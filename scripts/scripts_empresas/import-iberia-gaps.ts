/**
 * Búsqueda en huecos: términos locales del país; al encontrar, publica | privada | camping o no entra.
 *
 * USO:
 *   npm run import:iberia:gaps
 *   npm run import:iberia:gaps -- --from-report --import
 *   npm run import:baleares:gaps
 *   npm run import:baleares:gaps -- --from-report --import
 *   npm run import:alemania:gaps
 *   npm run import:alemania:gaps -- --from-report --import
 *   npm run import:francia:gaps
 *   npm run import:francia:gaps -- --from-report --import
 *   npm run import:italia:gaps
 *   npm run import:italia:gaps -- --from-report --import
 *   npm run import:alemania:gaps -- --solo-stopover
 *   npm run import:francia:gaps -- --solo-stopover
 *   npm run import:italia:gaps -- --solo-stopover
 *   npm run import:iberia:gaps -- --solo-stopover
 *   npm run import:suiza:gaps
 *   npm run import:austria:gaps
 *   npm run import:belgica:gaps
 *   npm run import:luxemburgo:gaps
 *   npm run import:holanda:gaps
 *   npm run import:dinamarca:gaps
 *   npm run import:suecia:gaps
 *   npm run import:noruega:gaps
 *   npm run import:chile:gaps
 *   npm run import:argentina:gaps
 *   npm run import:levante:campings
 *   npm run import:campings:valencia
 *   npm run import:campings:castellon
 *   npm run import:campings:tarragona
 *   npm run import:campings:barcelona
 *   npm run import:campings:gerona
 *   npm run import:campings:almeria
 *   npm run import:campings:malaga
 *   npm run import:campings:cadiz
 *   npm run import:campings:huelva
 *   npm run import:campings:cordoba
 *   npm run import:campings:jaen
 *   npm run import:campings:albacete
 *   npm run import:campings:ciudadreal
 *   npm run import:campings:badajoz
 *   npm run import:campings:cuenca
 *   npm run import:campings:madrid
 *   npm run import:campings:toledo
 *   npm run import:campings:caceres
 *   npm run import:campings:teruel
 *   npm run import:campings:guadalajara
 *   npm run import:campings:zaragoza
 *   npm run import:campings:huesca
 *   npm run import:campings:lleida
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { decidirUbicacion } from "../../lib/areas/tipo-area";
import { baseAreaSlug, uniqueAreaSlug } from "../../lib/areas/slug";

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

const REGION = process.argv.find((a) => a.startsWith("--region="))?.split("=")[1] || "peninsula";
const SOLO_STOPOVER = process.argv.includes("--solo-stopover");

let REPORT_NAME =
  REGION === "baleares"
    ? "baleares-gaps-dry-report.json"
    : REGION === "alemania"
      ? "alemania-gaps-dry-report.json"
      : REGION === "francia"
        ? "francia-gaps-dry-report.json"
        : REGION === "italia"
          ? "italia-gaps-dry-report.json"
        : REGION === "suiza"
          ? "suiza-gaps-dry-report.json"
        : REGION === "austria"
          ? "austria-gaps-dry-report.json"
        : REGION === "belgica"
          ? "belgica-gaps-dry-report.json"
        : REGION === "luxemburgo"
          ? "luxemburgo-gaps-dry-report.json"
        : REGION === "holanda"
          ? "holanda-gaps-dry-report.json"
        : REGION === "dinamarca"
          ? "dinamarca-gaps-dry-report.json"
        : REGION === "suecia"
          ? "suecia-gaps-dry-report.json"
        : REGION === "noruega"
          ? "noruega-gaps-dry-report.json"
        : REGION === "chile"
          ? "chile-gaps-dry-report.json"
        : REGION === "argentina"
          ? "argentina-gaps-dry-report.json"
        : REGION === "murcia-alicante"
          ? "levante-campings-dry-report.json"
        : REGION === "valencia"
          ? "valencia-campings-dry-report.json"
        : REGION === "castellon"
          ? "castellon-campings-dry-report.json"
        : REGION === "tarragona"
          ? "tarragona-campings-dry-report.json"
        : REGION === "barcelona"
          ? "barcelona-campings-dry-report.json"
        : REGION === "gerona"
          ? "gerona-campings-dry-report.json"
        : REGION === "almeria"
          ? "almeria-campings-dry-report.json"
        : REGION === "malaga"
          ? "malaga-campings-dry-report.json"
        : REGION === "cadiz"
          ? "cadiz-campings-dry-report.json"
        : REGION === "huelva"
          ? "huelva-campings-dry-report.json"
        : REGION === "cordoba"
          ? "cordoba-campings-dry-report.json"
        : REGION === "jaen"
          ? "jaen-campings-dry-report.json"
        : REGION === "albacete"
          ? "albacete-campings-dry-report.json"
        : REGION === "ciudadreal"
          ? "ciudadreal-campings-dry-report.json"
        : REGION === "badajoz"
          ? "badajoz-campings-dry-report.json"
        : REGION === "cuenca"
          ? "cuenca-campings-dry-report.json"
        : REGION === "madrid"
          ? "madrid-campings-dry-report.json"
        : REGION === "toledo"
          ? "toledo-campings-dry-report.json"
        : REGION === "caceres"
          ? "caceres-campings-dry-report.json"
        : REGION === "teruel"
          ? "teruel-campings-dry-report.json"
        : REGION === "guadalajara"
          ? "guadalajara-campings-dry-report.json"
        : REGION === "zaragoza"
          ? "zaragoza-campings-dry-report.json"
        : REGION === "huesca"
          ? "huesca-campings-dry-report.json"
        : REGION === "lleida"
          ? "lleida-campings-dry-report.json"
        : "iberia-gaps-dry-report.json";
if (SOLO_STOPOVER) {
  REPORT_NAME = REPORT_NAME.replace("-gaps-dry-report.json", "-stopover-dry-report.json");
}
const REPORT_PATH = path.join(process.cwd(), "scripts", REPORT_NAME);

const HUECOS_PENINSULA = [
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

/** Archipiélago vacío (0 áreas en BD). Un disparo cada ~25 km de tierra. */
const HUECOS_BALEARES = [
  { id: 1, zona: "Mallorca — Palma / SW", lat: 39.57, lng: 2.65, pais: "España" },
  { id: 2, zona: "Mallorca — Tramuntana / Sóller", lat: 39.77, lng: 2.72, pais: "España" },
  { id: 3, zona: "Mallorca — Alcúdia / Pollença", lat: 39.85, lng: 3.05, pais: "España" },
  { id: 4, zona: "Mallorca — Llevant / Manacor", lat: 39.55, lng: 3.25, pais: "España" },
  { id: 5, zona: "Mallorca — Migjorn / Santanyí", lat: 39.4, lng: 3.15, pais: "España" },
  { id: 6, zona: "Mallorca — Inca / centro", lat: 39.72, lng: 2.91, pais: "España" },
  { id: 7, zona: "Menorca — Ciutadella", lat: 40.0, lng: 3.84, pais: "España" },
  { id: 8, zona: "Menorca — Maó", lat: 39.89, lng: 4.26, pais: "España" },
  { id: 9, zona: "Menorca — Es Mercadal", lat: 39.99, lng: 4.05, pais: "España" },
  { id: 10, zona: "Ibiza — Vila / sur", lat: 38.91, lng: 1.43, pais: "España" },
  { id: 11, zona: "Ibiza — Sant Antoni", lat: 38.98, lng: 1.3, pais: "España" },
  { id: 12, zona: "Ibiza — nord", lat: 39.1, lng: 1.51, pais: "España" },
  { id: 13, zona: "Formentera", lat: 38.7, lng: 1.43, pais: "España" },
];

/** Huecos tierra DE (malla 25 km, sin mar del Norte ni Bohemia/Alsacia). */
const HUECOS_ALEMANIA = [
  { id: 1, zona: "Brandeburgo oeste / Havelland", lat: 52.59, lng: 12.32, pais: "Alemania" },
  { id: 2, zona: "Prignitz", lat: 53.05, lng: 12.15, pais: "Alemania" },
  { id: 3, zona: "Fläming", lat: 52.15, lng: 12.75, pais: "Alemania" },
  { id: 4, zona: "Alto Palatinado / Cham", lat: 49.2, lng: 12.65, pais: "Alemania" },
  { id: 5, zona: "Bosque Bávaro / Passau", lat: 48.75, lng: 13.1, pais: "Alemania" },
  { id: 6, zona: "Sarre", lat: 49.32, lng: 7.05, pais: "Alemania" },
  { id: 7, zona: "Emsland", lat: 52.75, lng: 7.25, pais: "Alemania" },
  { id: 8, zona: "Selva Negra / Baar", lat: 48.1, lng: 8.77, pais: "Alemania" },
  { id: 9, zona: "Turingia / Rhön", lat: 50.58, lng: 10.23, pais: "Alemania" },
  { id: 10, zona: "Rügen", lat: 54.42, lng: 13.4, pais: "Alemania" },
  { id: 11, zona: "Fehmarn / Holstein este", lat: 54.45, lng: 11.05, pais: "Alemania" },
  { id: 12, zona: "Frisia Norte", lat: 54.48, lng: 8.95, pais: "Alemania" },
  { id: 13, zona: "Sauerland", lat: 51.15, lng: 8.05, pais: "Alemania" },
  { id: 14, zona: "Teutoburgo", lat: 51.9, lng: 8.76, pais: "Alemania" },
  { id: 15, zona: "Holstein / Plön", lat: 54.1, lng: 10.3, pais: "Alemania" },
  { id: 16, zona: "Eifel", lat: 50.25, lng: 6.7, pais: "Alemania" },
];

const HUECOS_FRANCIA = [
  { id: 1, zona: "Perche / Sarthe", lat: 47.92, lng: 0.05, pais: "Francia" },
  { id: 2, zona: "Ardenas / Thiérache", lat: 49.74, lng: 4.1, pais: "Francia" },
  { id: 3, zona: "Finistère oeste", lat: 48.07, lng: -4.17, pais: "Francia" },
  { id: 4, zona: "Béarn", lat: 43.15, lng: -0.55, pais: "Francia" },
  { id: 5, zona: "Córcega interior", lat: 42.15, lng: 9.05, pais: "Francia" },
  { id: 6, zona: "Córcega sur", lat: 41.65, lng: 9.0, pais: "Francia" },
  { id: 7, zona: "Lorena", lat: 49.12, lng: 6.85, pais: "Francia" },
  { id: 8, zona: "Ardenas este", lat: 49.7, lng: 4.85, pais: "Francia" },
  { id: 9, zona: "Ariège", lat: 42.9, lng: 1.5, pais: "Francia" },
  { id: 10, zona: "Poitou / Vienne", lat: 46.63, lng: 0.5, pais: "Francia" },
  { id: 11, zona: "Livradois / Haute-Loire", lat: 45.44, lng: 3.58, pais: "Francia" },
  { id: 12, zona: "Gers / Gascuña", lat: 43.55, lng: 0.55, pais: "Francia" },
  { id: 13, zona: "Calvados / Bessin", lat: 49.25, lng: -0.7, pais: "Francia" },
  { id: 14, zona: "Bugey", lat: 45.87, lng: 5.45, pais: "Francia" },
  { id: 15, zona: "Beauce", lat: 48.27, lng: 1.99, pais: "Francia" },
  { id: 16, zona: "Diois / Drôme", lat: 44.53, lng: 5.63, pais: "Francia" },
];

