import { readFile } from "node:fs/promises";
import { io } from "socket.io-client";

const socketUrl = process.env.PUBLIC_SOCKET_URL;
const webOrigin = process.env.PUBLIC_WEB_ORIGIN;
if (!socketUrl || !webOrigin) {
  throw new Error("Define PUBLIC_SOCKET_URL y PUBLIC_WEB_ORIGIN.");
}

const credentialFile = new URL("../../.test-credentials.local.json", import.meta.url);
const envFile = new URL("../.env.local", import.meta.url);
const credentials = JSON.parse(await readFile(credentialFile, "utf8"));
const env = Object.fromEntries(
  (await readFile(envFile, "utf8")).split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)),
);
const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!apiKey || !projectId) throw new Error("Falta la configuración Firebase local.");

async function signIn(account) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password, returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`Firebase Auth rechazó ${account.email}.`);
  return response.json();
}

function firestoreValue(value) {
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  throw new Error("Tipo Firestore no soportado en E2E.");
}

async function createRoom(code, player1, player2) {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rooms`;
  const now = new Date().toISOString();
  const createResponse = await fetch(`${base}?documentId=${code}`, {
    method: "POST",
    headers: { authorization: `Bearer ${player1.idToken}`, "content-type": "application/json" },
    body: JSON.stringify({ fields: {
      code: firestoreValue(code),
      hostName: firestoreValue(credentials.player1.email),
      hostUid: firestoreValue(player1.localId),
      playerUids: firestoreValue([player1.localId]),
      status: firestoreValue("waiting"),
      createdAt: { timestampValue: now },
      updatedAt: { timestampValue: now },
    } }),
  });
  if (!createResponse.ok) throw new Error(`No se pudo crear la sala pública (${createResponse.status}).`);

  const masks = ["playerUids", "status", "updatedAt"].map((field) => `updateMask.fieldPaths=${field}`).join("&");
  const joinResponse = await fetch(`${base}/${code}?${masks}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${player2.idToken}`, "content-type": "application/json" },
    body: JSON.stringify({ fields: {
      playerUids: firestoreValue([player1.localId, player2.localId]),
      status: firestoreValue("ready"),
      updatedAt: { timestampValue: new Date().toISOString() },
    } }),
  });
  if (!joinResponse.ok) throw new Error(`No se pudo unir Player 2 (${joinResponse.status}).`);
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(socketUrl, {
      auth: { token },
      extraHeaders: { Origin: webOrigin },
      reconnection: false,
      timeout: 10_000,
      transports: ["websocket"],
    });
    const timer = setTimeout(() => reject(new Error("Timeout de conexión Socket.IO pública.")), 12_000);
    socket.once("connect", () => { clearTimeout(timer); resolve(socket); });
    socket.once("connect_error", (error) => { clearTimeout(timer); reject(error); });
  });
}

function waitFor(socket, event, timeout = 10_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout esperando ${event}.`)), timeout);
    socket.once(event, (payload) => { clearTimeout(timer); resolve(payload); });
  });
}

function join(socket, code) {
  return new Promise((resolve, reject) => socket.emit("join_room", code, (result) => result.ok ? resolve(result) : reject(new Error(result.error))));
}

const [player1, player2] = await Promise.all([signIn(credentials.player1), signIn(credentials.player2)]);
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code = Array.from(crypto.getRandomValues(new Uint8Array(5)), (value) => alphabet[value % alphabet.length]).join("");
await createRoom(code, player1, player2);

const socket1 = await connect(player1.idToken);
const socket2 = await connect(player2.idToken);
try {
  await join(socket1, code);
  await join(socket2, code);

  const moveAtPlayer2 = waitFor(socket2, "player_moved");
  socket1.emit("player_move", { sequence: 1, x: 1, y: 0 });
  if ((await moveAtPlayer2).uid !== player1.localId) throw new Error("Player 2 recibió identidad incorrecta.");

  const moveAtPlayer1 = waitFor(socket1, "player_moved");
  socket2.emit("player_move", { sequence: 1, x: -1, y: 0 });
  if ((await moveAtPlayer1).uid !== player2.localId) throw new Error("Player 1 recibió identidad incorrecta.");

  const playerLeft = waitFor(socket1, "player_left");
  socket2.disconnect();
  if ((await playerLeft) !== player2.localId) throw new Error("Desconexión pública incorrecta.");

  console.log(JSON.stringify({ code, firebaseAuth: "pass", httpsWebSocket: "pass", movementBothWays: "pass", disconnect: "pass" }));
} finally {
  socket1.disconnect();
  socket2.disconnect();
}
