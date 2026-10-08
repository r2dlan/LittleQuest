import { drawBeachBrother } from "./beach.js";
import { drawCamel } from "./camels.js";
import { drawCharacter } from "./characters.js";
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
  homeRoadStart,
  journeyHouses as houses,
  ladder,
  lakeFishPose,
  landscapeAt,
  meadowLake,
  meadowWildlife,
  mountain,
  mountainEdgeY,
  moveJourney,
  normalizeJourneySave,
  onJourneyLadder,
  pathY,
  river,
  shorelineX,
  shorelineY,
  stageAt,
  stages,
  JOURNEY_WORLD as WORLD,
  wildlifePose,
} from "./journey-world.js";
import { normalizeSettings } from "./settings.js";
import { swipeDirection } from "./swipe.js";
import { drawWildlife } from "./wildlife.js";
import { moveInRoom, roomFurniture } from "./world.js";

const freshState = () => normalizeJourneySave(null);
const normalizeSave = normalizeJourneySave;
const spawn = (state) => ({ x: state.x, y: state.y });
const $ = (id) => document.getElementById(id),
  canvas = $("world"),
  ctx = canvas.getContext("2d");
let s = freshState(),
  storage = true;
try {
  s = normalizeSave(JSON.parse(localStorage.getItem("littlequest-journey-v1")));
} catch {
  storage = false;
}
const p = { ...spawn(s), face: "down", walking: false };
let settings = normalizeSettings();
try {
  settings = normalizeSettings(
    JSON.parse(localStorage.getItem("littlequest-settings-v1")),
  );
} catch {
  // Play remains available if device storage is unavailable.
}
let W = 960,
  H = 540,
  cameraX = 0,
  cameraY = 0,
  time = 0,
  animationTime = 0,
  paused = true,
  dialogAction = null,
  toastUntil = 0,
  last = 0,
  saveTimer = 0;
const keys = new Set(),
  pointers = new Map();
let swipe = null,
  swipeVector = { x: 0, y: 0 };
