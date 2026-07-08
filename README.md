# Gestión de Clases

Plataforma de gestión de clases para un profesor de español (ELE) que da clases online a alumnos en
China: calendario (día/semana/mes), bonos de clases con acumulación automática de sobrantes,
seguimiento de nivel por alumno, resumen mensual de horas e ingresos, notas privadas, y un panel de
administración para gestionar varios profesores.

**Demo pública** (datos de prueba, no conectada a la base de datos real, se reinician al recargar la
página): https://juanixou.github.io/Calendar-Management/

## Stack

- React + TypeScript + Vite, Tailwind CSS, Radix UI, TanStack Query, React Router, FullCalendar.
- Firebase (Firestore + Auth) como backend.
- Monorepo con npm workspaces: `packages/core` (dominio, lógica de negocio y acceso a datos, detrás
  de un patrón repositorio) + `apps/web` (interfaz).

## Desarrollo local

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # rellena con tu propio proyecto de Firebase
npm run dev
```

Ver [docs/firebase-setup.md](docs/firebase-setup.md) para la configuración completa de Firestore
(reglas de seguridad, estructura de datos, cómo crear profesores y administradores), y
[docs/deploy.md](docs/deploy.md) para cómo y cuándo se actualiza cada despliegue (producción vs.
demo pública).

## Scripts

- `npm run dev` — servidor de desarrollo, contra tu Firebase real (`.env.local`).
- `npm run build` — build de producción (Firebase Hosting).
- `npm run deploy` — build + despliegue a Firebase Hosting. Requiere un `.firebaserc` propio (copia
  `.firebaserc.example` y pon tu project ID — se mantiene fuera del repo a propósito).
- `npm run build:demo -w apps/web` — build de la demo pública (base de datos local efímera, sin
  login), usado por el workflow de GitHub Pages.

## Licencia

MIT — ver [LICENSE](LICENSE).
