/**
 * PILOTO MÉXICO — búsqueda + import de trailer/RV parks
 *
 * USO:
 *   npm run import:mexico:pilot
 *   npm run import:mexico:pilot -- --from-report --import
 *   npm run import:mexico:pilot -- --phase=2 --import
 *   npm run import:mexico:pilot -- --region=sonora
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { decidirUbicacion } from "../../lib/areas/tipo-area";

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
  "mexico-pilot-dry-report.json"
);

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
  region: string;
  query: string;
}

/** Corredores (estudio mercado MX) */
const REGIONES: Region[] = [
  // Fase 1
  {
    id: "baja",
    nombre: "Baja California + BCS",
    bounds: { north: 32.45, south: 22.87, east: -109.4, west: -117.15 },
    gridSize: 1.5,
  },
  {
    id: "jalisco",
    nombre: "Jalisco",
    bounds: { north: 22.75, south: 18.95, east: -101.45, west: -105.75 },
    gridSize: 1.0,
  },
  // Fase 2 — expansión
  {
    id: "sonora",
    nombre: "Sonora",
    // Norte cortado bajo borde AZ (~31.33)
    bounds: { north: 31.32, south: 26.3, east: -108.5, west: -115.05 },
    gridSize: 1.2,
  },
  {
    id: "nayarit",
    nombre: "Nayarit",
    bounds: { north: 23.1, south: 20.6, east: -103.7, west: -105.85 },
    gridSize: 0.8,
  },
  {
    id: "sinaloa",
    nombre: "Sinaloa",
    bounds: { north: 26.95, south: 22.45, east: -105.35, west: -109.55 },
    gridSize: 1.2,
  },
  {
    id: "yucatan",
    nombre: "Yucatán",
    bounds: { north: 21.65, south: 19.55, east: -87.5, west: -90.55 },
    gridSize: 0.9,
  },
  {
    id: "qroo",
    nombre: "Quintana Roo",
    bounds: { north: 21.6, south: 18.0, east: -86.7, west: -89.35 },
    gridSize: 0.9,
  },
  {
    id: "guanajuato",
    nombre: "Guanajuato",
    bounds: { north: 21.85, south: 19.9, east: -99.65, west: -102.15 },
    gridSize: 0.9,
  },
  // Fase 3 — Pacífico sur, Bajío, centro, Golfo
  {
    id: "michoacan",
    nombre: "Michoacán",
    bounds: { north: 20.4, south: 17.9, east: -100.1, west: -103.8 },
    gridSize: 1.0,
  },
  {
    id: "colima",
    nombre: "Colima",
    bounds: { north: 19.55, south: 18.65, east: -103.5, west: -104.8 },
    gridSize: 0.6,
  },
  {
    id: "guerrero",
    nombre: "Guerrero",
    bounds: { north: 18.9, south: 16.3, east: -98.3, west: -102.2 },
    gridSize: 1.0,
  },
  {
    id: "oaxaca",
    nombre: "Oaxaca",
    bounds: { north: 18.7, south: 15.65, east: -93.9, west: -98.55 },
    gridSize: 1.1,
  },
  {
    id: "chiapas",
    nombre: "Chiapas",
    bounds: { north: 17.95, south: 14.55, east: -90.4, west: -94.2 },
    gridSize: 1.1,
  },
  {
    id: "morelos",
    nombre: "Morelos",
    bounds: { north: 19.15, south: 18.3, east: -98.6, west: -99.55 },
    gridSize: 0.5,
  },
  {
    id: "edomex",
    nombre: "Estado de México / CDMX",
    bounds: { north: 20.15, south: 18.9, east: -98.6, west: -100.35 },
    gridSize: 0.7,
  },
  {
    id: "queretaro",
    nombre: "Querétaro",
    bounds: { north: 21.65, south: 20.0, east: -99.05, west: -100.6 },
    gridSize: 0.7,
  },
  {
    id: "puebla",
    nombre: "Puebla",
    bounds: { north: 20.85, south: 17.85, east: -96.95, west: -99.1 },
    gridSize: 1.0,
  },
  {
    id: "veracruz",
    nombre: "Veracruz",
    bounds: { north: 22.45, south: 17.15, east: -93.95, west: -98.7 },
    gridSize: 1.2,
  },
  {
    id: "nuevo_leon",
    nombre: "Nuevo León",
    // Sur del borde TX (~25.9 en Laredo; acotamos a 26.0)
    bounds: { north: 26.0, south: 24.0, east: -98.9, west: -101.3 },
    gridSize: 0.8,
  },
  // Fase 4 — norte, altiplano, golfo sur
  {
    id: "chihuahua",
    nombre: "Chihuahua",
    // Este acotado para no chupar Big Bend / West Texas
    bounds: { north: 31.7, south: 25.5, east: -104.05, west: -109.1 },
    gridSize: 1.4,
  },
  {
    id: "coahuila",
    nombre: "Coahuila",
    bounds: { north: 29.3, south: 24.5, east: -99.8, west: -103.4 },
    gridSize: 1.3,
  },
  {
    id: "tamaulipas",
    nombre: "Tamaulipas",
    bounds: { north: 25.9, south: 22.2, east: -97.15, west: -100.15 },
    gridSize: 1.1,
  },
  {
    id: "durango",
    nombre: "Durango",
    bounds: { north: 26.9, south: 22.3, east: -102.4, west: -107.2 },
    gridSize: 1.3,
  },
  {
    id: "zacatecas",
    nombre: "Zacatecas",
    bounds: { north: 25.15, south: 21.0, east: -100.7, west: -104.4 },
    gridSize: 1.2,
  },
  {
    id: "san_luis",
    nombre: "San Luis Potosí",
    bounds: { north: 24.5, south: 21.1, east: -98.3, west: -102.3 },
    gridSize: 1.1,
  },
  {
    id: "aguascalientes",
    nombre: "Aguascalientes",
    bounds: { north: 22.3, south: 21.6, east: -101.85, west: -102.9 },
    gridSize: 0.5,
  },
  {
    id: "hidalgo",
    nombre: "Hidalgo",
    bounds: { north: 21.4, south: 19.6, east: -97.95, west: -99.9 },
    gridSize: 0.8,
  },
  {
    id: "tlaxcala",
    nombre: "Tlaxcala",
    bounds: { north: 19.75, south: 19.05, east: -97.6, west: -98.7 },
    gridSize: 0.5,
  },
  {
    id: "campeche",
    nombre: "Campeche",
    bounds: { north: 20.85, south: 17.8, east: -89.1, west: -92.5 },
    gridSize: 1.1,
  },
  {
    id: "tabasco",
    nombre: "Tabasco",
    bounds: { north: 18.65, south: 17.25, east: -91.0, west: -94.15 },
    gridSize: 0.9,
  },
];

