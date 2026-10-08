import { readFileSync } from "node:fs";
import vm from "node:vm";
import { drawBeachBrother } from "../../web/beach.js";
import { drawCamel } from "../../web/camels.js";
import { drawCharacter } from "../../web/characters.js";
import * as journey from "../../web/journey-world.js";
import { normalizeSettings } from "../../web/settings.js";
import { swipeDirection } from "../../web/swipe.js";
import { drawWildlife } from "../../web/wildlife.js";
import { moveInRoom, roomFurniture } from "../../web/world.js";

export function bootJourney(saved, oldSave, savedSettings, rendering = {}) {
  const events = {},
    elements = new Map(),
    memory = new Map();
  if (saved) memory.set("littlequest-journey-v1", JSON.stringify(saved));
  if (oldSave) memory.set("littlequest-v1", JSON.stringify(oldSave));
  if (savedSettings)
    memory.set("littlequest-settings-v1", JSON.stringify(savedSettings));
  const ctx =
    rendering.context ??
    new Proxy({}, { get: (object, key) => object[key] ?? (() => {}) });
  const element = (id) => {
    if (!elements.has(id))
      elements.set(id, {
        hidden: id === "dialog" || id.endsWith("Panel"),
        style: {},
        textContent: "",
        classList: { add() {}, remove() {} },
        getContext: () => ctx,
        focus() {},
        setPointerCapture() {},
      });
    return elements.get(id);
  };
  const sandbox = {
    ...journey,
    WORLD: journey.JOURNEY_WORLD,
    houses: journey.journeyHouses,
    drawCharacter: rendering.drawCharacter ?? drawCharacter,
    drawCamel: rendering.drawCamel ?? drawCamel,
    drawBeachBrother: rendering.drawBeachBrother ?? drawBeachBrother,
    drawWildlife: rendering.drawWildlife ?? drawWildlife,
    normalizeSettings,
    swipeDirection,
    moveInRoom,
    roomFurniture,
    innerWidth: 960,
    innerHeight: 540,
    document: {
      body: { classList: { add() {}, remove() {} } },
      getElementById: element,
      querySelectorAll: () => [],
      addEventListener: (key, handler) => {
        events[key] = handler;
      },
    },
    addEventListener: (key, handler) => {
      events[key] = handler;
    },
    localStorage: {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
    },
    navigator: {},
    location: { protocol: "http:" },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    confirm: () => true,
    console,
  };
  vm.createContext(sandbox);
  const source = readFileSync(
    new URL("../../web/journey-game.js", import.meta.url),
    "utf8",
  ).replace(/^import[\s\S]*?;\s*/gm, "");
  vm.runInContext(
    `${source}\nglobalThis.driver={p,update,interact,draw,save,down,keys,getInterior:()=>interior};`,
    sandbox,
  );
  element("play").onclick();
  return { d: sandbox.driver, e: element, memory, events };
}
