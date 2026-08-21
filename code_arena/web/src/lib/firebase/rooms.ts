import type { User } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";

const ROOM_CODE_LENGTH = 5;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type RoomStatus = "waiting" | "ready" | "playing" | "finished";

export type Room = {
  code: string;
  createdAt: Date | null;
  hostName: string;
  hostUid: string;
  playerUids: string[];
  status: RoomStatus;
};

function createRoomCode(): string {
  const values = crypto.getRandomValues(new Uint32Array(ROOM_CODE_LENGTH));
  return Array.from(values, (value) => ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length]).join("");
}

function roomFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): Room {
  const data = snapshot.data();
  return {
    code: snapshot.id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
    hostName: typeof data.hostName === "string" ? data.hostName : "Jugador",
    hostUid: data.hostUid,
    playerUids: Array.isArray(data.playerUids) ? data.playerUids : [],
    status: data.status,
  };
}

export async function createRoom(user: User): Promise<string> {
  const db = getFirebaseDb();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = createRoomCode();
    const roomRef = doc(db, "rooms", code);
    const created = await runTransaction(db, async (transaction) => {
      const existingRoom = await transaction.get(roomRef);
      if (existingRoom.exists()) {
        return false;
      }

      transaction.set(roomRef, {
        code,
        hostName: user.displayName || user.email || "Jugador",
        hostUid: user.uid,
        playerUids: [user.uid],
        status: "waiting",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    });

    if (created) {
      return code;
    }
  }

  throw new Error("No se pudo generar un código de sala único. Inténtalo de nuevo.");
}

export async function joinRoom(user: User, rawCode: string): Promise<string> {
  const code = rawCode.trim().toUpperCase();
  if (!new RegExp(`^[A-Z2-9]{${ROOM_CODE_LENGTH}}$`).test(code)) {
    throw new Error("Ingresa un código de sala válido de 5 caracteres.");
  }

  const roomRef = doc(getFirebaseDb(), "rooms", code);
  await runTransaction(getFirebaseDb(), async (transaction) => {
    const snapshot = await transaction.get(roomRef);
    if (!snapshot.exists()) {
      throw new Error("La sala no existe o el código es incorrecto.");
    }

    const data = snapshot.data();
    const playerUids = Array.isArray(data.playerUids) ? data.playerUids : [];
    if (playerUids.includes(user.uid)) {
      return;
    }
    if (data.status !== "waiting" || playerUids.length >= 2) {
      throw new Error("La sala ya no está disponible.");
    }

    transaction.update(roomRef, {
      playerUids: [...playerUids, user.uid],
      status: "ready",
      updatedAt: serverTimestamp(),
    });
  });

  return code;
}

export function subscribeToWaitingRooms(
  onRooms: (rooms: Room[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const roomsQuery = query(
    collection(getFirebaseDb(), "rooms"),
    where("status", "==", "waiting"),
    orderBy("createdAt", "desc"),
    limit(10),
  );

  return onSnapshot(
    roomsQuery,
    (snapshot) => onRooms(snapshot.docs.map(roomFromSnapshot)),
    onError,
  );
}

export function subscribeToRoom(
  code: string,
  onRoom: (room: Room | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getFirebaseDb(), "rooms", code),
    (snapshot) => onRoom(snapshot.exists() ? roomFromSnapshot(snapshot) : null),
    onError,
  );
}
