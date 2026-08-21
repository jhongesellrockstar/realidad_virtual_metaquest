import { z } from "zod";

export const roomCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z2-9]{5}$/);

export const movementSchema = z.object({
  sequence: z.number().int().nonnegative(),
  x: z.number().finite().min(-50).max(50),
  y: z.number().finite().min(-50).max(50),
});

export type MovementInput = z.infer<typeof movementSchema>;

export type PlayerState = MovementInput & {
  uid: string;
  updatedAt: number;
};

export type RoomSnapshot = {
  code: string;
  players: PlayerState[];
};

export type MatchResult = {
  completedAt: number;
  loserUid: string;
  matchId: string;
  playerUids: string[];
  roomCode: string;
  winnerPoints: number;
  winnerUid: string;
};

export type Acknowledgement =
  | { ok: true }
  | { ok: false; error: string };

export type JoinAcknowledgement =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

export interface ClientToServerEvents {
  join_room: (code: string, acknowledge: (result: JoinAcknowledgement) => void) => void;
  player_move: (movement: MovementInput, acknowledge?: (result: Acknowledgement) => void) => void;
}

export interface ServerToClientEvents {
  match_finished: (result: MatchResult) => void;
  player_joined: (player: PlayerState) => void;
  player_left: (uid: string) => void;
  player_moved: (player: PlayerState) => void;
  server_error: (message: string) => void;
}

export interface SocketData {
  displayName: string;
  idToken: string;
  roomCode?: string;
  uid: string;
}
