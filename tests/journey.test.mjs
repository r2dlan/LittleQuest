import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  beachBar,
  beachLoungers,
  beachPier,
  brother,
  camelPose,
  canWalkJourney,
  fountain,
  homeForest,
  homeGardenTrees,
  JOURNEY_WORLD,
  journeyHouses,
  journeyRoute,
  ladder,
  lakeFishPose,
  landscapeAt,
  meadowLake,
  meadowWildlife,
  mountain,
  mountainEdgeY,
  moveJourney,
  normalizeJourneySave,
  pathY,
  river,
  shorelineX,
  shorelineY,
  snowCave,
  stageAt,
  stages,
  wildlifePose,
} from "../web/journey-world.js";
import { bootJourney } from "./helpers/journey-harness.mjs";

const advance = (d, seconds) => {
  for (let frame = 0; frame < seconds * 60; frame++) d.update(1 / 60);
};
test("Home has a solid western forest, an open eastern exit and a road beginning at its door", () => {
  for (const y of [100, 350, 600, 1000]) {
    assert.equal(canWalkJourney(100, y), false);
  }
  for (const x of [430, 560, 730]) {
    assert.ok(canWalkJourney(x, pathY(x) - 100));
    assert.ok(canWalkJourney(x, pathY(x) + 100));
    assert.ok(canWalkJourney(x, pathY(x)));
  }
  const p = { x: homeForest.end + 25, y: 800 };
  moveJourney(p, -400, 0);
  assert.ok(p.x - 9 >= homeForest.end);
  for (const tree of homeGardenTrees)
    assert.equal(canWalkJourney(tree.x, tree.y), false);
  const home = journeyHouses[0];
  const approach = { x: home.x + home.w / 2, y: pathY(home.x + home.w / 2) };
  const doorY = home.y + home.h + 25;
  moveJourney(approach, 0, doorY - approach.y);
  assert.ok(Math.abs(approach.y - doorY) < 0.001);
  const { d } = bootJourney();
  d.draw();
});
test("Final beach opens into eastern water while retaining the southern sea and pier", () => {
  for (const y of [100, 300, 500, 700]) {
    assert.equal(canWalkJourney(shorelineX(y) + 15, y), false);
    assert.ok(canWalkJourney(shorelineX(y) - 35, y));
  }
  const p = { x: 11060, y: pathY(11060) };
  moveJourney(p, 400, 0);
  assert.ok(p.x + 9 <= shorelineX(p.y));
  assert.equal(canWalkJourney(10800, 1000), false);
  assert.ok(canWalkJourney(beachPier.x, beachPier.end - 20));
  const { d } = bootJourney({ version: 1, x: 11060, y: pathY(11060) });
  d.draw();
});
test("Beach bar, loungers, resting brother and pier coexist with a safe return route", () => {
  assert.equal(stageAt(beachBar.x).id, "S14");
  assert.equal(
    canWalkJourney(beachBar.x + beachBar.w / 2, beachBar.y + 70),
    false,
  );
  assert.equal(beachLoungers.length, 3);
  assert.ok(beachLoungers.some((chair) => chair.brother));
  for (const chair of beachLoungers)
    assert.equal(canWalkJourney(chair.x, chair.y), false);
  const p = { x: beachPier.x, y: pathY(beachPier.x) };
  moveJourney(p, 0, beachPier.end - 20 - p.y);
  assert.ok(p.y > shorelineY(p.x) + 100);
  assert.ok(canWalkJourney(p.x, p.y));
  assert.equal(canWalkJourney(beachPier.x + beachPier.w, p.y), false);
  const restored = normalizeJourneySave({ version: 1, ...p });
  assert.equal(restored.x, p.x);
  const y = p.y;
  moveJourney(p, 100, 0);
  assert.ok(p.x <= beachPier.x + beachPier.w / 2 - 9);
  p.x = beachPier.x;
  moveJourney(p, 0, pathY(p.x) - y);
  assert.ok(Math.abs(p.y - pathY(p.x)) < 0.001);
  const roles = [],
    brothers = [];
  const { d } = bootJourney(
    { version: 1, x: brother.x, y: pathY(brother.x) },
    undefined,
    undefined,
    {
      drawCharacter: (_ctx, character) => roles.push(character.role),
      drawBeachBrother: (_ctx, pose) => brothers.push({ ...pose }),
    },
  );
  d.draw();
  assert.ok(roles.includes("beachMan"));
  assert.ok(roles.includes("beachWoman"));
  assert.equal(brothers.length, 1);
});
test("Snow town residents switch from winter coats outside to sweaters indoors", () => {
  const roles = [];
  const house = journeyHouses.find((building) => building.biome === "snowTown");
  const { d } = bootJourney(
    { version: 1, x: 5260, y: pathY(5260) },
    undefined,
    undefined,
    {
      drawCharacter: (_ctx, character) => roles.push(character.role),
    },
  );
  d.draw();
  assert.ok(roles.includes("snowManOutdoor"));
  assert.ok(roles.includes("snowWomanOutdoor"));
  assert.ok(roles.includes("hero"));
  roles.length = 0;
  Object.assign(d.p, { x: house.x + house.w / 2, y: house.y + house.h + 25 });
  d.interact();
  advance(d, 0.6);
  d.draw();
  assert.ok(roles.includes("snowManIndoor"));
  assert.ok(roles.includes("snowWomanIndoor"));
  assert.ok(!roles.includes("snowManOutdoor"));
  roles.length = 0;
  d.interact();
  advance(d, 0.6);
  d.draw();
  assert.ok(roles.includes("snowManOutdoor"));
});
test("Meadow wildlife is spread across grassy stations on clear routes and respects motion settings", () => {
  assert.deepEqual(
    new Set(meadowWildlife.map((animal) => animal.kind)),
    new Set(["rabbit", "fox", "hedgehog", "deer"]),
  );
  const visited = new Set();
  for (let index = 0; index < meadowWildlife.length; index++) {
    assert.notDeepEqual(wildlifePose(index, 0), wildlifePose(index, 10));
    for (let time = 0; time < 120; time++) {
      const pose = wildlifePose(index, time);
      visited.add(stageAt(pose.x).id);
      assert.ok(
        canWalkJourney(pose.x, pose.y),
        `${pose.kind} must stay on clear ground`,
      );
      assert.ok(Math.abs(pose.y - pathY(pose.x)) > 100);
    }
  }
  assert.deepEqual(visited, new Set(["S08", "S09", "S12", "S13"]));
  const rendered = [];
  const { d, e } = bootJourney(
    { version: 1, x: 6900, y: pathY(6900) },
    undefined,
    undefined,
    {
      drawWildlife: (_ctx, pose) => rendered.push({ ...pose }),
    },
  );
  d.draw();
  assert.ok(rendered.length >= 2);
  const first = rendered.splice(0);
  advance(d, 1);
  d.draw();
  assert.notDeepEqual(rendered, first);
  const moving = rendered.splice(0);
  e("pause").onclick();
  advance(d, 1);
  d.draw();
  assert.deepEqual(rendered, moving);
  rendered.length = 0;
  e("play").onclick();
  e("reducedMotion").checked = true;
  e("reducedMotion").onchange();
  d.draw();
  const still = rendered.splice(0);
  advance(d, 1);
  d.draw();
  assert.deepEqual(rendered, still);
  assert.ok(rendered.every((pose) => !pose.walking));
});
test("Two desert camels walk on safe routes and freeze for pause and reduced motion", () => {
  for (let index = 0; index < 2; index++) {
    assert.notDeepEqual(camelPose(index, 0), camelPose(index, 10));
    for (let time = 0; time < 180; time++) {
      const pose = camelPose(index, time);
      assert.equal(stageAt(pose.x).id, index ? "S11" : "S10");
      assert.ok(canWalkJourney(pose.x, pose.y));
      assert.ok(pose.y - pathY(pose.x) > 100);
    }
  }
  const rendered = [];
  const { d, e } = bootJourney(
    { version: 1, x: 7600, y: pathY(7600) },
    undefined,
    undefined,
    {
      drawCamel: (_ctx, pose) => rendered.push({ ...pose }),
    },
  );
  d.draw();
  assert.equal(rendered.length, 1);
  const second = camelPose(1, 0);
  const town = bootJourney(
    { version: 1, x: second.x, y: pathY(second.x) },
    undefined,
    undefined,
    {
      drawCamel: (_ctx, pose) => rendered.push({ ...pose }),
    },
  );
  town.d.draw();
  assert.equal(rendered.length, 2);
  assert.ok(Math.abs(rendered[0].x - rendered[1].x) > 800);
  rendered.pop();
  const initial = rendered.splice(0);
  advance(d, 1);
  d.draw();
  assert.notDeepEqual(rendered, initial);
  const moving = rendered.splice(0);
  e("pause").onclick();
  advance(d, 2);
  d.draw();
  assert.deepEqual(rendered, moving);
  rendered.length = 0;
  e("play").onclick();
  e("reducedMotion").checked = true;
  e("reducedMotion").onchange();
  d.draw();
  const still = rendered.splice(0);
  advance(d, 2);
  d.draw();
  assert.deepEqual(rendered, still);
  assert.ok(rendered.every((pose) => pose.walking === false));
});
test("Desert town tents retain accessible entrances, furnished rooms and safe exits", () => {
  const tents = journeyHouses.filter(
    (building) => building.biome === "desertTown",
  );
  assert.equal(tents.length, 3);
  const { d, e } = bootJourney();
  for (const tent of tents) {
    assert.equal(tent.kind, "tent");
    assert.match(tent.name, /Zelt/);
    const x = tent.x + tent.w / 2;
    const y = tent.y + tent.h + 25;
    const p = { x, y: pathY(x) };
    moveJourney(p, 0, y - p.y);
    assert.ok(Math.abs(p.y - y) < 0.001);
    Object.assign(d.p, p);
    d.update(0);
    assert.match(e("prompt").textContent, /Zelt betreten/);
    d.interact();
    advance(d, 0.6);
    assert.match(e("area").textContent, /Zelt/);
    d.draw();
    d.update(0);
    assert.match(e("prompt").textContent, /Zelt verlassen/);
    d.interact();
    advance(d, 0.6);
    assert.equal(d.getInterior(), null);
    assert.equal(d.p.x, x);
    assert.equal(d.p.y, y);
  }
});
test("Desert residents use dedicated artwork outdoors and inside tents", () => {
  const roles = [];
  const tent = journeyHouses.find((building) => building.kind === "tent");
  const { d } = bootJourney(
    { version: 1, x: 8400, y: pathY(8400) },
    undefined,
    undefined,
    {
      drawCharacter: (_ctx, character) => roles.push(character.role),
    },
  );
  d.draw();
  assert.ok(roles.includes("desertMan"));
  assert.ok(roles.includes("hero"));
  roles.length = 0;
  Object.assign(d.p, { x: tent.x + tent.w / 2, y: tent.y + tent.h + 25 });
  d.interact();
  advance(d, 0.6);
  d.draw();
  assert.ok(roles.includes("desertMan"));
  assert.ok(roles.includes("desertWoman"));
  assert.ok(roles.includes("hero"));
});
test("Desert town well sits south of the road on an accessible square", () => {
  assert.equal(stageAt(fountain.x).id, "S11");
  assert.ok(fountain.y - fountain.h / 2 > pathY(fountain.x) + 38);
  assert.ok(canWalkJourney(fountain.x, pathY(fountain.x)));
  assert.equal(canWalkJourney(fountain.x, fountain.y), false);
  for (const [dx, dy] of [
    [-60, 0],
    [60, 0],
    [0, -45],
    [0, 45],
  ])
    assert.ok(canWalkJourney(fountain.x + dx, fountain.y + dy));
  const p = { x: fountain.x, y: pathY(fountain.x) };
  moveJourney(p, 0, 200);
  assert.ok(p.y < fountain.y - fountain.h / 2);
  const { d } = bootJourney({
    version: 1,
    x: fountain.x,
    y: pathY(fountain.x),
  });
  d.draw();
});
test("Second meadow lake blocks water without obstructing the route and fish stay inside", () => {
  const lake = meadowLake;
  assert.equal(stageAt(lake.x).id, "S12");
  assert.equal(canWalkJourney(lake.x, lake.y), false);
  assert.ok(canWalkJourney(lake.x, pathY(lake.x)));
  const p = { x: lake.x - lake.rx - 25, y: lake.y };
  moveJourney(p, lake.rx * 3, 0);
  assert.ok(p.x <= lake.x - lake.rx - 9);
  for (let i = 0; i < 5; i++) {
    assert.notDeepEqual(lakeFishPose(i, 0), lakeFishPose(i, 3));
    for (let t = 0; t < 120; t++) {
      const fish = lakeFishPose(i, t);
      assert.ok(
        ((fish.x - lake.x) / lake.rx) ** 2 +
          ((fish.y - lake.y) / lake.ry) ** 2 <
          0.6,
      );
    }
  }
  const { d } = bootJourney({ version: 1, x: lake.x, y: pathY(lake.x) });
  d.draw();
});
test("Snow summit cave is reachable, enters by walking and returns safely with fade or reduced motion", () => {
  const x = snowCave.x + snowCave.w / 2;
  assert.equal(stageAt(x).id, "S06");
  for (const reducedMotion of [false, true]) {
    const { d, e, memory } = bootJourney({ version: 1, x, y: pathY(x) });
    e("reducedMotion").checked = reducedMotion;
    e("reducedMotion").onchange();
    assert.equal(canWalkJourney(x, snowCave.y + 50), false);
    d.down("up");
    advance(d, 1.6);
    assert.ok(d.getInterior());
    assert.equal(e("area").textContent, "GIPFELHÖHLE");
    d.draw();
    d.save();
    const saved = JSON.parse(memory.get("littlequest-journey-v1"));
    assert.ok(canWalkJourney(saved.x, saved.y));
    assert.equal(bootJourney(saved).d.getInterior(), null);
    Object.assign(d.p, { x: 320, y: 270 });
    d.keys.clear();
    d.down("up");
    advance(d, 1);
    assert.ok(d.p.y >= 257, "Cave boulders block movement");
    d.keys.clear();
    Object.assign(d.p, { x: 320, y: 420 });
    d.down("down");
    advance(d, 0.8);
    assert.equal(d.getInterior(), null);
    assert.equal(d.p.x, x);
    assert.ok(canWalkJourney(d.p.x, d.p.y));
  }
});
test("All fourteen stations form one traversable return route with smooth colors", () => {
  assert.equal(stages.length, 14);
  const p = { x: 238, y: pathY(238) };
  const visited = new Set();
  for (const points of [journeyRoute, journeyRoute.toReversed()]) {
    for (const target of points) {
      let attempts = 0;
      while (Math.hypot(target.x - p.x, target.y - p.y) > 0.01) {
        const distance = Math.hypot(target.x - p.x, target.y - p.y);
        moveJourney(
          p,
          ((target.x - p.x) / distance) * Math.min(4, distance),
          ((target.y - p.y) / distance) * Math.min(4, distance),
        );
        assert.ok(++attempts < 100, "The route must remain traversable");
        visited.add(stageAt(p.x).id);
      }
    }
  }
  assert.equal(visited.size, 14);
  assert.ok(canWalkJourney(ladder.x, ladder.y));
  assert.ok(canWalkJourney(brother.x, brother.y - 35));
  assert.equal(canWalkJourney(river.x + 50, 300), false);
  assert.equal(canWalkJourney(11000, 1000), false);
  const channels = (color) =>
    [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16));
  for (let x = 799; x < JOURNEY_WORLD.width - 1; x += 800) {
    for (const field of ["ground", "path"]) {
      const a = channels(landscapeAt(x)[field]),
        b = channels(landscapeAt(x + 2)[field]);
      assert.ok(a.every((value, index) => Math.abs(value - b[index]) <= 1));
    }
  }
});

