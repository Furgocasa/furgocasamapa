/**
 * PILOTO GALES — se busca aire / stopover / CL / touring; se guarda publica | privada | camping
 *
 * No busca "áreas de autocaravanas" (jerga ES/FR). Busca el mix UK:
 *   - Arosfan / aire del consejo      → publica
 *   - aire CAMpRA / stopover de parcelas / CL → privada
 *   - CL / certified location         → privada
 *   - touring park / campsite         → camping
 *   - Brit Stop / pub                 → parking
 *
 * USO:
 *   npm run import:wales:pilot
 *   npm run import:wales:pilot -- --from-report --import
 *   npm run import:wales:pilot -- --import
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { decidirUbicacion } from "../../lib/areas/tipo-area";
import { baseAreaSlug, uniqueAreaSlug } from "../../lib/areas/slug";

// Windows / antivirus: interceptan TLS y rompen fetch a Google y Supabase
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const googleApiKey =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

const REPORT_PATH = path.join(
  process.cwd(),
  "scripts",
  "wales-pilot-dry-report.json"
);

type TipoArea = "publica" | "privada" | "camping";

interface Region {
  id: string;
  nombre: string;
  bounds: { north: number; south: number; east: number; west: number };
  gridSize: number;
}

interface Grid {
  north: number;
  south: number;
  east: number;
  west: number;
  center: { lat: number; lng: number };
}

interface PlaceHit {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  lat: number;
  lng: number;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  relevant: boolean;
  tipo_area: TipoArea | null;
  region: string;
  query: string;
}

const REGIONES: Region[] = [
  {
    id: "north",
    nombre: "Gales Norte (Eryri, Ynys Môn, Conwy)",
    bounds: { north: 53.43, south: 52.85, east: -2.95, west: -4.85 },
    gridSize: 0.35,
  },
  {
    id: "mid",
    nombre: "Gales Central (Ceredigion, Powys)",
    bounds: { north: 52.85, south: 52.15, east: -2.95, west: -4.7 },
    gridSize: 0.4,
  },
  {
    id: "west",
    nombre: "Gales Oeste (Pembrokeshire, Carmarthenshire)",
    bounds: { north: 52.15, south: 51.55, east: -3.9, west: -5.55 },
    gridSize: 0.35,
  },
  {
    id: "south",
    nombre: "Gales Sur (Gower, Cardiff, Bannau, Monmouthshire)",
    bounds: { north: 52.15, south: 51.35, east: -2.65, west: -4.4 },
    gridSize: 0.35,
  },
];

/** Términos locales UK — no "área de autocaravanas" */
const TERMINOS_GRID = [
  "motorhome aire",
  "motorhome stopover",
  "touring caravan park",
  "campsite motorhome",
];

/** Búsquedas de texto a escala país: aires y CL son escasos */
const TEXT_QUERIES = [
  "motorhome aire Wales",
  "motorhome stopover Wales",
  "campervan overnight parking Wales",
  "certified location motorhome Wales",
];

const RELEVANCE_RE =
  /\b(motorhome|motor\s*home|campervan|camper|caravan|aire|aires|stopover|stop\s*over|touring|tourer|campsite|camping|campground|caravan\s*park|caravan\s*site|holiday\s+park|certified\s*location|certificated|service\s*point)\b/i;

const NOISE_RE =
  /\b(hotel|motel|hostel|guest\s*house|bed\s*and\s*breakfast|b&b|restaurant|cafe|pub|inn|golf|spa|castle|museum|attraction|theme\s*park|zoo|retail|supermarket|hospital|school|university)\b/i;

const DEALER_RE =
  /\b(dealer|dealership|sales|hire|rental|rentals|storage|self[\s-]?storage|showroom|for\s*sale|motorhomes?\s+ltd)\b/i;

const LODGE_ONLY_RE =
  /\b(lodge|lodges|glamping|pod|pods|cabin|cabins|cottage|cottages|yurt)\b/i;

const ENGLAND_RE =
  /\b(england|cheshire|shropshire|herefordshire|gloucestershire|worcestershire|merseyside|liverpool|chester|shrewsbury|hereford|bristol|gloucester|oswestry|wirral)\b/i;