let interior = null;
let sceneTransition = null;
function changeScene(action) {
  if (sceneTransition) return;
  clearInput();
  p.walking = false;
  $("prompt").textContent = "";
  if (settings.reducedMotion) action();
  else sceneTransition = { elapsed: 0, action, switched: false };
}
function doorway() {
  return houses.findIndex(
    (h) =>
      Math.abs(p.x - (h.x + h.w / 2)) < 24 &&
      p.y >= h.y + h.h &&
      p.y <= h.y + h.h + 38,
  );
}
function enterHouse(index) {
  changeScene(() => {
    const house = houses[index];
    interior = { index, x: house.x + house.w / 2, y: house.y + house.h + 25 };
    Object.assign(p, { x: 320, y: 420, face: "up", walking: false });
    clearInput();
    hud();
    save();
  });
}
function leaveHouse() {
  changeScene(() => {
    Object.assign(p, {
      x: interior.x,
      y: interior.y,
      face: "down",
      walking: false,
    });
    interior = null;
    clearInput();
    hud();
    save();
  });
}
function resize() {
  const zoom = Math.max(1.15, Math.min(innerWidth / 640, innerHeight / 390));
  // Every world pixel occupies whole screen pixels, avoiding soft edges.
  const density = Math.max(1, Math.min(globalThis.devicePixelRatio || 1, 3));
  const pixelScale = Math.max(1, Math.round(zoom * density));
  const viewScale = 0.8;
  W = Math.ceil((innerWidth * density) / (pixelScale * viewScale));
  H = Math.ceil((innerHeight * density) / (pixelScale * viewScale));
  canvas.width = W * pixelScale;
  canvas.height = H * pixelScale;
  canvas.style.width = `${(canvas.width / density) * viewScale}px`;
  canvas.style.height = `${(canvas.height / density) * viewScale}px`;
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
addEventListener("resize", resize);
resize();
function save() {
  s.x = interior?.x ?? p.x;
  s.y = interior?.y ?? p.y;
  s.viewVersion = 2;
  try {
    localStorage.setItem("littlequest-journey-v1", JSON.stringify(s));
    storage = true;
  } catch {
    storage = false;
  }
  $("saveNote").textContent = storage
    ? "Dein Fortschritt wird automatisch auf diesem Gerät gespeichert."
    : "Speichern ist hier nicht verfügbar. Lass das Spiel geöffnet.";
}
function hud() {
  const stage = stageAt(interior?.x ?? p.x);
  $("objective").textContent = `${stage.id.slice(1)} / 14 · ${stage.name}`;
  $("hint").textContent = stage.hint;
  $("area").textContent = interior
    ? houses[interior.index].name
    : stage.name.toUpperCase();
  $("bag").textContent = "LANDSCHAFTSVORSCHAU";
}
function toast(t) {
  $("toast").textContent = t;
  $("toast").classList.add("visible");
  toastUntil = time + 3;
}
function clearInput() {
  stopSwipe();
  keys.clear();
  pointers.clear();
  document.querySelectorAll("[data-key]").forEach((b) => {
    b.classList.remove("pressed");
  });
}
$("dialogNext").onclick = () => {
  $("dialog").hidden = true;
  canvas.tabIndex = -1;
  canvas.focus({ preventScroll: true });
  const f = dialogAction;
  dialogAction = null;
  f?.();
  hud();
  save();
};
function interact() {
  if (sceneTransition || paused || !$("dialog").hidden) return;
  if (interior) {
    if (Math.abs(p.x - 320) < 35 && p.y > 395) leaveHouse();
    return;
  }
  const index = doorway();
  if (index >= 0) enterHouse(index);
}
function down(k) {
  if (sceneTransition) return;
  if (keys.has(k)) return;
  keys.add(k);
  if (k === "interact") interact();
}
const mapping = {
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  e: "interact",
  E: "interact",
  " ": "interact",
  Enter: "interact",
};
addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    togglePause();
    return;
  }
  if (
    (e.code === "Space" || e.key === " ") &&
    !$("dialog").hidden &&
    !e.target?.closest?.("input, a, select, textarea")
  ) {
    e.preventDefault();
    if (!e.repeat) $("dialogNext").onclick();
    return;
  }
  if (e.target?.closest?.("input, button, a, select, textarea")) return;
  const k = mapping[e.key];
  if (k) {
    e.preventDefault();
    if (!e.repeat) down(k);
  }
});
addEventListener("keyup", (e) => keys.delete(mapping[e.key]));
for (const b of document.querySelectorAll("[data-key]")) {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, b.dataset.key);
    b.classList.add("pressed");
    down(b.dataset.key);
  };
  const release = (e) => {
    const k = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (![...pointers.values()].includes(k)) {
      keys.delete(k);
      b.classList.remove("pressed");
    }
  };
  b.onpointerup = release;
  b.onpointercancel = release;
}
function togglePause() {
  if (closePanel()) return;
  if (!$("dialog").hidden) return;
  paused = !paused;
  clearInput();
  $("menu").hidden = !paused;
  $("play").textContent = "Weiterspielen";
  save();
}
$("pause").onclick = togglePause;
$("play").onclick = () => {
  paused = false;
  $("menu").hidden = true;
  last = performance.now();
  clearInput();
};
$("reset").onclick = () => {
  if (!confirm("Gespeicherten Fortschritt löschen und neu beginnen?")) return;
  interior = null;
  sceneTransition = null;
  s = freshState();
  Object.assign(p, spawn(s));
  $("play").textContent = "Abenteuer beginnen";
  hud();
  save();
};
function applySettings() {
  for (const key of ["showHints", "largeText", "reducedMotion"])
    $(key).checked = settings[key];
  document.body.classList[settings.showHints ? "remove" : "add"]("hideHints");
  document.body.classList[settings.largeText ? "add" : "remove"]("largeText");
  document.body.classList[settings.reducedMotion ? "add" : "remove"](
    "reducedMotion",
  );
}
for (const key of ["showHints", "largeText", "reducedMotion"]) {
  $(key).onchange = () => {
    settings[key] = $(key).checked;
    applySettings();
    try {
      localStorage.setItem("littlequest-settings-v1", JSON.stringify(settings));
    } catch {
      toast(
        "Einstellungen gelten nur für diese Sitzung: Speichern ist nicht verfügbar.",
      );
    }
  };
}
function closePanel() {
  let closed = false;
  for (const panel of ["settings", "help", "privacy"]) {
    if (!$(`${panel}Panel`).hidden) {
      $(`${panel}Panel`).hidden = true;
      closed = true;
    }
  }
  $("menu").inert = false;
  return closed;
}
for (const panel of ["settings", "help", "privacy"]) {
  $(`${panel}Open`).onclick = () => {
    clearInput();
    paused = true;
    save();
    closePanel();
    $("menu").inert = true;
    $(`${panel}Panel`).hidden = false;
    $(`${panel}Close`).focus?.();
  };
  $(`${panel}Close`).onclick = closePanel;
}
applySettings();
if (s.accepted) $("play").textContent = "Abenteuer fortsetzen";
addEventListener("blur", () => {
  clearInput();
  paused = true;
  $("menu").hidden = false;
  save();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInput();
    paused = true;
    $("menu").hidden = false;
    save();
  }
});
addEventListener("pagehide", save);
function update(dt) {
  time += dt;
  if (sceneTransition) {
    sceneTransition.elapsed += dt;
    if (!sceneTransition.switched && sceneTransition.elapsed >= 0.24) {
      sceneTransition.switched = true;
      sceneTransition.action();
    }
    if (sceneTransition.elapsed >= 0.48) {
      sceneTransition = null;
      clearInput();
    }
    return;
  }
  if (time > toastUntil) $("toast").classList.remove("visible");
  if (paused || !$("dialog").hidden) return;
  if (!settings.reducedMotion) animationTime += dt;
  let dx = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
  let dy = (keys.has("down") ? 1 : 0) - (keys.has("up") ? 1 : 0);
  if (!dx && !dy) {
    dx = swipeVector.x;
    dy = swipeVector.y;
  }
  p.walking = !!(dx || dy);
  if (Math.abs(dy) > Math.abs(dx)) p.face = dy > 0 ? "down" : "up";
  else if (dx) p.face = dx > 0 ? "right" : "left";
  const length = Math.hypot(dx, dy) || 1;
  if (interior) {
    moveInRoom(p, (dx / length) * 125 * dt, (dy / length) * 125 * dt);
    if (dy > 0 && Math.abs(p.x - 320) < 28 && p.y >= 438) leaveHouse();
    else
      $("prompt").textContent =
        p.y > 395 && Math.abs(p.x - 320) < 35
          ? `↓ / E / ✋ · ${buildingName(houses[interior.index])} verlassen`
          : "";
  } else if (dy < 0 && doorway() >= 0) {
    enterHouse(doorway());
  } else {
    if (onJourneyLadder(p)) {
      p.walking = dy !== 0;
      if (dy) p.face = dy > 0 ? "down" : "up";
      moveJourney(
        p,
        (ladder.x - p.x) * Math.min(1, dt * 8),
        (dy / length) * 95 * dt,
      );
    } else moveJourney(p, (dx / length) * 125 * dt, (dy / length) * 125 * dt);
    $("prompt").textContent = onJourneyLadder(p)
      ? "↑ / ↓ · Leiter hinauf- oder hinabklettern"
      : Math.abs(p.x - ladder.x) < 30 &&
          p.y >= ladder.bottom - 8 &&
          p.y < ladder.bottom + 50
        ? "↑ · Über die Leiter auf den Berg"
        : doorway() >= 0
          ? `↑ / E / ✋ · ${buildingName(houses[doorway()])} betreten`
          : "Folge dem Weg nach rechts · Alle Stationen sind offen";
  }
  saveTimer += dt;
  if (saveTimer > 2) {
    save();
    saveTimer = 0;
  }
  hud();
}
const rect = (x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
function poly(points, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}
function label(x, y, text, c = "#f5dda2") {
  ctx.fillStyle = c;
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}
function shadow(x, y, w = 26) {
  ctx.fillStyle = "#102d2935";
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}
function tree(t) {
  const { x, y } = t;
  shadow(x, y + 11, 54);
  rect(x - 7, y - 20, 14, 37, "#72533a");
  rect(x - 3, y - 15, 5, 30, "#a57a4a");
  poly(
    [
      [x - 32, y - 19],
      [x - 35, y - 43],
      [x - 21, y - 62],
      [x, y - 70],
      [x + 26, y - 59],
      [x + 36, y - 38],
      [x + 30, y - 16],
    ],
    "#285743",
  );
  poly(
    [
      [x - 30, y - 30],
      [x - 27, y - 50],
      [x - 10, y - 63],
      [x + 13, y - 61],
      [x + 30, y - 46],
      [x + 26, y - 29],
    ],
    "#3c7850",
  );
  rect(x - 20, y - 51, 14, 7, "#69a45d");
  rect(x + 5, y - 42, 17, 6, "#5c9955");
  rect(x - 10, y - 29, 12, 5, "#4b8c4e");
}
function rock(r) {
  shadow(r.x + r.w / 2, r.y + r.h - 4, r.w);
  poly(
    [
      [r.x, r.y + r.h - 9],
      [r.x + 4, r.y + 13],
      [r.x + r.w / 3, r.y],
      [r.x + r.w - 13, r.y + 6],
      [r.x + r.w, r.y + r.h - 17],
      [r.x + r.w - 8, r.y + r.h],
    ],
    "#667b70",
  );
  poly(
    [
      [r.x + 5, r.y + 15],
      [r.x + r.w / 3, r.y + 3],
      [r.x + r.w - 15, r.y + 8],
      [r.x + r.w - 25, r.y + 25],
    ],
    "#9baa8b",
  );
  rect(r.x + 10, r.y + r.h - 15, r.w - 25, 4, "#4e665f");
}
function house(o) {
  if (o.biome === "home" || o.biome === "village") {
    drawHillHome(o);
    return;
  }
  const { x, y, w, h } = o;
  const nordic = o.biome === "snowTown";
  rect(x + 7, y + h - 8, w, 16, "#31584040");
  rect(x, y + 44, w, h - 44, nordic ? "#793c3d" : "#d9be8f");
  rect(x + 6, y + 50, w - 12, h - 57, nordic ? "#ad504b" : "#eddaa8");
  if (nordic)
    for (let plank = x + 9; plank < x + w - 8; plank += 10) {
      rect(plank, y + 50, 2, h - 57, "#8f403e");
      rect(plank + 2, y + 50, 1, h - 57, "#c0665a");
    }
  rect(x + 13, y + 55, 7, h - 55, nordic ? "#eee9d8" : "#9a704d");
  rect(x + w - 20, y + 55, 7, h - 55, nordic ? "#eee9d8" : "#9a704d");
  rect(x, y + h - 27, w, 6, nordic ? "#8b4540" : "#a68152");
  poly(
    [
      [x - 9, y + 45],
      [x + 8, y],
      [x + w - 8, y],
      [x + w + 9, y + 45],
    ],
    "#944f3b",
  );
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 7; col++)
      rect(
        x + 6 + (col * (w - 12)) / 7 + (row % 2) * 3,
        y + 8 + row * 9,
        (w - 12) / 7 - 3,
        5,
        row % 2 ? "#ca7648" : "#b96642",
      );
  rect(x - 10, y + 43, w + 20, 6, "#6d4833");
  rect(x + w / 2 - 14, y + h - 39, 28, 39, "#735137");
  rect(x + w / 2 - 9, y + h - 34, 18, 34, "#9e784c");
  rect(x + 30, y + h - 68, 25, 25, "#4e7263");
  rect(x + 33, y + h - 65, 19, 19, "#99c8b1");
  rect(x + w - 56, y + h - 68, 25, 25, "#4e7263");
  rect(x + w - 53, y + h - 65, 19, 19, "#99c8b1");
  if (nordic) {
    rect(x + w / 2 - 18, y + h - 42, 36, 42, "#f1ecdd");
    rect(x + w / 2 - 13, y + h - 38, 26, 38, "#6e5145");
    rect(x + w / 2 + 6, y + h - 18, 3, 3, "#e2c482");
    for (const dx of [28, w - 58]) {
      rect(x + dx, y + h - 70, 29, 29, "#f4f0e3");
      rect(x + dx + 4, y + h - 66, 21, 21, "#c5dace");
      rect(x + dx + 13, y + h - 66, 3, 21, "#f4f0e3");
      rect(x + dx + 4, y + h - 57, 21, 3, "#f4f0e3");
    }
  }
  rect(x + w / 2 - 20, y + h, 40, 12, "#b6a583");
}
function drawHillHome({ x, y, w, h }) {
  const cx = x + w / 2;
  const oval = (px, py, rx, ry, color) =>
    poly(
      Array.from({ length: 40 }, (_, i) => {
        const angle = (i * Math.PI) / 20;
        return [px + Math.cos(angle) * rx, py + Math.sin(angle) * ry];
      }),
      color,
    );
  oval(cx, y + 64, w * 0.72, h * 0.63, "#496b3e");
  oval(cx - 6, y + 49, w * 0.66, h * 0.58, "#769754");
  oval(cx - 12, y + 36, w * 0.49, h * 0.39, "#8bad62");
  rect(x + w - 30, y - 13, 14, 34, "#937d62");
  rect(x + w - 33, y - 16, 20, 6, "#c5ad84");
  rect(x + w - 29, y - 6, 12, 2, "#c2aa85");
  oval(cx, y + h - 30, w * 0.52, 37, "#8a7050");
  oval(cx, y + h - 29, w * 0.47, 32, "#b49c71");
  oval(cx, y + h - 23, 27, 28, "#dcc99a");
  oval(cx, y + h - 23, 23, 24, "#3e6653");
  oval(cx - 2, y + h - 25, 19, 20, "#557e59");
  for (let dx = -12; dx <= 12; dx += 6) {
    const height = Math.sqrt(19 ** 2 - dx ** 2);
    rect(cx + dx, y + h - 25 - height, 1, height * 2, "#3b644d");
  }
  oval(cx + 9, y + h - 21, 3, 3, "#e2bd64");
  for (const dx of [27, w - 27]) {
    oval(x + dx, y + h - 43, 15, 15, "#dfcba0");
    oval(x + dx, y + h - 43, 11, 11, "#a8c6aa");
    rect(x + dx - 1, y + h - 53, 2, 20, "#f0dfb7");
    rect(x + dx - 10, y + h - 44, 20, 2, "#f0dfb7");
    rect(x + dx - 13, y + h - 25, 26, 7, "#896440");
    mountainScrub(x + dx, y + h - 21, 9);
  }
  for (let i = 0; i < 11; i++) {
    const px = x - 5 + i * 14,
      py = y + 22 + (i % 3) * 8;
    rect(px, py, 2, 6, "#5e864a");
    if (i % 2) rect(px - 2, py - 2, 5, 3, i % 3 ? "#e8d598" : "#d3a18d");
  }
  rect(cx - 21, y + h + 4, 42, 7, "#d3c098");
  for (const dx of [-w * 0.55, w * 0.55]) mountainScrub(cx + dx, y + h - 2, 20);
}
function buildingName(building) {
  return building.kind === "cave"
    ? "Höhle"
    : building.kind === "tent"
      ? "Zelt"
      : "Haus";
}
function tent(h) {
  const { x, y, w, h: height } = h;
  const cx = x + w / 2;
  shadow(cx, y + height - 1, w + 12);
  poly(
    [
      [x - 7, y + height],
      [x + 14, y + 37],
      [cx, y],
      [x + w - 14, y + 37],
      [x + w + 7, y + height],
    ],
    "#d8c19b",
  );
  poly(
    [
      [cx, y],
      [x + w - 14, y + 37],
      [x + w + 7, y + height],
      [cx + 18, y + height],
    ],
    "#b89770",
  );
  poly(
    [
      [x - 7, y + height],
      [x + 14, y + 37],
      [cx, y],
      [cx - 23, y + height],
    ],
    "#f0e2c3",
  );
  rect(x - 7, y + height - 10, w + 14, 7, "#b77656");
  poly(
    [
      [cx - 24, y + height],
      [cx - 15, y + height - 49],
      [cx + 15, y + height - 49],
      [cx + 24, y + height],
    ],
    "#4c4337",
  );
  poly(
    [
      [cx - 24, y + height],
      [cx - 15, y + height - 49],
      [cx - 5, y + height - 48],
      [cx - 12, y + height - 6],
    ],
    "#e9d6ad",
  );
  poly(
    [
      [cx + 24, y + height],
      [cx + 15, y + height - 49],
      [cx + 5, y + height - 48],
      [cx + 12, y + height - 6],
    ],
    "#c3a17a",
  );
  rect(cx - 2, y - 4, 4, 14, "#92724d");
  for (const dx of [-8, w + 5]) {
    rect(x + dx, y + height - 28, 2, 30, "#e7d5ac");
    rect(x + dx - 2, y + height, 6, 4, "#785c3f");
  }
}
function person(x, y, npc = false, name = "", resident = null) {
  drawCharacter(ctx, {
    x,
    y,
    face: resident?.face ?? (npc ? "down" : p.face),
    role:
      name === "JONA"
        ? "jona"
        : name === "MINA"
          ? "mina"
          : (resident?.role ?? (npc ? "mina" : "hero")),
    walking: resident ? !settings.reducedMotion : !npc && p.walking,
    time: animationTime,
  });
  if (name) label(x, y - 66, name);
}

