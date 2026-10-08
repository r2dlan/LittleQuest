import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { drawBeachBrother } from "../web/beach.js";
import { drawCamel } from "../web/camels.js";
import { characterFrame, drawCharacter } from "../web/characters.js";
import { drawWildlife } from "../web/wildlife.js";

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
      assert.ok(values[0] + values[2] <= image.naturalWidth);
      assert.ok(values[1] + values[3] <= (image.naturalHeight ?? 1254));
      calls.push(["draw", ...values]);
    },
  };
  drawCharacter(ctx, { x: 0, y: 0, ...options }, image);
  assert.equal(depth, 0);
  return calls;
}
test("Four wildlife sprites retain whole bodies, animate and mirror within their transparent atlas", () => {
  const png = readFileSync(
    new URL("../web/assets/wildlife.png", import.meta.url),
  );
  const image = {
    complete: true,
    naturalWidth: png.readUInt32BE(16),
    naturalHeight: png.readUInt32BE(20),
  };
  assert.equal(png[25], 6);
  const renderAnimal = (kind, options) => {
    const calls = [];
    const ctx = {
      save() {},
      restore() {},
      translate: (...values) => calls.push(["translate", ...values]),
      scale: (...values) => calls.push(["scale", ...values]),
      drawImage: (_image, sx, sy, sw, sh, _dx, _dy, width, height) => {
        assert.ok(
          sx >= 0 &&
            sy >= 0 &&
            sx + sw <= image.naturalWidth &&
            sy + sh <= image.naturalHeight,
        );
        assert.ok(width >= 20 && height >= 15 && height < 65);
        calls.push(["draw", sx, sy, sw, sh]);
      },
    };
    drawWildlife(ctx, { kind, x: 0, y: 0, ...options }, image);
    return calls;
  };
  for (const kind of ["rabbit", "fox", "hedgehog", "deer"]) {
    assert.notDeepEqual(
      renderAnimal(kind, { time: 0 }),
      renderAnimal(kind, { time: 0.2 }),
    );
    assert.notDeepEqual(
      renderAnimal(kind, { facing: 1 }),
      renderAnimal(kind, { facing: -1 }),
    );
    assert.deepEqual(
      renderAnimal(kind, { walking: false, time: 0 }),
      renderAnimal(kind, { walking: false, time: 0.2 }),
    );
  }
});
test("Camel sprites change walking frames and mirror safely within the transparent atlas", () => {
  const png = readFileSync(
    new URL("../web/assets/camels.png", import.meta.url),
  );
  const image = {
    complete: true,
    naturalWidth: png.readUInt32BE(16),
    naturalHeight: png.readUInt32BE(20),
  };
  assert.equal(png[25], 6);
  const renderCamel = (options) => {
    const calls = [];
    const ctx = {
      save() {},
      restore() {},
      translate() {},
      scale: (...values) => calls.push(["scale", ...values]),
      drawImage: (_image, sx, sy, sw, sh) => {
        assert.ok(
          sx >= 0 &&
            sy >= 0 &&
            sx + sw <= image.naturalWidth &&
            sy + sh <= image.naturalHeight,
        );
        calls.push(["draw", sx, sy, sw, sh]);
      },
    };
    drawCamel(ctx, { x: 0, y: 0, ...options }, image);
    return calls;
  };
  assert.notDeepEqual(renderCamel({ time: 0 }), renderCamel({ time: 0.2 }));
  assert.notDeepEqual(renderCamel({ facing: 1 }), renderCamel({ facing: -1 }));
  assert.deepEqual(
    renderCamel({ walking: false, time: 0 }),
    renderCamel({ walking: false, time: 0.2 }),
  );
});

test("B artwork uses separate directional sprites, mirrored left views and alternating feet", () => {
  const front = render({ face: "down" });
  assert.notDeepEqual(render({ face: "up" }), front);
  assert.notDeepEqual(render({ face: "right" }), front);
  assert.notDeepEqual(render({ face: "left" }), render({ face: "right" }));
  assert.notDeepEqual(render({ role: "jona" }), render({ role: "mina" }));
  assert.notDeepEqual(render({ walking: true, time: 0.12 }), front);
  assert.deepEqual(render({ walking: false, time: 100 }), front);
  assert.deepEqual(render({}, { complete: false }), []);
  for (const role of ["hero", "jona", "mina", "desertMan", "desertWoman"]) {
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
  const desert = readFileSync(
    new URL("../web/assets/characters-desert.png", import.meta.url),
  );
  assert.equal(desert.readUInt32BE(16), 1254);
  assert.equal(desert.readUInt32BE(20), 1254);
  assert.equal(desert[25], 6);
  const desertCalls = render({ role: "desertMan" });
  const desertDraw = desertCalls.find(([kind]) => kind === "draw");
  assert.ok(
    desertDraw[8] >= 50 && desertDraw[8] <= 62,
    "Desert sprites must match existing figure height",
  );
  const snow = readFileSync(
    new URL("../web/assets/characters-snow.png", import.meta.url),
  );
  assert.equal(snow[25], 6);
  const snowImage = {
    complete: true,
    naturalWidth: snow.readUInt32BE(16),
    naturalHeight: snow.readUInt32BE(20),
  };
  for (const role of [
    "snowManOutdoor",
    "snowWomanOutdoor",
    "snowManIndoor",
    "snowWomanIndoor",
  ]) {
    for (const face of ["down", "up", "left", "right"])
      for (const walking of [false, true])
        render({ role, face, walking, time: 0.2 }, snowImage);
  }
  assert.notDeepEqual(
    characterFrame("snowManIndoor"),
    characterFrame("snowManOutdoor"),
  );
  assert.notDeepEqual(
    characterFrame("snowWomanIndoor"),
    characterFrame("snowWomanOutdoor"),
  );
  const beach = readFileSync(
    new URL("../web/assets/characters-beach.png", import.meta.url),
  );
  assert.equal(beach[25], 6);
  const beachImage = {
    complete: true,
    naturalWidth: beach.readUInt32BE(16),
    naturalHeight: beach.readUInt32BE(20),
  };
  for (const role of ["beachMan", "beachWoman"])
    for (const face of ["down", "up", "left", "right"])
      render({ role, face, walking: true, time: 0.2 }, beachImage);
  const brother = readFileSync(
    new URL("../web/assets/brother-beach.png", import.meta.url),
  );
  assert.equal(brother[25], 6);
  let drawn = false;
  drawBeachBrother(
    {
      save() {},
      restore() {},
      drawImage(_image, x, y, w, h) {
        assert.ok([x, y, w, h].every(Number.isInteger));
        assert.equal(w, 118);
        assert.ok(h > 40 && h < 100);
        drawn = true;
      },
    },
    { x: 0, y: 0 },
    {
      complete: true,
      naturalWidth: brother.readUInt32BE(16),
      naturalHeight: brother.readUInt32BE(20),
    },
  );
  assert.equal(drawn, true);
});
