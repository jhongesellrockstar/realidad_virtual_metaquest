import type { User } from "firebase/auth";
import { io, type Socket } from "socket.io-client";

export type PlayerState = {
  sequence: number;
  uid: string;
  updatedAt: number;
  x: number;
  y: number;
};

type RoomSnapshot = { code: string; players: PlayerState[] };
type JoinResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };
type MoveResult = { ok: true } | { ok: false; error: string };
export type MatchResult = {
  completedAt: number;
  loserUid: string;
  matchId: string;
  playerUids: string[];
  roomCode: string;
  winnerPoints: number;
  winnerUid: string;
};

interface ServerEvents {
  match_finished: (result: MatchResult) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (uid: string) => void;
  player_moved: (player: PlayerState) => void;
  server_error: (message: string) => void;
}

interface ClientEvents {
  join_room: (code: string, acknowledge: (result: JoinResult) => void) => void;
  player_move: (movement: Omit<PlayerState, "uid" | "updatedAt">, acknowledge?: (result: MoveResult) => void) => void;
}

export type MultiplayerSocket = Socket<ServerEvents, ClientEvents>;

export async function createMultiplayerSocket(user: User): Promise<MultiplayerSocket> {
  const token = await user.getIdToken();
  return io(process.env.NEXT_PUBLIC_MULTIPLAYER_URL || "http://localhost:4000", {
    auth: { token },
    autoConnect: false,
    transports: ["websocket"],
  });
}
