/**
 * Recategoriza tipo_area país a país. España y Reino Unido no se tocan.
 *
 *   npx ts-node --project tsconfig.scripts.json scripts/scripts_empresas/reclassify-tipos.ts --pais Portugal
 *   npx ts-node --project tsconfig.scripts.json scripts/scripts_empresas/reclassify-tipos.ts --pais Francia --apply
 *
 * Checklist: scripts/scripts_empresas/reclassify-paises.md
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import {
  classifyTipoArea,
  esPernoctaSinServicio,
  type TipoArea,
} from "../../lib/areas/tipo-area";

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
dotenv.config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const OCULTAR_SIN_SERVICIO = process.argv.includes("--ocultar-sin-servicio");
const SOLO_PARKING = process.argv.includes("--solo-parking");
const PAIS_ARG = (() => {
  const i = process.argv.indexOf("--pais");
  return i >= 0 ? process.argv[i + 1] : "";
})();
const SKIP_PAISES = new Set(["España", "Reino Unido", "United Kingdom"]);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function loadAreas() {
  const all: Array<{
    id: string;
    nombre: string;
    tipo_area: string;
    pais: string;
    google_types?: string[] | null;
  }> = [];
  let page = 0;
  while (true) {
    let q = supabase
      .from("areas")
      .select("id,nombre,tipo_area,pais,google_types")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (SOLO_PARKING) q = q.eq("tipo_area", "parking");
    else q = q.eq("activo", true);
    if (PAIS_ARG) q = q.eq("pais", PAIS_ARG);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

async function ocultarSinServicio(
  areas: Array<{ id: string; nombre: string; tipo_area: string; pais: string }>
) {
  const hits = areas.filter((a) => esPernoctaSinServicio(a.nombre));
  console.log(APPLY ? "\nOCULTAR SIN SERVICIO\n" : "\nDRY RUN OCULTAR SIN SERVICIO\n");
  console.log(`Candidatas: ${hits.length}\n`);
  hits.forEach((a) =>
    console.log(`  [${a.tipo_area}] ${a.pais} — ${a.nombre}`)
  );

  if (!APPLY) {
    console.log("\nPara ocultar: --ocultar-sin-servicio --apply\n");
    return;
  }

  let ok = 0;
  const chunk = 40;
  for (let i = 0; i < hits.length; i += chunk) {
    const slice = hits.slice(i, i + chunk);
    const results = await Promise.all(
      slice.map((a) =>
        supabase.from("areas").update({ activo: false }).eq("id", a.id)
      )
    );
    for (let j = 0; j < results.length; j++) {
      if (results[j].error) {
        console.error(`  ❌ ${slice[j].nombre}: ${results[j].error?.message}`);
      } else {
        ok++;
      }
    }
  }
  console.log(`\nOcultadas: ${ok}\n`);
}

async function main() {
  const areas = await loadAreas();
  if (OCULTAR_SIN_SERVICIO) {
    await ocultarSinServicio(areas);
    return;
  }

  const changes: Array<{
    id: string;
    nombre: string;
    pais: string;
    from: string;
    to: TipoArea;
  }> = [];

  if (!SOLO_PARKING && !PAIS_ARG) {
    console.error("Indica --pais \"Francia\" (o el país). No hay apply mundial.\n");
    process.exit(1);
  }
  if (PAIS_ARG && SKIP_PAISES.has(PAIS_ARG)) {
    console.error(`${PAIS_ARG} no se recategoriza (ya hecha).\n`);
    process.exit(1);
  }

  for (const a of areas) {
    if (SOLO_PARKING) {
      if (a.tipo_area !== "parking") continue;
    } else if (SKIP_PAISES.has(a.pais)) {
      continue;
    }
    if (PAIS_ARG && a.pais !== PAIS_ARG) continue;
    const types = Array.isArray(a.google_types) ? a.google_types : [];
    const next = classifyTipoArea(a.nombre, { pais: a.pais, types });
    if (next !== a.tipo_area) {
      changes.push({
        id: a.id,
        nombre: a.nombre,
        pais: a.pais,
        from: a.tipo_area || "null",
        to: next,
      });
    }
  }

  const byPais: Record<string, Record<string, number>> = {};
  for (const c of changes) {
    if (!byPais[c.pais]) byPais[c.pais] = {};
    const key = `${c.from}→${c.to}`;
    byPais[c.pais][key] = (byPais[c.pais][key] || 0) + 1;
  }

  console.log(APPLY ? "\nAPLICAR\n" : "\nDRY RUN\n");
  console.log(`Áreas: ${areas.length}. Cambios: ${changes.length}\n`);
  Object.keys(byPais)
    .sort()
    .forEach((p) => console.log(p, byPais[p]));

  const show = (to: string, n = 15) => {
    const xs = changes.filter((c) => c.to === to).slice(0, n);
    if (!xs.length) return;
    console.log(`\n→ ${to} (${changes.filter((c) => c.to === to).length}):`);
    xs.forEach((c) => console.log(`  [${c.from}] ${c.nombre}`));
  };
  show("camping", 40);
  show("privada", 40);
  show("publica", 15);
  const warn = changes.filter((c) => c.from === "privada" || c.from === "camping");
  if (warn.length) {
    console.log("\nREVISAR (salen de privada/camping):");
    warn.slice(0, 40).forEach((c) => console.log(`  [${c.from}→${c.to}] ${c.nombre}`));
  }

  if (!APPLY) {
    console.log("\nPara escribir: --apply\n");
    return;
  }

  let ok = 0;
  const chunk = 40;
  for (let i = 0; i < changes.length; i += chunk) {
    const slice = changes.slice(i, i + chunk);
    const results = await Promise.all(
      slice.map((c) =>
        supabase.from("areas").update({ tipo_area: c.to }).eq("id", c.id)
      )
    );
    for (let j = 0; j < results.length; j++) {
      if (results[j].error) {
        console.error(`  ❌ ${slice[j].nombre}: ${results[j].error?.message}`);
      } else {
        ok++;
      }
    }
    console.log(`  … ${ok}/${changes.length}`);
  }
  console.log(`\nActualizadas: ${ok}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