const HUECOS_ITALIA = [
  { id: 1, zona: "Sicilia sur / Agrigento", lat: 37.25, lng: 13.6, pais: "Italia" },
  { id: 2, zona: "Sicilia SE / Ragusa", lat: 36.95, lng: 14.6, pais: "Italia" },
  { id: 3, zona: "Sicilia / Madonie", lat: 37.9, lng: 14.1, pais: "Italia" },
  { id: 4, zona: "Marche / Urbino", lat: 43.58, lng: 12.94, pais: "Italia" },
  { id: 5, zona: "Cerdeña / Barbagia", lat: 40.24, lng: 9.16, pais: "Italia" },
  { id: 6, zona: "Cerdeña sur / Sarrabus", lat: 39.35, lng: 9.35, pais: "Italia" },
  { id: 7, zona: "Cerdeña NO / Nurra", lat: 40.7, lng: 8.45, pais: "Italia" },
  { id: 8, zona: "Emilia / Cremona", lat: 45.17, lng: 9.83, pais: "Italia" },
  { id: 9, zona: "Valtellina", lat: 46.35, lng: 10.15, pais: "Italia" },
  { id: 10, zona: "Novara / Verbano", lat: 45.63, lng: 8.47, pais: "Italia" },
  { id: 11, zona: "Sannio / Irpinia", lat: 41.15, lng: 14.8, pais: "Italia" },
  { id: 12, zona: "Apenino tosco-emiliano", lat: 44.4, lng: 10.05, pais: "Italia" },
  { id: 13, zona: "Val d'Ossola", lat: 46.15, lng: 8.35, pais: "Italia" },
  { id: 14, zona: "Tavoliere / Foggia", lat: 41.4, lng: 15.55, pais: "Italia" },
  { id: 15, zona: "Gargano", lat: 41.8, lng: 15.9, pais: "Italia" },
  { id: 16, zona: "Basilicata", lat: 40.55, lng: 15.8, pais: "Italia" },
];

/** Suiza: 41 áreas. Malla + cobertura del país (DE/FR/IT según cantón). */
const HUECOS_SUIZA = [
  { id: 1, zona: "Ginebra / Léman", lat: 46.22, lng: 6.14, pais: "Suiza", lang: "fr" },
  { id: 2, zona: "Lausana / Vaud", lat: 46.52, lng: 6.63, pais: "Suiza", lang: "fr" },
  { id: 3, zona: "Jura / Yverdon", lat: 46.78, lng: 6.64, pais: "Suiza", lang: "fr" },
  { id: 4, zona: "Valais / Sion", lat: 46.23, lng: 7.36, pais: "Suiza", lang: "fr" },
  { id: 5, zona: "Valais / Brig", lat: 46.32, lng: 8.0, pais: "Suiza", lang: "de" },
  { id: 6, zona: "Berna", lat: 46.95, lng: 7.45, pais: "Suiza", lang: "de" },
  { id: 7, zona: "Oberland / Interlaken", lat: 46.68, lng: 7.86, pais: "Suiza", lang: "de" },
  { id: 8, zona: "Basilea", lat: 47.48, lng: 7.6, pais: "Suiza", lang: "de" },
  { id: 9, zona: "Argovia / Aarau", lat: 47.39, lng: 8.05, pais: "Suiza", lang: "de" },
  { id: 10, zona: "Zúrich", lat: 47.38, lng: 8.54, pais: "Suiza", lang: "de" },
  { id: 11, zona: "Lucerna", lat: 47.05, lng: 8.3, pais: "Suiza", lang: "de" },
  { id: 12, zona: "Tesino / Lugano", lat: 46.15, lng: 8.95, pais: "Suiza", lang: "it" },
  { id: 13, zona: "Grisones / Coira", lat: 46.85, lng: 9.53, pais: "Suiza", lang: "de" },
  { id: 14, zona: "Engadina", lat: 46.5, lng: 9.84, pais: "Suiza", lang: "de" },
  { id: 15, zona: "San Galo / Appenzell", lat: 47.42, lng: 9.38, pais: "Suiza", lang: "de" },
  { id: 16, zona: "Friburgo / Gruyère", lat: 46.8, lng: 7.15, pais: "Suiza", lang: "fr" },
];

/** Austria: 89 áreas. Huecos tierra (sin Baviera, Tirol del Sur ni Hungría). */
const HUECOS_AUSTRIA = [
  { id: 1, zona: "Ausserfern / Reutte", lat: 47.48, lng: 10.72, pais: "Austria" },
  { id: 2, zona: "Landeck / Paznaun", lat: 47.14, lng: 10.57, pais: "Austria" },
  { id: 3, zona: "Ötztal / Imst", lat: 47.2, lng: 10.92, pais: "Austria" },
  { id: 4, zona: "Mühlviertel", lat: 48.55, lng: 14.15, pais: "Austria" },
  { id: 5, zona: "Südburgenland", lat: 47.08, lng: 16.2, pais: "Austria" },
  { id: 6, zona: "Hochschwab / Mariazell", lat: 47.6, lng: 15.3, pais: "Austria" },
  { id: 7, zona: "Weinviertel", lat: 48.55, lng: 16.45, pais: "Austria" },
  { id: 8, zona: "Weststeiermark", lat: 46.8, lng: 15.2, pais: "Austria" },
  { id: 9, zona: "Gailtal / Hermagor", lat: 46.63, lng: 13.37, pais: "Austria" },
  { id: 10, zona: "Pinzgau / Zell am See", lat: 47.25, lng: 12.78, pais: "Austria" },
  { id: 11, zona: "Mittelkärnten", lat: 46.8, lng: 14.37, pais: "Austria" },
  { id: 12, zona: "Oststeiermark", lat: 47.2, lng: 15.95, pais: "Austria" },
  { id: 13, zona: "Lungau / Murau", lat: 47.12, lng: 13.7, pais: "Austria" },
  { id: 14, zona: "Traunviertel / Steyr", lat: 48.04, lng: 14.42, pais: "Austria" },
  { id: 15, zona: "Mostviertel", lat: 48.1, lng: 15.5, pais: "Austria" },
  { id: 16, zona: "Waldviertel", lat: 48.65, lng: 15.2, pais: "Austria" },
];

/** Bélgica: 54 áreas. Flandes en neerlandés, Valonia en francés, Eupen en alemán. */
const HUECOS_BELGICA = [
  { id: 1, zona: "Costa / Ostende", lat: 51.22, lng: 2.92, pais: "Bélgica", lang: "nl" },
  { id: 2, zona: "Brujas", lat: 51.21, lng: 3.22, pais: "Bélgica", lang: "nl" },
  { id: 3, zona: "Gante", lat: 51.05, lng: 3.73, pais: "Bélgica", lang: "nl" },
  { id: 4, zona: "Amberes", lat: 51.22, lng: 4.4, pais: "Bélgica", lang: "nl" },
  { id: 5, zona: "Kempen / Turnhout", lat: 51.32, lng: 4.94, pais: "Bélgica", lang: "nl" },
  { id: 6, zona: "Limburgo / Hasselt", lat: 50.93, lng: 5.34, pais: "Bélgica", lang: "nl" },
  { id: 7, zona: "Lovaina", lat: 50.88, lng: 4.7, pais: "Bélgica", lang: "nl" },
  { id: 8, zona: "Bruselas sur / Nivelles", lat: 50.7, lng: 4.33, pais: "Bélgica", lang: "fr" },
  { id: 9, zona: "Mons / Hainaut", lat: 50.45, lng: 3.95, pais: "Bélgica", lang: "fr" },
  { id: 10, zona: "Charleroi", lat: 50.41, lng: 4.44, pais: "Bélgica", lang: "fr" },
  { id: 11, zona: "Namur", lat: 50.47, lng: 4.87, pais: "Bélgica", lang: "fr" },
  { id: 12, zona: "Lieja", lat: 50.63, lng: 5.57, pais: "Bélgica", lang: "fr" },
  { id: 13, zona: "Ardenas / Bastogne", lat: 50.0, lng: 5.72, pais: "Bélgica", lang: "fr" },
  { id: 14, zona: "Gaume / Arlon", lat: 49.68, lng: 5.82, pais: "Bélgica", lang: "fr" },
  { id: 15, zona: "Chimay / Botte", lat: 50.05, lng: 4.32, pais: "Bélgica", lang: "fr" },
  { id: 16, zona: "Eupen / Cantón del Este", lat: 50.63, lng: 6.03, pais: "Bélgica", lang: "de" },
];

/** Luxemburgo: 5 áreas. País pequeño; 6 disparos FR/DE. */
const HUECOS_LUXEMBURGO = [
  { id: 1, zona: "Ciudad de Luxemburgo", lat: 49.61, lng: 6.13, pais: "Luxemburgo", lang: "fr" },
  { id: 2, zona: "Éislek / Clervaux", lat: 50.0, lng: 6.0, pais: "Luxemburgo", lang: "de" },
  { id: 3, zona: "Mosela / Grevenmacher", lat: 49.63, lng: 6.44, pais: "Luxemburgo", lang: "de" },
  { id: 4, zona: "Redange / oeste", lat: 49.76, lng: 5.89, pais: "Luxemburgo", lang: "fr" },
  { id: 5, zona: "Mullerthal / Echternach", lat: 49.81, lng: 6.42, pais: "Luxemburgo", lang: "de" },
  { id: 6, zona: "Esch / sur", lat: 49.5, lng: 5.98, pais: "Luxemburgo", lang: "fr" },
];

/** Países Bajos: 155 áreas. El término es camperplaats, no “área”. */
const HUECOS_HOLANDA = [
  { id: 1, zona: "Kop van Noord-Holland", lat: 52.8, lng: 4.75, pais: "Países Bajos" },
  { id: 2, zona: "Frisia / Leeuwarden", lat: 53.2, lng: 5.8, pais: "Países Bajos" },
  { id: 3, zona: "Groninga", lat: 53.22, lng: 6.57, pais: "Países Bajos" },
  { id: 4, zona: "Drente / Assen", lat: 52.99, lng: 6.56, pais: "Países Bajos" },
  { id: 5, zona: "Overijssel / Zwolle", lat: 52.52, lng: 6.08, pais: "Países Bajos" },
  { id: 6, zona: "Twente / Enschede", lat: 52.22, lng: 6.89, pais: "Países Bajos" },
  { id: 7, zona: "Achterhoek", lat: 52.0, lng: 6.35, pais: "Países Bajos" },
  { id: 8, zona: "Veluwe", lat: 52.2, lng: 5.8, pais: "Países Bajos" },
  { id: 9, zona: "Utrecht / Groene Hart", lat: 52.09, lng: 5.12, pais: "Países Bajos" },
  { id: 10, zona: "Holanda Meridional", lat: 51.85, lng: 4.5, pais: "Países Bajos" },
  { id: 11, zona: "Zelanda", lat: 51.5, lng: 3.85, pais: "Países Bajos" },
  { id: 12, zona: "Brabante / Eindhoven", lat: 51.44, lng: 5.48, pais: "Países Bajos" },
  { id: 13, zona: "Limburgo norte / Venlo", lat: 51.37, lng: 6.17, pais: "Países Bajos" },
  { id: 14, zona: "Limburgo sur / Maastricht", lat: 50.9, lng: 5.8, pais: "Países Bajos" },
  { id: 15, zona: "Flevoland", lat: 52.52, lng: 5.47, pais: "Países Bajos" },
  { id: 16, zona: "Frisia Occidental", lat: 52.65, lng: 5.05, pais: "Países Bajos" },
];

/** Dinamarca: 53 áreas. Autocamperplads (y Stellplatz por turismo DE). */
const HUECOS_DINAMARCA = [
  { id: 1, zona: "Copenhague", lat: 55.68, lng: 12.57, pais: "Dinamarca" },
  { id: 2, zona: "Nordsjælland", lat: 56.03, lng: 12.3, pais: "Dinamarca" },
  { id: 3, zona: "Zealand oeste / Roskilde", lat: 55.64, lng: 12.08, pais: "Dinamarca" },
  { id: 4, zona: "Lolland / Falster", lat: 54.77, lng: 11.87, pais: "Dinamarca" },
  { id: 5, zona: "Fionia / Odense", lat: 55.4, lng: 10.39, pais: "Dinamarca" },
  { id: 6, zona: "Jutlandia sur / Kolding", lat: 55.49, lng: 9.47, pais: "Dinamarca" },
  { id: 7, zona: "Aarhus", lat: 56.16, lng: 10.2, pais: "Dinamarca" },
  { id: 8, zona: "Viborg / Midtjylland", lat: 56.45, lng: 9.4, pais: "Dinamarca" },
  { id: 9, zona: "Ringkøbing / oeste", lat: 56.09, lng: 8.24, pais: "Dinamarca" },
  { id: 10, zona: "Thy / Noroeste", lat: 56.95, lng: 8.7, pais: "Dinamarca" },
  { id: 11, zona: "Aalborg", lat: 57.05, lng: 9.92, pais: "Dinamarca" },
  { id: 12, zona: "Skagen / Vendsyssel", lat: 57.5, lng: 10.2, pais: "Dinamarca" },
  { id: 13, zona: "Sønderjylland / Tønder", lat: 55.05, lng: 8.87, pais: "Dinamarca" },
  { id: 14, zona: "Bornholm", lat: 55.13, lng: 14.92, pais: "Dinamarca" },
  { id: 15, zona: "Møn / Vordingborg", lat: 55.0, lng: 12.2, pais: "Dinamarca" },
  { id: 16, zona: "Silkeborg", lat: 56.17, lng: 9.55, pais: "Dinamarca" },
];

