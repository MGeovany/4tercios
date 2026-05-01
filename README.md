# Huella / Lensia

Plataforma para fotógrafos de eventos en Honduras. Subes fotos, la IA detecta rostros, y los asistentes encuentran las suyas con una selfie.

## Stack

- **Next.js 16** (App Router) + React 19
- **Supabase** — Postgres + auth + storage. `pgvector` para embeddings de rostros.
- **Replicate** — modelo de detección + embeddings facial. Endpoint serverless, pago por uso.
- **sharp** — generación de thumbnails con watermark.
- **Tailwind v4** + Radix UI.
- **Clinpays** — pasarela de pagos para Honduras (stub listo, requiere credenciales).

## Configuración

1. Crea un proyecto en [Supabase](https://supabase.com/) y ejecuta los archivos en `supabase/migrations/` en orden:

   ```bash
   psql "$DATABASE_URL" -f supabase/migrations/0001_initial_schema.sql
   psql "$DATABASE_URL" -f supabase/migrations/0002_storage.sql
   ```

   O usa la Supabase CLI: `supabase db push`.

2. Crea cuenta en [Replicate](https://replicate.com/), obtén un API token y elige un modelo público de detección + embedding facial (ver `.env.example`).

3. Copia `.env.example` a `.env.local` y completa los valores. Mínimo:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REPLICATE_API_TOKEN` y `REPLICATE_FACE_MODEL` (sin esto, se usa un mock determinista)

4. Instala y arranca:
   ```bash
   pnpm install
   pnpm dev
   ```

## Flujo

### Fotógrafo

1. `/registro` → onboarding → `/dashboard`
2. `/dashboard/events/new` crea el evento (Supabase).
3. `/dashboard/events/[id]/upload`:
   - Drag & drop sube directamente a Supabase Storage (bucket `photos-original`).
   - `/api/photos` registra cada foto.
   - `/api/photos/{id}/process` descarga el original, llama a Replicate para detectar rostros + embeddings, genera thumb watermarked en `photo-thumbs`, guarda `faces` en `pgvector`.
4. Cuando el evento está `Procesando` o `Listo`, `is_public = true` lo expone en `/e/{slug}`.

### Asistente

1. Visita `/e/{slug}` (link público compartido por el fotógrafo).
2. Captura una selfie con cámara o sube un archivo.
3. `POST /api/events/{slug}/search` envía la imagen al servidor, que:
   - Sube a `selfies` (privado).
   - Pide a Replicate el embedding del mejor rostro.
   - Llama a la RPC `search_photos_by_embedding` (pgvector cosine ANN).
   - Devuelve fotos rankeadas por confianza con thumbnails públicos.
4. El asistente selecciona fotos y crea una orden:
   - `manual_whatsapp` → genera `wa.me` con datos pre-llenados.
   - `clinpays` → si hay credenciales, crea sesión y devuelve `payment_url`.
5. El webhook `/api/payments/clinpays/webhook` actualiza el estado a `paid`.

## Comandos

| Acción                | Comando            |
| --------------------- | ------------------ |
| Dev server            | `pnpm dev`         |
| Build                 | `pnpm build`       |
| Lint + format + build | `pnpm ci`          |
| Apply DB migrations   | `supabase db push` |

## Costos esperados

A 100 eventos/mes (~184k fotos, ~600k caras detectadas, ~10k búsquedas):

- Modal/Replicate: ~$45/mes (a ~$0.0002/imagen)
- Supabase Pro: $25/mes
- Total infraestructura: ~$70/mes

## Estructura

```
src/
├── app/                       Routes (App Router, Next 16)
│   ├── api/                   Route handlers (photos, events, payments)
│   ├── dashboard/             Área del fotógrafo (auth)
│   └── e/[slug]/              Galería pública por evento
├── components/
│   ├── search/                Captura de selfie + galería
│   └── upload/                Drag & drop con progreso
├── lib/
│   ├── face/                  Replicate + provider mock
│   ├── imaging/               Sharp watermark + thumbs
│   ├── payments/clinpays.ts   Adapter de pagos
│   ├── server/                Capa de datos server-only
│   └── supabase/              Browser/server/service-role clients
└── ...

supabase/migrations/           Esquema inicial + storage policies
```
