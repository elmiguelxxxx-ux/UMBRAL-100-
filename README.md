# Umbral

App de estudio por objetivos: Objetivo → Umbral → Misión → Herramienta → Evidencia → Nuevo umbral.
Stack: React 19 + TypeScript + Vite 6 + Tailwind 4 + Supabase + Express (`server.js`) + Gemini.

## Correr en local

1. `npm install`
2. Copia `.env.example` a `.env` y completa `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. `npm run dev` → http://localhost:3000 (también desde el celular por `http://IP-DE-TU-PC:3000`).

Probar el onboarding desde cero: abre `http://localhost:3000/?reset_onboarding=1`.

## IA (importante)

Toda llamada a Gemini pasa por `POST /api/ai` en el servidor. La clave `GEMINI_API_KEY` **nunca** llega al navegador
(no uses `VITE_GEMINI_API_KEY`). Si el usuario pega su propia clave en Ajustes, se usa esa. Modelo opcional: `GEMINI_MODEL`
(por defecto `gemini-2.5-flash`). Con IA apagada o sin clave, todo el ciclo funciona con respaldos locales.

## Trabajar en Antigravity

1. Abre esta carpeta en Antigravity (la carpeta local manda; no vuelvas a exportar desde AI Studio).
2. En su terminal: `npm install` y `npm run dev` → abre http://localhost:3000. Cada cambio se ve en ~1 s.
3. Antes de subir: `npm run lint` y `npm run build`. No ejecutes nada que borre `server.js`.

## Producción (Render)

- Build Command: `npm install && npm run build`
- Start Command: `node server.js`
- Variables de entorno: las mismas tres del `.env`.

## Base de datos (Supabase)

Ejecuta en el SQL Editor, en este orden:
1. `supabase_onboarding_migration.sql`
2. `supabase_first_mission_migration.sql`
3. `supabase_interior_migration.sql`
4. `supabase_figure_migration.sql`
5. `supabase_activity_log.sql`

> Las políticas RLS actuales permiten acceso sin login. No guardes datos personales hasta que haya autenticación real.

## Estructura

- `src/features/figure/` — la figura concéntrica, misión, evidencia y veredicto.
- `src/features/onboarding/`, `src/features/primera-mision/` — flujo inicial.
- `src/lib/aiClient.ts`, `aiPolicy.ts` — toda llamada a IA pasa por aquí (con respaldo local si no hay IA).
- `api/routes.js` — endpoints `/api/*`, compartidos por `server.js` (producción) y Vite (dev).
