# Firebase y seguridad

Proyecto actual: `code-arena-daf7b`, plan Spark, Authentication Email/Password y Firestore Standard en `southamerica-west1`.

## Web

Copiar `web/.env.example` a `web/.env.local` y completar la configuración de la app Web Firebase. Estas variables son identificadores públicos del SDK cliente, pero el archivo local sigue sin versionarse para separar entornos.

## Servidor

Crear una cuenta de servicio con permisos mínimos para Firebase Auth y Firestore, guardar el JSON fuera del repositorio y definir `FIREBASE_SERVICE_ACCOUNT_PATH`. El patrón `firebase-adminsdk*.json` está ignorado globalmente.

En producción se recomienda montar el JSON como secreto de solo lectura en `/run/secrets/firebase-admin.json`; nunca copiarlo a la imagen Docker.

## Reglas e índices

- Reglas fuente: `firebase/firestore.rules`.
- Índices fuente: `firebase/firestore.indexes.json`.
- `users`: cada usuario solo lee/modifica su perfil.
- `rooms`: lectura autenticada; creación por anfitrión; unión limitada a un segundo miembro.
- `matches`: lectura exclusiva de participantes; escritura solo Admin.
- `scores`: lectura autenticada; escritura solo Admin.

Antes de usar un dominio definitivo, añadirlo en Firebase Console → Authentication → Settings → Authorized domains.
