# Despliegue Docker, Nginx y HTTPS

## Requisitos externos

- VPS Linux con IP pública, puertos 80/443 y Docker Engine + Compose.
- Dominio/subdominio con registro `A` hacia la IP.
- JSON Firebase Admin almacenado solo en el servidor.

## Preparación

En `code_arena/deployment`, copiar `.env.example` a `.env` y completar los valores. Para producción:

```dotenv
DOMAIN=arena.example.com
FIREBASE_SERVICE_ACCOUNT_FILE=/opt/code-arena/secrets/firebase-admin.json
NEXT_PUBLIC_MULTIPLAYER_URL=https://arena.example.com
```

El valor de `NEXT_PUBLIC_MULTIPLAYER_URL` se integra en el bundle durante el build; cambiarlo exige reconstruir la imagen web. Añadir el dominio a Firebase Authorized domains.

## Primer arranque HTTP

```bash
cd code_arena/deployment
docker compose --env-file .env up -d --build
curl -f http://arena.example.com/
curl -f http://arena.example.com/health/socket
```

## Certificado

Instalar Certbot en el host, detener temporalmente el proxy y emitir un certificado con nombre estable:

```bash
docker compose down
sudo certbot certonly --standalone --cert-name code-arena -d arena.example.com
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

La configuración HTTPS redirige HTTP, admite TLS 1.2/1.3, HSTS, assets WASM y `Upgrade` de WebSocket. Los certificados se montan desde `/etc/letsencrypt` en modo lectura.

## Operación

```bash
docker compose ps
docker compose logs -f --tail=200 web server nginx
curl -f https://arena.example.com/
curl -f https://arena.example.com/health/socket
```

Todos los servicios usan `restart: unless-stopped` y healthchecks. Para desplegar una revisión: `git pull --ff-only` y repetir `docker compose ... up -d --build`.

## CI/CD

`.github/workflows/ci.yml` valida código e imágenes en cada push. El despliegue automático a una VPS debe añadirse solo después de registrar `VPS_HOST`, `VPS_USER` y una clave SSH en GitHub Secrets; ningún secreto debe aparecer en YAML.