const PHASE1 = ["baja", "jalisco"];
const PHASE2 = ["sonora", "nayarit", "sinaloa", "yucatan", "qroo", "guanajuato"];
const PHASE3 = [
  "michoacan",
  "colima",
  "guerrero",
  "oaxaca",
  "chiapas",
  "morelos",
  "edomex",
  "queretaro",
  "puebla",
  "veracruz",
  "nuevo_leon",
];
const PHASE4 = [
  "chihuahua",
  "coahuila",
  "tamaulipas",
  "durango",
  "zacatecas",
  "san_luis",
  "aguascalientes",
  "hidalgo",
  "tlaxcala",
  "campeche",
  "tabasco",
];

/**
 * Filtro anti-spillover EE.UU. (Nearby 50km cruza la frontera).
 * Baja oeste del Colorado; rechaza franja Arizona (~31.33) y NM.
 */
function isInMexico(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < 14.5 || lat > 32.54) return false;
  if (lng < -118.5 || lng > -86.5) return false;
  // Sur de California / norte de BC: ya cortado por lat
  // Arizona (borde ~31.33°N, este del río Colorado ~-114.8)
  if (lat > 31.335 && lng > -114.82 && lng < -109.05) return false;
  // New Mexico
  if (lat > 31.78 && lng > -109.1 && lng < -103.0) return false;
  // Texas west tip rough
  if (lat > 31.7 && lng > -106.7 && lng < -103.0) return false;
  // Texas / frontera Laredo–Brownsville (sur ~25.8–26.0)
  if (lat > 25.95 && lng > -100.6 && lng < -97.0) return false;
  // El Paso / Juárez: rechaza lado US (lat>31.75 oeste de -106)
  if (lat > 31.75 && lng > -106.7 && lng < -106.0) return false;
  // West Texas Big Bend / Marathon / Fort Davis (norte del Río Bravo)
  // Ojinaga MX ~29.57,-104.41 se mantiene; el parque Big Bend US ~29.25,-103.3 se corta
  if (lat > 29.15 && lat < 30.6 && lng > -104.0 && lng < -102.7) return false;
  if (lat > 30.2 && lat < 31.6 && lng > -104.6 && lng < -103.2) return false; // Alpine/Fort Davis
  return true;
}

