/**
 * Desactiva áreas marcadas como México que geocoding ubica en EE.UU.
 * (spillover frontera Chihuahua / Big Bend / Texas)
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

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

async function countryOf(lat: number, lng: number): Promise<string | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("language", "es");
  url.searchParams.set("key", googleApiKey);
  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (data.status !== "OK") return null;
  for (const result of data.results || []) {
    for (const c of result.address_components || []) {
      if (c.types?.includes("country")) return c.long_name as string;
    }
  }
  return null;
}

async function main() {
  const { data, error } = await supabase
    .from("areas")
    .select("id,nombre,latitud,longitud,provincia")
    .eq("activo", true)
    .eq("pais", "México")
    .gte("latitud", 28.5)
    .lte("longitud", -102.5)
    .gte("longitud", -109.5)
    .limit(400);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`Candidatos frontera norte: ${data?.length || 0}`);
  let deactivated = 0;
  let kept = 0;

  for (const a of data || []) {
    const country = await countryOf(a.latitud, a.longitud);
    await delay(120);
    const isMx =
      !country ||
      country === "México" ||
      country === "Mexico" ||
      country.toLowerCase() === "méxico";
    if (!isMx) {
      const { error: e2 } = await supabase
        .from("areas")
        .update({ activo: false })
        .eq("id", a.id);
      if (!e2) {
        deactivated++;
        console.log(`❌ ${a.nombre} → ${country}`);
      }
    } else {
      kept++;
    }
  }

  const { count } = await supabase
    .from("areas")
    .select("id", { count: "exact", head: true })
    .eq("activo", true)
    .eq("pais", "México");

  console.log(`\nDesactivadas: ${deactivated}`);
  console.log(`Mantenidas: ${kept}`);
  console.log(`México activas: ${count}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