/** Suecia: 51 áreas. El término es ställplats / husbil. */
const HUECOS_SUECIA = [
  { id: 1, zona: "Skåne / Malmö", lat: 55.6, lng: 13.0, pais: "Suecia" },
  { id: 2, zona: "Skåne este / Kristianstad", lat: 56.03, lng: 14.15, pais: "Suecia" },
  { id: 3, zona: "Halland / Halmstad", lat: 56.67, lng: 12.86, pais: "Suecia" },
  { id: 4, zona: "Småland / Växjö", lat: 56.88, lng: 14.81, pais: "Suecia" },
  { id: 5, zona: "Blekinge", lat: 56.16, lng: 15.59, pais: "Suecia" },
  { id: 6, zona: "Gotemburgo / Bohuslän", lat: 57.71, lng: 11.97, pais: "Suecia" },
  { id: 7, zona: "Västergötland", lat: 58.39, lng: 13.85, pais: "Suecia" },
  { id: 8, zona: "Östergötland / Linköping", lat: 58.41, lng: 15.62, pais: "Suecia" },
  { id: 9, zona: "Estocolmo / Mälaren", lat: 59.33, lng: 17.8, pais: "Suecia" },
  { id: 10, zona: "Dalarna / Mora", lat: 61.0, lng: 14.54, pais: "Suecia" },
  { id: 11, zona: "Värmland / Karlstad", lat: 59.38, lng: 13.5, pais: "Suecia" },
  { id: 12, zona: "Gotland", lat: 57.5, lng: 18.47, pais: "Suecia" },
  { id: 13, zona: "Sundsvall / Norrland", lat: 62.39, lng: 17.31, pais: "Suecia" },
  { id: 14, zona: "Västerbotten / Umeå", lat: 63.83, lng: 20.26, pais: "Suecia" },
  { id: 15, zona: "Norrbotten / Luleå", lat: 65.58, lng: 22.15, pais: "Suecia" },
  { id: 16, zona: "Laponia / Kiruna", lat: 67.86, lng: 20.23, pais: "Suecia" },
];

/** Noruega: 113 áreas. El término es bobilplass. */
const HUECOS_NORUEGA = [
  { id: 1, zona: "Oslo / Østlandet", lat: 59.91, lng: 10.75, pais: "Noruega" },
  { id: 2, zona: "Østfold / Fredrikstad", lat: 59.22, lng: 10.93, pais: "Noruega" },
  { id: 3, zona: "Telemark", lat: 59.56, lng: 9.26, pais: "Noruega" },
  { id: 4, zona: "Sørlandet / Kristiansand", lat: 58.15, lng: 8.0, pais: "Noruega" },
  { id: 5, zona: "Rogaland / Stavanger", lat: 58.97, lng: 5.73, pais: "Noruega" },
  { id: 6, zona: "Vestland / Bergen", lat: 60.39, lng: 5.32, pais: "Noruega" },
  { id: 7, zona: "Sognefjord", lat: 61.23, lng: 7.1, pais: "Noruega" },
  { id: 8, zona: "Ålesund / Geiranger", lat: 62.47, lng: 6.15, pais: "Noruega" },
  { id: 9, zona: "Trondheim", lat: 63.43, lng: 10.4, pais: "Noruega" },
  { id: 10, zona: "Møre / Kristiansund", lat: 63.11, lng: 7.73, pais: "Noruega" },
  { id: 11, zona: "Nordland / Bodø", lat: 67.28, lng: 14.4, pais: "Noruega" },
  { id: 12, zona: "Lofoten", lat: 68.23, lng: 14.56, pais: "Noruega" },
  { id: 13, zona: "Tromsø", lat: 69.65, lng: 18.96, pais: "Noruega" },
  { id: 14, zona: "Finnmark / Alta", lat: 69.97, lng: 23.27, pais: "Noruega" },
  { id: 15, zona: "Innlandet / Lillehammer", lat: 61.12, lng: 10.47, pais: "Noruega" },
  { id: 16, zona: "Hardanger", lat: 60.07, lng: 6.55, pais: "Noruega" },
];

/** Chile: 224 previas (casi todo camping). 20 disparos de norte a sur; se busca casa rodante / motorhome. */
const HUECOS_CHILE = [
  { id: 1, zona: "Arica", lat: -18.48, lng: -70.31, pais: "Chile" },
  { id: 2, zona: "Iquique", lat: -20.22, lng: -70.14, pais: "Chile" },
  { id: 3, zona: "San Pedro de Atacama", lat: -22.91, lng: -68.2, pais: "Chile" },
  { id: 4, zona: "Antofagasta", lat: -23.65, lng: -70.4, pais: "Chile" },
  { id: 5, zona: "Copiapó", lat: -27.37, lng: -70.33, pais: "Chile" },
  { id: 6, zona: "La Serena / Coquimbo", lat: -29.9, lng: -71.25, pais: "Chile" },
  { id: 7, zona: "Valparaíso / Viña", lat: -33.05, lng: -71.62, pais: "Chile" },
  { id: 8, zona: "Santiago", lat: -33.45, lng: -70.67, pais: "Chile" },
  { id: 9, zona: "Rancagua", lat: -34.17, lng: -70.74, pais: "Chile" },
  { id: 10, zona: "Talca / Maule", lat: -35.43, lng: -71.66, pais: "Chile" },
  { id: 11, zona: "Concepción", lat: -36.83, lng: -73.05, pais: "Chile" },
  { id: 12, zona: "Temuco / Araucanía", lat: -38.74, lng: -72.6, pais: "Chile" },
  { id: 13, zona: "Pucón / Villarrica", lat: -39.28, lng: -71.98, pais: "Chile" },
  { id: 14, zona: "Valdivia", lat: -39.81, lng: -73.25, pais: "Chile" },
  { id: 15, zona: "Puerto Varas / Lagos", lat: -41.32, lng: -72.98, pais: "Chile" },
  { id: 16, zona: "Chiloé / Castro", lat: -42.48, lng: -73.76, pais: "Chile" },
  { id: 17, zona: "Coyhaique", lat: -45.57, lng: -72.07, pais: "Chile" },
  { id: 18, zona: "General Carrera", lat: -46.63, lng: -72.68, pais: "Chile" },
  { id: 19, zona: "Puerto Natales", lat: -51.73, lng: -72.51, pais: "Chile" },
  { id: 20, zona: "Punta Arenas", lat: -53.16, lng: -70.91, pais: "Chile" },
];

/** Argentina: 247 previas. Ruta 40 + litoral + AMBA; mismas palabras que Chile. */
const HUECOS_ARGENTINA = [
  { id: 1, zona: "Buenos Aires", lat: -34.6, lng: -58.38, pais: "Argentina" },
  { id: 2, zona: "Mar del Plata", lat: -38.0, lng: -57.55, pais: "Argentina" },
  { id: 3, zona: "Rosario", lat: -32.95, lng: -60.64, pais: "Argentina" },
  { id: 4, zona: "Córdoba", lat: -31.42, lng: -64.18, pais: "Argentina" },
  { id: 5, zona: "Mendoza", lat: -32.89, lng: -68.85, pais: "Argentina" },
  { id: 6, zona: "San Rafael", lat: -34.61, lng: -68.33, pais: "Argentina" },
  { id: 7, zona: "Salta", lat: -24.79, lng: -65.41, pais: "Argentina" },
  { id: 8, zona: "Jujuy / Quebrada", lat: -23.58, lng: -65.45, pais: "Argentina" },
  { id: 9, zona: "Iguazú", lat: -25.68, lng: -54.45, pais: "Argentina" },
  { id: 10, zona: "Posadas", lat: -27.37, lng: -55.9, pais: "Argentina" },
  { id: 11, zona: "Tucumán", lat: -26.81, lng: -65.22, pais: "Argentina" },
  { id: 12, zona: "Neuquén", lat: -38.95, lng: -68.06, pais: "Argentina" },
  { id: 13, zona: "Bariloche", lat: -41.13, lng: -71.31, pais: "Argentina" },
  { id: 14, zona: "San Martín de los Andes", lat: -40.16, lng: -71.35, pais: "Argentina" },
  { id: 15, zona: "Esquel", lat: -42.91, lng: -71.32, pais: "Argentina" },
  { id: 16, zona: "Puerto Madryn", lat: -42.77, lng: -65.04, pais: "Argentina" },
  { id: 17, zona: "El Calafate", lat: -50.34, lng: -72.26, pais: "Argentina" },
  { id: 18, zona: "El Chaltén", lat: -49.33, lng: -72.89, pais: "Argentina" },
  { id: 19, zona: "Río Gallegos", lat: -51.62, lng: -69.22, pais: "Argentina" },
  { id: 20, zona: "Ushuaia", lat: -54.8, lng: -68.3, pais: "Argentina" },
];

/** Campings Murcia + Alicante: en el mapa casi no hay (1 y 2). Se busca «camping», no «área». */
const HUECOS_MURCIA_ALICANTE = [
  { id: 1, zona: "Murcia", lat: 37.99, lng: -1.13, pais: "España" },
  { id: 2, zona: "Cartagena", lat: 37.6, lng: -0.98, pais: "España" },
  { id: 3, zona: "Mazarrón", lat: 37.56, lng: -1.31, pais: "España" },
  { id: 4, zona: "Águilas", lat: 37.41, lng: -1.58, pais: "España" },
  { id: 5, zona: "Lorca", lat: 37.67, lng: -1.7, pais: "España" },
  { id: 6, zona: "Mar Menor", lat: 37.8, lng: -0.84, pais: "España" },
  { id: 7, zona: "Caravaca", lat: 38.11, lng: -1.86, pais: "España" },
  { id: 8, zona: "Jumilla", lat: 38.48, lng: -1.33, pais: "España" },
  { id: 9, zona: "Alicante", lat: 38.35, lng: -0.48, pais: "España" },
  { id: 10, zona: "Elche / Santa Pola", lat: 38.2, lng: -0.62, pais: "España" },
  { id: 11, zona: "Torrevieja", lat: 37.98, lng: -0.68, pais: "España" },
  { id: 12, zona: "Benidorm", lat: 38.54, lng: -0.13, pais: "España" },
  { id: 13, zona: "Calpe", lat: 38.64, lng: 0.04, pais: "España" },
  { id: 14, zona: "Dénia", lat: 38.84, lng: 0.11, pais: "España" },
  { id: 15, zona: "Alcoy", lat: 38.7, lng: -0.47, pais: "España" },
  { id: 16, zona: "Villena", lat: 38.64, lng: -0.87, pais: "España" },
];

const HUECOS_VALENCIA = [
  { id: 1, zona: "Valencia", lat: 39.47, lng: -0.38, pais: "España" },
  { id: 2, zona: "Sagunto", lat: 39.68, lng: -0.28, pais: "España" },
  { id: 3, zona: "Gandía", lat: 38.97, lng: -0.18, pais: "España" },
  { id: 4, zona: "Cullera", lat: 39.16, lng: -0.25, pais: "España" },
  { id: 5, zona: "Oliva", lat: 38.92, lng: -0.12, pais: "España" },
  { id: 6, zona: "Xàtiva", lat: 38.99, lng: -0.52, pais: "España" },
  { id: 7, zona: "Alzira", lat: 39.15, lng: -0.44, pais: "España" },
  { id: 8, zona: "Requena", lat: 39.49, lng: -1.1, pais: "España" },
  { id: 9, zona: "Llíria", lat: 39.63, lng: -0.6, pais: "España" },
  { id: 10, zona: "Ayora", lat: 39.06, lng: -1.06, pais: "España" },
];

