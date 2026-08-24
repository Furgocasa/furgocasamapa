# Guía de engagement — Mapa Furgocasa

Documento de producto y técnica. Complementa `README.md` (visión general) y
`PLAN_MEJORAS.md` (seguimiento). Implementado el **21 agosto 2026**.

---

## 1. Diagnóstico (por qué existe esto)

Hay tráfico real (~160 sesiones/día, ~4.800 en 30 días) y **1.485 cuentas**.
Casi todo es discovery anónimo desde Google hacia una ficha `/area/...`.

Lo que no ocurría:

| Acción | Histórico | Últimos 30 días |
|--------|-----------|-----------------|
| Favoritos | 28 (17 users) | 1 |
| Visitas “he estado” | 11 | 0 |
| Valoraciones de área | 15 | 1 |
| Rutas guardadas | 27 (14 users) | 2 |
| Vehículos registrados | 46 (33 users) | 2 |
| Valoración IA de vehículo | 40 informes / 5 users | 0 |
| Reportes de accidente | 4 | residual |

Embudo Auth: 1.485 registrados → 87 login en 30d → 12 en 7d. ~80 % de las
cuentas solo entra el día del alta (o nunca). 526 nunca confirmaron/entraron.

**Lectura:** la gente encuentra áreas. No construye un perfil. Las funciones
de vehículo (IA, registro, QR) existían pero **no se veían** en el recorrido
real (ficha de área), solo abajo de la landing y en el menú del avatar.

---

## 2. Principio de diseño

1. El primer gesto (corazón) **no pide cuenta**.
2. El login aparece **en el momento de la acción**, encima de la página.
3. Tras autenticarse se **retoma** lo que el usuario iba a hacer.
4. El WelcomeModal **no interrumpe** a quien llega a una ficha desde Google.
5. Valoración de área = un solo gesto (“Estuve aquí”), no tres formularios.
6. El chatbot y el planificador **llenan la mochila** (favoritos), no solo hablan.
7. IA / registro de furgo / QR se muestran **donde está el tráfico**.

---

## 3. Recorrido del usuario

```
Google → ficha /area/slug
         │
         ├─ Corazón  → favorito local (sin cuenta)
         │              banner: “Tienes N áreas. Crea cuenta para no perderlas”
         │              AuthModal → sync a tabla favoritos
         │
         ├─ Estuve aquí → AuthModal si no hay sesión
         │                 visita + estrellas en un modal
         │
         ├─ Bloque “Tu furgo también vive aquí”
         │     Valorar con IA | Registrar furgo | Reportar golpe
         │
         └─ Chatbot (Tío Viajero)
               corazón en cada card + “guardar todas”
               chips: ¿Cuánto vale mi furgo? | QR anti-golpes
```

Home `/`:

- Visitante: bloque compacto de vehículo justo bajo el hero.
- Logado: sitios guardados + última ruta + mismo bloque (si ya hay furgo,
  el CTA central dice “Mi furgo: Fiat Ducato”).

Navbar (sesión): icono camión + “Mi furgo” → `/mis-autocaravanas`.

---

## 4. Piezas técnicas

### 4.1 Favoritos locales y sync

| Archivo | Rol |
|---------|-----|
| `lib/favoritos/local.ts` | `localStorage` (`mf_favoritos_local`), acción pendiente (`mf_accion_pendiente`), `syncLocalFavoritesToAccount` |
| `components/ui/FavoritosSync.tsx` | Montado en `app/layout.tsx`. Al `SIGNED_IN` vuelca favoritos locales a `favoritos` |
| `components/area/DetalleAreaHeader.tsx` | Corazón anónimo + badge + banner + AuthModal |

Duplicados en BD: se ignoran (`23505`). Tras el sync se limpia el localStorage.

### 4.2 Auth inline

| Archivo | Rol |
|---------|-----|
| `components/ui/AuthModal.tsx` | Google OAuth + email/contraseña (sin nombre/apellidos). `?next=` = página actual |
| `app/(public)/auth/login/page.tsx` | Respeta `?next=` (también en Google) |
| `app/(public)/auth/callback/route.ts` | Intercambia el code y redirige a `next` |
| `components/ui/WelcomeModal.tsx` | **Solo en `/`**. Nunca en `/area`, `/mapa`, etc. |

Tras OAuth/confirmación de email, `FavoritosSync` + `consumePendingAction`
retoman favoritos o “Estuve aquí”.

### 4.3 Estuve aquí (visita + valoración)

`components/area/ValoracionesCompleto.tsx`

- Un botón: **Estuve aquí — Valorar**.
- Modal: estrellas obligatorias; comentario y fecha opcionales (colapsados).
- Escribe `visitas` y `valoraciones`. Si ya valoró: avisa y no duplica.
- Sin sesión: guarda pending `estuve_aqui` y abre AuthModal.

### 4.4 Planificador

`components/ruta/PlanificadorRuta.tsx`

- Guardar sin sesión: AuthModal (la ruta calculada **no se pierde**).
- Tras guardar: si hay áreas en la ruta, ofrece añadirlas todas a favoritos.
- Evento `route_save` en `user_interactions`.

`/ruta` sigue pidiendo login para **usar** el planificador (`LoginWall`). El
mapa y las fichas son libres. El chat **no** lista paradas de trayecto: deriva
a `/ruta` (también si el usuario ya está logueado). Prefill: `?origen=&destino=`.

### 4.5 Chatbot

`components/chatbot/ChatbotWidget.tsx`

