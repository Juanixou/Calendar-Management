# Conexión a Firebase

La app se conecta a tu propio proyecto de Firebase mediante `apps/web/.env.local` (ver
`apps/web/.env.example`). Los datos se guardan en Firestore, bajo `teachers/{tu-uid}/...`, y el
acceso requiere haber iniciado sesión. **No hay registro (sign-up) en la app** — las cuentas se
crean a mano por ti desde **Authentication → Users** en la consola de Firebase; la pantalla de
login solo sabe iniciar sesión con cuentas que ya existen.

## Estructura de datos

```
teachers/{teacherId}                      → perfil del profesor (firstName, lastName, pricePerClass)
teachers/{teacherId}/students/{id}
teachers/{teacherId}/classPackPurchases/{id}
teachers/{teacherId}/classSessions/{id}
users/{uid}                               → { role: "teacher" | "admin", email, createdAt }
```

`users/{uid}` está separado de `teachers/{uid}` a propósito: guarda solo el rol, y permite que en
el futuro una cuenta admin pueda leer/escribir la rama de datos de **otros** profesores sin tocar
nada de lo ya construido.

**Alta automática de rol**: la primera vez que alguien inicia sesión (tras crear su cuenta en
Authentication), la app crea su documento `users/{uid}` con `role: "teacher"` si no existe
todavía — no hace falta que lo crees tú a mano para cada profesor nuevo. Nadie puede auto-asignarse
`admin`: eso solo lo puede hacer otro admin (o tú, a mano en la consola la primera vez).

## 1. Reglas de Firestore

En la consola de Firebase → **Firestore Database → Reglas**, sustituye el contenido por esto y
publica:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function isAdmin() {
      return isSignedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function isOwner(teacherId) {
      return isSignedIn() && request.auth.uid == teacherId;
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());

      // First-login self-provisioning: a signed-in user may create ONLY their own role doc, and
      // only as "teacher" — never "admin". Admins can create/promote any user's doc directly.
      allow create: if isSignedIn() && (
        (request.auth.uid == userId && request.resource.data.role == 'teacher') ||
        isAdmin()
      );

      // Changing an existing role (e.g. promoting someone to admin) or deleting a user doc is
      // admin-only — a teacher can never edit their own role doc once it exists.
      allow update, delete: if isAdmin();
    }

    match /teachers/{teacherId} {
      allow read, write: if isOwner(teacherId) || isAdmin();

      match /{document=**} {
        allow read, write: if isOwner(teacherId) || isAdmin();
      }
    }
  }
}
```

Esto permite que cada profesor solo pueda leer/escribir su propia rama de datos, que se
auto-registre como `teacher` la primera vez que entra, y deja preparado que cualquier usuario
marcado como `admin` pueda acceder a las de todos — hoy no hay ninguna pantalla que use ese acceso
todavía, pero el terreno queda listo.

## 2. Crear profesores y darte el rol de administrador

**Para cada profesor nuevo**: créalo tú en **Authentication → Users → Add user** (email +
contraseña). No hace falta nada más — en cuanto inicie sesión por primera vez, su documento
`users/{uid}` con `role: "teacher"` se crea solo.

**Para darte a ti el rol de administrador** (paso manual, solo para ti):

1. Inicia sesión una vez con tu cuenta desde la app, para que se cree tu documento `users/{tu-uid}`.
2. Ve a **Authentication → Users** y copia tu **User UID**.
3. Ve a **Firestore Database → Datos → users → {tu-uid}**.
4. Cambia el campo `role` de `teacher` a `admin`. Guarda.

Sin este paso, tu cuenta sigue funcionando igual (como `teacher`) — solo importa el día que
añadamos funcionalidades exclusivas de administrador.

## Notas

- `apps/web/.env.local` contiene la configuración de tu proyecto (no son datos secretos, están
  pensados para ir en el navegador — la seguridad real la dan el login y las reglas de arriba), pero
  se mantiene fuera del repositorio (`.gitignore`) igualmente, por convención.
- `.firebaserc` (qué proyecto de Firebase usa `firebase deploy`) también se mantiene fuera del
  repositorio para no exponer el ID del proyecto en público. Cópialo a partir de
  `.firebaserc.example` y pon ahí tu propio project ID antes de hacer `npm run deploy`.
- El modo local (IndexedDB, `npm run dev:reset`) ya no lo usa la app en producción — se reutiliza
  para el modo demo (`npm run build:demo`), ver el README.