const WALES_RE =
  /\b(wales|cymru|gwynedd|conwy|anglesey|ynys\s*m[oô]n|denbigh|flintshire|wrexham|wrecsam|powys|ceredigion|pembroke|carmarthen|swansea|abertawe|cardiff|caerdydd|newport|casnewydd|monmouth|bridgend|neath|merthyr|rhondda|snowdonia|eryri|brecon|bannau|tenby|aberystwyth|caernarfon|porthmadog|llandudno|abergavenny|chepstow|cardigan|pembrokeshire|carmarthenshire|glamorgan|gower|gŵyr|llangollen|dolgellau|machynlleth|newtown|haverfordwest|fishguard|st\s*davids)\b/i;

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

function createGrid(bounds: Region["bounds"], gridSize: number): Grid[] {
  const grids: Grid[] = [];
  for (let lat = bounds.south; lat < bounds.north; lat += gridSize) {
    for (let lng = bounds.west; lng < bounds.east; lng += gridSize) {
      const south = lat;
      const north = Math.min(lat + gridSize, bounds.north);
      const west = lng;
      const east = Math.min(lng + gridSize, bounds.east);
      grids.push({
        south,
        north,
        west,
        east,
        center: {
          lat: (south + north) / 2,
          lng: (west + east) / 2,
        },
      });
    }
  }
  return grids;
}

function isInWales(lat: number, lng: number, address?: string): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < 51.32 || lat > 53.44 || lng < -5.72 || lng > -2.6) return false;

  // Recortes del spillover inglés
  if (lat > 53.22 && lng > -3.02) return false; // Wirral / Chester
  if (lat > 52.65 && lat < 53.05 && lng > -2.98) return false; // Shrewsbury / Oswestry
  if (lat > 51.95 && lat < 52.25 && lng > -2.85) return false; // Hereford
  if (lat < 51.55 && lng > -2.75) return false; // Bristol

  const text = (address || "").toLowerCase();
  if (text && ENGLAND_RE.test(text) && !WALES_RE.test(text)) return false;
  return true;
}

function classifyTipo(name: string, types: string[]): TipoArea | null {
  return decidirUbicacion(name, { pais: "Reino Unido", types }).tipo;
}

function isRelevant(name: string, types: string[]): boolean {
  return decidirUbicacion(name, { pais: "Reino Unido", types }).admite;
}