const HUECOS_CASTELLON = [
  { id: 1, zona: "Castellón", lat: 39.99, lng: -0.04, pais: "España" },
  { id: 2, zona: "Benicàssim", lat: 40.05, lng: 0.06, pais: "España" },
  { id: 3, zona: "Peñíscola", lat: 40.36, lng: 0.41, pais: "España" },
  { id: 4, zona: "Vinaròs", lat: 40.47, lng: 0.47, pais: "España" },
  { id: 5, zona: "Morella", lat: 40.62, lng: -0.1, pais: "España" },
  { id: 6, zona: "Segorbe", lat: 39.85, lng: -0.49, pais: "España" },
  { id: 7, zona: "Onda", lat: 39.96, lng: -0.26, pais: "España" },
  { id: 8, zona: "Alcalà de Xivert", lat: 40.3, lng: 0.23, pais: "España" },
];

const HUECOS_TARRAGONA = [
  { id: 1, zona: "Tarragona", lat: 41.12, lng: 1.25, pais: "España" },
  { id: 2, zona: "Salou", lat: 41.08, lng: 1.14, pais: "España" },
  { id: 3, zona: "Cambrils", lat: 41.07, lng: 1.05, pais: "España" },
  { id: 4, zona: "L'Hospitalet de l'Infant", lat: 40.99, lng: 0.92, pais: "España" },
  { id: 5, zona: "Tortosa", lat: 40.81, lng: 0.52, pais: "España" },
  { id: 6, zona: "Sant Carles de la Ràpita", lat: 40.62, lng: 0.59, pais: "España" },
  { id: 7, zona: "Montblanc", lat: 41.38, lng: 1.16, pais: "España" },
  { id: 8, zona: "Falset", lat: 41.15, lng: 0.82, pais: "España" },
  { id: 9, zona: "L'Ametlla de Mar", lat: 40.88, lng: 0.8, pais: "España" },
  { id: 10, zona: "Calafell", lat: 41.2, lng: 1.57, pais: "España" },
];

const HUECOS_BARCELONA = [
  { id: 1, zona: "Barcelona", lat: 41.39, lng: 2.17, pais: "España" },
  { id: 2, zona: "Sitges", lat: 41.24, lng: 1.81, pais: "España" },
  { id: 3, zona: "Vilanova", lat: 41.22, lng: 1.73, pais: "España" },
  { id: 4, zona: "Mataró", lat: 41.54, lng: 2.44, pais: "España" },
  { id: 5, zona: "Calella", lat: 41.61, lng: 2.65, pais: "España" },
  { id: 6, zona: "Vic", lat: 41.93, lng: 2.25, pais: "España" },
  { id: 7, zona: "Manresa", lat: 41.73, lng: 1.83, pais: "España" },
  { id: 8, zona: "Berga", lat: 42.1, lng: 1.85, pais: "España" },
  { id: 9, zona: "Igualada", lat: 41.58, lng: 1.62, pais: "España" },
  { id: 10, zona: "Granollers", lat: 41.61, lng: 2.29, pais: "España" },
];

const HUECOS_GERONA = [
  { id: 1, zona: "Girona", lat: 41.98, lng: 2.82, pais: "España" },
  { id: 2, zona: "Figueres", lat: 42.27, lng: 2.96, pais: "España" },
  { id: 3, zona: "Roses", lat: 42.26, lng: 3.18, pais: "España" },
  { id: 4, zona: "L'Estartit", lat: 42.05, lng: 3.2, pais: "España" },
  { id: 5, zona: "Palamós", lat: 41.85, lng: 3.13, pais: "España" },
  { id: 6, zona: "Lloret", lat: 41.7, lng: 2.85, pais: "España" },
  { id: 7, zona: "Blanes", lat: 41.68, lng: 2.79, pais: "España" },
  { id: 8, zona: "Olot", lat: 42.18, lng: 2.49, pais: "España" },
  { id: 9, zona: "Ripoll", lat: 42.2, lng: 2.19, pais: "España" },
  { id: 10, zona: "Puigcerdà", lat: 42.43, lng: 1.93, pais: "España" },
  { id: 11, zona: "Banyoles", lat: 42.12, lng: 2.77, pais: "España" },
  { id: 12, zona: "Platja d'Aro", lat: 41.82, lng: 3.07, pais: "España" },
];

const HUECOS_ALMERIA = [
  { id: 1, zona: "Almería", lat: 36.84, lng: -2.46, pais: "España" },
  { id: 2, zona: "Roquetas", lat: 36.76, lng: -2.61, pais: "España" },
  { id: 3, zona: "El Ejido", lat: 36.75, lng: -2.81, pais: "España" },
  { id: 4, zona: "Adra", lat: 36.75, lng: -3.02, pais: "España" },
  { id: 5, zona: "Mojácar", lat: 37.14, lng: -1.85, pais: "España" },
  { id: 6, zona: "Vera", lat: 37.25, lng: -1.86, pais: "España" },
  { id: 7, zona: "Carboneras", lat: 36.99, lng: -1.89, pais: "España" },
  { id: 8, zona: "Cabo de Gata", lat: 36.78, lng: -2.14, pais: "España" },
  { id: 9, zona: "Tabernas", lat: 37.05, lng: -2.39, pais: "España" },
  { id: 10, zona: "Vélez-Blanco", lat: 37.69, lng: -2.1, pais: "España" },
];

const HUECOS_MALAGA = [
  { id: 1, zona: "Málaga", lat: 36.72, lng: -4.42, pais: "España" },
  { id: 2, zona: "Marbella", lat: 36.51, lng: -4.89, pais: "España" },
  { id: 3, zona: "Estepona", lat: 36.43, lng: -5.15, pais: "España" },
  { id: 4, zona: "Fuengirola", lat: 36.54, lng: -4.62, pais: "España" },
  { id: 5, zona: "Nerja", lat: 36.75, lng: -3.88, pais: "España" },
  { id: 6, zona: "Vélez-Málaga", lat: 36.77, lng: -4.1, pais: "España" },
  { id: 7, zona: "Ronda", lat: 36.74, lng: -5.16, pais: "España" },
  { id: 8, zona: "Antequera", lat: 37.02, lng: -4.56, pais: "España" },
  { id: 9, zona: "Mijas", lat: 36.6, lng: -4.64, pais: "España" },
];

const HUECOS_CADIZ = [
  { id: 1, zona: "Cádiz", lat: 36.53, lng: -6.29, pais: "España" },
  { id: 2, zona: "Jerez", lat: 36.69, lng: -6.14, pais: "España" },
  { id: 3, zona: "El Puerto", lat: 36.59, lng: -6.23, pais: "España" },
  { id: 4, zona: "Chiclana", lat: 36.42, lng: -6.15, pais: "España" },
  { id: 5, zona: "Tarifa", lat: 36.01, lng: -5.6, pais: "España" },
  { id: 6, zona: "Algeciras", lat: 36.13, lng: -5.45, pais: "España" },
  { id: 7, zona: "Barbate", lat: 36.19, lng: -5.92, pais: "España" },
  { id: 8, zona: "Sanlúcar", lat: 36.78, lng: -6.35, pais: "España" },
  { id: 9, zona: "Arcos", lat: 36.75, lng: -5.81, pais: "España" },
  { id: 10, zona: "Los Barrios", lat: 36.18, lng: -5.49, pais: "España" },
];

const HUECOS_HUELVA = [
  { id: 1, zona: "Huelva", lat: 37.26, lng: -6.95, pais: "España" },
  { id: 2, zona: "Punta Umbría", lat: 37.18, lng: -6.97, pais: "España" },
  { id: 3, zona: "Matalascañas", lat: 37.02, lng: -6.55, pais: "España" },
  { id: 4, zona: "Ayamonte", lat: 37.21, lng: -7.4, pais: "España" },
  { id: 5, zona: "Isla Cristina", lat: 37.2, lng: -7.32, pais: "España" },
  { id: 6, zona: "Lepe", lat: 37.25, lng: -7.2, pais: "España" },
  { id: 7, zona: "Aracena", lat: 37.89, lng: -6.56, pais: "España" },
  { id: 8, zona: "Riotinto", lat: 37.69, lng: -6.55, pais: "España" },
];

const HUECOS_CORDOBA = [
  { id: 1, zona: "Córdoba", lat: 37.89, lng: -4.78, pais: "España" },
  { id: 2, zona: "Lucena", lat: 37.41, lng: -4.49, pais: "España" },
  { id: 3, zona: "Puente Genil", lat: 37.39, lng: -4.77, pais: "España" },
  { id: 4, zona: "Priego", lat: 37.44, lng: -4.19, pais: "España" },
  { id: 5, zona: "Pozoblanco", lat: 38.38, lng: -4.85, pais: "España" },
  { id: 6, zona: "Palma del Río", lat: 37.7, lng: -5.28, pais: "España" },
  { id: 7, zona: "Hornachuelos", lat: 37.83, lng: -5.24, pais: "España" },
  { id: 8, zona: "Iznájar", lat: 37.26, lng: -4.31, pais: "España" },
  { id: 9, zona: "Villanueva", lat: 38.32, lng: -4.63, pais: "España" },
];

const HUECOS_JAEN = [
  { id: 1, zona: "Jaén", lat: 37.77, lng: -3.79, pais: "España" },
  { id: 2, zona: "Úbeda", lat: 38.01, lng: -3.37, pais: "España" },
  { id: 3, zona: "Linares", lat: 38.1, lng: -3.64, pais: "España" },
  { id: 4, zona: "Andújar", lat: 38.04, lng: -4.05, pais: "España" },
  { id: 5, zona: "Cazorla", lat: 37.91, lng: -3.0, pais: "España" },
  { id: 6, zona: "La Carolina", lat: 38.27, lng: -3.62, pais: "España" },
  { id: 7, zona: "Alcalá la Real", lat: 37.46, lng: -3.92, pais: "España" },
  { id: 8, zona: "Segura", lat: 38.3, lng: -2.65, pais: "España" },
  { id: 9, zona: "Baeza", lat: 37.99, lng: -3.47, pais: "España" },
];

const HUECOS_ALBACETE = [
  { id: 1, zona: "Albacete", lat: 38.99, lng: -1.86, pais: "España" },
  { id: 2, zona: "Hellín", lat: 38.51, lng: -1.7, pais: "España" },
  { id: 3, zona: "Almansa", lat: 38.87, lng: -1.1, pais: "España" },
  { id: 4, zona: "Villarrobledo", lat: 39.27, lng: -2.6, pais: "España" },
  { id: 5, zona: "Alcaraz", lat: 38.67, lng: -2.49, pais: "España" },
  { id: 6, zona: "Yeste", lat: 38.37, lng: -2.32, pais: "España" },
  { id: 7, zona: "La Roda", lat: 39.21, lng: -2.16, pais: "España" },
  { id: 8, zona: "Caudete", lat: 38.7, lng: -0.99, pais: "España" },
];

const HUECOS_CIUDADREAL = [
  { id: 1, zona: "Ciudad Real", lat: 38.99, lng: -3.93, pais: "España" },
  { id: 2, zona: "Puertollano", lat: 38.69, lng: -4.11, pais: "España" },
  { id: 3, zona: "Valdepeñas", lat: 38.76, lng: -3.39, pais: "España" },
  { id: 4, zona: "Alcázar", lat: 39.39, lng: -3.21, pais: "España" },
  { id: 5, zona: "Manzanares", lat: 38.99, lng: -3.37, pais: "España" },
  { id: 6, zona: "Daimiel", lat: 39.07, lng: -3.61, pais: "España" },
  { id: 7, zona: "Almagro", lat: 38.89, lng: -3.71, pais: "España" },
  { id: 8, zona: "Tomelloso", lat: 39.16, lng: -3.02, pais: "España" },
];

