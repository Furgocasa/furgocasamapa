# Guía — El mapa al servicio del alquiler

Documento de criterio. Complementa `README.md` (visión), `GUIA_ENGAGEMENT.md`
(embudo de favoritos/login) y `PLAN_MEJORAS.md` (seguimiento).

Escrito el **22 agosto 2026**. No está implementado: es la brújula para
los próximos 90 días. Si un cambio no encaja aquí, no se hace.

---

## 1. Para qué existe este mapa (y para qué no)

Nació para dos cosas. Las dos siguen siendo las únicas que justifican el
proyecto:

1. **Soporte al viajero de Furgocasa.** Quien ya alquiló se siente mejor
   atendido (ruta, áreas, conserje). Eso es marca frente a Indie Campers,
   McRent y el resto.
2. **SEO y tráfico hacia el alquiler.** `furgocasa.com` es lo que da
   dinero. El mapa es el folleto vivo y la puerta de Google.

No nació para ser Park4Night, ni una superapp de tasación IA / QR / gastos,
ni el mapa de LATAM. Eso se añadió cuando el proyecto tomó forma y nos
emocionamos. Esas capas no se borran; **se dejan de invertir** hasta que
el núcleo (alquiler + cliente ya pagado) se note.

### Tesis en una frase

Dejamos de ser una startup de mapas. Volvemos a ser **el mapa de Furgocasa**:
herramienta del que ya alquiló + imán SEO que convierte al que todavía no.

No hace falta que el visitante se enamore del mapa. Hace falta que **reserve
una semana** o que el que ya reservó **use el mapa en ruta**.

### Cómo se mide (y cómo no)

| Se mide | No se mide como éxito |
|---------|------------------------|
| Clics UTM mapa → `furgocasa.com` | Cuentas registradas |
| Reservas con `utm_source=mapafurgocasa` | Áreas importadas |
| % de alquileres que abren el mapa / la ruta | Favoritos, tasaciones IA, QR |
| Calidad de fichas ES / PT / sur de FR | Cobertura de Alemania, Gales, LATAM |

Park4Night tiene 13 millones de descargas. No es el marcador. Una reserva
de una semana suele pagar hosting, APIs y el mantenimiento de las fichas
de España.

---

## 2. El problema de la ficha (el que más duele)

Quien busca en Google «área de autocaravanas en Murcia» **es el cliente de
Furgocasa**. Llega a `/area/[slug]`. Ahí hoy ve, en este orden
(`app/(public)/area/[slug]/page.tsx`):

1. Hero del área (bien: es lo que vino a ver).
2. Info básica.
3. **Banner rotativo** — a menudo CasiCinco (hoteles, bares, restaurantes).
4. Servicios + «¿Has estado aquí?».
5. Galería.
6. **Otro banner rotativo** — otra vez sorteo 50/50.
7. Bloque **«Tu furgo también vive aquí»**: tasación IA, registrar furgo, QR.
8. Áreas relacionadas.

El CTA de dinero (`furgocasa.com/es`) no es un botón de reserva. Es un
**banner genérico** que entra en un sorteo. En desktop, el pool de
`BannerRotativo` da **más peso a CasiCinco** (bares 1.6, hoteles 1.6,
restaurantes 1.6) que a varios creativos de Furgocasa. El algoritmo
obliga a un equilibrio 50/50: si el primero es Furgocasa, el segundo
*tiene* que ser CasiCinco.

Peor: el fallback SSR de `BannerRotativo` pinta `BannerHeroHorizontal`,
que es **CasiCinco**. El primer paint de muchas fichas es un anuncio de
otro producto.

Y debajo, `HerramientasVehiculo` usa el tráfico SEO —el único que tenemos—
para vender un producto que **nadie pidió en esa página**: valorar la
furgo, pegar un QR, registrar gastos. En 30 días (ago 2026): 0 tasaciones
IA, 2 vehículos nuevos, 4 reportes de accidente en total. Ese bloque
compite visualmente con el único job que sí importa: **alquilar**.

Los banners de Furgocasa, cuando salen, apuntan a la home:

```
https://www.furgocasa.com/es?utm_source=mapafurgocasa&utm_medium=banner&utm_campaign=…
```

