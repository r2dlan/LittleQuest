import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { characterFrame, drawCharacter } from "../web/characters.js";

function render(options, image = { complete: true, naturalWidth: 1254 }) {
  const calls = [];
  let depth = 0;
  const ctx = {
    save() {
      depth++;
    },
    restore() {
      depth--;
    },
    translate(x, y) {
      calls.push(["translate", x, y]);
    },
    scale(x, y) {
      calls.push(["scale", x, y]);
    },
    drawImage(_image, ...values) {
      assert.ok(values.every(Number.isInteger));
      assert.ok(values[2] > 0 && values[3] > 0);
      assert.ok(values[0] >= 0 && values[1] >= 0);
      assert.ok(values[0] + values[2] <= 1254);
      assert.ok(values[1] + values[3] <= 1254);
      calls.push(["draw", ...values]);
    },
  };
  drawCharacter(ctx, { x: 0, y: 0, ...options }, image);
  assert.equal(depth, 0);
  return calls;
}

test("B artwork uses separate directional sprites, mirrored left views and alternating feet", () => {
  const front = render({ face: "down" });
  assert.notDeepEqual(render({ face: "up" }), front);
  assert.notDeepEqual(render({ face: "right" }), front);
  assert.notDeepEqual(render({ face: "left" }), render({ face: "right" }));
  assert.notDeepEqual(render({ role: "jona" }), render({ role: "mina" }));
  assert.notDeepEqual(render({ walking: true, time: 0.12 }), front);
  assert.deepEqual(render({ walking: false, time: 100 }), front);
  assert.deepEqual(render({}, { complete: false }), []);
  for (const role of ["hero", "jona", "mina"]) {
    for (const face of ["down", "left", "right", "up"]) {
      render({ role, face, walking: true, time: 1 });
      assert.ok(characterFrame(role, face).height > 300);
    }
  }
  const png = readFileSync(
    new URL("../web/assets/characters-b.png", import.meta.url),
  );
  assert.equal(png.readUInt32BE(16), 1254);
  assert.equal(png.readUInt32BE(20), 1254);
  assert.equal(png[25], 6, "Sprites must retain a transparent RGBA background");
});
