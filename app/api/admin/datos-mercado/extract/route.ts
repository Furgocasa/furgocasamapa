import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

// POST: Extraer datos de un anuncio a partir de una URL
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const { data: userData } = await supabase.auth.getUser();
    const isAdmin = userData?.user?.user_metadata?.is_admin;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const { url, preview } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL es requerida" },
        { status: 400 }
      );
    }

    console.log("🔗 [Extract] Extrayendo datos de URL:", url);
    console.log("👁️ [Extract] Modo preview:", preview ? "SÍ (solo extraer)" : "NO (extraer y guardar)");

    // 0. Obtener porcentaje IEDMT de la configuración global
    let porcentajeIEDMT = 14.75; // Valor por defecto
    try {
      const { data: configIEDMT } = await (supabase as any)
        .from("ia_config")
        .select("config_value")
        .eq("config_key", "valoracion_vehiculos")
        .single();

      if (configIEDMT?.config_value?.porcentaje_iedmt) {
        porcentajeIEDMT = parseFloat(configIEDMT.config_value.porcentaje_iedmt);
        console.log(`💰 [Extract] Porcentaje IEDMT desde config: ${porcentajeIEDMT}%`);
      } else {
        console.log(`⚠️ [Extract] Porcentaje IEDMT no configurado, usando por defecto: ${porcentajeIEDMT}%`);
      }
    } catch (configError) {
      console.warn("⚠️ [Extract] Error leyendo config IEDMT, usando por defecto:", configError);
    }
    const factorIEDMT = 1 + porcentajeIEDMT / 100;
    console.log(`🔢 [Extract] Factor IEDMT calculado: ${factorIEDMT}`);

    // 1. Hacer fetch del HTML de la página
    let htmlContent = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      htmlContent = await response.text();
      console.log("✅ [Extract] HTML obtenido:", htmlContent.length, "caracteres");
    } catch (fetchError: any) {
      console.error("❌ [Extract] Error obteniendo HTML:", fetchError);
      return NextResponse.json(
        { error: `Error al obtener la página: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // 2. Extraer texto visible del HTML (simplificado)
    const textContent = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Eliminar scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // Eliminar styles
      .replace(/<[^>]+>/g, " ") // Eliminar tags HTML
      .replace(/\s+/g, " ") // Normalizar espacios
      .trim();

    // Limitar a primeros 10000 caracteres para no saturar OpenAI
    const textSnippet = textContent.substring(0, 10000);

    console.log("📄 [Extract] Texto extraído:", textSnippet.length, "caracteres");

    // 3. Usar OpenAI para extraer datos estructurados
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Eres un experto en autocaravanas y furgonetas camper.

IMPORTANTE: Las autocaravanas tienen DOS marcas diferentes:
1. MARCA DEL CAMPERIZADOR (quien construye el interior): Hymer, Weinsberg, Knaus, Dethleffs, Rapido, Bürstner, Adria, Roller Team, Benimar, Carado, Pilote, etc.
2. CHASIS (vehículo base/motorización): Fiat Ducato, Mercedes Sprinter, Citroën Jumper, Peugeot Boxer, Volkswagen Crafter, Ford Transit, Renault Master, etc.

EXTRAE LA SIGUIENTE INFORMACIÓN DEL ANUNCIO:

- marca: Marca del CAMPERIZADOR/FABRICANTE del interior (ej: Hymer, Weinsberg, Knaus, Dethleffs, Rapido, Adria, Bürstner, Roller Team, Benimar, MC Louis, etc.)
- modelo: Modelo del camperizador (ej: Free 600, CaraOne 540, Twin Plus 600, etc.)
- chasis: Marca y modelo del VEHÍCULO BASE (ej: "Fiat Ducato", "Mercedes Sprinter", "Citroën Jumper", "Peugeot Boxer", "Volkswagen Crafter", "Ford Transit")
- año: Año de fabricación (número de 4 dígitos)
- precio: Precio de venta en euros (número entero, sin símbolos)
- kilometros: Kilometraje actual (número entero, sin símbolos)
- estado: Estado del vehículo (ej: "Usado", "Seminuevo", "Como nuevo", "Ocasión", "Nuevo")

REGLAS CRÍTICAS:
1. **CHASIS**: Busca términos como "sobre Fiat", "base Mercedes", "motorización Ducato", "chasis Sprinter", "140CV", "2.3L"
2. Si NO encuentras un dato específico, devuelve null
3. Si solo hay UN fabricante mencionado (ej: "Fiat Ducato camperizada"), usa ese en AMBOS campos (marca Y chasis)
4. **Marcas camperizadoras comunes**: Hymer, Weinsberg, Knaus, Dethleffs, Rapido, Bürstner, Adria, Roller Team, Pilote, Rimor, Benimar, Giottivan, MC Louis, Carado, Sunlight
5. **Chasis comunes**: Fiat Ducato, Mercedes Sprinter, Citroën Jumper, Peugeot Boxer, Volkswagen Crafter, Ford Transit, Renault Master
6. El precio debe ser mayor a 5000€
7. Devuelve SOLO JSON válido, sin texto adicional

EJEMPLOS CORRECTOS:
- "Hymer Free 600 sobre Fiat Ducato 140CV" 
  → marca: "Hymer", modelo: "Free 600", chasis: "Fiat Ducato"

- "Weinsberg CaraOne 540 MQ - Mercedes Sprinter 319"
  → marca: "Weinsberg", modelo: "CaraOne 540 MQ", chasis: "Mercedes Sprinter"

- "Knaus BoxStar 600 con base Peugeot Boxer"
  → marca: "Knaus", modelo: "BoxStar 600", chasis: "Peugeot Boxer"

- "Fiat Ducato L2H2 camperizada profesional"
  → marca: "Fiat", modelo: "Ducato L2H2", chasis: "Fiat Ducato"

TEXTO DEL ANUNCIO:
${textSnippet}

Responde en formato JSON:
{
  "marca": "...",
  "modelo": "...",
  "chasis": "...",
  "año": ...,
  "precio": ...,
  "kilometros": ...,
  "estado": "..."
}`;

    let extractedData: any = null;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un experto extractor de datos de anuncios de vehículos.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_completion_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content?.trim() || "";
      console.log("🤖 [Extract] Respuesta OpenAI:", aiResponse);

      // Intentar parsear JSON
      try {
        // Limpiar posible markdown
        const cleanedResponse = aiResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        extractedData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("❌ [Extract] Error parseando JSON de OpenAI:", parseError);
        return NextResponse.json(
          { error: "No se pudo extraer datos válidos del anuncio" },
          { status: 400 }
        );
      }
    } catch (aiError: any) {
      console.error("❌ [Extract] Error llamando OpenAI:", aiError);
      return NextResponse.json(
        { error: `Error de IA: ${aiError.message}` },
        { status: 500 }
      );
    }

    // 4. Validar datos extraídos
    if (!extractedData.marca || !extractedData.precio) {
      console.warn("⚠️ [Extract] Datos insuficientes:", extractedData);
      
      // Mensaje específico según qué falta
      let errorMsg = "No se pudo extraer ";
      const missing = [];
      if (!extractedData.marca) missing.push("marca");
      if (!extractedData.precio) missing.push("precio");
      errorMsg += missing.join(" y ") + " del anuncio";
      
      // Agregar más contexto si falta el precio
      if (!extractedData.precio && extractedData.marca) {
        errorMsg += ". El anuncio puede tener precio 'bajo consulta' o no estar visible en el HTML.";
      }
      
      return NextResponse.json(
        { 
          error: errorMsg,
          extracted: extractedData // Devolver lo que sí se extrajo para debug
        },
        { status: 400 }
      );
    }

    // 4.5 🚗 REGLA ESPECIAL: Diferenciar entre NUEVO y SEMINUEVO
    const estadoLower = (extractedData.estado || "").toLowerCase();
    const esSeminuevo = estadoLower.includes("seminuevo") || 
                        estadoLower.includes("semi-nuevo") ||
                        estadoLower.includes("semi nuevo");
    const esNuevo = !esSeminuevo && (
                      estadoLower.includes("nueva") ||
                      estadoLower.includes("nuevo") ||
                      estadoLower.includes("0 km") ||
                      estadoLower.includes("sin estrenar")
                    );

    let origenPrecio = "URL Manual";

    if (esNuevo) {
      const añoActual = new Date().getFullYear();
      console.log(`🆕 [Extract] Detectado vehículo NUEVO → Aplicando reglas especiales`);

      // Año = año actual (o año extraído si es mayor, porque puede ser modelo futuro)
      if (!extractedData.año || extractedData.año < añoActual) {
        console.log(`   📅 Año ajustado: ${extractedData.año || "null"} → ${añoActual}`);
        extractedData.año = añoActual;
      }

      // Kilómetros = 0 (solo si no tiene o es exactamente 0)
      if (!extractedData.kilometros || extractedData.kilometros === 0) {
        console.log(`   🚗 Kilómetros ajustados: ${extractedData.kilometros || "null"} → 0`);
        extractedData.kilometros = 0;
      }

      // Asegurar que el estado diga claramente "Nuevo"
      if (!extractedData.estado || estadoLower === "nueva" || estadoLower === "nuevo") {
        extractedData.estado = "Nuevo";
      }
    } else if (esSeminuevo) {
      console.log(`🔄 [Extract] Detectado SEMINUEVO → Manteniendo kilometraje real: ${extractedData.kilometros || "no detectado"} km`);
      // No aplicar reglas de vehículo nuevo, mantener datos reales
    } else {
      console.log(`🚙 [Extract] Vehículo usado → Manteniendo datos originales`);
    }

    // Aplicar normalización de precio solo si aplica (nuevos o seminuevos con IEDMT no incluido)
    if (esNuevo || esSeminuevo) {

      // 💰 NORMALIZACIÓN DE PRECIO: Detectar si falta IEDMT
      const textoCompletoLower = textContent.toLowerCase();
      const faltaIEDMT = textoCompletoLower.includes("iedmt no incluido") ||
                         textoCompletoLower.includes("impuesto de matriculación no incluido") ||
                         textoCompletoLower.includes("impuesto matriculación no incluido") ||
                         textoCompletoLower.includes("sin impuesto de matriculación") ||
                         textoCompletoLower.includes("sin iedmt") ||
                         (textoCompletoLower.includes("iedmt") && textoCompletoLower.includes("no incluido"));

      if (faltaIEDMT && extractedData.precio) {
        const precioOriginal = extractedData.precio;
        // IEDMT configurable globalmente desde /admin/configuracion
        const precioNormalizado = Math.round(precioOriginal * factorIEDMT);
        console.log(`💰 [Extract] IEDMT NO INCLUIDO detectado → Normalizando precio`);
        console.log(`   Precio original: ${precioOriginal}€`);
        console.log(`   Precio normalizado (+${porcentajeIEDMT}% IEDMT): ${precioNormalizado}€`);
        console.log(`   Factor aplicado: ${factorIEDMT}`);
        extractedData.precio = precioNormalizado;
        origenPrecio = `Concesionario (PVP Normalizado +${porcentajeIEDMT}% IEDMT)`;
      }
    }

    // 5. Si es preview, devolver datos SIN guardar
    if (preview) {
      console.log("👁️ [Extract] Modo preview - devolviendo datos sin guardar");
      return NextResponse.json({
        success: true,
        preview: true,
        ...extractedData,
      });
    }

    // 6. Si NO es preview, guardar en datos_mercado_autocaravanas
    console.log("💾 [Extract] Guardando en base de datos...");
    const dataToInsert = {
      marca: extractedData.marca || null,
      modelo: extractedData.modelo || null,
      chasis: extractedData.chasis || null,
      año: extractedData.año || null,
      precio: extractedData.precio || null,
      kilometros: extractedData.kilometros || null,
      fecha_transaccion: new Date().toISOString().split("T")[0],
      verificado: true, // Se considera verificado porque viene de una URL real
      estado: extractedData.estado || "Usado",
      origen: origenPrecio,
      tipo_dato: "Extracción Manual Admin",
      pais: "España",
      tipo_combustible: null,
      tipo_calefaccion: null,
      homologacion: null,
      region: null,
    };

    const { data: insertedData, error: insertError } = await (supabase as any)
      .from("datos_mercado_autocaravanas")
      .insert(dataToInsert)
      .select()
      .single();

    if (insertError) {
      console.error("❌ [Extract] Error insertando dato:", insertError);
      console.error("❌ [Extract] Detalles del error:", insertError);
      return NextResponse.json(
        {
          error: "Error al guardar datos en la base de datos",
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    console.log("✅ [Extract] Dato guardado exitosamente:", insertedData.id);

    return NextResponse.json({
      success: true,
      ...extractedData,
      id: insertedData.id,
    });
  } catch (error: any) {
    console.error("❌ Error en POST /api/admin/datos-mercado/extract:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
