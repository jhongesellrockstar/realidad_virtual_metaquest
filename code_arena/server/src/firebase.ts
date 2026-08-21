import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import type { MatchResult } from "./protocol.js";

export function initializeFirebase(
  projectId: string,
  serviceAccountPath?: string,
  serviceAccountBase64?: string,
): void {
  if (getApps().length === 0) {
    if (serviceAccountPath || serviceAccountBase64) {
      const serviceAccountJson = serviceAccountPath
        ? readFileSync(serviceAccountPath, "utf8")
        : Buffer.from(serviceAccountBase64!, "base64").toString("utf8");
      const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
      initializeApp({ credential: cert(serviceAccount), projectId });
      return;
    }
    initializeApp({ projectId });
  }
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ displayName: string; uid: string }> {
  const decodedToken = await getAuth().verifyIdToken(idToken);
  return {
    displayName: decodedToken.name || decodedToken.email || "Jugador",
    uid: decodedToken.uid,
  };
}

export async function persistMatchResult(
  result: MatchResult,
  displayNames: Map<string, string>,
): Promise<void> {
  const db = getFirestore();
  const matchRef = db.collection("matches").doc(result.matchId);
  const roomRef = db.collection("rooms").doc(result.roomCode);

  await db.runTransaction(async (transaction) => {
    const existingMatch = await transaction.get(matchRef);
    if (existingMatch.exists) return;

    transaction.create(matchRef, {
      completedAt: Timestamp.fromMillis(result.completedAt),
      loserUid: result.loserUid,
      playerNames: Object.fromEntries(
        result.playerUids.map((uid) => [uid, displayNames.get(uid) || "Jugador"]),
      ),
      playerUids: result.playerUids,
      roomCode: result.roomCode,
      scores: { [result.winnerUid]: result.winnerPoints, [result.loserUid]: 0 },
      winnerUid: result.winnerUid,
    });

    for (const uid of result.playerUids) {
      const won = uid === result.winnerUid;
      const scoreRef = db.collection("scores").doc(uid);
      transaction.set(scoreRef, {
        displayName: displayNames.get(uid) || "Jugador",
        losses: FieldValue.increment(won ? 0 : 1),
        matchesPlayed: FieldValue.increment(1),
        points: FieldValue.increment(won ? result.winnerPoints : 0),
        uid,
        updatedAt: FieldValue.serverTimestamp(),
        wins: FieldValue.increment(won ? 1 : 0),
      }, { merge: true });
    }

    transaction.update(roomRef, {
      matchId: result.matchId,
      status: "finished",
      updatedAt: FieldValue.serverTimestamp(),
      winnerUid: result.winnerUid,
    });
  });
}

type FirestoreValue = {
  arrayValue?: { values?: FirestoreValue[] };
  stringValue?: string;
};

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>;
};

export async function verifyRoomMembership(
  projectId: string,
  roomCode: string,
  uid: string,
  idToken: string,
): Promise<void> {
  const endpoint = new URL(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/rooms/${roomCode}`,
  );
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${idToken}` },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(response.status === 404 ? "La sala no existe." : "No se pudo validar la sala.");
  }

  const document = (await response.json()) as FirestoreDocument;
  const playerUids = document.fields?.playerUids?.arrayValue?.values
    ?.map((value) => value.stringValue)
    .filter((value): value is string => Boolean(value)) ?? [];

  if (!playerUids.includes(uid)) {
    throw new Error("El usuario no pertenece a la sala.");
  }
}