Ni base (Murcia / Madrid / Alicante / Valencia / Albacete), ni fechas, ni
«esta ruta». Quien está mirando un área de Murcia recibe el mismo enlace
que quien mira un Stellplatz en Baviera.

### Lectura

La ficha hace de **escaparate de un producto que nadie pidió**. El dinero
se esconde en un banner intercambiable. Eso es lo que hay que invertir,
antes que cualquier país nuevo o cualquier feature.

---

## 3. Principios (para no volver a emocionarnos)

1. **En una ficha pública, el alquiler va primero.** CasiCinco es otro
   negocio. En `mapafurgocasa.com` no reparte el escenario al 50 %.
2. **Un CTA no es un banner.** El visitante tiene que ver un bloque
   propio, siempre visible, que diga «Alquila una camper para hacer esta
   ruta» y lleve a Furgocasa con contexto.
3. **Contexto o no hay clic útil.** Murcia → base Murcia. Levante →
   Alicante/Valencia. Madrid / Albacete → esa base. Fuera de radio de
   flota → home de alquiler, no un invento.
4. **IA / QR / gastos no viven en la ficha SEO.** Viven en el perfil, en
   la flota, o en la home logada. `GUIA_ENGAGEMENT.md` sigue valiendo
   para favoritos y «Estuve aquí»; no para empujar tasación en `/area`.
5. **No se importa un país para sentirse grandes.** Solo se toca inventario
   de ES / PT / sur de FR (donde van los clientes de Furgocasa). El resto
   se mantiene, no se riega.
6. **Park4Night no es el enemigo.** El cliente puede usarlo y el nuestro.
   `/comparativa` es SEO; no es la estrategia de producto.
7. **Todo lo que no lleve a un alquiler o a un cliente ya pagado, se
   queda quieto.**

---

## 4. Qué cambia en la ficha (prioridad 1)

Objetivo: quien aterriza desde Google entiende en 5 segundos que **puede
alquilar una camper de Furgocasa para ir ahí**.

### 4.1 Bloque de alquiler propio (no es un banner)

Nuevo componente, p. ej. `components/area/CtaAlquilerFurgocasa.tsx`.
No entra en `BannerRotativo`. No se sortea. Va **siempre**.

Dónde (orden propuesto):

```
Hero
Info básica
→ CTA alquiler (prioridad 1, justo cuando ya sabe qué es el área)
Servicios
Galería
Áreas relacionadas
(opcional, al final) un solo banner CasiCinco, nunca por encima del CTA
```

Qué dice, según zona:

| Zona del área | Copy | Destino |
|---------------|------|---------|
| Murcia / entorno base | Alquila una camper en Murcia y duerme aquí | URL de la base Murcia + UTM |
| Alicante / Valencia / Levante | Esta ruta se hace desde nuestras bases del Levante | Base más cercana |
| Madrid / Albacete | Salimos desde Madrid / Albacete | Esa base |
| Resto de España / Portugal / sur de FR | Alquila una camper para recorrer esta zona | `furgocasa.com/es` o landing de producto |
| Resto del mundo | CTA suave o ninguno | No forzar Murcia en un área de Chile |

UTM obligatorio en todos los enlaces:

```
utm_source=mapafurgocasa
utm_medium=cta_ficha   (o email_reserva, whatsapp_previaje…)
utm_campaign=alquiler
utm_content={slug-del-area}
```

Sin esto no sabemos si el mapa paga.

### 4.2 BannerRotativo: el alquiler sale del sorteo

Archivo: `components/banners/BannerRotativo.tsx`.

Hoy: pool mixto + regla 50/50 CasiCinco / Furgocasa + fallback SSR a
`BannerHeroHorizontal` (CasiCinco).

Mañana:

- En `/area/[slug]`, **un slot como máximo** para CasiCinco, **debajo**
  del CTA de alquiler. Nunca el primer bloque comercial de la página.
- Los creativos `BannerFurgocasa*` **no rotan** en la ficha: el CTA del
  §4.1 los sustituye. Evita dos anuncios de Furgocasa distintos (banner
  genérico + CTA contextual) peleándose.
- El fallback SSR de la ficha **no puede ser CasiCinco**. O el CTA de
  alquiler, o nada.
- En páginas que no son ficha (si se mantienen banners), Furgocasa
  alquiler ≥ CasiCinco. El 50/50 deja de ser la regla.

