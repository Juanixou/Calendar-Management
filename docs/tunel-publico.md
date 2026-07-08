# Compartir la app con una URL pública temporal

Para enseñar la app fuera de tu red local (por ejemplo, desde el móvil sin estar en la
misma WiFi, o para que alguien la vea desde otro sitio), usa un túnel de Cloudflare.

**No tiene contraseña**: mientras el túnel esté abierto, cualquiera con el enlace puede
ver y editar los alumnos y las clases. Ciérralo cuando termines.

## Necesitas dos terminales abiertas a la vez

**Terminal 1 — arranca la app:**

```
cd ruta/a/tu/copia/del/proyecto
npm run dev
```

Espera a ver `Local: http://localhost:5173/`.

**Terminal 2 — arranca el túnel:**

Descarga `cloudflared` desde https://github.com/cloudflare/cloudflared/releases (o instálalo con tu
gestor de paquetes) y ejecútalo apuntando al servidor local:

```
cloudflared tunnel --url http://localhost:5173
```

Espera unos segundos hasta ver un recuadro como este:

```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://algo-random-aqui.trycloudflare.com
```

Esa URL cambia cada vez que lanzas el comando — es la que puedes compartir mientras
ambas terminales sigan abiertas.

## Para parar

`Ctrl+C` en cada una de las dos terminales.

## Nota técnica

`apps/web/vite.config.ts` tiene `server.allowedHosts: [".trycloudflare.com"]`. Sin esto,
Vite bloquea con un 403 cualquier petición que no venga de `localhost` (protección contra
DNS rebinding), así que el túnel no funcionaría.