const HUECOS_BADAJOZ = [
  { id: 1, zona: "Badajoz", lat: 38.88, lng: -6.97, pais: "España" },
  { id: 2, zona: "Mérida", lat: 38.92, lng: -6.34, pais: "España" },
  { id: 3, zona: "Zafra", lat: 38.43, lng: -6.42, pais: "España" },
  { id: 4, zona: "Don Benito", lat: 38.95, lng: -5.86, pais: "España" },
  { id: 5, zona: "Almendralejo", lat: 38.68, lng: -6.41, pais: "España" },
  { id: 6, zona: "Olivenza", lat: 38.68, lng: -7.1, pais: "España" },
  { id: 7, zona: "Jerez de los Caballeros", lat: 38.32, lng: -6.77, pais: "España" },
  { id: 8, zona: "Herrera del Duque", lat: 39.17, lng: -5.05, pais: "España" },
];

const HUECOS_CUENCA = [
  { id: 1, zona: "Cuenca", lat: 40.07, lng: -2.13, pais: "España" },
  { id: 2, zona: "Tarancón", lat: 40.01, lng: -3.0, pais: "España" },
  { id: 3, zona: "Motilla", lat: 39.56, lng: -1.91, pais: "España" },
  { id: 4, zona: "San Clemente", lat: 39.4, lng: -2.43, pais: "España" },
  { id: 5, zona: "Huete", lat: 40.15, lng: -2.69, pais: "España" },
  { id: 6, zona: "Cañete", lat: 40.04, lng: -1.65, pais: "España" },
  { id: 7, zona: "Beteta", lat: 40.57, lng: -2.07, pais: "España" },
  { id: 8, zona: "Minglanilla", lat: 39.42, lng: -1.59, pais: "España" },
  { id: 9, zona: "El Herrumblar", lat: 39.4, lng: -1.62, pais: "España" },
];

const HUECOS_MADRID = [
  { id: 1, zona: "Madrid", lat: 40.42, lng: -3.7, pais: "España" },
  { id: 2, zona: "Aranjuez", lat: 40.03, lng: -3.6, pais: "España" },
  { id: 3, zona: "Alcalá", lat: 40.48, lng: -3.37, pais: "España" },
  { id: 4, zona: "El Escorial", lat: 40.59, lng: -4.15, pais: "España" },
  { id: 5, zona: "Rascafría", lat: 40.87, lng: -3.88, pais: "España" },
  { id: 6, zona: "Navacerrada", lat: 40.73, lng: -4.02, pais: "España" },
  { id: 7, zona: "Chinchón", lat: 40.14, lng: -3.42, pais: "España" },
  { id: 8, zona: "Colmenar", lat: 40.66, lng: -3.77, pais: "España" },
];

const HUECOS_TOLEDO = [
  { id: 1, zona: "Toledo", lat: 39.86, lng: -4.02, pais: "España" },
  { id: 2, zona: "Talavera", lat: 39.96, lng: -4.83, pais: "España" },
  { id: 3, zona: "Quintanar", lat: 39.59, lng: -3.04, pais: "España" },
  { id: 4, zona: "Ocaña", lat: 39.96, lng: -3.5, pais: "España" },
  { id: 5, zona: "Consuegra", lat: 39.46, lng: -3.61, pais: "España" },
  { id: 6, zona: "Navalcán", lat: 40.07, lng: -5.09, pais: "España" },
  { id: 7, zona: "Los Navalucillos", lat: 39.64, lng: -4.64, pais: "España" },
  { id: 8, zona: "Madridejos", lat: 39.47, lng: -3.53, pais: "España" },
];

const HUECOS_CACERES = [
  { id: 1, zona: "Cáceres", lat: 39.48, lng: -6.37, pais: "España" },
  { id: 2, zona: "Plasencia", lat: 40.03, lng: -6.09, pais: "España" },
  { id: 3, zona: "Trujillo", lat: 39.46, lng: -5.88, pais: "España" },
  { id: 4, zona: "Navalmoral", lat: 39.89, lng: -5.54, pais: "España" },
  { id: 5, zona: "Valencia de Alcántara", lat: 39.41, lng: -7.24, pais: "España" },
  { id: 6, zona: "Coria", lat: 39.98, lng: -6.19, pais: "España" },
  { id: 7, zona: "Hervás", lat: 40.27, lng: -5.87, pais: "España" },
  { id: 8, zona: "Guadalupe", lat: 39.45, lng: -5.33, pais: "España" },
];

const HUECOS_TERUEL = [
  { id: 1, zona: "Teruel", lat: 40.34, lng: -1.11, pais: "España" },
  { id: 2, zona: "Alcañiz", lat: 41.05, lng: -0.13, pais: "España" },
  { id: 3, zona: "Calamocha", lat: 40.92, lng: -1.3, pais: "España" },
  { id: 4, zona: "Albarracín", lat: 40.41, lng: -1.44, pais: "España" },
  { id: 5, zona: "Valderrobres", lat: 40.87, lng: 0.15, pais: "España" },
  { id: 6, zona: "Mora de Rubielos", lat: 40.25, lng: -0.75, pais: "España" },
  { id: 7, zona: "Andorra", lat: 40.98, lng: -0.44, pais: "España" },
  { id: 8, zona: "Cantavieja", lat: 40.52, lng: -0.4, pais: "España" },
];

const HUECOS_GUADALAJARA = [
  { id: 1, zona: "Guadalajara", lat: 40.63, lng: -3.16, pais: "España" },
  { id: 2, zona: "Sigüenza", lat: 41.07, lng: -2.64, pais: "España" },
  { id: 3, zona: "Molina", lat: 40.84, lng: -1.89, pais: "España" },
  { id: 4, zona: "Cifuentes", lat: 40.79, lng: -2.62, pais: "España" },
  { id: 5, zona: "Pastrana", lat: 40.42, lng: -2.92, pais: "España" },
  { id: 6, zona: "Cogolludo", lat: 40.95, lng: -3.09, pais: "España" },
  { id: 7, zona: "Azuqueca", lat: 40.56, lng: -3.26, pais: "España" },
  { id: 8, zona: "Orea", lat: 40.55, lng: -1.73, pais: "España" },
];

const HUECOS_ZARAGOZA = [
  { id: 1, zona: "Zaragoza", lat: 41.65, lng: -0.89, pais: "España" },
  { id: 2, zona: "Calatayud", lat: 41.35, lng: -1.64, pais: "España" },
  { id: 3, zona: "Daroca", lat: 41.12, lng: -1.41, pais: "España" },
  { id: 4, zona: "Caspe", lat: 41.24, lng: -0.04, pais: "España" },
  { id: 5, zona: "Ejea", lat: 42.13, lng: -1.14, pais: "España" },
  { id: 6, zona: "Tarazona", lat: 41.9, lng: -1.73, pais: "España" },
  { id: 7, zona: "Mequinenza", lat: 41.37, lng: 0.3, pais: "España" },
  { id: 8, zona: "Belchite", lat: 41.31, lng: -0.75, pais: "España" },
  { id: 9, zona: "Sos", lat: 42.5, lng: -1.21, pais: "España" },
];

const HUECOS_HUESCA = [
  { id: 1, zona: "Huesca", lat: 42.14, lng: -0.41, pais: "España" },
  { id: 2, zona: "Barbastro", lat: 42.04, lng: 0.13, pais: "España" },
  { id: 3, zona: "Fraga", lat: 41.52, lng: 0.35, pais: "España" },
  { id: 4, zona: "Jaca", lat: 42.57, lng: -0.55, pais: "España" },
  { id: 5, zona: "Sabiñánigo", lat: 42.52, lng: -0.37, pais: "España" },
  { id: 6, zona: "Aínsa", lat: 42.42, lng: 0.14, pais: "España" },
  { id: 7, zona: "Benasque", lat: 42.61, lng: 0.52, pais: "España" },
  { id: 8, zona: "Graus", lat: 42.19, lng: 0.34, pais: "España" },
  { id: 9, zona: "Sariñena", lat: 41.79, lng: -0.16, pais: "España" },
  { id: 10, zona: "Broto", lat: 42.6, lng: -0.12, pais: "España" },
];

const HUECOS_LLEIDA = [
  { id: 1, zona: "Lleida", lat: 41.62, lng: 0.63, pais: "España" },
  { id: 2, zona: "Balaguer", lat: 41.79, lng: 0.79, pais: "España" },
  { id: 3, zona: "Tàrrega", lat: 41.65, lng: 1.14, pais: "España" },
  { id: 4, zona: "Tremp", lat: 42.17, lng: 0.89, pais: "España" },
  { id: 5, zona: "La Seu", lat: 42.36, lng: 1.46, pais: "España" },
  { id: 6, zona: "Sort", lat: 42.41, lng: 1.13, pais: "España" },
  { id: 7, zona: "Vielha", lat: 42.7, lng: 0.8, pais: "España" },
  { id: 8, zona: "Pont de Suert", lat: 42.41, lng: 0.74, pais: "España" },
  { id: 9, zona: "Espot", lat: 42.58, lng: 1.09, pais: "España" },
  { id: 10, zona: "Les Borges", lat: 41.52, lng: 0.87, pais: "España" },
];

const CAMPING_ZONAS: Record<
  string,
  {
    label: string;
    provinciaRe: RegExp;
    isIn: (lat: number, lng: number) => boolean;
    huecos: Array<{ id: number; zona: string; lat: number; lng: number; pais: string }>;
  }
