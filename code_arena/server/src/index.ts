import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { getConfig } from "./config.js";
import {
  initializeFirebase,
  verifyFirebaseIdToken,
  verifyRoomMembership,
} from "./firebase.js";
import {
  movementSchema,
  roomCodeSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from "./protocol.js";
import { RoomManager } from "./room-manager.js";

const config = getConfig();
initializeFirebase(config.FIREBASE_PROJECT_ID);

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: config.CORS_ORIGIN }));
app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "code-arena-server" });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>(httpServer, {
  cors: { origin: config.CORS_ORIGIN, methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});
const rooms = new RoomManager();

io.use(async (socket, next) => {
  try {
    const idToken = typeof socket.handshake.auth.token === "string" ? socket.handshake.auth.token : "";
    if (!idToken) throw new Error("Falta el token de Firebase.");

    const { uid } = await verifyFirebaseIdToken(idToken);
    socket.data.idToken = idToken;
    socket.data.uid = uid;
    next();
  } catch {
    next(new Error("Sesión de Firebase inválida."));
  }
});

io.on("connection", (socket) => {
  socket.on("join_room", async (rawCode, acknowledge) => {
    try {
      const code = roomCodeSchema.parse(rawCode);
      await verifyRoomMembership(
        config.FIREBASE_PROJECT_ID,
        code,
        socket.data.uid,
        socket.data.idToken,
      );

      if (socket.data.roomCode && socket.data.roomCode !== code) {
        rooms.leave(socket.data.roomCode, socket.data.uid);
        await socket.leave(socket.data.roomCode);
      }

      const snapshot = rooms.join(code, socket.data.uid);
      socket.data.roomCode = code;
      await socket.join(code);
      socket.to(code).emit("player_joined", snapshot.players.find((player) => player.uid === socket.data.uid)!);
      acknowledge({ ok: true, snapshot });
    } catch (error) {
      acknowledge({ ok: false, error: error instanceof Error ? error.message : "No se pudo entrar a la sala." });
    }
  });

  socket.on("player_move", (rawMovement, acknowledge) => {
    try {
      const code = socket.data.roomCode;
      if (!code) throw new Error("Únete a una sala antes de moverte.");
      const movement = movementSchema.parse(rawMovement);
      const player = rooms.move(code, socket.data.uid, movement);
      socket.to(code).emit("player_moved", player);
      acknowledge?.({ ok: true });
    } catch (error) {
      acknowledge?.({ ok: false, error: error instanceof Error ? error.message : "Movimiento inválido." });
    }
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    if (code && rooms.leave(code, socket.data.uid)) {
      socket.to(code).emit("player_left", socket.data.uid);
    }
  });
});

httpServer.listen(config.PORT, () => {
  console.log(`Code Arena server listening on http://localhost:${config.PORT}`);
});