CasiCinco no se elimina del grupo. Se **quita del primer impacto** de
la página que Google manda al que busca dormir en camper.

### 4.3 HerramientasVehiculo fuera de la ficha pública

Hoy está en `app/(public)/area/[slug]/page.tsx` justo después del segundo
banner, con el comentario «el tráfico real está aquí».

Ese tráfico real es de **gente que busca un área**, no de gente que
quiere tasar su Ducato.

Mover el bloque a:

- Home **logada** (ya está).
- `/mis-autocaravanas` y `/valoracion-ia-vehiculos` (ya existen).
- Navbar solo con sesión (ya está).

No va en `/area`. Si en 90 días el CTA de alquiler funciona y aún
queremos enseñar IA/QR al anónimo, se discute. No se vuelve a colar
«porque hay tráfico».

### 4.4 Landings de país (mismo criterio)

`/mapa-autocaravanas-espana`, Portugal y (si se toca) sur de Francia:
mismo CTA de alquiler, no banner 50/50. Las landings de Alemania, UK,
LATAM, etc. **no se rediseñan ahora**. Tampoco se les echa más SEO
inventado.

---

## 5. El que ya pagó (prioridad 2 — marca)

Park4Night no puede copiar esto: el mapa sale **dentro del alquiler**.

### Al confirmar la reserva

Email (y si hay WhatsApp de operaciones, el mismo enlace):

- «Tu furgo se recoge en {base}. Te hemos montado una ruta de los
  primeros días.»
- Deep link a `/ruta?...` o a un paquete de 4–6 áreas cerca de esa base
  (Levante, interior de Murcia, Madrid…).
- No a la home del mapa.

### El día anterior

«Mañana recoges en X. Cinco áreas a menos de una hora.» Lista corta,
una de ellas con vaciado/agua si la base no lo cubre al salir.

### En la furgo

Tarjeta o QR que abre **esa ruta**, no `mapafurgocasa.com`. El QR
anti-golpes de flota puede convivir; no es el gancho de la ficha SEO.

### Al volver

Un toque: «¿Qué tal el área de…?» Ahí sí «Estuve aquí». Eso alimenta
datos y se siente como cierre del viaje, no como registro forzado.

Objetivo de 90 días: **20–40 % de los alquileres** abren el mapa o la
ruta. Eso vale más que 1.485 cuentas SEO que no vuelven.

El Tío Viajero, en este marco, es **recepción 24/7 del rental** («salgo
de Murcia el viernes, dónde duermo hacia Granada»), no el chatbot del
sector. Los chips de tasación IA / QR en el widget se quitan o se
degradan; no son el job del que ya tiene las llaves.

---

## 6. Inventario y geografía (qué se toca, qué no)

### Se trabaja

- España (fichas de las zonas de flota primero: Murcia, Levante, Madrid,
  Albacete, y las rutas típicas desde ahí).
- Portugal (el cliente cruza).
- Sur de Francia (mismo motivo).
- Revisión de textos y datos de esas fichas: `GUIA_REVISION_AREAS.md`.
  Eso sí mueve Google.

### Se mantiene, no se riega

Alemania, Italia, Gales, resto de Europa, México, Argentina, Chile,
Uruguay, Centroamérica. Las landings y las fichas que ya existen
siguen publicadas. **No hay más imports, gaps ni pilotos** salvo
indicación explícita.

LATAM no es el plan de reflote. Es una semilla. Se riega cuando Iberia
pague su sitio.

### Se para

- Guerra de producto con Park4Night (la página `/comparativa` se puede
  dejar por SEO; no se amplía el relato).
- Nuevas funciones de vehículo / IA / QR en superficie pública.
- Medir el sprint por «cuántas áreas nuevas».

---

## 7. Relación con las otras guías

| Guía | Sigue igual | Cambia el acento |
|------|-------------|------------------|
| `GUIA_ENGAGEMENT.md` | Favoritos sin cuenta, AuthModal, Estuve aquí, no interrumpir al que llega de Google | No usar la ficha para empujar IA/QR. El digest semanal puede incluir un CTA de alquiler |
| `GUIA_REVISION_AREAS.md` | Ciclo auditar → corregir fichas activas | Priorizar ES / PT / sur FR, no LATAM ni DACH |
| `GUIA_DISENO_V3.md` | Tokens, mapa, móvil | El CTA de alquiler usa esos tokens; no es un banner «de anuncio» |
| Chatbot | Círculo revisión → corrección | Job: ayudar a dormir / ruta desde una base Furgocasa |

