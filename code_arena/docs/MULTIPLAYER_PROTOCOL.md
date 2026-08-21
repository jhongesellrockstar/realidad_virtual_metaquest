# Protocolo multijugador

## Conexión

El cliente abre Socket.IO con `auth.token = Firebase ID Token`. El middleware Admin verifica el token y fija `socket.data.uid`. `join_room(code)` valida además que ese UID figure en `rooms/{code}`.

## Eventos cliente → servidor

- `join_room(code, ack)`: código `[A-Z2-9]{5}`; devuelve snapshot actual.
- `player_move({x,y,sequence}, ack)`: coordenadas finitas entre -50 y 50 y secuencia creciente.

## Eventos servidor → cliente

- `player_joined(PlayerState)`
- `player_moved(PlayerState)`
- `player_left(uid)`
- `match_finished(MatchResult)`
- `server_error(message)`

`PlayerState` contiene `uid`, `x`, `y`, `sequence` y `updatedAt`. El servidor rechaza paquetes antiguos y distancias incompatibles con 12 unidades/segundo más tolerancia de red.

## Puente Unity

Unity publica mensajes `{source: "code-arena-unity", type: "player_move"}` al padre. Next.js publica al iframe mensajes `{source: "code-arena-web", type: "local_uid|remote_state|remote_left"}`. La `.jslib` encapsula la frontera WebGL y `MultiplayerBridge.cs` actualiza la escena.