function rabbit(pose) {
  const { x, y, facing, lift } = pose;
  shadow(x, y + 3, 20);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - lift));
  ctx.scale(facing, 1);
  rect(-10, -11, 18, 12, "#615548");
  rect(-9, -12, 16, 11, "#c5b79b");
  rect(-7, -12, 11, 3, "#e5dbc0");
  rect(-12, -8, 5, 5, "#f4edda");
  rect(-6, -1, 7, 3, "#8c7961");
  rect(5, -14, 10, 10, "#615548");
  rect(6, -14, 8, 8, "#e5dbc0");
  rect(6, -25, 3, 12, "#c5b79b");
  rect(11, -26, 3, 13, "#e5dbc0");
  rect(7, -23, 1, 7, "#c38e86");
  rect(12, -24, 1, 8, "#c38e86");
  rect(11, -12, 2, 2, "#273c32");
  rect(14, -9, 2, 2, "#c38e86");
  ctx.restore();
}

function drawInterior() {
  if (houses[interior.index].kind === "cave") {
    drawCaveInterior();
    return;
  }
  const isTent = houses[interior.index].kind === "tent";
  const isSnowHouse = houses[interior.index].biome === "snowTown";
  rect(0, 0, W, H, "#203a35");
  ctx.save();
  const scale = Math.min(W / 640, H / 480) * 0.8;
  ctx.translate((W - 640 * scale) / 2, (H - 480 * scale) / 2);
  ctx.scale(scale, scale);
  rect(70, 65, 500, 390, isTent ? "#ae906a" : "#543f31");
  rect(80, 90, 480, 360, isTent ? "#dbc59f" : "#b98a56");
  for (let y = 90; !isTent && y < 450; y += 24) {
    rect(80, y, 480, 2, "#87653e");
    for (let x = 100 + (y % 48 ? 70 : 0); x < 560; x += 140)
      rect(x, y + 2, 1, 22, "#976f43");
  }
  rect(80, 65, 480, 25, "#e5cda0");
  for (const x of isTent ? [] : [220, 380]) {
    rect(x, 66, 40, 22, "#655438");
    rect(x + 3, 68, 34, 16, "#a5cfbf");
    rect(x + 19, 68, 2, 16, "#f3ddb5");
  }
  if (isTent) {
    for (let x = 86; x < 555; x += 46) {
      rect(x, 69, 3, 24, "#bb9e76");
      rect(x, 95, 26, 2, "#ead9b7");
    }
    for (const x of [84, 549]) rect(x, 91, 6, 352, "#9b7953");
  }
  rect(
    230,
    285,
    180,
    85,
    ["#966c65", "#668c7a", "#8a809e"][interior.index % 3],
  );
  rect(237, 292, 166, 71, "#d6be8c");
  rect(290, 442, 60, 13, "#d9bc80");
  label(320, 466, "↓ AUSGANG", "#f5dda2");
  const objects = roomFurniture.map((f) => ({
    y: f.y + f.h,
    draw: () => {
      rect(f.x - 2, f.y - 2, f.w + 4, f.h + 4, "#584332");
      rect(f.x, f.y, f.w, f.h, "#ad7d4c");
      if (f.kind === "bed") {
        rect(f.x + 5, f.y + 5, f.w - 10, f.h - 10, "#768f86");
        rect(f.x + 7, f.y + 7, 25, f.h - 14, "#f5e8c7");
        rect(f.x + 36, f.y + 7, f.w - 43, 3, "#b1c5ad");
      } else if (f.kind === "table") {
        rect(f.x + 4, f.y + 4, f.w - 8, 4, "#e0b579");
        rect(f.x + 18, f.y + 15, 22, 17, "#eee0b6");
        rect(f.x + 50, f.y + 15, 12, 12, "#719b86");
        rect(f.x + 53, f.y + 17, 6, 6, "#f2e1b9");
      } else if (f.kind === "kitchen") {
        rect(f.x + 4, f.y + 3, f.w - 8, 25, "#d9d1af");
        rect(f.x + 12, f.y + 7, 28, 17, "#526b64");
        rect(f.x + 63, f.y + 7, 18, 16, "#695448");
        rect(f.x + 45, f.y + 30, 2, 12, "#705133");
      } else {
        for (let y = f.y + 4; y < f.y + f.h; y += 17) {
          for (let i = 0; i < 5; i++)
            rect(
              f.x + 5 + i * 9,
              y,
              6,
              12,
              ["#698778", "#bf7159", "#d6b96d"][i % 3],
            );
        }
      }
    },
  }));
  for (let i = 0; i < 2; i++) {
    const phase = (animationTime * 24 + interior.index * 37 + i * 105) % 320;
    const x = 230 + (phase < 160 ? phase : 320 - phase);
    const y = i ? 165 : 325;
    objects.push({
      y,
      draw: () =>
        person(x, y, true, "", {
          face: phase < 160 ? "right" : "left",
          role: isSnowHouse
            ? i
              ? "snowManIndoor"
              : "snowWomanIndoor"
            : isTent
              ? i
                ? "desertMan"
                : "desertWoman"
              : i
                ? "jona"
                : "mina",
        }),
    });
  }
  objects.push({ y: p.y, draw: () => person(p.x, p.y) });
  objects
    .sort((a, b) => a.y - b.y)
    .forEach((o) => {
      o.draw();
    });
  ctx.restore();
}
function drawCaveInterior() {
  rect(0, 0, W, H, "#18252b");
  ctx.save();
  const scale = Math.min(W / 640, H / 480) * 0.8;
  ctx.translate((W - 640 * scale) / 2, (H - 480 * scale) / 2);
  ctx.scale(scale, scale);
  rect(70, 65, 500, 390, "#37474a");
  rect(80, 90, 480, 360, "#697676");
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 8; col++) {
      const x = 90 + col * 58 + (row % 2) * 9;
      const y = 110 + row * 47;
      rect(x, y, 17 + ((col * 7) % 22), 2, "#7f8b87");
      rect(x + 8, y + 15, 10, 2, "#55686c");
    }
  }
  for (let x = 80; x < 550; x += 48) {
    rock({ x, y: 65, w: 49, h: 35 });
    poly(
      [
        [x + 13, 84],
        [x + 29, 118 + (x % 21)],
        [x + 36, 85],
      ],
      "#9bb9bd",
    );
  }
  for (const x of [72, 535])
    for (let y = 115; y < 430; y += 50) rock({ x, y, w: 30, h: 42 });
  snowdrift(282, 438, 77, 13);
  rect(290, 442, 60, 13, "#c2d7d8");
  label(320, 466, "↓ ZUM GIPFEL", "#e9f2ec");
  const objects = roomFurniture.map((f) => ({
    y: f.y + f.h,
    draw: () => {
      rock({ x: f.x, y: f.y, w: f.w, h: f.h });
      if (f.kind === "shelf" || f.kind === "kitchen") {
        for (let i = 0; i < 3; i++) {
          const x = f.x + 12 + i * 20;
          poly(
            [
              [x, f.y + f.h - 9],
              [x + 3, f.y + 12],
              [x + 12, f.y + f.h - 9],
            ],
            i % 2 ? "#b6dfdc" : "#7eb6bf",
          );
        }
      }
    },
  }));
  objects.push({ y: p.y, draw: () => person(p.x, p.y) });
  objects
    .sort((a, b) => a.y - b.y)
    .forEach((object) => {
      object.draw();
    });
  ctx.restore();
}
function drawCaveEntrance(h) {
  const cx = h.x + h.w / 2;
  poly(
    [
      [h.x - 42, h.y + h.h + 8],
      [h.x - 22, h.y + 33],
      [cx - 12, h.y - 17],
      [cx + 23, h.y - 4],
      [h.x + h.w + 30, h.y + 58],
      [h.x + h.w + 43, h.y + h.h + 8],
    ],
    "#667b7e",
  );
  poly(
    [
      [h.x - 22, h.y + 33],
      [cx - 12, h.y - 17],
      [cx + 23, h.y - 4],
      [cx + 10, h.y + 43],
      [h.x + 4, h.y + 66],
    ],
    "#94a5a2",
  );
  snowdrift(h.x - 15, h.y + 39, h.w + 26, 31);
  poly(
    [
      [cx - 31, h.y + h.h],
      [cx - 30, h.y + 72],
      [cx - 14, h.y + 53],
      [cx + 13, h.y + 54],
      [cx + 30, h.y + 75],
      [cx + 31, h.y + h.h],
    ],
    "#263a40",
  );
  poly(
    [
      [cx - 21, h.y + h.h],
      [cx - 20, h.y + 78],
      [cx - 9, h.y + 65],
      [cx + 10, h.y + 67],
      [cx + 21, h.y + 81],
      [cx + 22, h.y + h.h],
    ],
    "#14262e",
  );
  snowdrift(cx - 38, h.y + h.h + 2, 76, 6);
  label(cx, h.y - 26, h.name, "#f2f5eb");
}
function pine(x, y, snow = false) {
  shadow(x, y + 3, 36);
  rect(x - 4, y - 25, 8, 28, "#69533d");
  for (let i = 0; i < 3; i++) {
    const top = y - 65 + i * 16;
    poly(
      [
        [x, top],
        [x - 22 - i * 3, top + 30],
        [x + 22 + i * 3, top + 30],
      ],
      i % 2 ? "#3d6553" : "#355547",
    );
    if (snow) {
      ctx.save();
      ctx.globalAlpha = Number(snow);
      poly(
        [
          [x, top],
          [x - 14, top + 19],
          [x + 14, top + 19],
        ],
        "#e2e9dc",
      );
      ctx.restore();
    }
  }
}
function palm(x, y) {
  rect(x - 4, y - 40, 8, 43, "#a38354");
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 15;
    poly(
      [
        [x, y - 43],
        [x + dx, y - 54 + Math.abs(dx) / 3],
        [x + dx * 1.4, y - 30],
        [x + dx * 0.6, y - 41],
      ],
      "#70835c",
    );
  }
}
function mountainScrub(x, y, size) {
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * size * 0.3;
    const height = size * (0.5 + ((i * 7) % 5) / 10);
    poly(
      [
        [x + dx - 5, y],
        [x + dx - 3, y - height],
        [x + dx + 2, y - height * 0.6],
        [x + dx + 6, y],
      ],
      i % 2 ? "#58764c" : "#74905a",
    );
    rect(x + dx, y - height * 0.55, 2, height * 0.55, "#395c42");
  }
}
function snowCover(x) {
  const land = landscapeAt(x);
  const snowy = (index) =>
    ["snowMountain", "snowTown"].includes(stages[index].biome);
  const amount =
    (snowy(land.left) ? 1 - land.amount : 0) +
    (snowy(land.right) ? land.amount : 0);
  return amount * amount * (3 - 2 * amount);
}
function snowdrift(x, y, width, depth, opacity = 1) {
  ctx.save();
  ctx.globalAlpha = opacity;
  const outline = [
    [x, y],
    [x + width * 0.17, y - depth * 0.55],
    [x + width * 0.52, y - depth],
    [x + width * 0.83, y - depth * 0.7],
    [x + width, y - depth * 0.2],
    [x + width * 0.88, y + depth * 0.35],
    [x + width * 0.38, y + depth * 0.55],
    [x + width * 0.08, y + depth * 0.25],
  ];
  poly(outline, "#afc5cf");
  poly(
    outline.map(([px, py]) => [px, py - 3]),
    "#eaf1ee",
  );
  poly(
    [
      [x + width * 0.17, y - depth * 0.55 - 3],
      [x + width * 0.52, y - depth - 3],
      [x + width * 0.8, y - depth * 0.7 - 3],
      [x + width * 0.45, y - depth * 0.45 - 3],
    ],
    "#fcfcf3",
  );
  ctx.restore();
}
function drawGroundSnow(left, right) {
  for (let cell = Math.floor(left / 62); cell < Math.ceil(right / 62); cell++) {
    const x = cell * 62;
    const cover = snowCover(x);
    if (!cover) continue;
    for (
      let row = Math.floor(cameraY / 54);
      row < Math.ceil((cameraY + H) / 54);
      row++
    ) {
      const seed = (((cell * 43 + row * 29) % 97) + 97) % 97;
      const px = x + (seed % 25);
      const y = row * 54 + (seed % 19);
      if (
        px >= mountain.start &&
        px < mountain.end &&
        y > mountainEdgeY(px) - 12
      )
        continue;
      const onPath = Math.abs(y - pathY(px)) < 32;
      // Each drift grows and fades continuously instead of popping at a biome boundary.
      const density = Math.max(0, Math.min(1, (cover - seed / 150) * 3));
      if (!density) continue;
      snowdrift(
        px,
        y,
        (28 + (seed % 34)) * (0.35 + density * 0.65),
        onPath ? 3 : 9 + (seed % 9),
        density * (onPath ? 0.28 : 0.9),
      );
    }
  }
}
function drawMountainFace(left, right) {
  const start = Math.max(mountain.start, Math.floor(left / 48) * 48);
  for (let x = start; x < Math.min(mountain.end, right); x += 48) {
    const edge = mountainEdgeY(x);
    const bottom = x < ladder.x + 20 ? ladder.bottom - 10 : WORLD.height;
    for (let row = 0, y = edge + 10; y < bottom; row++, y += 51) {
      const seed = (Math.floor(x / 48) * 31 + row * 17) % 23;
      const height = Math.min(45 + seed / 2, bottom - y);
      const inset = 3 + (seed % 8);
      poly(
        [
          [x + inset, y + 5],
          [x + 32, y],
          [x + 47, y + 17],
          [x + 41, y + height],
          [x + 7, y + height - 4],
          [x, y + 22],
        ],
        seed % 2 ? "#73776b" : "#858477",
      );
      poly(
        [
          [x + inset, y + 5],
          [x + 32, y],
          [x + 28, y + 17],
          [x + 6, y + 24],
        ],
        "#a6a18b",
      );
      poly(
        [
          [x + 28, y + 17],
          [x + 47, y + 17],
          [x + 41, y + height],
          [x + 26, y + height - 5],
        ],
        "#505b55",
      );
      const cover = snowCover(x);
      if (seed % 3 === 0 && cover < 0.5)
        mountainScrub(x + 17, y + height - 2, 9);
      if (row < 3 && cover > 0)
        snowdrift(x + inset, y + 5, 32, 6, cover * (1 - row * 0.28));
    }
    // Broken stone and greenery soften the foot of the exposed western slope.
    if (x < ladder.x + 20) {
      const y = ladder.bottom + 18 + ((x * 7) % 31);
      if (Math.abs(x + 24 - ladder.x) > 38) {
        rock({ x: x + 8, y: y - 12, w: 29, h: 22 });
        mountainScrub(x + 32, y + 7, 21);
      }
    }
    if (Math.abs(x + 24 - ladder.x) > 40) {
      rock({ x: x + 12, y: edge - 19, w: 30, h: 21 });
      const cover = snowCover(x);
      if (cover) snowdrift(x + 13, edge - 13, 28, 6, cover);
      if (x % 3 === 0 && cover < 0.5) mountainScrub(x + 37, edge - 3, 13);
    }
  }
  for (let y = 110; y < ladder.bottom - 15; y += 47) {
    rock({ x: mountain.start - 31, y, w: 35, h: 30 });
    mountainScrub(mountain.start - 38, y + 35, 22);
  }
  for (let x = mountain.start - 140; x < ladder.x - 40; x += 37) {
    const y = ladder.bottom + 75 + ((x * 3) % 29);
    rock({ x, y, w: 31, h: 27 });
    mountainScrub(x - 9, y + 29, 24);
    mountainScrub(x + 28, y + 12, 14);
  }
}
function drawMeadowLake() {
  const { x, y, rx, ry } = meadowLake;
  if (x + rx < cameraX - 40 || x - rx > cameraX + W + 40) return;
  const oval = (cx, cy, width, height, color) =>
    poly(
      Array.from({ length: 48 }, (_, i) => {
        const angle = (i * Math.PI) / 24;
        return [cx + Math.cos(angle) * width, cy + Math.sin(angle) * height];
      }),
      color,
    );
  oval(x, y + 3, rx + 14, ry + 12, "#73965d");
  oval(x, y, rx + 6, ry + 5, "#c1bc88");
  oval(x, y, rx, ry, "#83b9ad");
  oval(x + 3, y + 4, rx - 17, ry - 13, "#5eaaa6");
  oval(x + 10, y + 8, rx - 43, ry - 30, "#4a919c");
  for (let i = 0; i < 5; i++) {
    const fish = lakeFishPose(i, animationTime);
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate(fish.angle);
    poly(
      [
        [-7, 0],
        [-13, -5 + fish.tail],
        [-12, 5 + fish.tail],
      ],
      "#dfad70",
    );
    poly(
      [
        [-8, 0],
        [-3, -4],
        [5, -3],
        [9, 0],
        [5, 3],
        [-3, 4],
      ],
      i % 2 ? "#c7d1aa" : "#ecba78",
    );
    rect(-3, -2, 8, 1, "#f5dbaa");
    rect(5, -1, 2, 2, "#2d5656");
    ctx.restore();
  }
  for (let i = 0; i < 8; i++) {
    const px = x - 91 + i * 25;
    const py = y - 35 + (i % 3) * 28;
    rect(
      px + Math.sin(animationTime * 1.2 + i) * 3,
      py,
      15 + (i % 3) * 5,
      2,
      "#abd4c7",
    );
  }
  for (const angle of [0.3, 0.9, 2.2, 2.8, 3.8, 5.3]) {
    const px = x + Math.cos(angle) * (rx + 11);
    const py = y + Math.sin(angle) * (ry + 7);
    mountainScrub(px, py, 17);
    rect(px + 5, py - 28, 2, 28, "#58794f");
    rect(px + 4, py - 29, 4, 9, "#936e47");
  }
  rock({ x: x - rx - 15, y: y + 15, w: 31, h: 25 });
  rock({ x: x + rx - 3, y: y - 17, w: 27, h: 24 });
}
function drawLounger(chair) {
  const { x, y } = chair;
  poly(
    [
      [x - 48, y + 4],
      [x + 42, y + 4],
      [x + 50, y + 19],
      [x - 41, y + 19],
    ],
    "#856345",
  );
  poly(
    [
      [x - 45, y - 17],
      [x - 23, y - 23],
      [x - 11, y + 3],
      [x - 39, y + 9],
    ],
    "#c69860",
  );
  poly(
    [
      [x - 40, y - 13],
      [x - 25, y - 17],
      [x - 14, y + 2],
      [x - 36, y + 6],
    ],
    "#eee0b8",
  );
  rect(x - 12, y - 4, 55, 13, "#eadcc0");
  for (const dx of [-34, 35]) rect(x + dx, y + 12, 4, 13, "#9b754c");
  for (let dx = -5; dx < 39; dx += 11) rect(x + dx, y - 3, 2, 11, "#d2bf97");
}
function drawBeachBar() {
  const { x, y, w, h } = beachBar;
  rect(x, y + 34, w, h - 34, "#946e4a");
  rect(x + 9, y + 40, w - 18, 47, "#394e43");
  for (let dx = 10; dx < w - 7; dx += 13)
    rect(x + dx, y + 88, 2, 23, "#b99460");
  rect(x - 6, y + 82, w + 12, 10, "#d6b47c");
  for (const dx of [6, w - 13]) rect(x + dx, y + 22, 7, h - 22, "#c9a170");
  poly(
    [
      [x - 15, y + 36],
      [x + 15, y],
      [x + w - 15, y],
      [x + w + 15, y + 36],
    ],
    "#c7ad72",
  );
  for (let dx = 2; dx < w; dx += 10) rect(x + dx, y + 13, 3, 21, "#e4ce91");
  rect(x - 14, y + 34, w + 28, 7, "#ad8855");
  for (let i = 0; i < 4; i++) {
    rect(x + 28 + i * 28, y + 61, 9, 20, i % 2 ? "#8cb9a4" : "#dba36e");
    rect(x + 31 + i * 28, y + 55, 3, 9, "#eee4bc");
  }
  label(x + w / 2, y + 51, "BEACHBAR", "#f4e4b5");
}
function drawBeachPier() {
  const { x, w, end } = beachPier;
  if (x + 130 < cameraX || x - w > cameraX + W) return;
  const start = shorelineY(x) - 25;
  rect(x - w / 2 - 4, start + 8, w + 8, end - start, "#356c74");
  rect(x - w / 2, start, w, end - start, "#876748");
  for (let y = start; y < end; y += 15) {
    rect(x - w / 2 + 2, y, w - 4, 12, "#c29d68");
    rect(x - w / 2 + 5, y + 2, w - 10, 2, "#dec391");
  }
  for (let y = start + 30; y < end; y += 65)
    for (const dx of [-w / 2 - 3, w / 2 - 3]) {
      rect(x + dx, y - 13, 6, 23, "#77553e");
      rect(x + dx - 1, y - 16, 8, 5, "#d0ae7c");
    }
  const bx = x + w / 2 + 45,
    by = end - 78;
  poly(
    [
      [bx, by - 58],
      [bx + 28, by - 29],
      [bx + 26, by + 40],
      [bx, by + 58],
      [bx - 26, by + 40],
      [bx - 28, by - 29],
    ],
    "#754f36",
  );
  poly(
    [
      [bx, by - 48],
      [bx + 20, by - 25],
      [bx + 18, by + 35],
      [bx, by + 46],
      [bx - 18, by + 35],
      [bx - 20, by - 25],
    ],
    "#d9b582",
  );
  rect(bx - 18, by - 8, 36, 7, "#997447");
  rect(bx - 17, by + 24, 34, 7, "#997447");
  rect(bx - 2, by - 24, 4, 64, "#edd7a1");
  poly(
    [
      [bx - 1, by - 22],
      [bx + 20, by + 14],
      [bx + 2, by + 14],
    ],
    "#eeeade",
  );
  rect(x + w / 2, by - 28, 27, 2, "#e2d2a2");
}
function drawScene() {
  if (interior) {
    drawInterior();
    return;
  }
  cameraX = Math.max(0, Math.min(WORLD.width - W, p.x - W * 0.45));
  cameraY = Math.max(0, Math.min(WORLD.height - H, p.y - H * 0.55));
  ctx.save();
  ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
  const left = Math.max(0, Math.floor(cameraX / 16) * 16);
  for (let x = left; x < Math.min(WORLD.width, cameraX + W + 16); x += 16) {
    const land = landscapeAt(x);
    rect(x, cameraY, 16, H + 1, land.ground);
    if (x >= homeForest.start && x < homeForest.end) {
      rect(x, cameraY, 16, H + 1, "#496f46");
    }
    if (x + 16 > homeRoadStart)
      rect(
        Math.max(x, homeRoadStart),
        pathY(x) - 38,
        x + 17 - Math.max(x, homeRoadStart),
        76,
        land.path,
      );
    if (x >= mountain.start && x < mountain.end) {
      const edge = mountainEdgeY(x);
      rect(x, edge, 16, WORLD.height - edge, "#5e655d");
      rect(x, edge, 16, 8, "#c2b99a");
      if (x <= ladder.x + 20) {
        rect(
          x,
          ladder.bottom - 8,
          16,
          WORLD.height - ladder.bottom + 8,
          land.ground,
        );
        if (x < ladder.x) rect(x, ladder.bottom - 7, 16, 45, land.path);
      }
    }
    const weight = (biomes) =>
      (biomes.includes(stages[land.left].biome) ? 1 - land.amount : 0) +
      (biomes.includes(stages[land.right].biome) ? land.amount : 0);
    const mountainWeight = weight([
      "mountain",
      "snowMountain",
      "descent",
      "highForest",
    ]);
    const snowWeight = weight(["snowMountain", "snowTown"]);
    const desertWeight = weight(["desert", "desertTown"]);
    if (mountainWeight > 0.02) {
      const ridge = 245 + Math.sin(x / 120) * 35;
      const height = (ridge - 120) * mountainWeight;
      rect(x, 120, 16, height, "#7e8373");
      rect(x, 120 + height - 5, 16, 5, "#c0bc9d");
      ctx.save();
      ctx.globalAlpha = snowWeight;
      rect(x, 120, 16, height, "#a7b7b1");
      rect(x, 120 + height - 7, 16, 7, "#edf3ee");
      ctx.restore();
    }
    if (desertWeight > 0.15) {
      rect(x, 250 + Math.sin(x / 180) * 20, 16, 3, "#cfad77");
      rect(x, 820 + Math.sin(x / 200) * 24, 16, 3, "#efd9a4");
    }
    if (x > 10550) {
      const shore = shorelineY(x);
      rect(x, shore, 16, WORLD.height - shore, "#69b8b5");
      rect(x, shore, 16, 5, "#eef0cf");
      rect(
        x,
        shore + 30 + Math.sin(animationTime * 2 + x / 70) * 4,
        16,
        2,
        "#bce6d3",
      );
    }
  }
  // The beach opens into the sea on the eastern side as well as the south.
  if (cameraX + W > 11080)
    for (let y = Math.floor(cameraY / 16) * 16; y < cameraY + H + 16; y += 16) {
      const edge = shorelineX(y);
      rect(edge, y, WORLD.width - edge, 17, "#69b8b5");
      if (y < shorelineY(edge) - 5) {
        rect(edge - 5, y, 5, 17, "#eef0cf");
        rect(
          edge + 28 + Math.sin(animationTime * 2 + y / 70) * 4,
          y,
          2,
          17,
          "#bce6d3",
        );
      }
    }
  drawGroundSnow(cameraX - 70, cameraX + W + 70);
  drawMeadowLake();
  drawBeachPier();
  // A small public square connects the town well to the southern roadside.
  rect(fountain.x - 23, pathY(fountain.x) + 34, 46, 66, "#e7cc98");
  rect(fountain.x - 55, fountain.y - 32, 110, 76, "#d5b584");
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 5; col++)
      rect(
        fountain.x - 52 + col * 22,
        fountain.y - 28 + row * 25,
        19,
        21,
        "#e6c99a",
      );
  // Continuous paths to doors let every settlement be explored.
  for (const h of houses) {
    const center = h.x + h.w / 2;
    rect(
      center - 22,
      h.y + h.h,
      44,
      pathY(center) - h.y - h.h + 10,
      landscapeAt(center).path,
    );
  }
  if (river.x + river.w > cameraX && river.x < cameraX + W) {
    rect(river.x, 0, river.w, WORLD.height, "#629e9c");
    for (let y = 0; y < WORLD.height; y += 30)
      rect(river.x + 15, y, 38, 2, "#acd1ba");
    const bridgeY = pathY(river.x + river.w / 2);
    rect(river.x - 12, bridgeY - 45, river.w + 24, 90, "#76543a");
    for (let x = river.x - 8; x < river.x + river.w + 12; x += 12)
      rect(x, bridgeY - 43, 10, 86, "#cfa46a");
    rect(river.x - 12, bridgeY - 48, river.w + 24, 5, "#ecd299");
    rect(river.x - 12, bridgeY + 43, river.w + 24, 5, "#ecd299");
  }
  // The western cliff edge closes the shortcut around the mountain.
  rect(mountain.start, 90, 20, ladder.bottom - 100, "#626b60");
  drawMountainFace(cameraX - 50, cameraX + W + 50);
  rect(
    ladder.x - 17,
    ladder.top - 8,
    34,
    ladder.bottom - ladder.top + 16,
    "#493f33",
  );
  for (const x of [ladder.x - 14, ladder.x + 10])
    rect(x, ladder.top - 8, 4, ladder.bottom - ladder.top + 16, "#b99258");
  for (let y = ladder.top; y <= ladder.bottom; y += 15)
    rect(ladder.x - 12, y, 24, 4, "#dbc18b");
  const objects = [];
  for (const t of homeGardenTrees)
    if (t.x > cameraX - 50 && t.x < cameraX + W + 50)
      objects.push({
        y: t.y,
        draw: () => {
          tree(t);
          mountainScrub(t.x - 17, t.y + 8, 19);
        },
      });
  for (let col = 0; col < 5; col++) {
    const x = homeForest.start + col * 29;
    if (x < cameraX - 55 || x > cameraX + W + 55) continue;
    for (let row = 0; row < 21; row++) {
      const y = 111 + row * 46 + (col % 2) * 19;
      objects.push({
        y,
        draw: () => {
          tree({ x: x + ((row * 7) % 9), y });
          if ((row + col) % 3 === 0) mountainScrub(x - 10, y + 9, 18);
        },
      });
    }
  }
  if (beachBar.x + beachBar.w > cameraX && beachBar.x < cameraX + W)
    objects.push({ y: beachBar.y + beachBar.h, draw: drawBeachBar });
  for (const chair of beachLoungers)
    if (chair.x > cameraX - 80 && chair.x < cameraX + W + 80)
      objects.push({
        y: chair.y + 18,
        draw: () => {
          if (chair.brother) drawBeachBrother(ctx, chair);
          else drawLounger(chair);
        },
      });
  for (let i = 0; i < 2; i++) {
    const x = i
      ? 11000 + Math.sin(animationTime * 0.22) * 35
      : beachBar.x + beachBar.w / 2;
    const y = i ? pathY(x) + 75 : beachBar.y + beachBar.h + 30;
    if (x > cameraX - 40 && x < cameraX + W + 40)
      objects.push({
        y,
        draw: () =>
          person(x, y, true, "", {
            role: i ? "beachWoman" : "beachMan",
            face: i
              ? Math.cos(animationTime * 0.22) > 0
                ? "right"
                : "left"
              : "down",
          }),
      });
  }
  for (let index = 0; index < meadowWildlife.length; index++) {
    const pose = wildlifePose(index, animationTime);
    if (pose.x > cameraX - 90 && pose.x < cameraX + W + 90)
      objects.push({
        y: pose.y,
        draw: () =>
          drawWildlife(ctx, {
            ...pose,
            time: animationTime + index,
            walking: !settings.reducedMotion,
          }),
      });
  }
  for (let index = 0; index < 2; index++) {
    const pose = camelPose(index, animationTime);
    if (pose.x > cameraX - 80 && pose.x < cameraX + W + 80)
      objects.push({
        y: pose.y,
        draw: () =>
          drawCamel(ctx, {
            ...pose,
            time: animationTime + index,
            walking: !settings.reducedMotion,
          }),
      });
  }
  const rabbitX = 1770 + Math.sin(animationTime * 0.35) * 60;
  const rabbitY = pathY(rabbitX) - 25;
  if (rabbitX > cameraX - 40 && rabbitX < cameraX + W + 40)
    objects.push({
      y: rabbitY,
      draw: () =>
        rabbit({
          x: rabbitX,
          y: rabbitY,
          facing: Math.cos(animationTime * 0.35) >= 0 ? 1 : -1,
          lift: Math.abs(Math.sin(animationTime * 4)) * 7,
        }),
    });
  if (fountain.x > cameraX - 60 && fountain.x < cameraX + W + 60)
    objects.push({
      y: fountain.y + fountain.h / 2,
      draw: () => {
        const { x, y } = fountain;
        shadow(x, y + 28, 84);
        rect(x - 38, y - 18, 76, 45, "#947853");
        rect(x - 35, y - 23, 70, 40, "#d4bd91");
        rect(x - 29, y - 18, 58, 24, "#385e63");
        rect(x - 25, y - 15, 50, 18, "#65aaa4");
        rect(x - 18, y - 12, 22, 2, "#bce1cb");
        rect(x - 38, y + 7, 76, 7, "#eed4a2");
        for (const dx of [-24, 0, 24]) rect(x + dx, y + 15, 2, 10, "#ac9067");
        for (const dx of [-33, 27]) {
          rect(x + dx, y - 66, 6, 63, "#8d623d");
          rect(x + dx + 1, y - 62, 2, 50, "#bf925b");
        }
        rect(x - 39, y - 69, 78, 8, "#b78b53");
        poly(
          [
            [x - 46, y - 68],
            [x, y - 84],
            [x + 46, y - 68],
          ],
          "#c89064",
        );
        rect(x - 47, y - 68, 94, 5, "#e2b57c");
        rect(x + 6, y - 61, 2, 40, "#e2cf9b");
        rect(x, y - 26, 16, 13, "#a57a4e");
        rect(x - 1, y - 28, 18, 3, "#d2b178");
      },
    });
  const firstCell = Math.max(0, Math.floor((cameraX - 70) / 75));
  const lastCell = Math.ceil((cameraX + W + 70) / 75);
  for (let cell = firstCell; cell <= lastCell; cell++) {
    const x = cell * 75 + ((cell * 29) % 37);
    if (x > WORLD.width - 60) continue;
    for (let row = 0; row < 5; row++) {
      const climate = landscapeAt(x);
      const variation = ((cell * 43 + row * 29) % 100) / 100;
      const biome =
        stages[variation < climate.amount ? climate.right : climate.left].biome;
      const y = 160 + row * 165 + ((cell * 53 + row * 31) % 70);
      if (!canWalkJourney(x, y)) continue;
      if (Math.abs(x - fountain.x) < 80 && Math.abs(y - fountain.y) < 90)
        continue;
      if (
        Math.abs(y - pathY(x)) < 100 ||
        houses.some(
          (h) =>
            x > h.x - 45 &&
            x < h.x + h.w + 45 &&
            y > h.y - 65 &&
            y < pathY(x) + 45,
        )
      )
        continue;
      if (x > 10550 && y > 735) continue;
      const forest = biome === "forest" || biome === "highForest";
      const snow = biome === "snowMountain" || biome === "snowTown";
      if (forest || (snow && cell % 3 === 0))
        objects.push({ y, draw: () => pine(x, y, snowCover(x)) });
      else if (biome === "desertTown" && cell % 3 === 0)
        objects.push({ y, draw: () => palm(x, y) });
      else if (
        ["mountain", "snowMountain", "descent", "desert"].includes(biome)
      ) {
        if (cell % 2 === 0)
          objects.push({
            y,
            draw: () => {
              rock({ x, y: y - 16, w: 32, h: 22 });
              const cover = snowCover(x);
              if (cover) snowdrift(x + 3, y - 9, 27, 7, cover);
            },
          });
      } else if (biome !== "beach") {
        if (cell % 4 === 0) objects.push({ y, draw: () => tree({ x, y }) });
        else {
          rect(x, y, 2, 6, "#638251");
          rect(x - 2, y - 2, 6, 3, row % 2 ? "#eddaa0" : "#dca796");
        }
      }
    }
  }
  for (const h of houses)
    if (h.x + h.w > cameraX - 30 && h.x < cameraX + W + 30)
      objects.push({
        y: h.y + h.h,
        draw: () => {
          if (h.kind === "cave") {
            drawCaveEntrance(h);
            return;
          }
          if (h.kind === "tent") {
            tent(h);
            return;
          }
          house(h);
          if (h.biome === "snowTown") {
            poly(
              [
                [h.x - 9, h.y + 42],
                [h.x + 8, h.y],
                [h.x + h.w - 8, h.y],
                [h.x + h.w + 9, h.y + 42],
              ],
              "#f0eee0",
            );
            rect(h.x + 10, h.y + 7, h.w - 20, 3, "#c4d4ca");
          } else if (h.biome === "desertTown") {
            rect(h.x - 6, h.y + 8, h.w + 12, 38, "#c89064");
            rect(h.x - 8, h.y + 7, h.w + 16, 8, "#e1b582");
          }
        },
      });
  for (const index of [1, 6, 10, 12]) {
    for (let resident = 0; resident < (index === 6 ? 2 : 1); resident++) {
      const phase = animationTime * 0.35 + index + resident * 2;
      const x = index * 800 + 405 + resident * 140 + Math.sin(phase) * 75;
      const y = pathY(x) - 30;
      if (x > cameraX - 40 && x < cameraX + W + 40)
        objects.push({
          y,
          draw: () =>
            person(x, y, true, "", {
              face: Math.cos(phase) > 0 ? "right" : "left",
              role:
                index === 6
                  ? resident
                    ? "snowWomanOutdoor"
                    : "snowManOutdoor"
                  : index === 10
                    ? "desertMan"
                    : index % 2
                      ? "mina"
                      : "jona",
            }),
        });
    }
  }
  if (brother.x > cameraX - 100 && brother.x < cameraX + W + 100) {
    objects.push({
      y: brother.y,
      draw: () => {
        label(brother.x, brother.y - 52, "DEIN BRUDER");
      },
    });
  }
  objects.push({ y: p.y, draw: () => person(p.x, p.y) });
  objects
    .sort((a, b) => a.y - b.y)
    .forEach((o) => {
      o.draw();
    });
  ctx.restore();
}