> = {
  "murcia-alicante": {
    label: "Murcia + Alicante",
    provinciaRe: /\b(murcia|alicante|alacant)\b/i,
    isIn: (lat, lng) =>
      (lat >= 37.36 && lat <= 38.77 && lng >= -2.36 && lng <= -0.64) ||
      (lat >= 37.82 && lat <= 38.88 && lng >= -1.15 && lng <= 0.22),
    huecos: HUECOS_MURCIA_ALICANTE,
  },
  valencia: {
    label: "Valencia",
    provinciaRe: /\b(valencia|val[eè]ncia)\b/i,
    isIn: (lat, lng) => lat >= 38.7 && lat <= 39.9 && lng >= -1.53 && lng <= -0.05,
    huecos: HUECOS_VALENCIA,
  },
  castellon: {
    label: "Castellón",
    provinciaRe: /\b(castell[oóò]n|castell[oó])\b/i,
    isIn: (lat, lng) => lat >= 39.72 && lat <= 40.8 && lng >= -0.55 && lng <= 0.52,
    huecos: HUECOS_CASTELLON,
  },
  tarragona: {
    label: "Tarragona",
    provinciaRe: /\btarragona\b/i,
    isIn: (lat, lng) => lat >= 40.52 && lat <= 41.45 && lng >= 0.22 && lng <= 1.67,
    huecos: HUECOS_TARRAGONA,
  },
  barcelona: {
    label: "Barcelona",
    provinciaRe: /\bbarcelona\b/i,
    isIn: (lat, lng) => lat >= 41.2 && lat <= 42.32 && lng >= 1.45 && lng <= 2.83,
    huecos: HUECOS_BARCELONA,
  },
  gerona: {
    label: "Gerona",
    provinciaRe: /\b(gerona|girona)\b/i,
    isIn: (lat, lng) => lat >= 41.62 && lat <= 42.5 && lng >= 1.72 && lng <= 3.33,
    huecos: HUECOS_GERONA,
  },
  almeria: {
    label: "Almería",
    provinciaRe: /\balmer[ií]a\b/i,
    isIn: (lat, lng) => lat >= 36.66 && lat <= 37.7 && lng >= -3.15 && lng <= -1.63,
    huecos: HUECOS_ALMERIA,
  },
  malaga: {
    label: "Málaga",
    provinciaRe: /\bm[aá]laga\b/i,
    isIn: (lat, lng) => lat >= 36.4 && lat <= 37.28 && lng >= -5.65 && lng <= -3.72,
    huecos: HUECOS_MALAGA,
  },
  cadiz: {
    label: "Cádiz",
    provinciaRe: /\bc[aá]diz\b/i,
    isIn: (lat, lng) => lat >= 36.0 && lat <= 36.95 && lng >= -6.52 && lng <= -5.28,
    huecos: HUECOS_CADIZ,
  },
  huelva: {
    label: "Huelva",
    provinciaRe: /\bhuelva\b/i,
    isIn: (lat, lng) => lat >= 36.95 && lat <= 38.05 && lng >= -7.52 && lng <= -6.35,
    huecos: HUECOS_HUELVA,
  },
  cordoba: {
    label: "Córdoba",
    provinciaRe: /\bc[oó]rdoba\b/i,
    isIn: (lat, lng) => lat >= 37.18 && lat <= 38.73 && lng >= -5.58 && lng <= -3.84,
    huecos: HUECOS_CORDOBA,
  },
  jaen: {
    label: "Jaén",
    provinciaRe: /\bja[eé]n\b/i,
    isIn: (lat, lng) => lat >= 37.37 && lat <= 38.53 && lng >= -4.28 && lng <= -2.4,
    huecos: HUECOS_JAEN,
  },
  albacete: {
    label: "Albacete",
    provinciaRe: /\balbacete\b/i,
    isIn: (lat, lng) => lat >= 38.0 && lat <= 39.45 && lng >= -2.9 && lng <= -0.83,
    huecos: HUECOS_ALBACETE,
  },
  ciudadreal: {
    label: "Ciudad Real",
    provinciaRe: /\bciudad real\b/i,
    isIn: (lat, lng) => lat >= 38.38 && lat <= 39.58 && lng >= -5.05 && lng <= -2.63,
    huecos: HUECOS_CIUDADREAL,
  },
  badajoz: {
    label: "Badajoz",
    provinciaRe: /\bbadajoz\b/i,
    isIn: (lat, lng) => lat >= 37.95 && lat <= 39.5 && lng >= -7.55 && lng <= -4.65,
    huecos: HUECOS_BADAJOZ,
  },
  cuenca: {
    label: "Cuenca",
    provinciaRe: /\bcuenca\b/i,
    isIn: (lat, lng) => lat >= 39.3 && lat <= 40.7 && lng >= -3.2 && lng <= -1.35,
    huecos: HUECOS_CUENCA,
  },
  madrid: {
    label: "Madrid",
    provinciaRe: /\bmadrid\b/i,
    isIn: (lat, lng) => lat >= 40.0 && lat <= 41.17 && lng >= -4.58 && lng <= -3.05,
    huecos: HUECOS_MADRID,
  },
  toledo: {
    label: "Toledo",
    provinciaRe: /\btoledo\b/i,
    isIn: (lat, lng) => lat >= 39.3 && lat <= 40.22 && lng >= -5.45 && lng <= -2.8,
    huecos: HUECOS_TOLEDO,
  },
  caceres: {
    label: "Cáceres",
    provinciaRe: /\bc[aá]ceres\b/i,
    isIn: (lat, lng) => lat >= 39.12 && lat <= 40.48 && lng >= -7.55 && lng <= -4.95,
    huecos: HUECOS_CACERES,
  },
  teruel: {
    label: "Teruel",
    provinciaRe: /\bteruel\b/i,
    isIn: (lat, lng) => lat >= 39.85 && lat <= 41.15 && lng >= -1.78 && lng <= 0.5,
    huecos: HUECOS_TERUEL,
  },
  guadalajara: {
    label: "Guadalajara",
    provinciaRe: /\bguadalajara\b/i,
    isIn: (lat, lng) => lat >= 40.25 && lat <= 41.32 && lng >= -3.5 && lng <= -1.7,
    huecos: HUECOS_GUADALAJARA,
  },
  zaragoza: {
    label: "Zaragoza",
    provinciaRe: /\bzaragoza\b/i,
    isIn: (lat, lng) => lat >= 40.93 && lat <= 42.75 && lng >= -2.18 && lng <= 0.43,
    huecos: HUECOS_ZARAGOZA,
  },
  huesca: {
    label: "Huesca",
    provinciaRe: /\bhuesca\b/i,
    isIn: (lat, lng) => lat >= 41.35 && lat <= 42.93 && lng >= -0.95 && lng <= 0.77,
    huecos: HUECOS_HUESCA,
  },
  lleida: {
    label: "Lleida",
    provinciaRe: /\b(lleida|l[eé]rida)\b/i,
    isIn: (lat, lng) => lat >= 41.25 && lat <= 42.86 && lng >= 0.3 && lng <= 1.9,
    huecos: HUECOS_LLEIDA,
  },
};

const CAMPING = CAMPING_ZONAS[REGION];

const HUECOS =
  REGION === "baleares"
    ? HUECOS_BALEARES
    : REGION === "alemania"
      ? HUECOS_ALEMANIA
      : REGION === "francia"
        ? HUECOS_FRANCIA
        : REGION === "italia"
          ? HUECOS_ITALIA
          : REGION === "suiza"
            ? HUECOS_SUIZA
            : REGION === "austria"
              ? HUECOS_AUSTRIA
              : REGION === "belgica"
                ? HUECOS_BELGICA
                : REGION === "luxemburgo"
                  ? HUECOS_LUXEMBURGO
                  : REGION === "holanda"
                    ? HUECOS_HOLANDA
                    : REGION === "dinamarca"
                      ? HUECOS_DINAMARCA
                      : REGION === "suecia"
                        ? HUECOS_SUECIA
                        : REGION === "noruega"
                          ? HUECOS_NORUEGA
                          : REGION === "chile"
                            ? HUECOS_CHILE
                            : REGION === "argentina"
                              ? HUECOS_ARGENTINA
                              : CAMPING
                                ? CAMPING.huecos
                                : HUECOS_PENINSULA;

const TERMINOS_ES = [
  "área autocaravanas",
  "área de servicio autocaravanas",
  "camping autocaravanas",
];
const TERMINOS_BALEARES = [
  "área autocaravanas",
  "àrea autocaravanes",
  "camping autocaravanas",
];
const TERMINOS_PT = [
  "área autocaravanas",
  "parque de campismo",
  "aire camping-car",
];
const TERMINOS_DE = [
  "Wohnmobilstellplatz",
  "Stellplatz Wohnmobil",
  "Campingplatz Wohnmobil",
];
const TERMINOS_FR = [
  "aire camping-car",
  "aire de service camping-car",
  "camping camping-car",
];
const TERMINOS_IT = [
  "area sosta camper",
  "sosta camper",
  "campeggio camper",
];

/** Términos locales extra (parking / Parkplatz / parcheggio). No son un cuarto tipo: al encontrar se clasifican en pública o privada. */
const STOPOVER_ES = ["aparcamiento autocaravanas"];
const STOPOVER_BALEARES = ["aparcamiento autocaravanas", "parking autocaravanes"];
const STOPOVER_PT = ["estacionamento autocaravanas"];
const STOPOVER_DE = ["Wohnmobilparkplatz", "Weingut Wohnmobil"];
const STOPOVER_FR = ["parking camping-car", "chez l'habitant camping-car"];
const STOPOVER_IT = ["parcheggio camper"];
const TERMINOS_NL = ["camperplaats", "camperplaatsen", "camping camper"];
const STOPOVER_NL = ["camperparking", "camper parkeerplaats"];
const TERMINOS_LU = ["aire camping-car", "Wohnmobilstellplatz", "camping camping-car"];
const STOPOVER_LU = ["parking camping-car", "camperplaats"];
const TERMINOS_DK = ["autocamperplads", "campingplads autocamper", "stellplatz"];
const STOPOVER_DK = ["autocamper parkering"];
const TERMINOS_SE = ["ställplats", "husbil ställplats", "camping husbil"];
const STOPOVER_SE = ["husbilsparkering"];
const TERMINOS_NO = ["bobilplass", "bobilplasser", "camping bobil"];
const STOPOVER_NO = ["bobilparkering"];
const TERMINOS_CL = ["casas rodantes", "motorhome", "camping motorhome"];
const STOPOVER_CL = ["estacionamiento casas rodantes", "trailer park"];

const TERMINOS_CAMPING_ES = ["camping", "càmping"];

function terminosDe(hueco: { pais?: string; lang?: string }) {
  if (CAMPING) {
    return TERMINOS_CAMPING_ES;
  }
  if (REGION === "chile" || REGION === "argentina") {
    return SOLO_STOPOVER ? STOPOVER_CL : [...TERMINOS_CL, ...STOPOVER_CL];
  }
  if (REGION === "dinamarca") {
    return SOLO_STOPOVER ? STOPOVER_DK : [...TERMINOS_DK, ...STOPOVER_DK];
  }
  if (REGION === "suecia") {
    return SOLO_STOPOVER ? STOPOVER_SE : [...TERMINOS_SE, ...STOPOVER_SE];
  }
  if (REGION === "noruega") {
    return SOLO_STOPOVER ? STOPOVER_NO : [...TERMINOS_NO, ...STOPOVER_NO];
  }
  if (REGION === "holanda") {
    return SOLO_STOPOVER ? STOPOVER_NL : [...TERMINOS_NL, ...STOPOVER_NL];
  }
  if (REGION === "luxemburgo") {
    return SOLO_STOPOVER ? STOPOVER_LU : [...TERMINOS_LU, ...STOPOVER_LU];
  }
  if (REGION === "belgica") {
    if (hueco.lang === "fr") {
      return SOLO_STOPOVER ? STOPOVER_FR : [...TERMINOS_FR, ...STOPOVER_FR];
    }
    if (hueco.lang === "de") {
      return SOLO_STOPOVER ? STOPOVER_DE : [...TERMINOS_DE, ...STOPOVER_DE];
    }
    return SOLO_STOPOVER ? STOPOVER_NL : [...TERMINOS_NL, ...STOPOVER_NL];
  }
  if (REGION === "suiza") {
    if (hueco.lang === "fr") {
      return SOLO_STOPOVER ? STOPOVER_FR : [...TERMINOS_FR, ...STOPOVER_FR];
    }
    if (hueco.lang === "it") {
      return SOLO_STOPOVER ? STOPOVER_IT : [...TERMINOS_IT, ...STOPOVER_IT];
    }
    return SOLO_STOPOVER ? STOPOVER_DE : [...TERMINOS_DE, ...STOPOVER_DE];
  }
  if (REGION === "austria") {
    return SOLO_STOPOVER ? STOPOVER_DE : [...TERMINOS_DE, ...STOPOVER_DE];
  }
  const areaCamping =
    REGION === "baleares"
      ? TERMINOS_BALEARES
      : REGION === "alemania"
        ? TERMINOS_DE
        : REGION === "francia"
          ? TERMINOS_FR
          : REGION === "italia"
            ? TERMINOS_IT
            : hueco.pais === "Portugal"
              ? TERMINOS_PT
              : TERMINOS_ES;
  const stopover =
    REGION === "baleares"
      ? STOPOVER_BALEARES
      : REGION === "alemania"
        ? STOPOVER_DE
        : REGION === "francia"
          ? STOPOVER_FR
          : REGION === "italia"
            ? STOPOVER_IT
            : hueco.pais === "Portugal"
              ? STOPOVER_PT
              : STOPOVER_ES;
  return SOLO_STOPOVER ? stopover : [...areaCamping, ...stopover];
}

const RELEVANCE_RE =
  /\b(autocaravana|autocaravanas|autocaravanes|camper|caravana|camping|c[aà]mping|campismo|campground|aire|area de servicio|área de servicio|sosta|stellplatz|motorhome|campervan|caravaning|weingut|stopover|camperplaats|husbil|bobil|autocamper|casa.?rodante)\b|wohnmobil|reisemobil|stallplats|bobilplass|autocamperplads/i;
const NOISE_RE =
  /\b(hotel|motel|hostal|hostel|restaurante|restaurant|gasolinera|gas station|dealer|concesionario|venta|alquiler|arriendo|hire|rental|rentals|rent\b|storage|trasteros?|rimessaggio|agencia|experience|indie campers|vermietung|verkauf|haendler|händler|autohaus|noleggio|overnachten niet toegestaan|no overnight|sin pernocta|vaerksted|teltplass|leieplattform)\b/i;

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

