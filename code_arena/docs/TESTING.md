# Pruebas

## Automatizadas

- Servidor: typecheck, cuatro pruebas de `RoomManager`, build y audit.
- Web: ESLint, TypeScript/Next build y audit.
- CI: repite lo anterior en Linux y construye los Dockerfiles de web y servidor.

## E2E local de dos clientes

Se probaron dos orígenes (`localhost:3000` y `localhost:3001`) para aislar la persistencia Firebase:

1. login de Player 1 y Player 2;
2. crear/unir sala;
3. cargar Unity en ambos;
4. movimiento visual en ambos sentidos;
5. rechazo explícito de token inválido;
6. salida de Player 2 visible en Player 1;
7. victoria, escritura de partida/puntajes y ranking/historial.

Las cuentas y contraseñas viven únicamente en `code_arena/.test-credentials.local.json`, ignorado por Git.

## E2E HTTPS

`npm run test:e2e:public` lee las credenciales locales, crea una sala real y valida autenticación, WebSocket TLS, movimiento bidireccional y desconexión. Requiere:

```powershell
$env:PUBLIC_SOCKET_URL='https://socket.example.com'
$env:PUBLIC_WEB_ORIGIN='https://arena.example.com'
npm run test:e2e:public
```

La ejecución temporal del 2026-08-21 pasó con sala `JMKKK` a través de túneles HTTPS públicos. Los túneles rápidos no se consideran alojamiento persistente.