function draw() {
  drawScene();
  if (!sceneTransition) return;
  const progress = Math.min(1, sceneTransition.elapsed / 0.48);
  const opacity = 1 - Math.abs(progress * 2 - 1);
  ctx.save();
  ctx.globalAlpha = opacity;
  rect(0, 0, W, H, "#142e2a");
  ctx.restore();
}
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  if (!document.hidden) draw();
  requestAnimationFrame(frame);
}
hud();
save();
requestAnimationFrame(frame);
if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
  navigator.serviceWorker.register("./sw.js").catch(() => {});

function stopSwipe() {
  swipe = null;
  swipeVector = { x: 0, y: 0 };
  $("thumbstick").hidden = true;
}
$("swipeZone").onpointerdown = (e) => {
  if (paused || !$("dialog").hidden || swipe) return;
  e.preventDefault();
  $("swipeZone").setPointerCapture(e.pointerId);
  swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
  swipeVector = { x: 0, y: 0 };
  $("thumbstick").style.left = `${e.clientX}px`;
  $("thumbstick").style.top = `${e.clientY}px`;
  $("thumbstick").hidden = false;
  $("thumb").style.transform = "translate(0px,0px)";
};
$("swipeZone").onpointermove = (e) => {
  if (swipe?.id !== e.pointerId) return;
  e.preventDefault();
  swipeVector = swipeDirection(swipe.x, swipe.y, e.clientX, e.clientY);
  const distance = Math.min(
    36,
    Math.hypot(e.clientX - swipe.x, e.clientY - swipe.y),
  );
  $("thumb").style.transform =
    `translate(${swipeVector.x * distance}px,${swipeVector.y * distance}px)`;
};
for (const event of ["onpointerup", "onpointercancel", "onlostpointercapture"])
  $("swipeZone")[event] = (e) => {
    if (swipe?.id === e.pointerId) stopSwipe();
  };
