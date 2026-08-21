import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function initializeFirebase(projectId: string): void {
  if (getApps().length === 0) {
    initializeApp({ projectId });
  }
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string }> {
  const decodedToken = await getAuth().verifyIdToken(idToken);
  return { uid: decodedToken.uid };
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
