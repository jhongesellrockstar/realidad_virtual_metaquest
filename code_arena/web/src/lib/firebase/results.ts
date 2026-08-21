import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";

export type RankedScore = {
  displayName: string;
  losses: number;
  matchesPlayed: number;
  points: number;
  uid: string;
  wins: number;
};

export type MatchHistoryItem = {
  completedAt: Date | null;
  id: string;
  playerNames: Record<string, string>;
  roomCode: string;
  winnerUid: string;
};

function numberField(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function scoreFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): RankedScore {
  const data = snapshot.data();
  return {
    displayName: typeof data.displayName === "string" ? data.displayName : "Jugador",
    losses: numberField(data.losses),
    matchesPlayed: numberField(data.matchesPlayed),
    points: numberField(data.points),
    uid: snapshot.id,
    wins: numberField(data.wins),
  };
}

function matchFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): MatchHistoryItem {
  const data = snapshot.data();
  return {
    completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : null,
    id: snapshot.id,
    playerNames: data.playerNames && typeof data.playerNames === "object" ? data.playerNames : {},
    roomCode: typeof data.roomCode === "string" ? data.roomCode : "-----",
    winnerUid: typeof data.winnerUid === "string" ? data.winnerUid : "",
  };
}

export function subscribeToRanking(
  onScores: (scores: RankedScore[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const rankingQuery = query(
    collection(getFirebaseDb(), "scores"),
    orderBy("points", "desc"),
    orderBy("updatedAt", "asc"),
    limit(25),
  );
  return onSnapshot(rankingQuery, (snapshot) => onScores(snapshot.docs.map(scoreFromSnapshot)), onError);
}

export function subscribeToMatchHistory(
  uid: string,
  onMatches: (matches: MatchHistoryItem[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const historyQuery = query(
    collection(getFirebaseDb(), "matches"),
    where("playerUids", "array-contains", uid),
    limit(20),
  );
  return onSnapshot(historyQuery, (snapshot) => {
    const matches = snapshot.docs.map(matchFromSnapshot).sort(
      (left, right) => (right.completedAt?.getTime() ?? 0) - (left.completedAt?.getTime() ?? 0),
    );
    onMatches(matches);
  }, onError);
}
