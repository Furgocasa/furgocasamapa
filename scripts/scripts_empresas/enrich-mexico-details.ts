/**
 * Enrich México con Place Details: website, teléfono, rating, ratings_total, types.
 * Una sola llamada Details por área pendiente.
 *
 * USO:
 *   npm run enrich:mexico:details                 # dry-run (cuenta pendientes)
 *   npm run enrich:mexico:details -- --confirm   # escribe (API de pago)
 *
 * Env: MEXICO_ENRICH_LIMIT (def 400), MEXICO_ENRICH_DELAY_MS (def 120)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONFIRM = process.argv.includes("--confirm");
const LIMIT = parseInt(process.env.MEXICO_ENRICH_LIMIT || "400", 10);
const DELAY_MS = parseInt(process.env.MEXICO_ENRICH_DELAY_MS || "120", 10);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const googleApiKey =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function placeDetails(placeId: string) {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("key", googleApiKey);
  url.searchParams.set(
    "fields",
    "website,formatted_phone_number,international_phone_number,rating,user_ratings_total,types,business_status"
  );
  url.searchParams.set("language", "es");

  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (data.status === "NOT_FOUND" || data.status === "INVALID_REQUEST") {
    return { error: data.status as string };
  }
  if (data.status !== "OK" || !data.result) {
    return { error: data.status || "NO_RESULT" };
  }
  const r = data.result;
  return {
    website: r.website || null,
    telefono:
      r.formatted_phone_number || r.international_phone_number || null,
    google_rating: r.rating ?? null,
    google_ratings_total: r.user_ratings_total ?? null,
    google_types: r.types || null,
    business_status: r.business_status || null,
  };
}

async function main() {
  if (!googleApiKey) {
    console.error("Falta GOOGLE_MAPS_API_KEY");
    process.exit(1);
  }

  console.log(
    `\n🇲🇽 Enrich Details México | limit=${LIMIT} | ${CONFIRM ? "CONFIRM" : "DRY-RUN"}\n`
  );

  // Pendientes: sin web O sin tel O sin ratings_total
  const { data: areas, error } = await supabase
    .from("areas")
    .select(
      "id,nombre,google_place_id,website,telefono,google_rating,google_ratings_total"
    )
    .eq("activo", true)
    .eq("pais", "México")
    .not("google_place_id", "is", null)
    .or("website.is.null,telefono.is.null,google_ratings_total.is.null")
    .order("google_rating", { ascending: false, nullsFirst: false })
    .limit(LIMIT);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(`Pendientes en este lote: ${areas?.length || 0}`);
  if (!areas?.length) {
    console.log("✅ Nada pendiente.\n");
    return;
  }

  areas.slice(0, 8).forEach((a) => {
    console.log(
      `  - ${a.nombre} | web=${a.website ? "✓" : "·"} tel=${a.telefono ? "✓" : "·"} reviews=${a.google_ratings_total ?? "·"}`
    );
  });

  const costEst = ((areas.length * 17) / 1000).toFixed(2);
  console.log(`\n💰 Coste Details estimado: ~$${costEst} USD`);

  if (!CONFIRM) {
    console.log(
      "\n👀 DRY-RUN. Para ejecutar: npm run enrich:mexico:details -- --confirm\n"
    );
    return;
  }

  let updated = 0;
  let closed = 0;
  let failed = 0;

  for (const area of areas) {
    const details = await placeDetails(area.google_place_id!);
    await delay(DELAY_MS);

    if ("error" in details && details.error) {
      failed++;
      if (failed <= 5) {
        console.log(`⚠️  ${area.nombre}: ${details.error}`);
      }
      continue;
    }

    const d = details as {
      website: string | null;
      telefono: string | null;
      google_rating: number | null;
      google_ratings_total: number | null;
      google_types: string[] | null;
      business_status: string | null;
    };

    if (d.business_status === "CLOSED_PERMANENTLY") {
      await supabase
        .from("areas")
        .update({ activo: false })
        .eq("id", area.id);
      closed++;
      console.log(`🚫 Cerrado: ${area.nombre}`);
      continue;
    }

    const patch: Record<string, unknown> = {};
    if (!area.website && d.website) patch.website = d.website;
    if (!area.telefono && d.telefono) patch.telefono = d.telefono;
    if (d.google_rating != null) patch.google_rating = d.google_rating;
    if (d.google_ratings_total != null) {
      patch.google_ratings_total = d.google_ratings_total;
    }
    if (d.google_types?.length) patch.google_types = d.google_types;

    if (!Object.keys(patch).length) continue;

    const { error: e2 } = await supabase
      .from("areas")
      .update(patch)
      .eq("id", area.id);
    if (e2) {
      failed++;
      console.error(`❌ ${area.nombre}: ${e2.message}`);
    } else {
      updated++;
      if (updated % 25 === 0) console.log(`   … ${updated}/${areas.length}`);
    }
  }

  console.log(`\n✅ Actualizadas: ${updated}`);
  console.log(`🚫 Cerradas desactivadas: ${closed}`);
  console.log(`⚠️  Fallos: ${failed}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