- Corazón en cada card (local o cuenta).
- “Guardar estas N áreas”.
- Sin GPS el chat se sombrea (mismo estado que el mapa).
- Anónimo: 2 preguntas. Con cuenta: sin tope.
- Pastillas de mensaje: solo «cerca de mí» (gratis, pública, agua/luz, mascotas).
- Chips de enlace (no gastan pregunta): `/ruta`, `/valoracion-ia-vehiculos` y
  `/sistema-reporte-accidentes`.
- ↻ limpia la vista; el historial queda en BD. F5 tras ↻ sigue limpio.

### 4.6 Home y ficha: vehículo visible

| Archivo | Rol |
|---------|-----|
| `components/ui/HerramientasVehiculo.tsx` | Tres atajos: IA, registro, reportar golpe |
| `app/(public)/area/[slug]/page.tsx` | El bloque va **después de valoraciones** (donde aterriza el SEO) |
| `app/page.tsx` | Visitante: bajo el hero. Logado: en el bloque personal |
| `components/layout/Navbar.tsx` | Acceso permanente a `/mis-autocaravanas` si hay sesión |

Páginas de destino (ya existían):

- `/valoracion-ia-vehiculos` — marketing + flujo de tasación IA
- `/mis-autocaravanas` — ficha, gastos, mantenimiento, QR
- `/accidente` — formulario de testigo / golpe
- `/sistema-reporte-accidentes` — explicación del QR

### 4.7 Tracking

`lib/analytics/track.ts` → `POST /api/analytics/track` → `user_interactions`.

Eventos que ahora sí se disparan (antes no se registraban):

- `area_favorite` / `area_unfavorite` (`event_data.modo`: `local` \| `cuenta`; `origen`: `chatbot`, `ruta`…)
- `area_visit_register`
- `area_rate` (con `rating`)
- `route_save`

Métricas de producto a vigilar (30 días):

| Métrica | Antes (ago 2026) | Señal de que funciona |
|---------|------------------|------------------------|
| Favoritos | 1 | 80–150 |
| % sesiones que guardan ≥1 área | ~0 | 8–12 % |
| Altas con ≥1 favorito el mismo día | ~0 | 40 %+ |
| Login activos 7d | 12 | 40–60 |
| Valoraciones de área | 1 | 20–40 |
| Altas de vehículo / informes IA | 2 / 0 | movimiento claro vs baseline |

Admin: https://www.mapafurgocasa.com/admin/analytics

---

## 5. Digest semanal (email)

Solo a usuarios con **≥1 favorito**. Viernes 09:00 UTC.

| Pieza | Detalle |
|-------|---------|
| Cron | `vercel.json` → `GET /api/cron/digest-semanal` |
| Código | `app/api/cron/digest-semanal/route.ts` |
| Envío | Resend (`RESEND_API_KEY`) |
| Auth cron | `Authorization: Bearer CRON_SECRET` si está definido |

### Variables en Vercel (producción)

```
RESEND_API_KEY=re_...
EMAIL_FROM=Mapa Furgocasa <hola@mapafurgocasa.com>
CRON_SECRET=cadena-aleatoria
```

Sin `RESEND_API_KEY` el endpoint responde `{ skipped: true }` y no envía nada.
El dominio de `EMAIL_FROM` debe estar verificado en Resend.

Maquetación de correos: `mail_mapas/REGLAS_MAQUETACION_EMAILS.md`. El HTML
actual del digest es un primer envío; si se maqueta plantilla Outlook, copiar
la estructura de `mail_mapas/` y sustituir el `html` del route.

Probar a mano (con secret):

```
curl -H "Authorization: Bearer $CRON_SECRET" https://www.mapafurgocasa.com/api/cron/digest-semanal
```

---

## 6. Cómo verificar en producción

1. Incógnito → abrir una ficha `/area/...`. **No** debe salir el WelcomeModal.
2. Tocar el corazón: se pone rojo, toast “Guardada en tus sitios”, badge con 1.
3. Banner bajo el hero de la ficha: “Crea una cuenta…”. AuthModal inline.
4. Tras Google/email: favoritos en `/perfil` (tab Favoritos) y en la home logada.
5. “Estuve aquí”: estrellas + Publicar → fila en `visitas` y `valoraciones`.
6. `/ruta` (con sesión): calcular → Guardar → modal “¿añadimos las áreas?”.
7. Chatbot: chips de furgo/QR y corazón en las cards.
8. Navbar con sesión: icono de camión → `/mis-autocaravanas`.
9. Home visitante: bloque de 3 tarjetas bajo el hero (antes de “Features”).

Ctrl+F5 tras el deploy de Vercel (2–3 min).

---

## 7. Qué no tocar todavía

Funciones con uso residual **hasta** que el núcleo (favoritos + login +
visibilidad de furgo) se mueva:

- Contribuciones de datos de área (2 usos; fase 2 admin pendiente).
- Pedir más campos en el registro (nombre, apellidos, username).
- Nuevos muros de login en mapa o fichas.

Si en 4–8 semanas el tráfico **ve** IA/QR/registro y sigue sin usarlos, entonces
es un problema de producto (propuesta de valor), no de descubrimiento.

---

## 8. Commits de referencia

| Hash (aprox.) | Qué |
|---------------|-----|
| `f06f4ec` | Embudo: favoritos locales, AuthModal, Estuve aquí, planificador, home logada, chatbot, digest |
| `a8be35d` | Visibilidad: bloque furgo en ficha/home, navbar “Mi furgo”, chips chatbot |
