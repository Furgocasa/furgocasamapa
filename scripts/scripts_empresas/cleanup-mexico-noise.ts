/**
 * Desactiva ruido en áreas México: estacionamientos, miradores, hoteles
 * sin señal RV/camping/trailer, y tipos Google no relevantes.
 *
 * USO:
 *   npm run cleanup:mexico:noise          # dry-run
 *   npm run cleanup:mexico:noise -- --apply
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RELEVANCE_RE =
  /\b(trailer|tr[aá]iler|rv\b|casa\s*rodante|motorhome|motor\s*home|fifth\s*wheel|campground|camping|campamento|acampado|camper|overland)\b/i;

const NOISE_NAME_RE =
  /\b(estacionamiento|parking|mirador|plaza comercial|centro comercial|mall|aeropuerto|hospital|gasolinera|pemex|oxxo\s*gas|walmart|soriana|costco|bodega aurrera|funeraria|cementerio|iglesia|templo|banco|bbva|banorte)\b/i;

const HOTEL_ONLY_RE =
  /\b(hotel|motel|hostal|hostel|resort|spa|posada)\b/i;

const US_NAME_RE =
  /\b(arizona|new mexico|california|texas|yuma|san diego|tucson|koa journey|lordsburg|casa grande|el paso|big bend)\b/i;

function parseTypes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function shouldKeep(name: string, types: string[]): boolean {
  if (US_NAME_RE.test(name)) return false;

  const nameOk = RELEVANCE_RE.test(name);
  const hasCampType = types.includes("campground");
  const hasRvType = types.includes("rv_park");

  // En MX, Google etiqueta mal muchos parkings como rv_park.
  // Si el NOMBRE es parking/mirador/mall y NO dice trailer/camping/RV → fuera.
  if (NOISE_NAME_RE.test(name) && !nameOk) return false;

  // Hotel/motel/hostal sin keyword RV/camping en el nombre
  if (HOTEL_ONLY_RE.test(name) && !nameOk && !hasCampType) return false;

  if (nameOk) return true;
  if (hasCampType) return true;

  // rv_park solo cuenta si el nombre no parece parking genérico
  if (hasRvType && !NOISE_NAME_RE.test(name) && !HOTEL_ONLY_RE.test(name)) {
    return true;
  }

  const badTypes = [
    "parking",
    "gas_station",
    "shopping_mall",
    "hospital",
    "airport",
    "car_dealer",
    "car_repair",
    "car_wash",
  ];
  if (types.some((t) => badTypes.includes(t))) return false;

  return false;
}

async function main() {
  console.log(
    `\n🧹 Cleanup ruido México | ${APPLY ? "APPLY" : "DRY-RUN"}\n`
  );

  const all: {
    id: string;
    nombre: string;
    google_types: unknown;
    provincia: string | null;
  }[] = [];
  const pageSize = 1000;
  let page = 0;
  let more = true;

  while (more) {
    const { data, error } = await supabase
      .from("areas")
      .select("id,nombre,google_types,provincia")
      .eq("activo", true)
      .eq("pais", "México")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    if (!data?.length) more = false;
    else {
      all.push(...data);
      page++;
      if (data.length < pageSize) more = false;
    }
  }

  console.log(`Áreas México activas: ${all.length}`);

  const toDrop = all.filter(
    (a) => !shouldKeep(a.nombre, parseTypes(a.google_types))
  );

  console.log(`A desactivar (ruido): ${toDrop.length}`);
  console.log(`Se mantienen: ${all.length - toDrop.length}\n`);

  const byReason: Record<string, number> = {};
  for (const a of toDrop.slice(0, 40)) {
    console.log(`  - ${a.nombre}${a.provincia ? ` (${a.provincia})` : ""}`);
  }
  if (toDrop.length > 40) console.log(`  … y ${toDrop.length - 40} más`);

  // Stats simples
  for (const a of toDrop) {
    const key = NOISE_NAME_RE.test(a.nombre)
      ? "parking/mirador"
      : HOTEL_ONLY_RE.test(a.nombre)
        ? "hotel sin RV"
        : "otros";
    byReason[key] = (byReason[key] || 0) + 1;
  }
  console.log("\nPor categoría:", byReason);

  if (!APPLY) {
    console.log("\n👀 DRY-RUN. Para aplicar: npm run cleanup:mexico:noise -- --apply\n");
    return;
  }

  let done = 0;
  const chunk = 50;
  for (let i = 0; i < toDrop.length; i += chunk) {
    const ids = toDrop.slice(i, i + chunk).map((a) => a.id);
    const { error } = await supabase
      .from("areas")
      .update({ activo: false })
      .in("id", ids);
    if (error) console.error("Error batch:", error.message);
    else done += ids.length;
  }

  const { count } = await supabase
    .from("areas")
    .select("id", { count: "exact", head: true })
    .eq("activo", true)
    .eq("pais", "México");

  console.log(`\n✅ Desactivadas: ${done}`);
  console.log(`México activas ahora: ${count}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
