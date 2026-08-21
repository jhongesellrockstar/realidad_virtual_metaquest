# Arquitectura

## Responsabilidades

- Next.js controla autenticación, navegación privada, salas Firestore, estado de conexión y resultados.
- Unity WebGL solo representa la arena, lee teclado, publica posiciones locales y dibuja jugadores remotos.
- El puente web traduce `postMessage` de Unity a eventos Socket.IO tipados y viceversa.
- El servidor obtiene la identidad exclusivamente del ID Token verificado; nunca confía en un UID declarado por el cliente.
- Firestore persiste perfiles, salas, partidas y acumulados. El movimiento de alta frecuencia permanece fuera de Firestore.

## Modelo persistente

- `users/{uid}`: perfil básico privado.
- `rooms/{code}`: anfitrión, miembros, estado, partida y ganador.
- `matches/{matchId}`: sala, jugadores, nombres, ganador, puntajes y fecha.
- `scores/{uid}`: puntos, victorias, derrotas y partidas jugadas.

El cliente puede crear una sala o efectuar la única transición `waiting → ready`. Solo Firebase Admin escribe partidas, puntajes y el cierre de sala.

## Decisiones

- Socket.IO aporta reconexión, acknowledgements y fallback de transporte sin convertir Firestore en servidor de movimiento.
- La meta se valida en servidor (`x >= 8`) y requiere exactamente dos jugadores conectados.
- El resultado usa un ID determinista por sala/instante y una transacción Firestore para evitar dobles incrementos.
- Next.js se compila como `standalone` para una imagen de ejecución pequeña; Unity se copia como asset público una sola vez.
