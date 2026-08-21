import type { MovementInput, PlayerState, RoomSnapshot } from "./protocol.js";

const MAX_PLAYERS = 2;
const MAX_SPEED_UNITS_PER_SECOND = 12;
const MOVEMENT_TOLERANCE = 1.5;

export class RoomManager {
  private readonly rooms = new Map<string, Map<string, PlayerState>>();

  join(code: string, uid: string, now = Date.now()): RoomSnapshot {
    const players = this.rooms.get(code) ?? new Map<string, PlayerState>();
    const existingPlayer = players.get(uid);
    if (!existingPlayer && players.size >= MAX_PLAYERS) {
      throw new Error("La sala ya tiene dos jugadores conectados.");
    }

    if (!existingPlayer) {
      players.set(uid, { uid, x: 0, y: 0, sequence: 0, updatedAt: now });
      this.rooms.set(code, players);
    }

    return this.snapshot(code);
  }

  move(code: string, uid: string, movement: MovementInput, now = Date.now()): PlayerState {
    const player = this.rooms.get(code)?.get(uid);
    if (!player) {
      throw new Error("Únete a una sala antes de moverte.");
    }
    if (movement.sequence <= player.sequence) {
      throw new Error("Movimiento fuera de orden.");
    }

    const elapsedSeconds = Math.max((now - player.updatedAt) / 1000, 1 / 60);
    const distance = Math.hypot(movement.x - player.x, movement.y - player.y);
    const allowedDistance = MAX_SPEED_UNITS_PER_SECOND * elapsedSeconds + MOVEMENT_TOLERANCE;
    if (distance > allowedDistance) {
      throw new Error("Movimiento rechazado por velocidad inválida.");
    }

    const nextPlayer = { ...movement, uid, updatedAt: now };
    this.rooms.get(code)?.set(uid, nextPlayer);
    return nextPlayer;
  }

  leave(code: string, uid: string): boolean {
    const players = this.rooms.get(code);
    if (!players) return false;

    const removed = players.delete(uid);
    if (players.size === 0) this.rooms.delete(code);
    return removed;
  }

  snapshot(code: string): RoomSnapshot {
    return { code, players: Array.from(this.rooms.get(code)?.values() ?? []) };
  }
}