---

## 8. Plan 90 días

### Semanas 1–2 — Ficha y medición

- [ ] Componente CTA alquiler en `/area/[slug]` (siempre, contextual).
- [ ] Quitar `HerramientasVehiculo` de la ficha.
- [ ] `BannerRotativo` en ficha: CasiCinco como máximo un slot, debajo
      del CTA; fallback SSR ya no es CasiCinco.
- [ ] UTMs en todos los destinos a `furgocasa.com`.
- [ ] Evento de analytics `cta_alquiler_click` (además del UTM).
- [ ] En Furgocasa: vista o nota de reservas con
      `utm_source=mapafurgocasa`.

### Semanas 3–6 — Cliente que ya pagó

- [ ] Email de confirmación con ruta / 5 áreas de la base.
- [ ] Toque pre-viaje (email o WhatsApp de operaciones).
- [ ] Contar % de reservas que abren el enlace.

### Semanas 7–12 — SEO donde duele y recorte

- [ ] Oleada de revisión de fichas en radio de flota (no 25 países).
- [ ] CTA igual en `/mapa-autocaravanas-espana` (y PT si hay tracción).
- [ ] Mirar los tres números de la §9. Decidir: seguir, ajustar CTA, o
      recortar más superficie (IA, LATAM, comparativa).

Si a los 90 días hay tráfico y **cero clics** al alquiler: el problema
es la ficha, no el mercado. Si hay clics y **cero reservas**: el
problema es la web de Furgocasa o el matching de producto. Si los
clientes de alquiler **no abren** el enlace: el problema es el
onboarding (email/WhatsApp), no LATAM.

---

## 9. Números para no volver a hundirnos

Línea base (ago 2026), para no olvidar de dónde salimos:

- ~4.800 sesiones / 30 días, ~160/día, casi todas a `/area/...`.
- 1.485 cuentas; 87 login en 30 d; 12 en 7 d.
- Favoritos / visitas / valoraciones (30 d): 1 / 0 / 1.
- Tasaciones IA (30 d): 0.

Servilleta, no promesa: 4.800 sesiones × 3 % al CTA ≈ 144 visitas/mes
a Furgocasa. Si el rental convierte al 2–4 %, son **3–6 reservas
asistidas**. Con eso el mapa merece existir.

Señal a 90 días:

| Métrica | Señal de que flota |
|---------|---------------------|
| Clics UTM / `cta_alquiler_click` | Tendencia clara vs «casi no se miraba» |
| Reservas `utm_source=mapafurgocasa` | Aunque sean 3–5/mes, el activo se justifica |
| % alquileres que abren mapa o ruta | 20–40 % |

---

## 10. Archivos que tocarán (cuando se implemente)

No se implementa en este documento. Lista para no buscarlo otra vez:

| Qué | Dónde |
|-----|--------|
| Orden de la ficha, quitar IA/QR | `app/(public)/area/[slug]/page.tsx` |
| CTA contextual | nuevo `components/area/CtaAlquilerFurgocasa.tsx` |
| Sorteo y 50/50 | `components/banners/BannerRotativo.tsx` |
| Destino genérico actual | `components/banners/BannerFurgocasa*.tsx` → `furgocasa.com/es` |
| Bloque que sobra en ficha | `components/ui/HerramientasVehiculo.tsx` (se queda para home/perfil) |
| Chips IA/QR del chatbot | `components/chatbot/ChatbotWidget.tsx` |
| Landings ES/PT | `app/(public)/mapa-autocaravanas-espana/page.tsx` (y PT) |
| Tracking | `lib/analytics/track.ts` + evento `cta_alquiler_click` |

Bases Furgocasa a mapear (confirmar URLs reales en `furgocasa.com`
antes de hardcodear): Murcia, Madrid, Alicante, Valencia, Albacete.

---

## 11. Lo que este documento no pide

- App nativa.
- Ganar Europa.
- Sembrar LATAM.
- Borrar CasiCinco del grupo.
- Apagar tasación IA, QR o gestión de flota: siguen para el negocio
  interno y para quien ya tiene cuenta. **No en la puerta de Google.**

Si hay duda, releer el §1.
