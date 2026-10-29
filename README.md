# CosechaCerca · MVP

Plataforma de sistemas alimentarios cortos: agricultores locales publican cosechas y excedentes;
mercados, restaurantes y comedores comunitarios cercanos los reservan directamente.

## Stack (todo con plan gratuito)
| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend + API | Next.js 15 (App Router) + TypeScript + Tailwind 4 | Un solo repo y un solo deploy; Route Handlers como backend |
| Base de datos | Supabase (PostgreSQL + PostGIS) | SQL relacional, búsqueda por distancia, RLS |
| Auth | Supabase Auth (email / magic link) | Rol guardado en `profiles` |
| Archivos | Supabase Storage | Fotos de productos (bucket `product-images`) |
| Tareas programadas | pg_cron | Libera reservas vencidas cada 15 min |
| Hosting | Render (plan gratuito) | Se redespliega solo con cada push a `main` |

## Funcionalidades
- Login obligatorio al entrar; registro e ingreso con rol **agricultor** o **comprador** (mercado, restaurante, comedor comunitario).
- Catálogo por cercanía con filtros (categoría, radio, excedentes, búsqueda) y ubicación del navegador.
- Reserva atómica de inventario; el agricultor confirma → listo → completado, o cualquiera cancela.
- Panel del agricultor: puntos de recojo con GPS, publicar cosechas **con foto obligatoria**, pausar/activar, pedidos recibidos.
- "Mis pedidos" del comprador, con contacto por WhatsApp.
- **Idiomas: español, inglés y francés** (botón ES / EN / FR en la cabecera; se recuerda en una cookie
  y, la primera vez, se usa el idioma del navegador). Textos en `src/i18n/dictionaries/`.

## Estructura
```
supabase/migrations/0001_init.sql   Esquema, RLS y funciones SQL (reserva atómica, cercanía)
src/
  middleware.ts                     Refresco de sesión Supabase
  app/
    catalogo/page.tsx               Catálogo por cercanía (Server Component)
    api/listings/route.ts           GET catálogo · POST publicar cosecha
    api/orders/route.ts             GET mis pedidos · POST reservar
    api/orders/[id]/route.ts        PATCH cambiar estado del pedido
  components/catalog/               ListingCard, ReserveForm, CatalogFilters
  lib/supabase/                     Clientes server / browser
  lib/validation/                   Esquemas Zod
  lib/format.ts, lib/http.ts        Formato (S/, unidades) y mapeo de errores
  types/domain.ts                   Tipos de dominio
  i18n/                             Configuración y diccionarios es / en / fr
```

## Puesta en marcha
1. Crea un proyecto en supabase.com y ejecuta `supabase/migrations/0001_init.sql` en el SQL Editor
   (o `supabase db push` con la CLI).
2. Ejecuta también `0002_schedule_expire_stale.sql` (pg_cron) y `0003_product_images_storage.sql` (fotos).
3. `cp .env.example .env.local` y completa URL y anon key.
4. `npm install && npm run dev` → http://localhost:3000/catalogo
5. Registro: pasa `role` (`farmer`/`buyer`), `buyer_type`, `full_name` en `options.data` de `supabase.auth.signUp`;
   un trigger crea el perfil.

## Reglas de negocio clave
- La reserva descuenta stock **dentro de una transacción con bloqueo de fila** (`create_order`): no hay sobreventa.
- El agricultor tiene 24 h para confirmar; si no, `expire_stale` devuelve el stock.
- Cancelar (comprador o agricultor) devuelve el stock; solo el agricultor avanza `pending → confirmed → ready → completed`.
- Las publicaciones vencidas (`available_until`) salen del catálogo automáticamente.
- Un pedido agrupa productos de un solo agricultor (simplifica logística y pagos).

## Despliegue en Render
- Runtime Node · Build: `npm install && npm run build` · Start: `npm start`
- Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key)
- En Supabase > Authentication > URL Configuration, pon la URL de Render como *Site URL*.

## Añadir un idioma
1. Copia `src/i18n/dictionaries/en.ts` a `pt.ts` y traduce (TypeScript avisa si falta una clave).
2. Agrega `"pt"` en `LOCALES`, `LOCALE_NAMES` e `INTL_LOCALE` de `src/i18n/config.ts` y en `dictionaries/index.ts`.

## Siguientes pasos
- `npm run db:types` para tipar el cliente Supabase.
- Notificaciones por WhatsApp/email al crear o confirmar pedidos.
- Ocultar el teléfono del perfil hasta que exista un pedido entre ambas partes.
- Métricas de impacto: kg rescatados de excedentes, km evitados.

## Créditos de imágenes
Fotos de demostración y de portada: [Unsplash](https://unsplash.com/license) (licencia libre).
