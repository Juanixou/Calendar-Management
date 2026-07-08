# Guía de despliegue

Hay **dos despliegues completamente independientes**, que nunca se pisan entre sí:

| | Producción (Firebase Hosting) | Demo pública (GitHub Pages) |
|---|---|---|
| URL | tu dominio de Firebase Hosting | https://juanixou.github.io/Calendar-Management/ |
| Datos | tu Firestore real | IndexedDB local, efímera, con datos de prueba |
| Login | sí, con tus cuentas reales | no, entra directo |
| Se actualiza con | `npm run deploy` (manual, cuando tú quieras) | `git push` a `main` (automático) |
| Config que usa | `apps/web/.env.local` + `.firebaserc` (solo en tu máquina, nunca en GitHub) | `apps/web/.env.demo` (commiteado, sin datos reales) |

## 1. Actualizar producción (tu Firebase real)

```
npm run deploy
```

- Compila en modo normal y despliega `apps/web/dist` a Firebase Hosting.
- Usa tu `apps/web/.env.local` y tu `.firebaserc` — ambos existen solo en tu máquina (están en
  `.gitignore`), así que esto no depende de GitHub para nada. Puedes desplegar a producción sin
  haber hecho `git push`, y viceversa.
- Si algún día trabajas desde otro ordenador: copia `apps/web/.env.example` → `.env.local` y
  `.firebaserc.example` → `.firebaserc`, rellena tus valores reales, y ya puedes desplegar desde ahí.

## 2. Actualizar la demo pública (GitHub Pages)

No hace falta ningún comando manual — se dispara sola con `git push` a `main`:

1. GitHub Actions detecta el push y ejecuta `.github/workflows/deploy-demo.yml`.
2. Compila con `npm run build:demo -w apps/web` (modo `demo`: usa `apps/web/.env.demo`, base de
   datos local efímera, sin login).
3. Publica `apps/web/dist` en GitHub Pages.

**Para comprobar que funcionó**: en el repo de GitHub, pestaña **Actions** → debería aparecer
"Deploy demo to GitHub Pages" en verde tras cada push.

**Paso único pendiente de verificar** (la demo todavía devuelve 404 en este momento, probablemente
por esto): en GitHub, **Settings → Pages → Source**, tiene que estar puesto en **"GitHub Actions"**
(no "Deploy from a branch"). Sin este cambio, el workflow compila pero no llega a publicarse nunca.

## Flujo del día a día

1. Desarrollas la funcionalidad en local, la pruebas con `npm run dev` (contra tu Firebase real).
2. `git add` + `git commit`.
3. ¿Quieres que tu app real ya tenga el cambio? → `npm run deploy`, cuando quieras.
4. ¿Quieres que la demo pública lo enseñe? → `git push`.

Puedes hacer 3 y 4 en cualquier orden, juntos o por separado — son independientes.

## Por qué no hay riesgo de que se crucen

- GitHub Actions (la demo) **no tiene acceso** a `apps/web/.env.local` ni a `.firebaserc`, porque
  ambos están fuera del repo. Es imposible que el workflow de la demo despliegue por error contra tu
  Firebase real, aunque quisiera.
- Tu build/deploy normal (`npm run build`, `npm run deploy`) nunca lee `apps/web/.env.demo` — solo
  se activa pasando explícitamente `--mode demo`, que ni `build` ni `deploy` usan.
