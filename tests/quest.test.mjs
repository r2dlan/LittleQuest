import assert from "node:assert/strict";
import test from "node:test";
import {
  collectBoard,
  feedFox,
  freshState,
  normalizeSave,
  objective,
  repairBridge,
} from "../web/quest.js";

test("Complete first story including fox trade, repair and reload", () => {
  const s = freshState();
  assert.equal(collectBoard(s, 1), false);
  s.accepted = true;
  assert.equal(collectBoard(s, 1), true);
  assert.equal(collectBoard(s, 1), false);
  assert.equal(collectBoard(s, 3), false);
  assert.equal(feedFox(s), false);
  assert.equal(repairBridge(s), false);
  s.apple = true;
  assert.equal(feedFox(s), true);
  assert.equal(s.apple, false);
  assert.equal(collectBoard(s, 3), true);
  collectBoard(s, 2);
  assert.equal(repairBridge(s), true);
  const loaded = normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(loaded.repaired, true);
  assert.equal(loaded.foxFed, true);
  assert.equal(loaded.boards.length, 3);
  assert.match(objective(loaded)[0], /Brücke/);
});
test("Damaged saves cannot unlock a bridge or completion", () => {
  assert.deepEqual(normalizeSave(null), freshState());
  const s = normalizeSave({
    version: 1,
    boards: [1, 1, 99],
    repaired: true,
    finished: true,
    x: Infinity,
  });
  assert.deepEqual(s.boards, [1]);
  assert.equal(s.repaired, false);
  assert.equal(s.finished, false);
  assert.equal(s.x, 1210);
});
test("Fox trade and bridge repair cannot be repeated", () => {
  const s = freshState();
  s.accepted = true;
  s.apple = true;
  assert.equal(feedFox(s), true);
  s.apple = true;
  assert.equal(feedFox(s), false);
  s.boards = [1, 2, 3];
  assert.equal(repairBridge(s), true);
  assert.equal(repairBridge(s), false);
});