async function nearbySearch(
  query: string,
  grid: Grid
): Promise<Omit<PlaceHit, "relevant" | "tipo_area" | "region" | "query">[]> {
  if (!googleApiKey) throw new Error("Falta GOOGLE_MAPS_API_KEY");

  const latDiff = grid.north - grid.south;
  const lngDiff = grid.east - grid.west;
  const radiusKm =
    (Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111) / 2;
  const radiusMeters = Math.min(Math.max(radiusKm * 1000, 5000), 50000);

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${grid.center.lat},${grid.center.lng}`);
  url.searchParams.set("radius", String(Math.round(radiusMeters)));
  url.searchParams.set("keyword", query);
  url.searchParams.set("key", googleApiKey);
  url.searchParams.set("language", "en");

  return fetchPlaces(url);
}

async function textSearch(
  query: string
): Promise<Omit<PlaceHit, "relevant" | "tipo_area" | "region" | "query">[]> {
  if (!googleApiKey) throw new Error("Falta GOOGLE_MAPS_API_KEY");

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  url.searchParams.set("query", query);
  url.searchParams.set("location", "52.40,-3.80");
  url.searchParams.set("radius", "150000");
  url.searchParams.set("key", googleApiKey);
  url.searchParams.set("language", "en");

  return fetchPlaces(url);
}

async function fetchPlaces(
  url: URL
): Promise<Omit<PlaceHit, "relevant" | "tipo_area" | "region" | "query">[]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error(`HTTP ${response.status}`);
        return [];
      }
      const data: any = await response.json();
      if (data.status === "ZERO_RESULTS") return [];
      if (
        data.status === "OVER_QUERY_LIMIT" ||
        data.status === "REQUEST_DENIED"
      ) {
        console.error(`API ${data.status}: ${data.error_message || ""}`);
        return [];
      }
      if (data.status !== "OK") {
        console.error(`${data.status}`);
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
        business_status: p.business_status,
      }));
    } catch (err: any) {
      if (attempt === 3) {
        console.error(`fetch: ${err?.cause?.code || err.message}`);
        return [];
      }
      await delay(1000 * attempt);
    }
  }
  return [];
}

async function placeDetails(placeId: string) {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("key", googleApiKey!);
  url.searchParams.set(
    "fields",
    "formatted_address,address_component,website,formatted_phone_number,international_phone_number,rating,user_ratings_total,types,business_status,url"
  );
  url.searchParams.set("language", "en");

  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (data.status !== "OK" || !data.result) {
    return null;
  }
  const r = data.result;
  const comps: Array<{ long_name: string; short_name: string; types: string[] }> =
    r.address_components || [];
  const get = (type: string) =>
    comps.find((c) => c.types.includes(type))?.long_name || null;

  return {
    formatted_address: r.formatted_address || null,
    website: r.website || null,
    telefono:
      r.formatted_phone_number || r.international_phone_number || null,
    google_rating: r.rating ?? null,
    google_ratings_total: r.user_ratings_total ?? null,
    google_types: r.types || null,
    business_status: r.business_status || null,
    google_maps_url: r.url || null,
    ciudad: get("postal_town") || get("locality") || null,
    provincia: get("administrative_area_level_2") || null,
    comunidad: get("administrative_area_level_1") || null,
    codigo_postal: get("postal_code") || null,
    country: get("country") || null,
    country_code:
      comps.find((c) => c.types.includes("country"))?.short_name || null,
  };
}

async function loadExistingPlaceIds(): Promise<Set<string>> {
  const set = new Set<string>();
  if (!supabase) {
    console.log("⚠️  Sin Supabase: no se contrastará con BD existente\n");
    return set;
  }

  console.log("🔄 Cargando google_place_id existentes...");
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("areas")
      .select("google_place_id")
      .eq("activo", true)
      .not("google_place_id", "is", null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("❌ Error Supabase:", error.message);
      break;
    }
    if (!data?.length) {
      hasMore = false;
    } else {
      for (const row of data) {
        if (row.google_place_id) set.add(row.google_place_id);
      }
      page++;
      if (data.length < pageSize) hasMore = false;
    }
  }

  console.log(`✅ ${set.size} place_ids ya en BD\n`);
  return set;
}

let takenSlugs: Set<string> | null = null;

async function ensureTakenSlugs(): Promise<Set<string>> {
  if (takenSlugs) return takenSlugs;
  takenSlugs = new Set<string>();
  if (!supabase) return takenSlugs;
  const pageSize = 1000;
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("areas")
      .select("slug")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data?.length) break;
    for (const row of data) {
      if (row.slug) takenSlugs.add(row.slug);
    }
    if (data.length < pageSize) break;
    page++;
  }
  return takenSlugs;
}

function toHit(
  r: Omit<PlaceHit, "relevant" | "tipo_area" | "region" | "query">,
  region: string,
  query: string
): PlaceHit | null {
  const address = r.formatted_address || r.vicinity || "";
  if (!isInWales(r.lat, r.lng, address)) return null;
  return {
    ...r,
    relevant: isRelevant(r.name, r.types),
    tipo_area: classifyTipo(r.name, r.types),
    region,
    query,
  };
}

async function importArea(hit: PlaceHit): Promise<boolean> {
  if (!supabase) return false;

  const details = await placeDetails(hit.place_id);
  await delay(120);

  if (details?.business_status === "CLOSED_PERMANENTLY") {
    console.log(`   🚫 Cerrado: ${hit.name}`);
    return false;
  }
  if (details?.country_code && details.country_code !== "GB") {
    console.log(`   🚫 Fuera GB: ${hit.name} (${details.country_code})`);
    return false;
  }
  if (details?.comunidad && /england/i.test(details.comunidad)) {
    console.log(`   🚫 Inglaterra: ${hit.name}`);
    return false;
  }

  const comunidad = details?.comunidad || "Gales";
  if (comunidad && !/wales|cymru|gales/i.test(comunidad) && details?.comunidad) {
    // administrative_area_level_1 a veces viene como el condado; no bloquear
  }

  const decision = decidirUbicacion(hit.name, {
    pais: "Reino Unido",
    types: details?.google_types || hit.types || [],
  });
  if (!decision.admite || !decision.tipo) {
    console.log(`   ↷ fuera de las 4: ${hit.name} (${decision.motivo})`);
    return false;
  }

  const taken = await ensureTakenSlugs();
  const slug = uniqueAreaSlug(
    baseAreaSlug(hit.name, details?.ciudad, details?.provincia || hit.region),
    taken
  );
  taken.add(slug);
  const newArea = {
    nombre: hit.name,
    slug,
    descripcion: null,
    tipo_area: decision.tipo,
    pais: "Reino Unido",
    comunidad: "Gales",
    comunidad_autonoma: "Gales",
    provincia: details?.provincia || hit.region,
    ciudad: details?.ciudad || null,
    direccion:
      details?.formatted_address ||
      hit.formatted_address ||
      hit.vicinity ||
      null,
    codigo_postal: details?.codigo_postal || null,
    latitud: hit.lat,
    longitud: hit.lng,
    precio_noche: null,
    plazas_camper: null,
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
  };

  const { error } = await supabase.from("areas").insert([newArea]);
  if (error) {
    console.error(`   ❌ Insert ${hit.name}: ${error.message}`);
    return false;
  }
  return true;
}

async function importHits(
  hits: PlaceHit[],
  existingIds: Set<string>
): Promise<number> {
  const toImport = hits.filter(
    (h) =>
      h.relevant &&
      !existingIds.has(h.place_id) &&
      isInWales(h.lat, h.lng, h.formatted_address || h.vicinity)
  );
  console.log(`\n⚠️  IMPORT REAL — ${toImport.length} áreas…`);

  const byTipo: Record<string, number> = {};
  let imported = 0;
  for (const hit of toImport) {
    const ok = await importArea(hit);
    if (ok) {
      imported++;
      existingIds.add(hit.place_id);
      byTipo[hit.tipo_area] = (byTipo[hit.tipo_area] || 0) + 1;
      if (imported % 20 === 0 || imported === toImport.length) {
        console.log(`   … ${imported}/${toImport.length}`);
      }
    }
    await delay(60);
  }
  console.log(`\n✅ Importadas: ${imported}`);
  console.log(
    `   Tipos: ${Object.entries(byTipo)
      .map(([k, v]) => `${k}=${v}`)
      .join(" · ")}`
  );
  return imported;
}

function collectHit(
  r: Omit<PlaceHit, "relevant" | "tipo_area" | "region" | "query">,
  region: string,
  query: string,
  seenIds: Set<string>,
  allHits: PlaceHit[]
): boolean {
  if (!r.place_id || seenIds.has(r.place_id)) return false;
  const hit = toHit(r, region, query);
  if (!hit) return false;
  seenIds.add(r.place_id);
  allHits.push(hit);
  return true;
}

async function importFromReport(): Promise<void> {
  if (!fs.existsSync(REPORT_PATH)) {
    console.error(`❌ No existe informe: ${REPORT_PATH}`);
    process.exit(1);
  }
  if (!supabase) {
    console.error("❌ Falta Supabase");
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const existingIds = await loadExistingPlaceIds();
  const hits: PlaceHit[] = (report.allHits || [])
    .map((h: any) => {
      const types = h.types || [];
      return {
        place_id: h.place_id,
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        types,
        rating: h.rating,
        user_ratings_total: h.reviews ?? h.user_ratings_total,
        formatted_address: h.formatted_address,
        vicinity: h.vicinity,
        relevant: isRelevant(h.name, types),
        tipo_area: classifyTipo(h.name, types),
        region: h.region,
        query: h.query || "",
      };
    })
    .filter((h: PlaceHit) => h.relevant);

  console.log("\n" + "=".repeat(72));
  console.log("🇬🇧  IMPORT GALES DESDE INFORME (sin nuevas búsquedas API)");
  console.log("=".repeat(72));
  console.log(`Candidatos en informe: ${hits.length}`);

  await importHits(hits, existingIds);
  console.log("=".repeat(72) + "\n");
}

async function main() {
  const args = process.argv.slice(2);
  const doImport = args.includes("--import");
  const fromReport = args.includes("--from-report");

  if (fromReport) {
    if (!doImport) {
      console.error("Usa: --from-report --import");
      process.exit(1);
    }
    await importFromReport();
    return;
  }

  if (!googleApiKey) {
    console.error("❌ Falta GOOGLE_MAPS_API_KEY");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(72));
  console.log("🇬🇧  PILOTO GALES — se busca aire/stopover/CL/touring; se guarda en las 3 tipologías");
  console.log("=".repeat(72));
  console.log(`Modo: ${doImport ? "IMPORT REAL" : "DRY RUN (sin importar)"}`);
  console.log(`Términos grid: ${TERMINOS_GRID.join(" | ")}`);
  console.log(`Text search:   ${TEXT_QUERIES.join(" | ")}`);
  console.log("=".repeat(72) + "\n");

  const existingIds = await loadExistingPlaceIds();
  const seenIds = new Set<string>();
  const allHits: PlaceHit[] = [];
  let busquedas = 0;
  let rawResults = 0;

  console.log("🔎 Text Search (aire / stopover local / CL)\n");
  for (const query of TEXT_QUERIES) {
    busquedas++;
    process.stdout.write(`   "${query}"… `);
    const results = await textSearch(query);
    rawResults += results.length;
    let nuevos = 0;
    for (const r of results) {
      if (collectHit(r, "Gales (text)", query, seenIds, allHits)) nuevos++;
    }
    console.log(`${results.length} (nuevos en Gales: ${nuevos})`);
    await delay(350);
  }

  for (const region of REGIONES) {
    const grids = createGrid(region.bounds, region.gridSize);
    const estimadas = grids.length * TERMINOS_GRID.length;
    console.log(`\n📍 ${region.nombre}`);
    console.log(`   Grids: ${grids.length} · Búsquedas: ${estimadas}`);
    console.log(
      `   Coste Nearby estimado: $${((estimadas * 32) / 1000).toFixed(2)} USD\n`
    );

    for (let i = 0; i < grids.length; i++) {
      const grid = grids[i];
      console.log(
        `   Grid ${i + 1}/${grids.length} [${grid.center.lat.toFixed(2)}, ${grid.center.lng.toFixed(2)}]`
      );

      for (const termino of TERMINOS_GRID) {
        busquedas++;
        process.stdout.write(`      "${termino}"… `);
        const results = await nearbySearch(termino, grid);

        if (!results.length) {
          console.log("0");
          await delay(350);
          continue;
        }

        rawResults += results.length;
        let nuevos = 0;
        for (const r of results) {
          if (collectHit(r, region.nombre, termino, seenIds, allHits)) {
            nuevos++;
          }
        }
        console.log(`${results.length} (únicos nuevos: ${nuevos})`);
        await delay(350);
      }
    }
  }

  const relevant = allHits.filter((h) => h.relevant);
  const alreadyInDb = allHits.filter((h) => existingIds.has(h.place_id));
  const newRelevant = relevant.filter((h) => !existingIds.has(h.place_id));

  const byTipo = (list: PlaceHit[]) => {
    const acc: Record<string, number> = {};
    for (const h of list) acc[h.tipo_area] = (acc[h.tipo_area] || 0) + 1;
    return acc;
  };

  const byRegion = [
    { id: "text", nombre: "Gales (text)" },
    ...REGIONES,
  ].map((r) => {
    const hits = allHits.filter((h) => h.region === r.nombre);
    const rel = hits.filter((h) => h.relevant);
    return {
      region: r.nombre,
      unicos: hits.length,
      relevantes: rel.length,
      nuevosRelevantes: rel.filter((h) => !existingIds.has(h.place_id)).length,
    };
  });

  const top = [...newRelevant]
    .sort(
      (a, b) =>
        (b.user_ratings_total || 0) - (a.user_ratings_total || 0) ||
        (b.rating || 0) - (a.rating || 0)
    )
    .slice(0, 40);

  const costoNearby = (busquedas * 32) / 1000;
  const costoDetailsProyectado = (newRelevant.length * 17) / 1000;

  const report = {
    fecha: new Date().toISOString(),
    modo: doImport ? "import" : "dry-run",
    regiones: REGIONES.map((r) => r.id),
    terminos: [...TEXT_QUERIES, ...TERMINOS_GRID],
    busquedas,
    rawResults,
    unicos: allHits.length,
    relevantes: relevant.length,
    yaEnBd: alreadyInDb.length,
    nuevosRelevantes: newRelevant.length,
    byTipo: byTipo(newRelevant),
    byRegion,
    costoNearbyUsd: Number(costoNearby.toFixed(2)),
    costoDetailsProyectadoUsd: Number(costoDetailsProyectado.toFixed(2)),
    costoTotalProyectadoUsd: Number(
      (costoNearby + costoDetailsProyectado).toFixed(2)
    ),
    top40: top.map((h) => ({
      name: h.name,
      rating: h.rating,
      reviews: h.user_ratings_total,
      tipo_area: h.tipo_area,
      types: h.types.slice(0, 4),
      region: h.region,
      query: h.query,
      lat: h.lat,
      lng: h.lng,
      place_id: h.place_id,
    })),
    ruidoDescartado: allHits.length - relevant.length,
    allHits: allHits.map((h) => ({
      place_id: h.place_id,
      name: h.name,
      lat: h.lat,
      lng: h.lng,
      rating: h.rating,
      reviews: h.user_ratings_total,
      types: h.types,
      tipo_area: h.tipo_area,
      relevant: h.relevant,
      region: h.region,
      query: h.query,
      formatted_address: h.formatted_address,
      vicinity: h.vicinity,
      inDb: existingIds.has(h.place_id),
    })),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("\n" + "=".repeat(72));
  console.log("📊 RESUMEN PILOTO GALES");
  console.log("=".repeat(72));
  console.log(`Búsquedas:                 ${busquedas}`);
  console.log(`Resultados brutos:         ${rawResults}`);
  console.log(`Place IDs únicos en Gales: ${allHits.length}`);
  console.log(`Relevantes (filtro UK):    ${relevant.length}`);
  console.log(`Ya en BD:                  ${alreadyInDb.length}`);
  console.log(`Nuevos relevantes:         ${newRelevant.length}`);
  console.log(`Ruido descartado:          ${report.ruidoDescartado}`);
  console.log(`Tipos nuevos:              ${JSON.stringify(report.byTipo)}`);
  console.log(`\n💰 Coste búsquedas:        $${report.costoNearbyUsd} USD`);
  console.log(
    `💰 + Details proyectado:    $${report.costoDetailsProyectadoUsd} USD`
  );
  console.log("\nPor región:");
  for (const row of byRegion) {
    console.log(
      `   ${row.region.padEnd(52)} únicos=${row.unicos}  rel=${row.relevantes}  nuevos=${row.nuevosRelevantes}`
    );
  }
  console.log(`\n📄 Informe: ${REPORT_PATH}`);
  console.log("\nTop 15 nuevos relevantes:");
  top.slice(0, 15).forEach((h, i) => {
    console.log(
      `   ${String(i + 1).padStart(2)}. [${h.tipo_area}] ${h.name} ★${h.rating || "?"} (${h.user_ratings_total || 0})`
    );
  });

  if (doImport) {
    await importHits(newRelevant, existingIds);
  } else {
    console.log("\n👀 DRY RUN — no se importó nada.");
    console.log(
      "   Importar: npm run import:wales:pilot -- --from-report --import"
    );
  }

  console.log("=".repeat(72) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Fatal:", err);
    process.exit(1);
  });
