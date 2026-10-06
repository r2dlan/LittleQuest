import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import * as quest from "../web/quest.js";
import * as settingsModule from "../web/settings.js";
import * as swipe from "../web/swipe.js";
import * as world from "../web/world.js";

function boot(saved, savedSettings) {
  const elements = new Map(),
    events = {},
    memory = new Map(saved ? [["littlequest-v1", JSON.stringify(saved)]] : []);
  if (savedSettings)
    memory.set("littlequest-settings-v1", JSON.stringify(savedSettings));
  const context = new Proxy(
    { createLinearGradient: () => ({ addColorStop() {} }) },
    { get: (o, k) => o[k] ?? (() => {}) },
  );
  const element = (id) => {
    if (!elements.has(id))
      elements.set(id, {
        textContent: "",
        style: {},
        setPointerCapture() {},
        hidden: id === "dialog" || id.endsWith("Panel"),
        classList: { add() {}, remove() {} },
        getContext: () => context,
      });
    return elements.get(id);
  };
  const sandbox = {
    ...quest,
    ...world,
    ...swipe,
    ...settingsModule,
    document: {
      body: { classList: { add() {}, remove() {} } },
      getElementById: element,
      querySelectorAll: () => [],
      addEventListener: (k, f) => (events[k] = f),
    },
    innerWidth: 960,
    innerHeight: 540,
    addEventListener: (k, f) => (events[k] = f),
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    localStorage: {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, v),
    },
    navigator: {},
    location: { protocol: "http:" },
    confirm: () => true,
    console,
  };
  vm.createContext(sandbox);
  const source = readFileSync(
    new URL("../web/game.js", import.meta.url),
    "utf8",
  ).replace(/^import[\s\S]*?;\s*/gm, "");
  vm.runInContext(
    `${source}\nglobalThis.driver={p,getState:()=>s,update,interact,save,down,keys,draw};`,
    sandbox,
  );
  element("play").onclick();
  return {
    d: sandbox.driver,
    e: element,
    memory,
    events,
    document: sandbox.document,
  };
}
const advance = (d, seconds) => {
  for (let i = 0; i < seconds * 60; i++) d.update(1 / 60);
};
test("Top-down quest integration: both stories, interactions and saved ending", () => {
  const { d, e, memory } = boot();
  Object.assign(d.p, { x: 1230, y: 540 });
  d.interact();
  assert.equal(e("dialog").hidden, false);
  e("dialogNext").onclick();
  assert.equal(d.getState().accepted, true);
  for (const item of world.boards.slice(0, 2)) {
    Object.assign(d.p, item);
    advance(d, 0.1);
  }
  assert.equal(d.getState().boards.length, 2);
  Object.assign(d.p, { x: 425, y: 665 });
  d.interact();
  assert.equal(d.getState().apple, true);
  Object.assign(d.p, { x: 225, y: 315 });
  d.interact();
  e("dialogNext").onclick();
  assert.equal(d.getState().foxFed, true);
  Object.assign(d.p, { x: 245, y: 315 });
  advance(d, 0.1);
  Object.assign(d.p, { x: 1230, y: 540 });
  d.interact();
  e("dialogNext").onclick();
  assert.equal(d.getState().repaired, true);
  Object.assign(d.p, { x: 1880, y: 540 });
  advance(d, 0.1);
  e("dialogNext").onclick();
  Object.assign(d.p, { x: 1900, y: 540 });
  d.interact();
  e("dialogNext").onclick();
  assert.equal(d.getState().caveAccepted, true);
  for (const item of world.gears.slice(0, 2)) {
    Object.assign(d.p, item);
    advance(d, 0.1);
  }
  Object.assign(d.p, { x: 2190, y: 510 });
  d.interact();
  assert.equal(d.getState().switches.length, 0);
  for (const x of [2290, 2190, 2390]) {
    Object.assign(d.p, { x, y: 510 });
    d.interact();
  }
  assert.equal(d.getState().switches.length, 3);
  Object.assign(d.p, world.gears[2]);
  advance(d, 0.1);
  Object.assign(d.p, { x: 2510, y: 582 });
  d.interact();
  e("dialogNext").onclick();
  assert.equal(d.getState().machineFixed, true);
  Object.assign(d.p, { x: 2690, y: 540 });
  d.down("right");
  advance(d, 1);
  d.keys.clear();
  assert.equal(d.getState().lakeReached, true);
  const restored = boot(JSON.parse(memory.get("littlequest-v1")));
  assert.equal(restored.d.getState().lakeReached, true);
  assert.equal(restored.d.p.y, 540);
  d.draw();
});
test("Four directions, equal diagonal speed and solid house collision", () => {
  const { d } = boot();
  Object.assign(d.p, { x: 1300, y: 600 });
  d.down("up");
  advance(d, 0.4);
  d.keys.clear();
  assert.ok(d.p.y < 600);
  const start = { ...d.p };
  d.down("down");
  d.down("right");
  advance(d, 0.4);
  d.keys.clear();
  assert.ok(Math.abs(Math.hypot(d.p.x - start.x, d.p.y - start.y) - 50) < 3);
  Object.assign(d.p, { x: 1080, y: 430 });
  d.down("up");
  advance(d, 1);
  d.keys.clear();
  assert.ok(d.p.y >= 402);
});
test("Side-view save migration retains quest progress and chooses a valid new position", () => {
  const old = {
    version: 1,
    accepted: true,
    boards: [1, 2, 3],
    repaired: true,
    finished: true,
    caveAccepted: true,
    gears: [1],
    switches: [2],
    x: 4050,
  };
  const { d } = boot(old);
  assert.equal(d.getState().gears[0], 1);
  assert.equal(d.p.x, 1980);
  assert.equal(d.p.y, 580);
  assert.ok(world.canStand(d.p.x, d.p.y, d.getState()));
  assert.equal(d.getState().viewVersion, 2);
});

