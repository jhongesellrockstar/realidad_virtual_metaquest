import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RoomManager } from "./room-manager.js";

describe("RoomManager", () => {
  it("admits at most two unique players", () => {
    const rooms = new RoomManager();
    rooms.join("ABCDE", "one", 1000);
    rooms.join("ABCDE", "two", 1000);
    assert.throws(() => rooms.join("ABCDE", "three", 1000), /dos jugadores/);
    assert.equal(rooms.snapshot("ABCDE").players.length, 2);
  });

  it("rejects stale and impossible movements", () => {
    const rooms = new RoomManager();
    rooms.join("ABCDE", "one", 1000);
    assert.throws(() => rooms.move("ABCDE", "one", { x: 1, y: 0, sequence: 0 }, 1100), /fuera de orden/);
    assert.throws(() => rooms.move("ABCDE", "one", { x: 50, y: 0, sequence: 1 }, 1100), /velocidad inválida/);

    const accepted = rooms.move("ABCDE", "one", { x: 2, y: 0, sequence: 1 }, 1100);
    assert.equal(accepted.x, 2);
  });

  it("removes empty rooms", () => {
    const rooms = new RoomManager();
    rooms.join("ABCDE", "one");
    assert.equal(rooms.leave("ABCDE", "one"), true);
    assert.deepEqual(rooms.snapshot("ABCDE").players, []);
  });

  it("finishes a two-player match when a player reaches the goal", () => {
    const rooms = new RoomManager();
    rooms.join("ABCDE", "one", 1000);
    rooms.join("ABCDE", "two", 1000);
    rooms.move("ABCDE", "one", { x: 8, y: 0, sequence: 1 }, 2000);

    const result = rooms.finishIfGoalReached("ABCDE", "one", 2000);
    assert.equal(result?.winnerUid, "one");
    assert.equal(result?.loserUid, "two");
    assert.equal(result?.winnerPoints, 3);
    assert.equal(rooms.finishIfGoalReached("ABCDE", "one", 2100), null);
  });
});