test("Mountain requires the ladder, blocks shortcuts and supports descent and old positions", () => {
  const blocked = { x: mountain.start - 20, y: 250 };
  moveJourney(blocked, 600, 0);
  assert.ok(blocked.x <= mountain.start - 9);
  for (const y of [90, 250, 420, 600, 850, 1050]) {
    assert.equal(
      canWalkJourney(ladder.x + 45, y),
      y + 7 <= mountainEdgeY(ladder.x + 45),
    );
  }
  const below = { x: ladder.x - 30, y: ladder.bottom + 30 };
  moveJourney(below, 1000, 0);
  assert.ok(below.x <= ladder.x + 20);
  const { d, e } = bootJourney({ version: 1, x: ladder.x, y: ladder.bottom });
  d.down("up");
  advance(d, 3);
  assert.ok(d.p.y < ladder.top + 8);
  d.keys.clear();
  d.down("right");
  advance(d, 1);
  assert.ok(d.p.x > ladder.x + 80);
  assert.equal(e("dialog").hidden, true);
  d.keys.clear();
  Object.assign(d.p, { x: ladder.x, y: ladder.top });
  d.down("down");
  advance(d, 3);
  assert.ok(d.p.y >= ladder.bottom);
  assert.equal(canWalkJourney(d.p.x, d.p.y), true);
  const migrated = normalizeJourneySave({ version: 1, x: 3500, y: 550 });
  assert.equal(migrated.x, 3500);
  assert.equal(migrated.y, pathY(3500));
});

