# 4tercios

Plataforma para fotógrafos de eventos en Honduras. Subes fotos, la IA detecta rostros, y los asistentes encuentran las suyas con una selfie.

## Stack

- **Next.js 16** (App Router) + React 19
- **Supabase** — Postgres + auth + storage. `pgvector` para embeddings de rostros.
- **Reconocimiento facial** — InsightFace (SCRFD detector + ArcFace 512-d) corriendo localmente en el server vía `onnxruntime-node`. Modelos del mirror público `immich-app/buffalo_s` (~16MB total). Sin API ni pago por inferencia. Replicate disponible como alternativa configurable.
- **sharp** — generación de thumbnails con watermark.
- **Tailwind v4** + Radix UI.
- **Clinpays** — pasarela de pagos para Honduras (stub listo, requiere credenciales).

## Configuración

1. Crea un proyecto en [Supabase](https://supabase.com/) y ejecuta los archivos en `supabase/migrations/` en orden:

   ```bash
   psql "$DATABASE_URL" -f supabase/migrations/0001_initial_schema.sql
   psql "$DATABASE_URL" -f supabase/migrations/0002_storage.sql
   psql "$DATABASE_URL" -f supabase/migrations/0003_retention.sql
   ```

   O usa la Supabase CLI: `supabase db push`.

2. Copia `.env.example` a `.env.local` y completa los valores. Mínimo:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

   Para reconocimiento facial no necesitas nada más: por defecto se usa el provider local. Los modelos ONNX (~16MB) se descargan automáticamente al primer uso a `$TMPDIR/4tercios-face-models`.

3. Instala y arranca:
   ```bash
   pnpm install
   pnpm dev
   ```

## Reconocimiento facial — opciones

| Provider          | Cuándo                                                                   | Cómo activarlo                                                                           |
| ----------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `local` (default) | MVP y producción de bajo volumen. CPU del server, ~150-300ms por foto.   | No requiere config. O `FACE_PROVIDER=local`.                                             |
| `replicate`       | Volumen alto (>1000 fotos/min) o quieres GPU.                            | `FACE_PROVIDER=replicate`, `REPLICATE_API_TOKEN`, `REPLICATE_FACE_MODEL=<owner>/<name>`. |
| `mock`            | Tests y dev sin descargar modelos. Embeddings deterministas pero falsos. | `FACE_PROVIDER=mock`.                                                                    |

El embedding es siempre de 512 dimensiones (compatible con la columna `vector(512)` en pgvector). Modelos de menor dimensión se padean con ceros, conservando la similitud coseno.

## Flujo

### Fotógrafo

1. `/registro` → onboarding → `/dashboard`
2. `/dashboard/events/new` crea el evento (Supabase). Tope de 60 días online (constraint en DB).
3. `/dashboard/events/[id]/upload`:
   - Drag & drop sube directamente a Supabase Storage (bucket `photos-original`).
   - `/api/photos` registra cada foto.
   - `/api/photos/{id}/process` descarga el original, corre InsightFace, genera thumb watermarked en `photo-thumbs`, guarda embeddings en `faces`.
4. Cuando el evento está `Procesando` o `Listo`, `is_public = true` lo expone en `/e/{slug}`.

### Asistente

1. Visita `/e/{slug}` (link público compartido por el fotógrafo).
2. Captura una selfie con cámara o sube un archivo.
3. `POST /api/events/{slug}/search` envía la imagen al servidor, que:
   - Sube a `selfies` (privado, auto-borrado).
   - Extrae embedding del mejor rostro.
   - Llama a la RPC `search_photos_by_embedding` (pgvector cosine ANN).
   - Devuelve fotos rankeadas por confianza con thumbnails públicos.
4. El asistente selecciona fotos y crea una orden:
   - `manual_whatsapp` → genera `wa.me` con datos pre-llenados.
   - `clinpays` → si hay credenciales, crea sesión y devuelve `payment_url`.
5. El webhook `/api/payments/clinpays/webhook` actualiza el estado a `paid`.

## Retención y costos

- **Galerías:** máximo 60 días (configurable por evento, enforced en DB).
- **Selfies:** se eliminan del storage al finalizar la búsqueda; queries con `expires_at` < now() se borran por el cron.
- **Auto-archivo:** activa pg_cron y agenda `select cron.schedule('4tercios_archive_expired', '0 4 * * *', $$ select public.archive_expired_events(); $$);` (incluido en migración `0003_retention.sql`).

A 100 eventos/mes (~184k fotos, ~600k caras detectadas, ~10k búsquedas) con provider local:

- Supabase Pro: $25/mes (DB + Storage)
- Compute (Vercel/Fly): ~$20/mes
- Total infraestructura: **~$45/mes**

Con Replicate self-deploy: +$45/mes pero con GPU (procesamiento ~10x más rápido).

## Comandos

| Acción                | Comando            |
| --------------------- | ------------------ |
| Dev server            | `pnpm dev`         |
| Build                 | `pnpm build`       |
| Lint + format + build | `pnpm ci`          |
| Apply DB migrations   | `supabase db push` |

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
│   ├── face/                  Local (onnxruntime + InsightFace) + replicate + mock
│   │   └── local/             Detector SCRFD, alineación, embedder
│   ├── imaging/               Sharp watermark + thumbs
│   ├── payments/clinpays.ts   Adapter de pagos
│   ├── server/                Capa de datos server-only
│   └── supabase/              Browser/server/service-role clients
└── ...

supabase/migrations/           Esquema inicial + storage policies + retention
```