test("Left swipe moves, releasing or losing capture stops, pause clears touch", () => {
  const { d, e } = boot();
  Object.assign(d.p, { x: 1300, y: 600 });
  const event = (id, x, y) => ({
    pointerId: id,
    clientX: x,
    clientY: y,
    preventDefault() {},
  });
  const zone = e("swipeZone");
  zone.onpointerdown(event(1, 100, 200));
  zone.onpointermove(event(1, 135, 200));
  advance(d, 0.4);
  assert.ok(d.p.x > 1340);
  zone.onpointerup(event(1, 135, 200));
  const x = d.p.x;
  advance(d, 0.4);
  assert.equal(d.p.x, x);
  zone.onpointerdown(event(2, 100, 200));
  zone.onpointermove(event(2, 100, 160));
  advance(d, 0.2);
  assert.ok(d.p.y < 600);
  zone.onlostpointercapture(event(2, 100, 160));
  const y = d.p.y;
  advance(d, 0.2);
  assert.equal(d.p.y, y);
  zone.onpointerdown(event(3, 100, 200));
  zone.onpointermove(event(3, 60, 200));
  e("pause").onclick();
  e("play").onclick();
  const endX = d.p.x;
  advance(d, 0.2);
  assert.equal(d.p.x, endX);
});

test("Backgrounding saves position and progress and requires explicit resume", () => {
  const { d, e, memory, events, document } = boot();
  Object.assign(d.p, { x: 1300, y: 600 });
  d.getState().accepted = true;
  d.down("right");
  advance(d, 0.2);
  document.hidden = true;
  events.visibilitychange();
  const stopped = d.p.x;
  advance(d, 0.5);
  assert.equal(d.p.x, stopped);
  assert.equal(e("menu").hidden, false);
  const save = JSON.parse(memory.get("littlequest-v1"));
  assert.equal(save.accepted, true);
  assert.equal(save.x, stopped);
  document.hidden = false;
  advance(d, 0.3);
  assert.equal(d.p.x, stopped);
  e("play").onclick();
  advance(d, 0.3);
  assert.equal(d.p.x, stopped);
  const restored = boot(save);
  assert.equal(restored.d.p.x, stopped);
  assert.equal(restored.d.getState().accepted, true);
});

test("Settings survive restart, reset preserves settings, panels pause movement", () => {
  const { d, e, memory } = boot();
  Object.assign(d.p, { x: 1300, y: 600 });
  e("pause").onclick();
  e("settingsOpen").onclick();
  assert.equal(e("settingsPanel").hidden, false);
  e("largeText").checked = true;
  e("largeText").onchange();
  e("reducedMotion").checked = true;
  e("reducedMotion").onchange();
  d.down("right");
  advance(d, 0.5);
  assert.equal(d.p.x, 1300);
  e("settingsClose").onclick();
  assert.equal(e("settingsPanel").hidden, true);
  e("reset").onclick();
  const stored = JSON.parse(memory.get("littlequest-settings-v1"));
  assert.equal(stored.largeText, true);
  const restored = boot(null, stored);
  assert.equal(restored.e("largeText").checked, true);
  assert.equal(restored.e("reducedMotion").checked, true);
  assert.deepEqual(
    settingsModule.normalizeSettings({ showHints: "wrong", largeText: true }),
    {
      showHints: true,
      largeText: true,
      reducedMotion: false,
    },
  );
});