function isInItaly(lat: number, lng: number): boolean {
  if (lat >= 36.65 && lat <= 38.32 && lng >= 12.4 && lng <= 15.65) return true; // Sicilia
  if (lat >= 38.85 && lat <= 41.32 && lng >= 8.13 && lng <= 9.84) return true; // Cerdeña
  if (lat < 36.6 || lat > 47.15 || lng < 6.6 || lng > 18.55) return false;
  if (lat > 45.95 && lng < 7.55) return false;
  if (lat > 46.75 && lng < 10.15) return false;
  if (lat > 46.9 && lng > 12.55) return false;
  if (lat > 46.25 && lng > 13.75) return false;
  if (lat > 42.5 && lat < 44.5 && lng < 8.0) return false;
  if (lat > 43.8 && lat < 45.4 && lng > 13.55) return false;
  return true;
}

function isInFrance(lat: number, lng: number): boolean {
  if (lat >= 41.32 && lat <= 43.05 && lng >= 8.5 && lng <= 9.6) return true; // Córcega
  if (lat < 42.3 || lat > 51.15 || lng < -5.2 || lng > 8.3) return false;
  if (lat > 50.25 && lng < 1.5) return false;
  if (lat > 49.85 && lng < 0.05) return false;
  if (lat < 47.2 && lng < -1.55) return false;
  if (lat < 43.15 && lng > 3.3 && lng < 6.5) return false;
  if (lat > 47.6 && lng > 7.7) return false;
  if (lat > 49.55 && lng > 6.2) return false;
  if (lat < 42.55 && lng < 2.9) return false; // Navarra/Cataluña
  return true;
}

function isInGermany(lat: number, lng: number): boolean {
  if (lat < 47.27 || lat > 55.06 || lng < 5.87 || lng > 15.04) return false;
  if (lat > 53.75 && lng < 8.1) return false;
  if (lat < 48.05 && lng < 7.5) return false;
  if (lat > 50.0 && lat < 50.95 && lng > 14.45) return false;
  if (lat > 49.25 && lat < 50.25 && lng > 13.9) return false;
  if (lat < 47.85 && lng > 13.1) return false;
  if (lat > 53.65 && lng > 14.35) return false;
  return true;
}

function isInSwitzerland(lat: number, lng: number): boolean {
  if (lat < 45.82 || lat > 47.81 || lng < 5.96 || lng > 10.49) return false;
  if (lng < 6.47 && lat > 46.4) return false;
  if (lat < 46.38 && lng > 6.22 && lng < 6.85) return false;
  if (lng < 6.9 && lat > 47.15 && lat < 47.55) return false;
  if (lat > 47.52 && lng < 7.15) return false;
  if (lat > 47.6 && lng < 8.45) return false;
  if (lat > 47.65 && lng > 8.7) return false;
  if (lng > 9.55 && lat > 47.02 && lat < 47.5) return false;
  if (lng > 9.75 && lat > 47.05) return false;
  if (lat < 46.3 && lng > 9.16) return false;
  if (lat < 45.9 && lng < 8.75) return false;
  if (lat < 46.08 && lng > 8.1 && lng < 8.45) return false;
  return true;
}

function isInAustria(lat: number, lng: number): boolean {
  if (lat < 46.37 || lat > 49.02 || lng < 9.53 || lng > 17.16) return false;
  if (lng < 9.72) return false;
  if (lng < 10.15 && lat < 47.0) return false;
  if (lat < 46.72 && lng < 12.15) return false;
  if (lat < 46.56 && lng < 13.15) return false;
  if (lat > 47.55 && lng >= 10.15 && lng <= 12.15) return false;
  if (lat > 47.92 && lng < 12.8) return false;
  if (lat > 48.58 && lng < 13.35) return false;
  if (lat < 46.42 && lng > 14.5) return false;
  if (lng > 16.55 && lat < 46.95) return false;
  if (lng > 17.05 && lat < 48.12) return false;
  return true;
}

function isInBelgium(lat: number, lng: number): boolean {
  if (lat < 49.5 || lat > 51.51 || lng < 2.54 || lng > 6.4) return false;
  if (lat > 51.27 && lng > 3.45 && lng < 4.25) return false;
  if (lat > 51.42 && lng > 4.3 && lng < 5.6) return false;
  if (lat > 51.35 && lng > 5.5) return false;
  if (lat < 50.12 && lng < 4.15) return false;
  if (lat < 49.85 && lng < 4.85) return false;
  if (lng > 6.15 && lat < 50.28) return false;
  if (lng > 6.28 && lat > 50.55) return false;
  if (lat < 50.16 && lng > 5.82 && lng < 6.2) return false;
  return true;
}

function isInLuxembourg(lat: number, lng: number): boolean {
  if (lat < 49.44 || lat > 50.19 || lng < 5.73 || lng > 6.53) return false;
  if (lat > 50.0 && lng < 5.9) return false;
  if (lat < 49.5 && lng < 6.05) return false;
  return true;
}

function isInNetherlands(lat: number, lng: number): boolean {
  if (lat < 50.75 || lat > 53.56 || lng < 3.36 || lng > 7.23) return false;
  if (lat < 51.22 && lng < 4.25) return false;
  if (lat < 51.3 && lng > 4.3 && lng < 5.45) return false;
  if (lat < 50.8) return false;
  if (lat < 50.95 && lng < 5.45) return false;
  if (lng > 7.08 && lat < 52.15) return false;
  return true;
}

function isInDenmark(lat: number, lng: number): boolean {
  if (lat >= 54.98 && lat <= 55.32 && lng >= 14.67 && lng <= 15.16) return true;
  if (lat < 54.56 || lat > 57.76 || lng < 8.07 || lng > 12.79) return false;
  if (lat < 54.83 && lng < 9.6) return false;
  if (lat < 54.7 && lng < 11.5) return false;
  if (lng > 12.65 && lat < 56.0) return false;
  return true;
}

function isInSweden(lat: number, lng: number): boolean {
  if (lat >= 56.9 && lat <= 57.95 && lng >= 18.1 && lng <= 19.35) return true;
  if (lat >= 56.19 && lat <= 57.37 && lng >= 16.38 && lng <= 17.16) return true;
  if (lat < 55.34 || lat > 69.07 || lng < 11.11 || lng > 24.17) return false;
  if (lat < 56.1 && lng < 12.7) return false;
  if (lng < 11.8 && lat > 58.5) return false;
  if (lng < 12.2 && lat > 59.0 && lat < 62.0) return false;
  if (lng > 23.8 && lat > 65.7) return false;
  return true;
}

function isInNorway(lat: number, lng: number): boolean {
  if (lat < 57.97 || lat > 71.19 || lng < 4.5 || lng > 31.2) return false;
  if (lng > 12.6 && lat < 60.2) return false;
  if (lng > 15.2 && lat > 61.0 && lat < 64.0) return false;
  if (lng > 24.5 && lat < 69.2) return false;
  return true;
}

function isInArgentina(lat: number, lng: number): boolean {
  if (lat < -55.1 || lat > -21.7 || lng < -73.6 || lng > -53.5) return false;
  if (lng < -70.8 && lat > -40 && lat < -23) return false;
  if (lng < -72.5 && lat > -46 && lat < -40) return false;
  if (lat > -25.4 && lng > -54.6) return false;
  if (lat < -33.5 && lat > -35.2 && lng > -58.1 && lng < -56.5) return false;
  return true;
}

function isInChile(lat: number, lng: number): boolean {
  if (lat < -56.0 || lat > -17.5 || lng < -75.7 || lng > -66.4) return false;
  if (lat > -32 && lat < -23 && lng > -68.0) return false;
  if (lat < -33 && lat > -40 && lng > -69.8) return false;
  if (lat < -40 && lat > -48 && lng > -71.0) return false;
  return true;
}

function esProvinciaCamping(details: { provincia?: string | null } | null): boolean {
  if (!CAMPING) return false;
  return CAMPING.provinciaRe.test(details?.provincia || "");
}

