/**
 * Búsqueda en huecos de cobertura de la península (radio 25–40 km).
 *
 * USO:
 *   npm run import:iberia:gaps
 *   npm run import:iberia:gaps -- --import
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const googleApiKey =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

const REPORT_PATH = path.join(
  process.cwd(),
  "scripts",
  "iberia-gaps-dry-report.json"
);

type TipoArea = "publica" | "privada" | "camping" | "parking";

const HUECOS = [
  { id: 1, zona: "Alentejo interior", lat: 38.991, lng: -7.817, pais: "Portugal" },
  { id: 2, zona: "Arribes / Trás-os-Montes", lat: 41.355, lng: -7.094, pais: "España" },
  { id: 3, zona: "Sierra Morena / Los Pedroches", lat: 38.72, lng: -4.85, pais: "España" },
  { id: 4, zona: "Serranía de Cuenca", lat: 40.2, lng: -2.881, pais: "España" },
  { id: 5, zona: "Monegros / Bajo Aragón", lat: 41.557, lng: -0.236, pais: "España" },
  { id: 6, zona: "Altiplano Albacete", lat: 38.62, lng: -1.85, pais: "España" },
  { id: 7, zona: "Tierra de Pinares", lat: 41.26, lng: -4.3, pais: "España" },
  { id: 8, zona: "Sierra de Baza / Filabres", lat: 37.62, lng: -2.8, pais: "España" },
  { id: 9, zona: "Tierra de Campos", lat: 41.98, lng: -5.2, pais: "España" },
  { id: 10, zona: "Calatayud / Sistema Ibérico", lat: 41.3, lng: -1.95, pais: "España" },
  { id: 11, zona: "Huelva / Doñana interior", lat: 37.1, lng: -6.575, pais: "España" },
  { id: 12, zona: "Campiña Córdoba–Sevilla", lat: 37.75, lng: -5.95, pais: "España" },
  { id: 13, zona: "Manchuela", lat: 39.75, lng: -1.637, pais: "España" },
  { id: 14, zona: "Cinco Villas", lat: 42.3, lng: -0.867, pais: "España" },
  { id: 15, zona: "Alberche / oeste Madrid", lat: 40.5, lng: -3.95, pais: "España" },
  { id: 16, zona: "Monchique / SW Alentejo", lat: 37.6, lng: -8.7, pais: "Portugal" },
];

const TERMINOS_ES = [
  "área autocaravanas",
  "área de servicio autocaravanas",
  "camping autocaravanas",
];
const TERMINOS_PT = [
  "área autocaravanas",
  "parque de campismo",
  "aire camping-car",
];

const RELEVANCE_RE =
  /\b(autocaravana|autocaravanas|camper|caravana|camping|campismo|campground|aire|area de servicio|área de servicio|sosta|stellplatz|motorhome|campervan|caravaning)\b/i;
const NOISE_RE =
  /\b(hotel|motel|hostal|hostel|restaurante|restaurant|gasolinera|gas station|dealer|concesionario|venta|alquiler|hire|rental|storage)\b/i;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function classifyTipo(name: string, types: string[]): TipoArea {
  const n = name.toLowerCase();
  if (
    /\b(aire|área de servicio|area de servicio|area de servico|área de serviço|aire de service|esta[cç][aã]o de servi[cç]o|sosta|servizio)\b/.test(
      n
    )
  ) {
    return "publica";
  }
  if (/\b(parking|aparcamiento|estacionamiento)\b/.test(n) && RELEVANCE_RE.test(n)) {
    return "parking";
  }
  if (
    types.includes("campground") ||
    /\b(camping|campismo|campground|caravan park)\b/.test(n)
  ) {
    return "camping";
  }
  if (/\b(área|area|autocaravana)\b/.test(n)) return "publica";
  return "camping";
}

function isRelevant(name: string, types: string[]): boolean {
  if (/\b(glamping|b[ií]blico|biblico)\b/i.test(name) && !/\b(autocaravana|camper|aire)\b/i.test(name)) {
    return false;
  }
  if (NOISE_RE.test(name) && !RELEVANCE_RE.test(name)) return false;
  if (RELEVANCE_RE.test(name)) return true;
  if (types.includes("campground") || types.includes("rv_park")) return true;
  return false;
}

async function nearby(query: string, lat: number, lng: number) {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "40000");
  url.searchParams.set("keyword", query);
  url.searchParams.set("key", googleApiKey);
  url.searchParams.set("language", "es");

  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (data.status === "ZERO_RESULTS") return [];
  if (data.status !== "OK") {
    console.error(`  API ${data.status}: ${data.error_message || ""}`);
    return [];
  }
  return (data.results || []).map((p: any) => ({
    place_id: p.place_id,
    name: p.name,
    vicinity: p.vicinity,
    formatted_address: p.formatted_address || p.vicinity,
    lat: p.geometry?.location?.lat,
    lng: p.geometry?.location?.lng,
    types: p.types || [],
    rating: p.rating,
    user_ratings_total: p.user_ratings_total,
  }));
}

async function placeDetails(placeId: string) {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("key", googleApiKey);
  url.searchParams.set(
    "fields",
    "formatted_address,address_component,website,formatted_phone_number,international_phone_number,rating,user_ratings_total,types,business_status,url"
  );
  url.searchParams.set("language", "es");
  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (data.status !== "OK" || !data.result) return null;
  const r = data.result;
  const comps: Array<{ long_name: string; short_name: string; types: string[] }> =
    r.address_components || [];
  const get = (type: string) =>
    comps.find((c) => c.types.includes(type))?.long_name || null;
  return {
    formatted_address: r.formatted_address || null,
    website: r.website || null,
    telefono: r.formatted_phone_number || r.international_phone_number || null,
    google_rating: r.rating ?? null,
    google_ratings_total: r.user_ratings_total ?? null,
    google_types: r.types || null,
    business_status: r.business_status || null,
    google_maps_url: r.url || null,
    ciudad: get("locality") || get("postal_town") || null,
    provincia: get("administrative_area_level_2") || null,
    comunidad: get("administrative_area_level_1") || null,
    codigo_postal: get("postal_code") || null,
    country_code:
      comps.find((c) => c.types.includes("country"))?.short_name || null,
  };
}

async function loadExisting() {
  const placeIds = new Set<string>();
  const coords: Array<{ lat: number; lng: number }> = [];
  const pageSize = 1000;
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("areas")
      .select("google_place_id,latitud,longitud")
      .eq("activo", true)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      if (row.google_place_id) placeIds.add(row.google_place_id);
      if (row.latitud != null && row.longitud != null) {
        coords.push({ lat: Number(row.latitud), lng: Number(row.longitud) });
      }
    }
    if (data.length < pageSize) break;
    page++;
  }
  return { placeIds, coords };
}

function tooCloseToExisting(
  lat: number,
  lng: number,
  coords: Array<{ lat: number; lng: number }>,
  minKm = 1.2
) {
  return coords.some((c) => haversine(lat, lng, c.lat, c.lng) < minKm);
}

async function importUtiles(utiles: any[]) {
  let imported = 0;
  for (const hit of utiles) {
    const details = await placeDetails(hit.place_id);
    await delay(120);
    if (details?.business_status === "CLOSED_PERMANENTLY") continue;
    const cc = details?.country_code;
    if (cc && cc !== "ES" && cc !== "PT") continue;
    const pais = cc === "PT" ? "Portugal" : "España";
    const slug = `${normalizeText(hit.name).replace(/\s+/g, "-").slice(0, 80)}-${pais === "Portugal" ? "pt" : "es"}-${hit.place_id.slice(-8)}`;
    const { error } = await supabase.from("areas").insert([
      {
        nombre: hit.name,
        slug,
        tipo_area: classifyTipo(hit.name, hit.types || []),
        pais,
        comunidad: details?.comunidad || null,
        comunidad_autonoma: details?.comunidad || null,
        provincia: details?.provincia || hit.hueco,
        ciudad: details?.ciudad || null,
        direccion:
          details?.formatted_address || hit.formatted_address || null,
        codigo_postal: details?.codigo_postal || null,
        latitud: hit.lat,
        longitud: hit.lng,
        google_place_id: hit.place_id,
        google_types: details?.google_types || hit.types,
        google_maps_url:
          details?.google_maps_url ||
          `https://www.google.com/maps/place/?q=place_id:${hit.place_id}`,
        website: details?.website || null,
        telefono: details?.telefono || null,
        google_rating: details?.google_rating ?? hit.rating ?? null,
        google_ratings_total:
          details?.google_ratings_total ?? hit.user_ratings_total ?? null,
        verificado: false,
        activo: true,
        servicios: {},
      },
    ]);
    if (error) {
      console.error(`  ❌ ${hit.name}: ${error.message}`);
    } else {
      imported++;
      if (imported % 15 === 0) console.log(`  … ${imported}/${utiles.length}`);
    }
    await delay(60);
  }
  console.log(`\nImportadas: ${imported}\n`);
}

async function main() {
  const doImport = process.argv.includes("--import");
  const fromReport = process.argv.includes("--from-report");

  if (fromReport) {
    if (!doImport) {
      console.error("Usa: --from-report --import");
      process.exit(1);
    }
    const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
    const { placeIds } = await loadExisting();
    const utiles = (report.allHits || [])
      .filter((h: any) => isRelevant(h.name, h.types || []))
      .filter((h: any) => !placeIds.has(h.place_id) && !h.cercaExistente && !h.inDb);
    console.log(`Import desde informe: ${utiles.length} candidatos`);
    await importUtiles(utiles);
    return;
  }

  console.log("\nPenínsula — búsqueda en 16 huecos (radio 40 km)");
  console.log(doImport ? "MODO IMPORT\n" : "DRY RUN\n");

  const { placeIds, coords } = await loadExisting();
  console.log(`Ya en BD: ${placeIds.size} place_ids, ${coords.length} coords\n`);

  const seen = new Set<string>();
  const hits: any[] = [];
  let busquedas = 0;

  for (const hueco of HUECOS) {
    const terminos = hueco.pais === "Portugal" ? TERMINOS_PT : TERMINOS_ES;
    console.log(`#${hueco.id} ${hueco.zona} [${hueco.lat}, ${hueco.lng}]`);
    for (const termino of terminos) {
      busquedas++;
      process.stdout.write(`   "${termino}"… `);
      const results = await nearby(termino, hueco.lat, hueco.lng);
      let nuevos = 0;
      for (const r of results) {
        if (!r.place_id || seen.has(r.place_id)) continue;
        if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) continue;
        const distCentro = haversine(hueco.lat, hueco.lng, r.lat, r.lng);
        if (distCentro > 42) continue;
        seen.add(r.place_id);
        const relevant = isRelevant(r.name, r.types);
        const inDb = placeIds.has(r.place_id);
        const cercaExistente = tooCloseToExisting(r.lat, r.lng, coords);
        hits.push({
          ...r,
          relevant,
          inDb,
          cercaExistente,
          tipo_area: classifyTipo(r.name, r.types),
          hueco: hueco.zona,
          huecoId: hueco.id,
          paisHint: hueco.pais,
          query: termino,
          distCentroKm: +distCentro.toFixed(1),
        });
        if (relevant && !inDb && !cercaExistente) nuevos++;
      }
      console.log(`${results.length} (nuevos útiles: ${nuevos})`);
      await delay(350);
    }
  }

  const utiles = hits.filter((h) => h.relevant && !h.inDb && !h.cercaExistente);
  const report = {
    fecha: new Date().toISOString(),
    busquedas,
    unicos: hits.length,
    utiles: utiles.length,
    byHueco: HUECOS.map((h) => ({
      id: h.id,
      zona: h.zona,
      utiles: utiles.filter((x) => x.huecoId === h.id).length,
    })),
    utilesList: utiles.map((h) => ({
      name: h.name,
      tipo_area: h.tipo_area,
      hueco: h.hueco,
      dist: h.distCentroKm,
      rating: h.rating,
      reviews: h.user_ratings_total,
      lat: h.lat,
      lng: h.lng,
      place_id: h.place_id,
      address: h.formatted_address,
    })),
    allHits: hits,
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log("\n=== RESUMEN ===");
  console.log(`Búsquedas: ${busquedas}`);
  console.log(`Únicos: ${hits.length}`);
  console.log(`Nuevos útiles: ${utiles.length}`);
  for (const row of report.byHueco) {
    if (row.utiles) console.log(`  #${row.id} ${row.zona}: ${row.utiles}`);
  }
  console.log(`\nInforme: ${REPORT_PATH}`);
  utiles.slice(0, 20).forEach((h, i) => {
    console.log(
      `  ${i + 1}. [${h.tipo_area}] ${h.name} — ${h.hueco} (${h.distCentroKm} km)`
    );
  });

  if (!doImport) {
    console.log("\nDRY RUN. Importar: npm run import:iberia:gaps -- --from-report --import\n");
    return;
  }

  await importUtiles(utiles);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
