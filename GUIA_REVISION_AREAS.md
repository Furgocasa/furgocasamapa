# Guía de revisión de áreas — Mapa Furgocasa

Una revisión de área es un ciclo de **auditar → investigar → corregir → verificar**. Se puede pedir para una ficha, una zona, un país o todas las áreas activas.

## Alcance que se puede pedir

- “Revisa esta área” → ficha completa: identidad, datos, texto, imágenes, traducciones y ficha pública.
- “Revisa [ciudad/zona/país]” → **todas** las áreas activas de ese alcance, con auditoría y corrección por lotes; no solo las que parezcan débiles.
- “Revisa todas las áreas” → oleadas reanudables, con auditoría antes y después.
- “Solo revisa textos / servicios / imágenes” → se limita al componente pedido, pero se verifica el resultado.

## Ciclo de una ficha

1. **Identidad y geografía**: nombre, `slug`, coordenadas, dirección, localidad, país y tipo. Solo existen `publica`, `privada` y `camping`.
2. **Datos estructurados**: servicios, plazas, precio y acceso. `precio_noche = null` significa precio no disponible; solo `0` significa gratuita.
3. **Texto español**: investigar con GPT-5.6 Terra y `web_search`. Debe describir el recinto y aportar SEO local natural: municipio/provincia, accesos, transporte y 3–5 referencias locales verificables. No usar relleno turístico ni repetir keywords. Antes de publicar, comprobar que no omite datos operativos confirmados: temporada, cierre temporal y reapertura, horarios, precio y extras, plazas, acceso, estancia máxima y servicios. Un cierre temporal o estacional se indica al principio.
4. **Imágenes**: primero fotos de la web oficial del recinto. Si no hay, generar imagen IA propia en `areas/ia/`. Nunca Google Places/Images, ni stock, catálogo, prensa, redes o directorios de terceros.
5. **Traducciones**: regenerar FR, DE, IT y EN solo después de cerrar el texto español.
6. **Cierre**: revisar `https://www.mapafurgocasa.com/area/[slug]`, comprobar que los datos visibles coinciden y marcar `verificado`.

## Zona, país o todas las áreas

Empieza siempre con una auditoría de las áreas activas:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npm run db:audit
node scripts/audit-copyright-images.js
```

Después trabaja en este orden:

1. Datos estructurados: `npm run enrich:datos` genera propuestas; revisar `scripts/enrich-datos-propuestas.csv` antes de ejecutar `npm run enrich:datos:apply`.
2. Textos: primero dry-run y después lote reanudable. Para un país:

```powershell
$env:BULK_PROVINCIA="Murcia"
$env:BULK_MODE="critical"
$env:BULK_DRYRUN="1"
node scripts/bulk-enrich.js

Remove-Item Env:BULK_DRYRUN
$env:BULK_CHECKPOINT="enrich-murcia-checkpoint.txt"
node scripts/bulk-enrich.js
```

3. Imágenes: web oficial; si no hay foto propia, IA. Purgar riesgo alto (stock, Google, redes):

```powershell
npm run imagenes:purga-ia
```

4. Traducciones, cuando **todas** las fichas españolas del alcance estén cerradas. Para actualizar traducciones existentes después de una revisión, usar `TRAD_FORCE=1` y el mismo alcance:

```powershell
$env:TRAD_RUN="1"
$env:TRAD_FORCE="1"
$env:TRAD_PROVINCIA="Murcia"
node scripts/translate-descriptions.js
```

5. Repetir `npm run db:audit` y revisar las excepciones restantes.

## Herramientas de administración

- `/admin/areas/edit/[id]`: revisión y corrección manual de una ficha.
- `/admin/areas/enriquecer-textos`: investigación y reescritura individual.
- `/admin/areas/actualizar-servicios`: servicios y datos estructurados.
- `/admin/areas/revisar-imagenes`: revisión, borrado y generación de imágenes.
- `/admin/areas`: filtros por país, estado y verificación.

## Reglas de datos y costes

- Trabajar solo con `activo = true`. Las áreas inactivas del piloto México son ruido deliberado y no se reactivan ni enriquecen sin indicación explícita.
- Usar las credenciales de `.env.local`, nunca el MCP de Supabase de otra cuenta.
- No inventar servicios, precios, aforo, horarios, distancias ni frecuencias.
- `enrich-datos --apply` solo rellena campos vacíos; las correcciones de datos existentes requieren revisión explícita.
- No pagar ni usar fotos de Google. Tampoco stock ni fotos ajenas con derechos. Web oficial o, si no hay, IA propia.
- Los scripts que usan Google o importan lugares se ejecutan primero en dry-run y solo con su confirmación explícita.
- Para acotar los lotes sin mezclar países: `BULK_PROVINCIA`, `DATOS_PROVINCIA` y `TRAD_PROVINCIA`. Para traducir solo fichas ya cerradas: `TRAD_IDS` admite IDs separados por comas.
