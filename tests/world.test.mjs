import assert from "node:assert/strict";
import test from "node:test";
import { freshState } from "../web/quest.js";
import {
  boards,
  canStand,
  gears,
  move,
  places,
  switches,
  WORLD,
} from "../web/world.js";

// Flood-fill using the player's full collision footprint, not point-only tiles.
function reachable(s) {
  const _step = 16,
    queue = [[1216, 544]],
    seen = new Set(["1216,544"]);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [
      [16, 0],
      [-16, 0],
      [0, 16],
      [0, -16],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        key = `${nx},${ny}`;
      if (
        !seen.has(key) &&
        nx > 0 &&
        ny > 0 &&
        nx < WORLD.width &&
        ny < WORLD.height &&
        canStand(nx, ny, s)
      ) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return (target, r = 28) =>
    queue.some(([x, y]) => Math.hypot(x - target.x, y - target.y) < r);
}
test("Every story location is reachable; bridge, secret chamber and lake remain gated", () => {
  const s = freshState();
  let reaches = reachable(s);
  for (const t of [...boards, places.jona, places.apple, places.fox])
    assert.ok(reaches(t), JSON.stringify(t));
  assert.equal(reaches(places.mina), false);
  s.repaired = true;
  s.caveAccepted = true;
  reaches = reachable(s);
  for (const t of [
    places.mina,
    places.clue,
    places.machine,
    ...switches,
    ...gears.slice(0, 2),
  ])
    assert.ok(reaches(t, t.id ? 28 : 58), JSON.stringify(t));
  assert.equal(reaches(gears[2]), false);
  assert.equal(reaches({ x: 2800, y: 540 }), false);
  s.switches = [2, 1, 3];
  reaches = reachable(s);
  assert.ok(reaches(gears[2]));
  s.machineFixed = true;
  assert.ok(reachable(s)({ x: 2800, y: 540 }));
});
test("Large movement steps cannot tunnel through the river or gate", () => {
  const s = freshState(),
    p = { x: 1600, y: 540 };
  move(p, 600, 0, s);
  assert.ok(p.x < 1650);
  s.repaired = true;
  move(p, 900, 0, s);
  assert.ok(p.x < 2595);
});