function isInBaleares(lat: number, lng: number): boolean {
  if (lat >= 39.25 && lat <= 39.97 && lng >= 2.3 && lng <= 3.48) return true; // Mallorca
  if (lat >= 39.78 && lat <= 40.1 && lng >= 3.78 && lng <= 4.33) return true; // Menorca
  if (lat >= 38.84 && lat <= 39.12 && lng >= 1.18 && lng <= 1.62) return true; // Ibiza
  if (lat >= 38.64 && lat <= 38.8 && lng >= 1.38 && lng <= 1.65) return true; // Formentera
  return false;
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

function classifyTipo(name: string, types: string[], pais?: string) {
  return decidirUbicacion(name, { types, pais }).tipo;
}

function isRelevant(name: string, types: string[], pais?: string): boolean {
  if (!decidirUbicacion(name, { types, pais }).admite) return false;
  if (/\b(glamping|b[ií]blico|biblico)\b/i.test(name) && !/\b(autocaravana|camper|aire)\b/i.test(name)) {
    return false;
  }
  if (NOISE_RE.test(name)) {
    const toponimoVenta =
      /\bventa\b/i.test(name) &&
      (/\bc[aà]mping\b/i.test(name) || types.includes("campground") || types.includes("rv_park"));
    if (!toponimoVenta || NOISE_RE.test(name.replace(/\bventa\b/gi, " "))) {
      return false;
    }
  }
  if (/\blocation (de )?(camping-car|fourgon|van|utilitaire)\b/i.test(name)) return false;
  if (/\b(ferienhof|ferienhaus|wassersportzentrum)\b/i.test(name) && !/\bstellplatz\b/i.test(name)) {
    return false;
  }
  if (/\bno es un parking\b/i.test(name)) return false;
  if (/\ben autocaravana\b/i.test(name)) return false;
  if (
    /\b(gumara|campervan ibiza|camper van days|camper menorca|autocaravanas mallorca|autocaravana mallorca|europeas)\b/i.test(
      name
    )
  ) {
    return false;
  }
  if (REGION === "francia") {
    if (
      !/\b(camping-car|camping car|campingcar|fourgon|camper|autocaravane|stellplatz|chez l.habitant|parking de passage)\b/i.test(
        name
      ) &&
      !types.includes("campground") &&
      !types.includes("rv_park")
    ) {
      return false;
    }
  }
  if (REGION === "italia") {
    if (
      !/\b(camper|sosta|campeggio|autocaravan|roulotte|motorhome)\b/i.test(name) &&
      !types.includes("campground") &&
      !types.includes("rv_park")
    ) {
      return false;
    }
  }
  if (REGION === "alemania" || REGION === "austria" || REGION === "suiza") {
    if (
      !/wohnmobil|reisemobil|stellplatz|weingut|campingplatz|\bcamper\b|camping-car|sosta|\baire\b/i.test(
        name
      ) &&
      !types.includes("campground") &&
      !types.includes("rv_park")
    ) {
      return false;
    }
  }
  if (REGION === "holanda" || REGION === "belgica" || REGION === "luxemburgo") {
    if (
      !/camperplaats|camperparking|stellplatz|wohnmobil|camping-car|\bcamper\b|\baire\b|campingplatz/i.test(
        name
      ) &&
      !types.includes("campground") &&
      !types.includes("rv_park")
    ) {
      return false;
    }
  }
  if (CAMPING) {
    if (/\b(tienda|articulos|campingaz|camping gas|outlet|alquiler|hire|rental|bar at|cl[ií]nica|clinic|supermercado|parque acu[aá]tico)\b/i.test(name)) {
      return false;
    }
    if (/^\s*camping\s*$/i.test(name)) return false;
    if (
      !/\b(c[aà]mping|camper ?park|kampaoh|alannia|taiga|yelloh|huttopia)\b/i.test(name) &&
      !types.includes("campground") &&
      !types.includes("rv_park")
    ) {
      return false;
    }
    if (
      !/\b(c[aà]mping|camper|kampaoh|alannia|taiga|nomading|yelloh|huttopia)\b/i.test(name) &&
      !(/\bcamp\b/i.test(name) && types.includes("campground"))
    ) {
      return false;
    }
  }
  if (REGION === "chile" || REGION === "argentina") {
    if (/\b(hostel|hospedaje)\b/i.test(name)) return false;
    if (
      /\b(showroom|fabrica|factory|equipamiento|kit|rental|rentals|alquiler|arriendo|toldos)\b/i.test(
        name
      )
    ) {
      return false;
    }
    if (
      /\b(guarderia|cochera|park to fly|nautica)\b/i.test(name) &&
      !/casa.?rodante|camping motorhome|area/i.test(name)
    ) {
      return false;
    }
    if (
      /\bestacionamiento\b/i.test(name) &&
      !/casa.?rodante|motorhome|camper|trailer|\brv\b|camping/i.test(name)
    ) {
      return false;
    }
    if (
      !/casa.?rodante|motorhome|trailer|\brv\b|camper|camping|campamento/i.test(name)
    ) {
      return false;
    }
    if (
      /\b(tienda|accesorios|tanques|vendo|carrozados|impresion)\b/i.test(name)
    ) {
      return false;
    }
    if (
      /motorhome|casa.?rodante|trailer/i.test(name) &&
      !/camping|campamento|estacionamiento|parking|parador|area|autocamp|rv park|trailer park|caravan park/i.test(
        name
      )
    ) {
      return false;
    }
  }
  if (REGION === "dinamarca" || REGION === "suecia" || REGION === "noruega") {
    if (
      !/stallplats|bobilplass|autocamper|husbil|bobil|stellplatz|campingplads|campingplass|\bcamper\b|wohnmobil/i.test(
        name
      ) &&
      !types.includes("campground") &&
      !types.includes("rv_park")
    ) {
      return false;
    }
  }
  if (RELEVANCE_RE.test(name)) return true;
  if (types.includes("campground") || types.includes("rv_park")) return true;
  return false;
}

async function nearby(query: string, lat: number, lng: number, language = "es") {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", "40000");
  url.searchParams.set("keyword", query);
  url.searchParams.set("key", googleApiKey);
  url.searchParams.set("language", language);

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
  const slugs = new Set<string>();
  const coords: Array<{ lat: number; lng: number }> = [];
  const pageSize = 1000;
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("areas")
      .select("google_place_id,latitud,longitud,slug")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      if (row.slug) slugs.add(row.slug);
      if (row.google_place_id) placeIds.add(row.google_place_id);
      if (row.latitud != null && row.longitud != null) {
        coords.push({ lat: Number(row.latitud), lng: Number(row.longitud) });
      }
    }
    if (data.length < pageSize) break;
    page++;
  }
  return { placeIds, coords, slugs };
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
  const { slugs: takenSlugs } = await loadExisting();
  let imported = 0;
  for (const hit of utiles) {
    const details = await placeDetails(hit.place_id);
    await delay(120);
    if (details?.business_status === "CLOSED_PERMANENTLY") continue;
    const cc = details?.country_code;
    if (REGION === "alemania") {
      if (cc && cc !== "DE") continue;
      if (!isInGermany(hit.lat, hit.lng)) continue;
    } else if (REGION === "francia") {
      if (cc && cc !== "FR") continue;
      if (!isInFrance(hit.lat, hit.lng)) continue;
    } else if (REGION === "italia") {
      if (cc && cc !== "IT") continue;
      if (!isInItaly(hit.lat, hit.lng)) continue;
    } else if (REGION === "suiza") {
      if (cc && cc !== "CH") continue;
      if (!isInSwitzerland(hit.lat, hit.lng)) continue;
    } else if (REGION === "austria") {
      if (cc && cc !== "AT") continue;
      if (!isInAustria(hit.lat, hit.lng)) continue;
    } else if (REGION === "belgica") {
      if (cc && cc !== "BE") continue;
      if (!isInBelgium(hit.lat, hit.lng)) continue;
    } else if (REGION === "luxemburgo") {
      if (cc && cc !== "LU") continue;
      if (!isInLuxembourg(hit.lat, hit.lng)) continue;
    } else if (REGION === "holanda") {
      if (cc && cc !== "NL") continue;
      if (!isInNetherlands(hit.lat, hit.lng)) continue;
    } else if (REGION === "dinamarca") {
      if (cc && cc !== "DK") continue;
      if (!isInDenmark(hit.lat, hit.lng)) continue;
    } else if (REGION === "suecia") {
      if (cc && cc !== "SE") continue;
      if (!isInSweden(hit.lat, hit.lng)) continue;
    } else if (REGION === "noruega") {
      if (cc && cc !== "NO") continue;
      if (!isInNorway(hit.lat, hit.lng)) continue;
    } else if (REGION === "chile") {
      if (cc && cc !== "CL") continue;
      if (!isInChile(hit.lat, hit.lng)) continue;
    } else if (REGION === "argentina") {
      if (cc && cc !== "AR") continue;
      if (!isInArgentina(hit.lat, hit.lng)) continue;
    } else if (CAMPING) {
      if (cc && cc !== "ES") continue;
      if (!CAMPING.isIn(hit.lat, hit.lng)) continue;
      if (details && !esProvinciaCamping(details)) continue;
    } else if (cc && cc !== "ES" && cc !== "PT") {
      continue;
    }
    const onBalears = isInBaleares(hit.lat, hit.lng);
    if (REGION === "baleares" && !onBalears) continue;
    const pais =
      REGION === "alemania" || cc === "DE"
        ? "Alemania"
        : REGION === "francia" || cc === "FR"
          ? "Francia"
          : REGION === "italia" || cc === "IT"
            ? "Italia"
          : REGION === "suiza" || cc === "CH"
            ? "Suiza"
            : REGION === "austria" || cc === "AT"
              ? "Austria"
          : REGION === "belgica" || cc === "BE"
            ? "Bélgica"
            : REGION === "luxemburgo" || cc === "LU"
              ? "Luxemburgo"
              : REGION === "holanda" || cc === "NL"
                ? "Países Bajos"
          : REGION === "dinamarca" || cc === "DK"
            ? "Dinamarca"
            : REGION === "suecia" || cc === "SE"
              ? "Suecia"
              : REGION === "noruega" || cc === "NO"
                ? "Noruega"
          : REGION === "chile" || cc === "CL"
            ? "Chile"
          : REGION === "argentina" || cc === "AR"
            ? "Argentina"
          : cc === "PT"
            ? "Portugal"
            : "España";
    const slug = uniqueAreaSlug(
      baseAreaSlug(
        hit.name,
        details?.ciudad,
        details?.provincia || (onBalears ? "Illes Balears" : hit.hueco)
      ),
      takenSlugs
    );
    takenSlugs.add(slug);
    const decision = decidirUbicacion(hit.name, { types: hit.types || [], pais });
    if (!decision.admite || !decision.tipo) {
      console.log(`  ↷ fuera de las 4: ${hit.name} (${decision.motivo})`);
      continue;
    }
    const { error } = await supabase.from("areas").insert([
      {
        nombre: hit.name,
        slug,
        tipo_area: decision.tipo,
        pais,
        comunidad: onBalears ? "Illes Balears" : details?.comunidad || null,
        comunidad_autonoma: onBalears ? "Illes Balears" : details?.comunidad || null,
        provincia: onBalears
          ? details?.provincia || "Illes Balears"
          : details?.provincia || hit.hueco,
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
      .filter((h: any) => isRelevant(h.name, h.types || [], h.pais))
      .filter((h: any) => !placeIds.has(h.place_id) && !h.cercaExistente && !h.inDb);
    console.log(`Import desde informe: ${utiles.length} candidatos`);
    await importUtiles(utiles);
    return;
  }

  console.log(
    REGION === "baleares"
      ? "\nBaleares — archipiélago sin cobertura (13 disparos, radio 40 km)"
      : REGION === "alemania"
        ? "\nAlemania — 16 huecos (radio 40 km)"
        : REGION === "francia"
          ? "\nFrancia — 16 huecos (radio 40 km)"
        : REGION === "italia"
          ? "\nItalia — 16 huecos (radio 40 km)"
        : REGION === "suiza"
          ? "\nSuiza — 16 disparos (radio 40 km, DE/FR/IT)"
        : REGION === "austria"
          ? "\nAustria — 16 huecos (radio 40 km)"
        : REGION === "belgica"
          ? "\nBélgica — 16 disparos (NL/FR/DE, radio 40 km)"
        : REGION === "luxemburgo"
          ? "\nLuxemburgo — 6 disparos (FR/DE, radio 40 km)"
        : REGION === "holanda"
          ? "\nPaíses Bajos — 16 disparos (camperplaats, radio 40 km)"
        : REGION === "dinamarca"
          ? "\nDinamarca — 16 disparos (autocamperplads, radio 40 km)"
        : REGION === "suecia"
          ? "\nSuecia — 16 disparos (ställplats, radio 40 km)"
        : REGION === "noruega"
          ? "\nNoruega — 16 disparos (bobilplass, radio 40 km)"
        : REGION === "chile"
          ? "\nChile — 20 disparos (casas rodantes / motorhome, radio 40 km)"
        : REGION === "argentina"
          ? "\nArgentina — 20 disparos (casas rodantes / motorhome, radio 40 km)"
        : CAMPING
          ? `\n${CAMPING.label} — ${CAMPING.huecos.length} disparos (camping / càmping, radio 40 km)`
        : "\nPenínsula — búsqueda en 16 huecos (radio 40 km)"
  );
  if (SOLO_STOPOVER) {
    console.log("Solo términos locales de parking/Parkplatz/parcheggio (se clasifican en pública o privada)\n");
  }
  console.log(doImport ? "MODO IMPORT\n" : "DRY RUN\n");

  const { placeIds, coords } = await loadExisting();
  console.log(`Ya en BD: ${placeIds.size} place_ids, ${coords.length} coords\n`);

  const seen = new Set<string>();
  const hits: any[] = [];
  let busquedas = 0;

  for (const hueco of HUECOS) {
    const terminos = terminosDe(hueco);
    console.log(`#${hueco.id} ${hueco.zona} [${hueco.lat}, ${hueco.lng}]`);
    for (const termino of terminos) {
      busquedas++;
      process.stdout.write(`   "${termino}"… `);
      const lang =
        (hueco as { lang?: string }).lang ||
        (REGION === "alemania" || REGION === "austria"
          ? "de"
          : REGION === "francia"
            ? "fr"
            : REGION === "italia"
              ? "it"
              : REGION === "holanda"
                ? "nl"
                : REGION === "dinamarca"
                  ? "da"
                  : REGION === "suecia"
                    ? "sv"
                    : REGION === "noruega"
                      ? "no"
                : "es");
      const results = await nearby(termino, hueco.lat, hueco.lng, lang);
      let nuevos = 0;
      for (const r of results) {
        if (!r.place_id || seen.has(r.place_id)) continue;
        if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) continue;
        const distCentro = haversine(hueco.lat, hueco.lng, r.lat, r.lng);
        if (distCentro > 42) continue;
        if (REGION === "baleares" && !isInBaleares(r.lat, r.lng)) continue;
        if (REGION === "alemania" && !isInGermany(r.lat, r.lng)) continue;
        if (REGION === "francia" && !isInFrance(r.lat, r.lng)) continue;
        if (REGION === "italia" && !isInItaly(r.lat, r.lng)) continue;
        if (REGION === "suiza" && !isInSwitzerland(r.lat, r.lng)) continue;
        if (REGION === "austria" && !isInAustria(r.lat, r.lng)) continue;
        if (REGION === "belgica" && !isInBelgium(r.lat, r.lng)) continue;
        if (REGION === "luxemburgo" && !isInLuxembourg(r.lat, r.lng)) continue;
        if (REGION === "holanda" && !isInNetherlands(r.lat, r.lng)) continue;
        if (REGION === "dinamarca" && !isInDenmark(r.lat, r.lng)) continue;
        if (REGION === "suecia" && !isInSweden(r.lat, r.lng)) continue;
        if (REGION === "noruega" && !isInNorway(r.lat, r.lng)) continue;
        if (REGION === "chile" && !isInChile(r.lat, r.lng)) continue;
        if (REGION === "argentina" && !isInArgentina(r.lat, r.lng)) continue;
        if (CAMPING && !CAMPING.isIn(r.lat, r.lng)) continue;
        seen.add(r.place_id);
        const decision = decidirUbicacion(r.name, { types: r.types, pais: hueco.pais });
        const relevant = decision.admite && isRelevant(r.name, r.types || [], hueco.pais);
        const inDb = placeIds.has(r.place_id);
        const cercaExistente = tooCloseToExisting(r.lat, r.lng, coords);
        hits.push({
          ...r,
          relevant,
          inDb,
          cercaExistente,
          tipo_area: decision.tipo,
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
