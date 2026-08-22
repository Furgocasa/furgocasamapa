# 🔗 Paridad Mapa Furgocasa ↔ Casi Cinco

> Este archivo existe **igual en los dos repositorios**. Si lo tocas en uno, cópialo en el otro.
>
> Para qué sirve: cuando se pide *"ponlo como en la otra"*, aquí está escrito **cuál es "la otra"**,
> qué archivo hace ese trabajo en cada proyecto, qué ya se igualó y qué no se debe igualar nunca.

Última actualización: **22 de agosto de 2026**.

---

## 1. Los dos proyectos

|  | Mapa Furgocasa | Casi Cinco |
|---|---|---|
| Qué mapea | Áreas de autocaravana y campings | Sitios de 4,7★ o más (restaurantes, bares, hoteles) |
| Repositorio | `github.com/Furgocasa/furgocasamapa` (`main`) | `github.com/ActtaxIA/Casi_cinco_app` (`main`) |
| Producción | https://www.mapafurgocasa.com | https://www.casicinco.com |
| Despliegue | Vercel, automático al pushear a `main` (2-3 min) | AWS Amplify, automático al pushear a `main` |
| Carpeta local | `Eskala IA\6 - MAPA FURGOCASA\NEW MAPA FURGOCASA` | `Eskala IA\5 - CASI CINCO APP WEB\Casi_cinco_app` |
| Stack | Next.js 14 + Supabase + Tailwind | Next.js + Supabase + Tailwind |
| Datos | Proyecto Supabase propio | Proyecto Supabase propio, **distinto** |
| Reglas de git del repo | commit + push a `main` siempre (`.cursor/rules/github.mdc`) | pedir confirmación antes de commit/push (`.cursorrules`) |

**No comparten datos ni base de datos.** Lo único común en infraestructura es la cuenta de **MapTiler**:
los dos leen `NEXT_PUBLIC_MAPTILER_API_KEY` con la misma clave, y Casi Cinco cae a Carto Voyager si falta.

> Detalle que despista: Furgocasa tiene un `amplify.yml` heredado, pero **despliega en Vercel**.
> Casi Cinco es el que va por Amplify.

---

## 2. Quién es la referencia de qué

- **Furgocasa manda en el comportamiento del mapa**: cámara y vuelo de entrada, clustering, GPS,
  límites de paneo, atribución, hojas móviles, PWA. Es lo validado en producción.
- **Casi Cinco manda en la estética de las tarjetas y la leyenda**: tarjeta de lugar, jerarquía
  tipográfica de valoración y reseñas, leyenda con iconos, filtros táctiles.
- **Nunca se copia la identidad**: los tiers de Casi Cinco (diamante → bronce) y el tipo de
  ubicación de Furgocasa (pública / privada / camping) son cosas distintas y así se quedan.

---

## 3. Equivalencias de archivos

Antes de copiar nada, abre el archivo de la columna de origen y léelo. No supongas.

| Función | Mapa Furgocasa | Casi Cinco |
|---|---|---|
| Cabecera | `components/layout/Navbar.tsx` (azul en todas las páginas) | `components/layout/Header.tsx` (variante azul a sangre en `/mapa` y `/ruta`) |
| Página de mapa | `app/(public)/mapa/page.tsx` + `components/mapa/MapaInteractivo*.tsx` | `app/(public)/mapa/page.tsx` (MapLibre en línea, import dinámico) |
| Motores de mapa | 3 intercambiables desde el admin: MapLibre, Google, Leaflet | MapLibre en `/mapa`, `@react-google-maps/api` en `/ruta` |
| Estilo del basemap | `lib/map/brand-style.ts` | `lib/map/brand-style.ts` (mismo papel: `applyBrandTheme` + `applyMapLanguage`) |
| Filtros | `components/mapa/FiltrosMapa.tsx` | panel de filtros dentro de `app/(public)/mapa/page.tsx` |
| Lista de resultados | `components/mapa/ListaResultados.tsx` | tarjetas en línea en la página (`PlaceCard`, `PlaceRatingLine`) |
| Planificador de ruta | `components/ruta/PlanificadorRuta.tsx` (envuelto por `app/(public)/ruta/page.tsx`) | `app/(public)/ruta/page.tsx` |
| Clasificación propia | `lib/areas/tipo-area.ts` | `lib/utils/tier-calculator.ts` |
| Chat (los dos, "Tío Viajero") | `components/chatbot/ChatbotWidget.tsx` | `components/ChatbotFloating.tsx` |
| Hoja inferior móvil | `components/mobile/BottomSheet.tsx` | `components/mobile/BottomSheet.tsx` |
| Barra inferior móvil | en línea en cada página (p. ej. `app/(public)/ruta/page.tsx`) | `components/mobile/BottomNavigation.tsx` (reutilizable) |
| Idiomas | `lib/i18n/ui.ts`, 5 idiomas (es, en, fr, de, it) | solo español |

---

## 4. Lo que ya está igualado

### 4.1 Casi Cinco adoptó de Furgocasa