test("New route starts at home, preserves prototype save and saves safe exterior positions", () => {
  const old = { version: 1, accepted: true, repaired: true, x: 1900, y: 540 };
  const { d, e, memory } = bootJourney(undefined, old);
  assert.match(e("objective").textContent, /01 \/ 14/);
  assert.equal(memory.get("littlequest-v1"), JSON.stringify(old));
  for (const house of journeyHouses) {
    Object.assign(d.p, { x: house.x + house.w / 2, y: house.y + house.h + 25 });
    d.interact();
    advance(d, 0.6);
    assert.ok(d.getInterior());
    d.draw();
    d.save();
    const save = JSON.parse(memory.get("littlequest-journey-v1"));
    assert.ok(canWalkJourney(save.x, save.y));
    assert.equal(save.x, house.x + house.w / 2);
    d.interact();
    advance(d, 0.6);
    assert.equal(d.getInterior(), null);
  }
  for (let i = 0; i < 14; i++) {
    Object.assign(d.p, { x: i * 800 + 400, y: pathY(i * 800 + 400) });
    d.update(0);
    d.draw();
    assert.match(e("objective").textContent, new RegExp(stages[i].id.slice(1)));
    d.interact();
    assert.equal(e("dialog").hidden, true);
  }
  d.save();
  const restored = bootJourney(
    JSON.parse(memory.get("littlequest-journey-v1")),
  );
  assert.equal(restored.d.p.x, d.p.x);
  assert.equal(restored.d.p.y, d.p.y);
  assert.equal(normalizeJourneySave({ version: 1, x: NaN, y: 0 }).x, 238);
  assert.equal(normalizeJourneySave({ version: 1, x: 11000, y: 1000 }).x, 238);
});

