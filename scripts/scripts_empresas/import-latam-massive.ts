/**
 * 🌎 BÚSQUEDA MASIVA AUTOMÁTICA - LATINOAMÉRICA
 * ============================================================================
 *
 * Este script recorre LATAM buscando con términos locales (trailer park, RV,
 * casa rodante). Al encontrar: publica | privada | camping, o no entra.
 *
 * ESTRATEGIA:
 * - Divide cada país en cuadrículas geográficas
 * - Busca múltiples términos en cada cuadrícula
 * - Detecta y evita duplicados (7 criterios)
 * - Importa automáticamente a la base de datos
 * - Corrige países automáticamente
 *
 * USO:
 *   npm run import:latam:dry           # Modo estimación (sin importar)
 *   npm run import:latam               # Importar todas las áreas
 *   npm run import:latam -- --country=uruguay  # Solo un país
 *   npm run import:latam -- --limit=50        # Máximo 50 áreas por país
 *
 * COSTOS ESTIMADOS (depende de resultados):
 *   - ~1500-2000 búsquedas en Google Places API
 *   - Costo aproximado: $80-120 USD
 *   - Tiempo estimado: 2-4 horas
 *
 * REQUISITOS:
 *   - Variables de entorno NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 *   - Variables de Supabase configuradas
 *   - Permisos de administrador
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { decidirUbicacion } from "../../lib/areas/tipo-area";

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan variables de entorno de Supabase");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar Google API
const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!googleApiKey) {
  console.error("❌ Error: Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  process.exit(1);
}

// ============================================================================
// CONFIGURACIÓN DE PAÍSES Y REGIONES
// ============================================================================

interface Pais {
  nombre: string;
  codigo: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  gridSize: number; // Tamaño de cuadrícula en grados (1° ≈ 111km)
  prioridad: number; // 1=alta, 2=media, 3=baja
}

const PAISES_LATAM: Pais[] = [
  // AMÉRICA DEL SUR
  {
    nombre: "Argentina",
    codigo: "AR",
    bounds: { north: -21.78, south: -55.05, east: -53.59, west: -73.56 },
    gridSize: 3, // País grande, cuadrículas de ~330km
    prioridad: 1,
  },
  {
    nombre: "Uruguay",
    codigo: "UY",
    bounds: { north: -30.09, south: -35.0, east: -53.08, west: -58.43 },
    gridSize: 1, // País pequeño, cuadrículas de ~111km
    prioridad: 1,
  },
  {
    nombre: "Chile",
    codigo: "CL",
    bounds: { north: -17.5, south: -56.0, east: -66.42, west: -75.64 },
    gridSize: 3, // País muy largo
    prioridad: 1,
  },
  {
    nombre: "Perú",
    codigo: "PE",
    bounds: { north: -0.04, south: -18.35, east: -68.65, west: -81.33 },
    gridSize: 2.5,
    prioridad: 2,
  },
  {
    nombre: "Bolivia",
    codigo: "BO",
    bounds: { north: -9.67, south: -22.9, east: -57.45, west: -69.64 },
    gridSize: 2.5,
    prioridad: 2,
  },
  {
    nombre: "Paraguay",
    codigo: "PY",
    bounds: { north: -19.29, south: -27.61, east: -54.26, west: -62.64 },
    gridSize: 2,
    prioridad: 2,
  },
  {
    nombre: "Colombia",
    codigo: "CO",
    bounds: { north: 12.46, south: -4.23, east: -66.87, west: -79.02 },
    gridSize: 2.5,
    prioridad: 2,
  },
  {
    nombre: "Ecuador",
    codigo: "EC",
    bounds: { north: 1.43, south: -5.01, east: -75.19, west: -81.08 },
    gridSize: 1.5,
    prioridad: 2,
  },
  {
    nombre: "Venezuela",
    codigo: "VE",
    bounds: { north: 12.2, south: 0.65, east: -59.8, west: -73.35 },
    gridSize: 2.5,
    prioridad: 3,
  },

  // AMÉRICA CENTRAL
  {
    nombre: "Panamá",
    codigo: "PA",
    bounds: { north: 9.65, south: 7.2, east: -77.17, west: -83.05 },
    gridSize: 1,
    prioridad: 2,
  },
  {
    nombre: "Costa Rica",
    codigo: "CR",
    bounds: { north: 11.22, south: 8.03, east: -82.55, west: -85.95 },
    gridSize: 1,
    prioridad: 2,
  },
  {
    nombre: "Nicaragua",
    codigo: "NI",
    bounds: { north: 15.03, south: 10.71, east: -83.15, west: -87.69 },
    gridSize: 1.5,
    prioridad: 3,
  },
  {
    nombre: "Honduras",
    codigo: "HN",
    bounds: { north: 16.51, south: 12.98, east: -83.15, west: -89.35 },
    gridSize: 1.5,
    prioridad: 3,
  },
  {
    nombre: "El Salvador",
    codigo: "SV",
    bounds: { north: 14.45, south: 13.15, east: -87.69, west: -90.13 },
    gridSize: 0.8,
    prioridad: 3,
  },
  {
    nombre: "Guatemala",
    codigo: "GT",
    bounds: { north: 17.82, south: 13.74, east: -88.22, west: -92.23 },
    gridSize: 1.5,
    prioridad: 3,
  },

  // AMÉRICA DEL NORTE
  {
    nombre: "México",
    codigo: "MX",
    bounds: { north: 32.72, south: 14.53, east: -86.71, west: -118.45 },
    gridSize: 3, // País muy grande
    prioridad: 1,
  },

  // CARIBE
  {
    nombre: "Cuba",
    codigo: "CU",
    bounds: { north: 23.27, south: 19.82, east: -74.13, west: -84.97 },
    gridSize: 2,
    prioridad: 3,
  },
  {
    nombre: "República Dominicana",
    codigo: "DO",
    bounds: { north: 19.93, south: 17.47, east: -68.32, west: -72.0 },
    gridSize: 1,
    prioridad: 2,
  },
];

// Términos de búsqueda en español
const TERMINOS_BUSQUEDA = [
  "área autocaravana",
  "camping motorhome",
  "estacionamiento motorhome",
  "rv park",
  "área camper",
  "parking camper",
];

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

interface Grid {
  north: number;
  south: number;
  east: number;
  west: number;
  center: { lat: number; lng: number };
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  website?: string | null;
  phone?: string | null;
  photos?: any[];
}

interface Area {
  id: string;
  nombre: string;
  slug: string;
  pais: string | null;
  provincia: string | null;
  ciudad: string | null;
  latitud: number;
  longitud: number;
  direccion: string | null;
  google_place_id: string | null;
}

interface ImportStats {
  pais: string;
  busquedasRealizadas: number;
  resultadosEncontrados: number;
  areasNuevas: number;
  areasDuplicadas: number;
  areasImportadas: number;
  errores: number;
  costoEstimado: number;
}

// ============================================================================
// CACHÉ DE ÁREAS EXISTENTES
// ============================================================================

let areasExistentes: Area[] = [];
let placeIdsSet = new Set<string>();
let slugsSet = new Set<string>();
let normalizedNamesSet = new Set<string>();

async function cargarAreasExistentes() {
  console.log("🔄 Cargando áreas existentes desde Supabase...");

  const allAreas: Area[] = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: areas, error } = await (supabase as any).from("areas")
      .select(
        "id, nombre, slug, pais, provincia, ciudad, latitud, longitud, direccion, google_place_id"
      )
      .eq("activo", true)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("❌ Error cargando áreas:", error.message);
      throw error;
    }

    if (!areas || areas.length === 0) {
      hasMore = false;
    } else {
      allAreas.push(...(areas as Area[]));
      page++;

      if (areas.length < pageSize) {
        hasMore = false;
      }
    }
  }

  areasExistentes = allAreas;

  // Construir sets para búsqueda rápida
  placeIdsSet = new Set(
    allAreas
      .filter((a) => a.google_place_id)
      .map((a) => a.google_place_id as string)
  );
  slugsSet = new Set(allAreas.map((a) => a.slug));
  normalizedNamesSet = new Set(allAreas.map((a) => normalizeText(a.nombre)));

  console.log(`✅ Cargadas ${allAreas.length} áreas existentes`);
  console.log(`   - ${placeIdsSet.size} Google Place IDs únicos`);
  console.log(`   - ${slugsSet.size} slugs únicos`);
  console.log(`   - ${normalizedNamesSet.size} nombres únicos\n`);
}

// ============================================================================
// UTILIDADES
// ============================================================================

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateSlug(text: string): string {
  return normalizeText(text).replace(/\s+/g, "-");
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// DETECCIÓN DE DUPLICADOS (7 CRITERIOS)
// ============================================================================

function checkIfPlaceExists(place: PlaceResult): boolean {
  // 1. VERIFICAR POR GOOGLE PLACE ID
  if (place.place_id && placeIdsSet.has(place.place_id)) {
    return true;
  }

  // 2. VERIFICAR POR SLUG GENERADO
  const placeSlug = generateSlug(place.name);
  if (placeSlug && slugsSet.has(placeSlug)) {
    return true;
  }

  // 3. VERIFICAR POR NOMBRE NORMALIZADO
  const placeNormalizedName = normalizeText(place.name);
  if (placeNormalizedName && normalizedNamesSet.has(placeNormalizedName)) {
    return true;
  }

  // 4. VERIFICAR POR DIRECCIÓN NORMALIZADA
  const placeNormalizedAddress = normalizeText(place.formatted_address);
  if (placeNormalizedAddress) {
    for (const area of areasExistentes) {
      if (
        area.direccion &&
        normalizeText(area.direccion) === placeNormalizedAddress
      ) {
        return true;
      }
    }
  }

  // 5. VERIFICAR POR COORDENADAS (radio 500m)
  const lat = place.geometry?.location?.lat;
  const lng = place.geometry?.location?.lng;

  if (lat && lng) {
    for (const area of areasExistentes) {
      if (area.latitud && area.longitud) {
        const distance = calculateDistance(
          lat,
          lng,
          area.latitud,
          area.longitud
        );
        if (distance < 0.5) {
          // Menos de 500 metros
          return true;
        }
      }
    }
  }

  // 6. SIMILITUD DE NOMBRE (Fuzzy Matching)
  const placeWords = new Set(
    placeNormalizedName.split(" ").filter((w) => w.length > 3)
  );

  for (const area of areasExistentes) {
    const areaWords = new Set(
      normalizeText(area.nombre)
        .split(" ")
        .filter((w) => w.length > 3)
    );

    if (placeWords.size > 0 && areaWords.size > 0) {
      const intersection = new Set(
        [...placeWords].filter((w) => areaWords.has(w))
      );
      const similarity =
        intersection.size / Math.max(placeWords.size, areaWords.size);

      if (similarity >= 0.8) {
        // 80% de palabras coinciden
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// GENERACIÓN DE CUADRÍCULA
// ============================================================================

function createGrid(bounds: Pais["bounds"], gridSize: number): Grid[] {
  const grids: Grid[] = [];

  for (let lat = bounds.south; lat < bounds.north; lat += gridSize) {
    for (let lng = bounds.west; lng < bounds.east; lng += gridSize) {
      const grid: Grid = {
        south: lat,
        north: Math.min(lat + gridSize, bounds.north),
        west: lng,
        east: Math.min(lng + gridSize, bounds.east),
        center: {
          lat: lat + gridSize / 2,
          lng: lng + gridSize / 2,
        },
      };
      grids.push(grid);
    }
  }

  return grids;
}

// ============================================================================
// BÚSQUEDA EN GOOGLE PLACES API
// ============================================================================

async function searchInBounds(
  query: string,
  bounds: Grid
): Promise<PlaceResult[]> {
  try {
    // Calcular radio desde el centro
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const radiusKm =
      (Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111) / 2;
    const radiusMeters = Math.min(radiusKm * 1000, 50000); // Máximo 50km

    // Usar Nearby Search API
    const searchUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    );
    searchUrl.searchParams.append(
      "location",
      `${bounds.center.lat},${bounds.center.lng}`
    );
    searchUrl.searchParams.append("radius", radiusMeters.toString());
    searchUrl.searchParams.append("keyword", query);
    searchUrl.searchParams.append("key", googleApiKey!);
    searchUrl.searchParams.append("language", "es");

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      console.error(`❌ Error HTTP ${response.status} en búsqueda: ${query}`);
      return [];
    }

    const data: any = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return [];
    }

    if (data.status !== "OK") {
      console.error(
        `⚠️  API Status: ${data.status} - ${data.error_message || ""}`
      );
      return [];
    }

    let allResults = data.results || [];

    // Obtener páginas adicionales (hasta 60 resultados)
    let nextPageToken = data.next_page_token;
    let pagesProcessed = 1;

    while (nextPageToken && pagesProcessed < 3) {
      await delay(2000); // Delay requerido por Google

      const nextPageUrl = new URL(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
      );
      nextPageUrl.searchParams.append("key", googleApiKey!);
      nextPageUrl.searchParams.append("pagetoken", nextPageToken);

      const nextResponse = await fetch(nextPageUrl.toString());

      if (nextResponse.ok) {
        const nextData: any = await nextResponse.json();

        if (nextData.status === "OK" && nextData.results) {
          allResults = [...allResults, ...nextData.results];
          nextPageToken = nextData.next_page_token;
          pagesProcessed++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // Enriquecer con Place Details
    const enrichedResults: PlaceResult[] = [];

    for (const place of allResults) {
      try {
        const detailsUrl = new URL(
          "https://maps.googleapis.com/maps/api/place/details/json"
        );
        detailsUrl.searchParams.append("place_id", place.place_id);
        detailsUrl.searchParams.append("key", googleApiKey!);
        detailsUrl.searchParams.append(
          "fields",
          "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,business_status,address_components"
        );
        detailsUrl.searchParams.append("language", "es");

        const detailsResponse = await fetch(detailsUrl.toString());

        if (detailsResponse.ok) {
          const detailsData: any = await detailsResponse.json();

          if (detailsData.status === "OK" && detailsData.result) {
            enrichedResults.push({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.formatted_address,
              geometry: {
                location: {
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                },
              },
              types: place.types,
              rating: place.rating,
              user_ratings_total: place.user_ratings_total,
              business_status: place.business_status,
              website: detailsData.result.website || null,
              phone: detailsData.result.formatted_phone_number || null,
            });
          }
        }

        await delay(100); // Pequeño delay entre detalles
      } catch (error) {
        // Añadir sin detalles adicionales
        enrichedResults.push({
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: {
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
          },
          types: place.types,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          business_status: place.business_status,
          website: null,
          phone: null,
        });
      }
    }

    return enrichedResults;
  } catch (error: any) {
    console.error(`❌ Error en búsqueda: ${error.message}`);
    return [];
  }
}

// ============================================================================
// GEOCODING INVERSO (OBTENER PAÍS REAL)
// ============================================================================

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ country: string; province: string; city: string } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${googleApiKey}`;

    const response = await fetch(url);
    const data: any = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return null;
    }

    const components = data.results[0].address_components;

    let country = "";
    let province = "";
    let city = "";

    for (const component of components) {
      if (component.types.includes("country")) {
        country = component.long_name;
      }
      if (component.types.includes("administrative_area_level_2")) {
        province = component.long_name;
      }
      if (
        component.types.includes("administrative_area_level_1") &&
        !province
      ) {
        province = component.long_name;
      }
      if (component.types.includes("locality")) {
        city = component.long_name;
      }
    }

    return { country: country || "Desconocido", province, city };
  } catch (error) {
    return null;
  }
}

// ============================================================================
// IMPORTACIÓN DE ÁREAS
// ============================================================================

async function importArea(place: PlaceResult, pais: string): Promise<boolean> {
  try {
    // Obtener país real mediante geocoding
    const location = await reverseGeocode(
      place.geometry.location.lat,
      place.geometry.location.lng
    );

    const paisReal = location?.country || pais;
    const provincia = location?.province || null;
    const ciudad = location?.city || null;

    // Generar slug
    const slug = generateSlug(
      `${place.name}-${ciudad || provincia || paisReal}`
    );

    // Verificar si ya existe (doble check)
    if (slugsSet.has(slug) || placeIdsSet.has(place.place_id)) {
      return false; // Ya existe
    }

    const decision = decidirUbicacion(place.name, {
      pais: paisReal,
      types: place.types || [],
    });
    if (!decision.admite || !decision.tipo) {
      console.log(`  ↷ fuera de las 4: ${place.name} (${decision.motivo})`);
      return false;
    }

    const newArea = {
      nombre: place.name,
      slug: slug,
      descripcion: null,
      tipo_area: decision.tipo,
      pais: paisReal,
      provincia: provincia,
      ciudad: ciudad,
      direccion: place.formatted_address,
      latitud: place.geometry.location.lat,
      longitud: place.geometry.location.lng,
      precio_noche: null,
      plazas_camper: null,
      google_place_id: place.place_id,
      google_types: place.types || null, // ✨ Guardar tipos de Google
      google_maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      website: place.website || null,
      telefono: place.phone || null,
      google_rating: place.rating || null,
      verificado: false,
      activo: true,
      servicios: {},
    };

    const { error } = await (supabase as any).from("areas").insert([newArea]);

    if (error) {
      console.error(`❌ Error insertando ${place.name}:`, error.message);
      return false;
    }

    // Actualizar caché local
    placeIdsSet.add(place.place_id);
    slugsSet.add(slug);
    normalizedNamesSet.add(normalizeText(place.name));

    return true;
  } catch (error: any) {
    console.error(`❌ Error importando área: ${error.message}`);
    return false;
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function importLATAMMassive() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry") || args.includes("--dry-run");
  const countryFilter = args
    .find((arg) => arg.startsWith("--country="))
    ?.split("=")[1];
  const limitPerCountry = parseInt(
    args.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || "0"
  );

  console.log("\n" + "=".repeat(80));
  console.log("🌎 BÚSQUEDA MASIVA AUTOMÁTICA - LATINOAMÉRICA");
  console.log("=".repeat(80));
  console.log(`📅 Fecha: ${new Date().toLocaleString("es-ES")}`);
  console.log(
    `Modo: ${isDryRun ? "👀 DRY RUN (estimación)" : "✅ IMPORTACIÓN REAL"}`
  );
  if (countryFilter) {
    console.log(`🎯 País filtrado: ${countryFilter.toUpperCase()}`);
  }
  if (limitPerCountry > 0) {
    console.log(`🔢 Límite por país: ${limitPerCountry} áreas`);
  }
  console.log("=".repeat(80) + "\n");

  // Cargar áreas existentes
  await cargarAreasExistentes();

  // Filtrar países si es necesario
  let paisesAProcesar = PAISES_LATAM;
  if (countryFilter) {
    paisesAProcesar = PAISES_LATAM.filter(
      (p) =>
        p.nombre.toLowerCase() === countryFilter.toLowerCase() ||
        p.codigo.toLowerCase() === countryFilter.toLowerCase()
    );

    if (paisesAProcesar.length === 0) {
      console.error(`❌ País no encontrado: ${countryFilter}`);
      console.log("\nPaíses disponibles:");
      PAISES_LATAM.forEach((p) =>
        console.log(`   - ${p.nombre} (${p.codigo})`)
      );
      process.exit(1);
    }
  }

  // Ordenar por prioridad
  paisesAProcesar.sort((a: any, b: any) => a.prioridad - b.prioridad);

  const statsGlobal: ImportStats[] = [];
  let totalBusquedas = 0;
  let totalResultados = 0;
  let totalImportadas = 0;
  let totalDuplicadas = 0;

  // Procesar cada país
  for (const pais of paisesAProcesar) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🌍 PROCESANDO: ${pais.nombre.toUpperCase()} (${pais.codigo})`);
    console.log(`${"=".repeat(80)}\n`);

    const stats: ImportStats = {
      pais: pais.nombre,
      busquedasRealizadas: 0,
      resultadosEncontrados: 0,
      areasNuevas: 0,
      areasDuplicadas: 0,
      areasImportadas: 0,
      errores: 0,
      costoEstimado: 0,
    };

    // Crear cuadrícula
    const grids = createGrid(pais.bounds, pais.gridSize);
    console.log(`📐 Cuadrículas generadas: ${grids.length}`);
    console.log(`🔍 Términos de búsqueda: ${TERMINOS_BUSQUEDA.length}`);
    console.log(
      `📊 Total búsquedas estimadas: ${
        grids.length * TERMINOS_BUSQUEDA.length
      }\n`
    );

    let areasImportadasPais = 0;

    // Procesar cada cuadrícula
    for (let i = 0; i < grids.length; i++) {
      const grid = grids[i];

      console.log(
        `\n📍 Cuadrícula ${i + 1}/${
          grids.length
        } - Centro: [${grid.center.lat.toFixed(2)}, ${grid.center.lng.toFixed(
          2
        )}]`
      );

      // Buscar cada término
      for (const termino of TERMINOS_BUSQUEDA) {
        // Verificar límite
        if (limitPerCountry > 0 && areasImportadasPais >= limitPerCountry) {
          console.log(
            `\n⚠️  Límite alcanzado para ${pais.nombre}: ${limitPerCountry} áreas`
          );
          break;
        }

        stats.busquedasRealizadas++;
        totalBusquedas++;

        process.stdout.write(`   Buscando "${termino}"... `);

        const resultados = await searchInBounds(termino, grid);

        if (resultados.length > 0) {
          console.log(`✅ ${resultados.length} resultados`);

          stats.resultadosEncontrados += resultados.length;
          totalResultados += resultados.length;

          // Filtrar duplicados
          const nuevas = resultados.filter((r) => !checkIfPlaceExists(r));

          stats.areasNuevas += nuevas.length;
          stats.areasDuplicadas += resultados.length - nuevas.length;
          totalDuplicadas += resultados.length - nuevas.length;

          if (nuevas.length > 0) {
            console.log(
              `      → ${nuevas.length} nuevas, ${
                resultados.length - nuevas.length
              } duplicadas`
            );

            // Importar si no es dry-run
            if (!isDryRun) {
              for (const area of nuevas) {
                // Verificar límite nuevamente
                if (
                  limitPerCountry > 0 &&
                  areasImportadasPais >= limitPerCountry
                ) {
                  break;
                }

                const imported = await importArea(area, pais.nombre);
                if (imported) {
                  stats.areasImportadas++;
                  totalImportadas++;
                  areasImportadasPais++;
                  console.log(`      ✅ Importada: ${area.name}`);
                } else {
                  stats.errores++;
                }
                await delay(100); // Delay entre importaciones
              }
            }
          } else {
            console.log(`      → Todas son duplicadas`);
          }
        } else {
          console.log(`⚪ 0 resultados`);
        }

        // Delay entre búsquedas
        await delay(500);
      }

      // Verificar límite de cuadrícula
      if (limitPerCountry > 0 && areasImportadasPais >= limitPerCountry) {
        break;
      }
    }

    // Calcular costo estimado para este país
    // Nearby Search: $32/1000, Place Details: $17/1000, Geocoding: $5/1000
    const costoBusquedas = (stats.busquedasRealizadas * 32) / 1000;
    const costoDetalles = (stats.resultadosEncontrados * 17) / 1000;
    const costoGeocoding = (stats.areasImportadas * 5) / 1000;
    stats.costoEstimado = costoBusquedas + costoDetalles + costoGeocoding;

    statsGlobal.push(stats);

    // Resumen del país
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📊 RESUMEN - ${pais.nombre.toUpperCase()}`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Búsquedas realizadas:    ${stats.busquedasRealizadas}`);
    console.log(`Resultados encontrados:  ${stats.resultadosEncontrados}`);
    console.log(`Áreas nuevas:            ${stats.areasNuevas}`);
    console.log(`Áreas duplicadas:        ${stats.areasDuplicadas}`);
    if (!isDryRun) {
      console.log(`Áreas importadas:        ${stats.areasImportadas}`);
      console.log(`Errores:                 ${stats.errores}`);
    }
    console.log(
      `Costo estimado:          $${stats.costoEstimado.toFixed(2)} USD`
    );
    console.log(`${"=".repeat(80)}\n`);

    // Pequeña pausa entre países
    await delay(2000);
  }

  // ============================================================================
  // RESUMEN GLOBAL
  // ============================================================================

  console.log(`\n\n${"=".repeat(80)}`);
  console.log(`🌎 RESUMEN GLOBAL - LATINOAMÉRICA`);
  console.log(`${"=".repeat(80)}\n`);

  console.log(`📊 Estadísticas generales:`);
  console.log(`   Países procesados:       ${statsGlobal.length}`);
  console.log(`   Búsquedas realizadas:    ${totalBusquedas}`);
  console.log(`   Resultados encontrados:  ${totalResultados}`);
  console.log(
    `   Áreas nuevas detectadas: ${statsGlobal.reduce(
      (sum, s) => sum + s.areasNuevas,
      0
    )}`
  );
  console.log(`   Áreas duplicadas:        ${totalDuplicadas}`);

  if (!isDryRun) {
    console.log(`   Áreas importadas:        ${totalImportadas}`);
    console.log(
      `   Errores:                 ${statsGlobal.reduce(
        (sum, s) => sum + s.errores,
        0
      )}`
    );
  }

  const costoTotal = statsGlobal.reduce((sum: any, s: any) => sum + s.costoEstimado, 0);
  console.log(`\n💰 Costo total estimado:     $${costoTotal.toFixed(2)} USD\n`);

  // Tabla por país
  console.log(`📋 Detalle por país:\n`);
  console.log(
    `${"País".padEnd(20)} ${"Búsquedas".padEnd(12)} ${"Resultados".padEnd(
      12
    )} ${"Nuevas".padEnd(10)} ${
      isDryRun ? "" : "Importadas".padEnd(12)
    } ${"Costo".padEnd(10)}`
  );
  console.log(`${"-".repeat(80)}`);

  statsGlobal.forEach((stat) => {
    console.log(
      `${stat.pais.padEnd(20)} ${stat.busquedasRealizadas
        .toString()
        .padEnd(12)} ${stat.resultadosEncontrados
        .toString()
        .padEnd(12)} ${stat.areasNuevas.toString().padEnd(10)} ${
        isDryRun ? "" : stat.areasImportadas.toString().padEnd(12)
      } ${"$" + stat.costoEstimado.toFixed(2).padEnd(10)}`
    );
  });

  console.log(`\n${"=".repeat(80)}\n`);

  if (isDryRun) {
    console.log(`👀 Modo DRY RUN - No se importaron áreas`);
    console.log(`   Para importar realmente, ejecuta:`);
    console.log(`   npm run import:latam\n`);
  } else {
    console.log(`✅ Importación completada`);
    console.log(
      `   Total de áreas añadidas a la base de datos: ${totalImportadas}\n`
    );
  }
}

// Ejecutar
importLATAMMassive()
  .then(() => {
    console.log("✅ Script completado\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