const US_NAME_RE =
  /\b(arizona|new mexico|california|texas|yuma|san diego|tucson|koa journey|lordsburg|casa grande|el paso)\b/i;

const NOISE_NAME_RE =
  /\b(estacionamiento|parking|mirador|plaza comercial|centro comercial|mall|aeropuerto|hospital)\b/i;

/** Keywords locales MX (no jerga europea) */
const TERMINOS_MX = [
  "trailer park",
  "RV park",
  "tráiler park",
  "parque de casas rodantes",
  "campamento trailer",
  "RV camping",
];

const RELEVANCE_RE =
  /\b(trailer|tr[aá]iler|rv\b|casa\s*rodante|motorhome|motor\s*home|fifth\s*wheel|campground|camping|campamento|acampado|camper)\b/i;

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

function createGrid(
  bounds: Region["bounds"],
  gridSize: number
): Grid[] {
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

function isRelevant(name: string, types: string[]): boolean {
  if (!decidirUbicacion(name, { pais: "México", types }).admite) return false;
  if (US_NAME_RE.test(name)) return false;
  // En MX Google etiqueta parkings como rv_park: priorizar nombre
  if (NOISE_NAME_RE.test(name) && !RELEVANCE_RE.test(name)) return false;
  if (RELEVANCE_RE.test(name)) return true;
  if (types.includes("campground")) return true;
  // rv_park sin nombre camping/trailer solo si no parece hotel/parking
  if (
    types.includes("rv_park") &&
    !/\b(hotel|motel|hostal|estacionamiento|parking)\b/i.test(name)
  ) {
    return true;
  }
  return false;
}

async function nearbySearch(
  query: string,
  grid: Grid
): Promise<Omit<PlaceHit, "relevant" | "region" | "query">[]> {
  if (!googleApiKey) {
    throw new Error("Falta GOOGLE_MAPS_API_KEY");
  }
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
  url.searchParams.set("language", "es");

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

      // Solo 1ª página en piloto (max 20) — controla coste
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

function generateSlug(name: string, placeId: string): string {
  const base = normalizeText(name).replace(/\s+/g, "-").slice(0, 80);
  return `${base}-mx-${placeId.slice(-10)}`;
}

async function importArea(hit: PlaceHit): Promise<boolean> {
  if (!supabase) return false;

  const decision = decidirUbicacion(hit.name, { pais: "México", types: hit.types || [] });
  if (!decision.admite || !decision.tipo) {
    console.log(`   ↷ fuera de las 4: ${hit.name} (${decision.motivo})`);
    return false;
  }

  const slug = generateSlug(hit.name, hit.place_id);
  const newArea = {
    nombre: hit.name,
    slug,
    descripcion: null,
    tipo_area: decision.tipo,
    pais: "México",
    provincia: hit.region,
    ciudad: null,
    direccion: hit.formatted_address || hit.vicinity || null,
    latitud: hit.lat,
    longitud: hit.lng,
    precio_noche: null,
    plazas_camper: null,
    google_place_id: hit.place_id,
    google_types: hit.types,
    google_maps_url: `https://www.google.com/maps/place/?q=place_id:${hit.place_id}`,
    website: null,
    telefono: null,
    google_rating: hit.rating || null,
    google_ratings_total: hit.user_ratings_total ?? null,
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
    (h) => h.relevant && !existingIds.has(h.place_id) && isInMexico(h.lat, h.lng)
  );
  console.log(`\n⚠️  IMPORT REAL — ${toImport.length} áreas…`);
  let imported = 0;
  for (const hit of toImport) {
    const ok = await importArea(hit);
    if (ok) {
      imported++;
      existingIds.add(hit.place_id);
      if (imported % 25 === 0 || imported === toImport.length) {
        console.log(`   … ${imported}/${toImport.length}`);
      }
    }
    await delay(60);
  }
  console.log(`\n✅ Importadas: ${imported}`);
  return imported;
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
    .filter((h: any) => h.relevant)
    .map((h: any) => ({
      place_id: h.place_id,
      name: h.name,
      lat: h.lat,
      lng: h.lng,
      types: h.types || [],
      rating: h.rating,
      user_ratings_total: h.reviews ?? h.user_ratings_total,
      relevant: true,
      region: h.region,
      query: h.query || "",
    }));

  console.log("\n" + "=".repeat(72));
  console.log("🇲🇽  IMPORT DESDE INFORME (sin nuevas búsquedas API)");
  console.log("=".repeat(72));
  console.log(`Candidatos en informe: ${hits.length}`);

  await importHits(hits, existingIds);
  console.log("=".repeat(72) + "\n");
}

async function main() {
  const args = process.argv.slice(2);
  const doImport = args.includes("--import");
  const fromReport = args.includes("--from-report");
  const isDryRun = !doImport;
  const phaseArg = args
    .find((a) => a.startsWith("--phase="))
    ?.split("=")[1];
  const regionFilter = args
    .find((a) => a.startsWith("--region="))
    ?.split("=")[1]
    ?.toLowerCase();

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

  let regiones = REGIONES.filter((r) => PHASE1.includes(r.id));
  if (phaseArg === "2") {
    regiones = REGIONES.filter((r) => PHASE2.includes(r.id));
  } else if (phaseArg === "3") {
    regiones = REGIONES.filter((r) => PHASE3.includes(r.id));
  } else if (phaseArg === "4") {
    regiones = REGIONES.filter((r) => PHASE4.includes(r.id));
  } else if (phaseArg === "all") {
    regiones = REGIONES;
  }
  if (regionFilter) {
    regiones = REGIONES.filter((r) => r.id === regionFilter);
    if (!regiones.length) {
      console.error(`❌ Región desconocida: ${regionFilter}`);
      console.log(
        "Disponibles:",
        REGIONES.map((r) => r.id).join(", ")
      );
      process.exit(1);
    }
  }

  console.log("\n" + "=".repeat(72));
  console.log("🇲🇽  PILOTO MÉXICO");
  console.log("=".repeat(72));
  console.log(
    `Modo: ${isDryRun ? "DRY RUN (sin importar)" : "IMPORT REAL"}`
  );
  console.log(`Regiones: ${regiones.map((r) => r.nombre).join(" · ")}`);
  console.log(`Términos: ${TERMINOS_MX.join(" | ")}`);
  console.log("=".repeat(72) + "\n");

  const existingIds = await loadExistingPlaceIds();
  const seenIds = new Set<string>();
  const allHits: PlaceHit[] = [];
  let busquedas = 0;
  let rawResults = 0;

  for (const region of regiones) {
    const grids = createGrid(region.bounds, region.gridSize);
    const estimadas = grids.length * TERMINOS_MX.length;
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

      for (const termino of TERMINOS_MX) {
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
          if (!r.place_id || seenIds.has(r.place_id)) continue;
          if (!isInMexico(r.lat, r.lng)) continue;
          seenIds.add(r.place_id);
          const hit: PlaceHit = {
            ...r,
            relevant: isRelevant(r.name, r.types),
            region: region.nombre,
            query: termino,
          };
          allHits.push(hit);
          nuevos++;
        }
        console.log(`${results.length} (únicos nuevos en run: ${nuevos})`);
        await delay(350);
      }
    }
  }

  const relevant = allHits.filter((h) => h.relevant);
  const alreadyInDb = allHits.filter((h) => existingIds.has(h.place_id));
  const newRelevant = relevant.filter((h) => !existingIds.has(h.place_id));
  const byRegion = regiones.map((r) => {
    const hits = allHits.filter((h) => h.region === r.nombre);
    const rel = hits.filter((h) => h.relevant);
    return {
      region: r.nombre,
      unicos: hits.length,
      relevantes: rel.length,
      nuevosRelevantes: rel.filter((h) => !existingIds.has(h.place_id)).length,
    };
  });

  // Ranking top por reviews
  const top = [...newRelevant]
    .sort(
      (a, b) =>
        (b.user_ratings_total || 0) - (a.user_ratings_total || 0) ||
        (b.rating || 0) - (a.rating || 0)
    )
    .slice(0, 40);

  const costoNearby = (busquedas * 32) / 1000;
  // Proyección si luego enriquecemos Details de los relevantes nuevos
  const costoDetailsProyectado = (newRelevant.length * 17) / 1000;

  const report = {
    fecha: new Date().toISOString(),
    modo: isDryRun ? "dry-run" : "import",
    regiones: regiones.map((r) => r.id),
    terminos: TERMINOS_MX,
    busquedas,
    rawResults,
    unicos: allHits.length,
    relevantes: relevant.length,
    yaEnBd: alreadyInDb.length,
    nuevosRelevantes: newRelevant.length,
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
      relevant: h.relevant,
      region: h.region,
      query: h.query,
      inDb: existingIds.has(h.place_id),
    })),
  };

  const outPath = REPORT_PATH;
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  console.log("\n" + "=".repeat(72));
  console.log("📊 RESUMEN PILOTO MÉXICO");
  console.log("=".repeat(72));
  console.log(`Búsquedas Nearby:          ${busquedas}`);
  console.log(`Resultados brutos:         ${rawResults}`);
  console.log(`Place IDs únicos:          ${allHits.length}`);
  console.log(`Relevantes (filtro MX):    ${relevant.length}`);
  console.log(`Ya en BD:                  ${alreadyInDb.length}`);
  console.log(`Nuevos relevantes:         ${newRelevant.length}`);
  console.log(`Ruido descartado:          ${report.ruidoDescartado}`);
  console.log(`\n💰 Coste Nearby (este run): $${report.costoNearbyUsd} USD`);
  console.log(
    `💰 + Details proyectado:     $${report.costoDetailsProyectadoUsd} USD`
  );
  console.log(
    `💰 Total proyectado import:  $${report.costoTotalProyectadoUsd} USD`
  );
  console.log("\nPor región:");
  for (const row of byRegion) {
    console.log(
      `   ${row.region.padEnd(28)} únicos=${row.unicos}  rel=${row.relevantes}  nuevos=${row.nuevosRelevantes}`
    );
  }
  console.log(`\n📄 Informe: ${outPath}`);
  console.log("\nTop 15 nuevos relevantes (por nº reviews):");
  top.slice(0, 15).forEach((h, i) => {
    console.log(
      `   ${String(i + 1).padStart(2)}. ${h.name} ★${h.rating || "?"} (${h.user_ratings_total || 0}) — ${h.region}`
    );
  });

  if (doImport) {
    await importHits(newRelevant, existingIds);
  } else {
    console.log("\n👀 DRY RUN — no se importó nada.");
    console.log(
      "   Import informe: npm run import:mexico:pilot -- --from-report --import"
    );
    console.log(
      "   Fase 2: npm run import:mexico:pilot -- --phase=2 --import"
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