| Commit | Qué se llevó |
|---|---|
| `0af6b9a` | Alineación general del mapa con la UX de Furgocasa, conservando los tiers |
| `7b26301` | Paneo libre, clusters en azul corporativo, glifo de tier en los puntos |
| `b97e1df` | Botones de GPS y de restablecer zoom idénticos |
| `8d21c28` | Viewport móvil y PWA: `100dvh`, safe-area, `viewportFit: 'cover'`, `next-pwa` |
| `073e75d`, `c556bb2` | Mar en el azul de Furgocasa y etiquetas en castellano (también con Carto, que rotula con `{name_en}`) |
| `0eef5e4` | Atribución del mapa abajo a la izquierda y leyenda visible en móvil bajo el recuento |
| `a7d1aeb` | Arrastre real de la hoja móvil, brújula y zoom al pulsar un cluster |
| `2364fd7` | Mismos límites de mapa en móvil y escritorio, para alcanzar Canarias |
| `1926a33` | Vuelo de entrada Europa → España (solo la primera carga) y ficha anclada al pin |
| `d661944`, `0043944`, `dca317d` | Basemap: Carto explícito y luego MapTiler `streets-v2` con la clave de Furgocasa (Carto como respaldo) |
| `a899859` | Chat del Tío Viajero con la estética de Furgocasa (botón con anillo degradado, ventana, burbujas, input) |
| `841bc67` | Navbar del mapa a ancho completo y con el contraste de Furgocasa |
| `2456980` | `/ruta` rehecha con el layout de tres columnas del mapa (panel, mapa a sangre, lista) |
| `f620d89` | `/ruta` usa el mismo header inmersivo y el mismo anclaje del chat que `/mapa` |

### 4.2 Mapa Furgocasa adoptó de Casi Cinco

| Commit | Qué se llevó |
|---|---|
| `18e08a8` | Planificador de rutas unificado con la UI del mapa (3 columnas, hojas móviles) |
| `cf7b093` | Leyenda de tipos con icono propio dentro del pin: bandera (pública), valla (privada), tienda (camping) |
| `daf7873`, `dc31d2c` | Valoración de Google y número de reseñas al pasar el ratón y en la ficha del pin |
| `e14f994` | Número de reseñas en las tarjetas de la lista |
| `2f49b6f` | Leyenda independiente del recuento y atribución plegada al abrir |
| `a9d493b` | Tarjeta del mapa al estilo Casi Cinco, con acciones de favorito y visita |
| `cfc3ffc` | Reseñas en gris pequeño, sin negrita (como en Casi Cinco) |
| `81352ba` | Filtro de tipo de ubicación en el planificador de rutas, a imagen de las categorías de Casi Cinco |

### 4.3 Decisiones que valen para los dos

- **Atribución del basemap abajo a la izquierda**, para que no la tape el botón del chat.
- **Conteo de reseñas** en `text-xs text-gray-500`: la valoración destaca, el recuento acompaña.
- **Etiquetas del mapa en castellano**, sea MapTiler o Carto el basemap.
- En móvil, la navegación de `/mapa` y `/ruta` la lleva la **barra inferior de la página**, no la cabecera.

---

## 5. Divergencias deliberadas (no son fallos)

- **Clasificación**: tiers por valoración en Casi Cinco; titularidad (pública / privada / camping) en Furgocasa.
- **Motores de mapa**: Furgocasa mantiene tres implementaciones sincronizadas y el admin elige;
  Casi Cinco usa MapLibre en el mapa y Google en la ruta.
- **Idiomas**: cualquier texto nuevo en Furgocasa pasa por `lib/i18n/ui.ts` en 5 idiomas. En Casi Cinco, español.
- **Muro de acceso**: Furgocasa usa `LoginWall`; Casi Cinco `LoginOverlay` y prueba/paywall propios.
- **Reordenar paradas de la ruta**: Furgocasa arrastra con `@dnd-kit`; Casi Cinco no tiene esa
  dependencia y usa flechas de subir/bajar. Es equivalente funcional, no una tarea pendiente.
- **Guardar rutas, GPX y favoritos**: existen en Furgocasa; en Casi Cinco solo se copió la UI de `/ruta`.

---

## 6. Cómo se trabaja un "hazlo como en la otra"

1. **Mira primero el original.** Abre el archivo equivalente de la tabla del punto 3 y cópialo de ahí,
   no de memoria ni de una captura.
2. **Conserva la identidad** del proyecto de destino (punto 5). Se copia la forma, no la taxonomía.
3. **En Furgocasa, si tocas el mapa, tócalo en los tres motores.** Es obligatorio:
   ver `.cursor/rules/mapas.mdc`.
4. **Compila antes de subir** (`npm run build`). Si el TLS local falla al descargar fuentes,
   `NODE_TLS_REJECT_UNAUTHORIZED=0` **solo** para ese build local.
5. **Cada repo tiene sus reglas de git**: en Furgocasa se commitea y pushea a `main`; en Casi Cinco
   se pide confirmación antes de commitear.
6. **Cuidado con las sesiones en paralelo.** Antes de `git add`, `git status` y `git diff`: es normal
   encontrar cambios de otra sesión sin commitear. No los arrastres en tu commit sin decirlo.
7. **Apunta el resultado aquí**, en el punto 4, con el hash. Es lo que hace que este documento sirva.

---

## 7. Cosas que ya han mordido

- **Arrastrar trabajo ajeno en un commit.** El 22 de ago, un commit de `/ruta` en Casi Cinco se llevó
  por delante una reescritura sin commitear del `Header.tsx` hecha por otra sesión, que eliminaba el
  menú hamburguesa. Se decidió mantenerla (los enlaces siguen en el footer), pero salió a producción
  sin pedirlo. Revisa el `git status` completo antes de commitear.
- **`main` roto por otra sesión.** El build de Furgocasa cayó por un `card.subtitle` huérfano en
  `components/perfil/DashboardStats.tsx`. Si tu build falla en un archivo que no has tocado,
  comprueba si ya venía roto del repositorio antes de buscar el fallo en tu cambio.
- **Builds interrumpidos + Dropbox.** Cortar un `npm run build` ha corrompido el índice de git
  (`bad signature`) en las dos carpetas. Se arregla borrando `.git/index` y haciendo `git reset -q`,
  sin perder cambios locales.
- **Claves por captura de pantalla.** La clave de MapTiler se copió de `.env.local` a `.env.local`
  entre proyectos, no transcribiéndola a mano. Hazlo así.
