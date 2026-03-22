/**
 * Extrae y parsea los tres precios recomendados del texto del informe de valoración IA.
 * Evita falsos positivos del cuerpo del informe (Pilar 1, PVP, etc.) priorizando el bloque final.
 */

const NBSP = /\u00a0/g;

/** Parsea cantidades tipo 67.900 €, 67,900 €, 67900, 1.234.567 */
export function parsearPrecioInforme(raw: string): number | null {
  if (!raw) return null;
  const t = raw.replace(NBSP, " ").replace(/\s/g, "").trim();
  if (!t) return null;

  if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    return parseInt(t.replace(/\./g, ""), 10);
  }
  if (/^\d{1,3}(,\d{3})+$/.test(t)) {
    return parseInt(t.replace(/,/g, ""), 10);
  }
  if (/^\d+$/.test(t)) {
    return parseInt(t, 10);
  }
  if (/^\d+,\d{2}$/.test(t)) {
    return Math.round(parseFloat(t.replace(",", ".")));
  }
  const n = parseFloat(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Última aparición de un marcador de sección de cierre de precios */
export function extraerBloqueFinalPrecios(text: string): string {
  const lower = text.toLowerCase();
  const marcas = [
    "precios finales recomendados",
    "precios finales recomendado",
    "precio final recomendado",
    "triangulación final y precios recomendados",
    "triangulacion final y precios recomendados",
  ];
  let mejor = -1;
  for (const m of marcas) {
    const i = lower.lastIndexOf(m);
    if (i > mejor) mejor = i;
  }
  if (mejor >= 0) return text.slice(mejor);
  return text;
}

function matchUltimoEnBloque(
  bloque: string,
  regex: RegExp
): RegExpMatchArray | null {
  const matches = [...bloque.matchAll(regex)];
  return matches.length ? matches[matches.length - 1] : null;
}

export type PreciosExtraidos = {
  precio_salida: number | null;
  precio_objetivo: number | null;
  precio_minimo: number | null;
};

/** Quita negritas Markdown que rompen los regex (ej. **Precio...**) */
function normalizarTextoInformeParaPrecios(text: string): string {
  return text.replace(/\*\*/g, "").replace(/__/g, "");
}

/**
 * Patrones amplios: etiquetas en español, con/sin "Recomendado", mínimo con/sin tilde.
 */
const CAP = "([\\d\\s.,\\u00a0]+?)";

const RE_SALIDA = new RegExp(
  `precio\\s+de\\s+salida(?:\\s+recomendado)?\\s*[:\\s]+\\s*${CAP}\\s*€`,
  "gi"
);
const RE_OBJETIVO = new RegExp(
  `precio\\s+objetivo(?:\\s+de\\s+venta)?\\s*[:\\s]+\\s*${CAP}\\s*€`,
  "gi"
);
const RE_MINIMO = new RegExp(
  `precio\\s+m[ií]nimo(?:\\s+aceptable)?\\s*[:\\s]+\\s*${CAP}\\s*€`,
  "gi"
);

export function extraerPreciosRecomendadosDelInforme(
  informeTexto: string
): PreciosExtraidos {
  const limpio = normalizarTextoInformeParaPrecios(informeTexto);
  const bloque = extraerBloqueFinalPrecios(limpio);

  let salida: number | null = null;
  let objetivo: number | null = null;
  let minimo: number | null = null;

  const mS = matchUltimoEnBloque(bloque, RE_SALIDA);
  const mO = matchUltimoEnBloque(bloque, RE_OBJETIVO);
  const mM = matchUltimoEnBloque(bloque, RE_MINIMO);

  if (mS?.[1]) salida = parsearPrecioInforme(mS[1]);
  if (mO?.[1]) objetivo = parsearPrecioInforme(mO[1]);
  if (mM?.[1]) minimo = parsearPrecioInforme(mM[1]);

  // Si el bloque final no encontró algo, reintento en todo el texto (última aparición)
  if (salida == null || objetivo == null || minimo == null) {
    if (salida == null) {
      const m = matchUltimoEnBloque(limpio, RE_SALIDA);
      if (m?.[1]) salida = parsearPrecioInforme(m[1]);
    }
    if (objetivo == null) {
      const m = matchUltimoEnBloque(limpio, RE_OBJETIVO);
      if (m?.[1]) objetivo = parsearPrecioInforme(m[1]);
    }
    if (minimo == null) {
      const m = matchUltimoEnBloque(limpio, RE_MINIMO);
      if (m?.[1]) minimo = parsearPrecioInforme(m[1]);
    }
  }

  return { precio_salida: salida, precio_objetivo: objetivo, precio_minimo: minimo };
}

/**
 * Garantiza salida >= objetivo >= mínimo cuando los tres existen.
 * Si solo hay objetivo, no inventa salida/mínimo aquí (lo hace el caller con fallback).
 */
export function corregirOrdenPreciosValores(
  salida: number | null,
  objetivo: number | null,
  minimo: number | null
): PreciosExtraidos {
  if (
    salida != null &&
    objetivo != null &&
    minimo != null &&
    salida > 0 &&
    objetivo > 0 &&
    minimo > 0
  ) {
    if (salida >= objetivo && objetivo >= minimo) {
      return { precio_salida: salida, precio_objetivo: objetivo, precio_minimo: minimo };
    }
    const arr = [salida, objetivo, minimo].sort((a, b) => b - a);
    return {
      precio_salida: arr[0],
      precio_objetivo: arr[1],
      precio_minimo: arr[2],
    };
  }
  return { precio_salida: salida, precio_objetivo: objetivo, precio_minimo: minimo };
}