test("Journey keeps keyboard, swipe, settings and pause working without quest gates", () => {
  const { d, e, events } = bootJourney();
  const start = d.p.x;
  events.keydown({
    key: "ArrowRight",
    code: "ArrowRight",
    preventDefault() {},
  });
  advance(d, 0.5);
  assert.ok(d.p.x > start);
  events.keyup({ key: "ArrowRight" });
  e("pause").onclick();
  const pausedX = d.p.x;
  advance(d, 1);
  assert.equal(d.p.x, pausedX);
  e("play").onclick();
  e("swipeZone").onpointerdown({
    pointerId: 1,
    clientX: 50,
    clientY: 250,
    preventDefault() {},
  });
  e("swipeZone").onpointermove({
    pointerId: 1,
    clientX: 110,
    clientY: 250,
    preventDefault() {},
  });
  advance(d, 0.5);
  assert.ok(d.p.x > pausedX);
  e("swipeZone").onpointerup({ pointerId: 1 });
  e("reducedMotion").checked = true;
  e("reducedMotion").onchange();
  d.draw();
});

test("Station docs support multiple stable task IDs and the active page loads the journey", () => {
  const files = readdirSync("docs/quests").filter((file) =>
    /^S\d\d-/.test(file),
  );
  assert.equal(files.length, 14);
  for (const stage of stages) {
    const file = files.find((name) => name.startsWith(stage.id));
    assert.ok(file);
    assert.match(
      readFileSync(`docs/quests/${file}`, "utf8"),
      /## Aufgabenübersicht/,
    );
  }
  const bridgeDoc = readFileSync("docs/quests/S03-wald-bruecke.md", "utf8");
  assert.match(bridgeDoc, /S03-A01/);
  assert.match(bridgeDoc, /S03-A02/);
  assert.match(
    readFileSync("web/index.html", "utf8"),
    /src="journey-game\.js"/,
  );
  const cache = readFileSync("web/sw.js", "utf8");
  assert.match(cache, /\.\/journey-game\.js/);
  assert.match(cache, /\.\/journey-world\.js/);
});
