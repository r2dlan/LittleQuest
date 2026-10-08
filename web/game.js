import {
  collectBoard,
  collectGear,
  feedFox,
  fixMachine,
  freshState,
  normalizeSave,
  objective,
  pressSwitch,
  repairBridge,
} from "./quest.js";
import { normalizeSettings } from "./settings.js";
import { swipeDirection } from "./swipe.js";
import {
  boards,
  gears,
  houses,
  move,
  nearby,
  places,
  rocks,
  spawn,
  switches,
  trees,
  WORLD,
} from "./world.js";

const $ = (id) => document.getElementById(id),
  canvas = $("world"),
  ctx = canvas.getContext("2d");
let s = freshState(),
  storage = true;
try {
  s = normalizeSave(JSON.parse(localStorage.getItem("littlequest-v1")));
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
function resize() {
  const zoom = Math.max(1.15, Math.min(innerWidth / 640, innerHeight / 390));
  W = Math.round(innerWidth / zoom);
  H = Math.round(innerHeight / zoom);
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
}
addEventListener("resize", resize);
resize();
function save() {
  s.x = p.x;
  s.y = p.y;
  s.viewVersion = 2;
  try {
    localStorage.setItem("littlequest-v1", JSON.stringify(s));
    storage = true;
  } catch {
    storage = false;
  }
  $("saveNote").textContent = storage
    ? "Dein Fortschritt wird automatisch auf diesem Gerät gespeichert."
    : "Speichern ist hier nicht verfügbar. Lass das Spiel geöffnet.";
}
function hud() {
  const [a, b] = objective(s);
  $("objective").textContent = a;
  $("hint").textContent = b;
  $("boards").textContent = `${s.boards.length} / 3`;
  $("apple").textContent = s.caveAccepted
    ? `⚙ ${s.gears.length} / 3`
    : s.apple
      ? "🍎 1"
      : "";
  $("area").textContent =
    p.x < 900
      ? "FLÜSTERWALD"
      : p.x < 1830
        ? "WEIDENDORF"
        : p.x < 2630
          ? "FLÜSTERHÖHLE"
          : "SONNENSEE";
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
function say(speaker, title, text, label = "Weiter", action = () => {}) {
  clearInput();
  $("speaker").textContent = speaker;
  $("dialogTitle").textContent = title;
  $("dialogText").textContent = text;
  $("dialogNext").textContent = label;
  $("dialog").hidden = false;
  dialogAction = action;
}
$("dialogNext").onclick = () => {
  $("dialog").hidden = true;
  const f = dialogAction;
  dialogAction = null;
  f?.();
  hud();
  save();
};
function target() {
  if (s.repaired) {
    if (nearby(p, places.mina)) return "mina";
    if (s.caveAccepted && nearby(p, places.clue)) return "clue";
    if (s.caveAccepted && nearby(p, places.machine)) return "machine";
    for (const b of switches)
      if (s.caveAccepted && nearby(p, b, 40)) return `switch${b.id}`;
  }
  if (nearby(p, places.jona)) return "jona";
  if (nearby(p, places.fox)) return "fox";
  if (nearby(p, places.apple) && s.accepted && !s.apple && !s.foxFed)
    return "apple";
  return null;
}
function interact() {
  if (paused || !$("dialog").hidden) return;
  const t = target();
  if (caveInteract(t)) return;
  if (t === "jona") {
    if (!s.accepted)
      say(
        "JONA · HANDWERKER",
        "Die kaputte Brücke",
        "Gut, dass du da bist! Die Brücke ist kaputt. Ich brauche drei Bretter. Im Wald links liegen noch welche. Aber pass auf: Ein Fuchs hat eines in seinen Bau gezogen.",
        "Ich helfe dir",
        () => {
          s.accepted = true;
          toast("Neue Aufgabe: Finde drei Bretter");
        },
      );
    else if (s.repaired)
      say(
        "JONA · HANDWERKER",
        "Ein neuer Weg",
        "Danke! Die Brücke ist wieder sicher. Rechts wartet das nächste Abenteuer auf dich.",
      );
    else if (s.boards.length === 3)
      say(
        "JONA · HANDWERKER",
        "Genau die richtigen Bretter!",
        "Damit kann ich die Brücke reparieren. Gemeinsam bekommen wir das hin.",
        "Brücke reparieren",
        () => {
          repairBridge(s);
          toast("Die Brücke ist repariert! Ein neuer Weg ist offen.");
        },
      );
    else
      say(
        "JONA · HANDWERKER",
        "Ein Brett nach dem anderen",
        `Du hast schon ${s.boards.length} von drei Brettern. Schau auch auf den kleinen Waldlichtungen nach. Der Fuchs mag Äpfel – vielleicht hilft dir das weiter.`,
      );
  } else if (t === "fox") {
    if (!s.accepted)
      say(
        "EIN KLEINER FUCHS",
        "Raschel, raschel …",
        "Aus dem Bau schaut ein neugieriger Fuchs. Unter seinen Pfoten liegt ein Brett.",
      );
    else if (s.foxFed)
      say(
        "EIN KLEINER FUCHS",
        "Zufriedenes Knuspern",
        "Der Fuchs genießt seinen Apfel. Das Brett vor dem Bau gehört jetzt dir.",
      );
    else if (s.apple)
      say(
        "EIN KLEINER FUCHS",
        "Ein fairer Tausch",
        "Der Fuchs schnuppert an deinem Apfel. Möchtest du ihn vor den Bau legen?",
        "Apfel hinlegen",
        () => {
          feedFox(s);
          toast("Der Fuchs kommt heraus. Das dritte Brett ist frei!");
        },
      );
    else
      say(
        "EIN KLEINER FUCHS",
        "Ein hungriger Waldbewohner",
        "Der Fuchs hält das Brett fest. Vielleicht lässt er sich mit einem Apfel hervorlocken. Am Baum rechts wächst einer.",
      );
  } else if (t === "apple") {
    s.apple = true;
    toast("Ein Apfel! Der Fuchs wird sich freuen.");
    save();
    hud();
  }
}

function cavePrompt(t) {
  return t === "mina"
    ? "E / ✋ · Mit Mina sprechen"
    : t === "clue"
      ? "E / ✋ · Hinweisstein lesen"
      : t === "machine"
        ? "E / ✋ · Alte Maschine"
        : t?.startsWith("switch")
          ? "E / ✋ · Schalter drücken"
          : "";
}
function caveInteract(t) {
  if (t === "mina") {
    if (!s.caveAccepted)
      say(
        "MINA · TÜFTLERIN",
        "Die alte Wassermaschine",
        "Diese Maschine leitete früher Quellwasser ins Dorf. Drei Zahnräder fehlen. Zwei liegen zwischen den Felsen, das dritte in einer verschlossenen Kammer. Der Hinweisstein verrät, wie sie aufgeht. Hilfst du mir?",
        "Zahnräder suchen",
        () => {
          s.caveAccepted = true;
          toast("Neue Aufgabe: Die alte Maschine");
        },
      );
    else
      say(
        "MINA · TÜFTLERIN",
        s.machineFixed ? "Es fließt wieder!" : "Ein altes Geheimnis",
        s.machineFixed
          ? "Du hast es geschafft! Das Tor zum See ist offen, und das Dorf bekommt wieder Quellwasser. Danke!"
          : "Auf dem Hinweisstein stehen drei Symbole. Drücke die Schalter in genau dieser Reihenfolge. Die Lichtpunkte zeigen deinen Fortschritt.",
      );
    return true;
  }
  if (t === "clue") {
    say(
      "EIN VERWITTERTER HINWEIS",
      "Die Nacht vor dem Morgen",
      "„Zuerst der Mond. Dann die Sonne. Zuletzt der Stern. So öffnet sich die Kammer im Stein.“ Die Schalter von links nach rechts: Sonne, Mond, Stern.",
      "Verstanden",
    );
    return true;
  }
  if (t?.startsWith("switch")) {
    if (s.switches.length === 3) toast("Die Kammer ist bereits offen.");
    else {
      const ok = pressSwitch(s, Number(t.slice(6)));
      toast(
        ok
          ? s.switches.length === 3
            ? "Die Steinkammer öffnet sich!"
            : "Ein Licht beginnt zu leuchten."
          : "Falsche Reihenfolge. Die Lichter erlöschen.",
      );
    }
    save();
    return true;
  }
  if (t === "machine") {
    if (s.machineFixed)
      say(
        "DIE ALTE MASCHINE",
        "Ein sanftes Rattern",
        "Wasser fließt wieder durch die Leitung. Das Tor zum See steht offen.",
      );
    else if (s.gears.length === 3)
      say(
        "DIE ALTE MASCHINE",
        "Alles passt zusammen",
        "Du setzt die drei Zahnräder in die Maschine. Ein Handgriff fehlt noch.",
        "Maschine starten",
        () => {
          fixMachine(s);
          toast("Die Maschine läuft! Das Tor zum See ist offen.");
        },
      );
    else
      say(
        "DIE ALTE MASCHINE",
        "Drei leere Plätze",
        `Noch fehlen Zahnräder. Du hast ${s.gears.length} von drei gefunden.`,
      );
    return true;
  }
  return false;
}
function down(k) {
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
  if (!settings.reducedMotion) animationTime += dt;
  if (time > toastUntil) $("toast").classList.remove("visible");
  if (paused || !$("dialog").hidden) return;
  let dx = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0),
    dy = (keys.has("down") ? 1 : 0) - (keys.has("up") ? 1 : 0);
  if (!dx && !dy) {
    dx = swipeVector.x;
    dy = swipeVector.y;
  }
  p.walking = !!(dx || dy);
  if (Math.abs(dy) > Math.abs(dx)) p.face = dy > 0 ? "down" : "up";
  else if (dx) p.face = dx > 0 ? "right" : "left";
  const length = Math.hypot(dx, dy) || 1;
  move(p, (dx / length) * 125 * dt, (dy / length) * 125 * dt, s);
  for (const item of boards)
    if (nearby(p, item, 24) && collectBoard(s, item.id)) {
      toast(`Brett gefunden · ${s.boards.length} / 3`);
      save();
    }
  for (const item of gears)
    if (nearby(p, item, 24) && collectGear(s, item.id)) {
      toast(`Zahnrad gefunden · ${s.gears.length} / 3`);
      save();
    }
  if (p.x > 1845 && s.repaired && !s.finished) {
    s.finished = true;
    save();
    say(
      "DER NEUE WEG",
      "Die Brücke steht!",
      "Der Fuchs ist satt und das Dorf hat einen neuen Weg. Am Höhleneingang wartet Mina auf dich. Sie hat etwas entdeckt …",
      "Weiter erkunden",
    );
  }
  if (p.x > 2730 && s.machineFixed && !s.lakeReached) {
    s.lakeReached = true;
    save();
    say(
      "SONNENSEE",
      "Ein Licht hinter den Felsen",
      "Die Maschine rattert, das Tor steht offen und vor dir glitzert der See. Mina kann wieder Wasser ins Dorf leiten. Zwei kleine Geschichten – und eine Welt, die sich verändert.",
      "Am See verweilen",
    );
  }
  const t = target();
  $("prompt").textContent =
    cavePrompt(t) ||
    (t === "jona"
      ? "E / ✋ · Mit Jona sprechen"
      : t === "fox"
        ? "E / ✋ · Den Fuchs besuchen"
        : t === "apple"
          ? "E / ✋ · Apfel pflücken"
          : p.x > 1590 && p.x < 1650 && !s.repaired
            ? "Die Brücke ist kaputt. Hilf Jona."
            : p.x > 2540 && p.x < 2630 && !s.machineFixed
              ? "Das Tor ist zu. Repariere die Maschine."
              : "");
  saveTimer += dt;
  if (saveTimer > 2) {
    save();
    saveTimer = 0;
  }
  hud();
}
const rect = (x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
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
  const { x, y, w, h } = o;
  rect(x + 7, y + h - 8, w, 16, "#31584040");
  rect(x, y + 44, w, h - 44, "#d9be8f");
  rect(x + 6, y + 50, w - 12, h - 57, "#eddaa8");
  rect(x + 13, y + 55, 7, h - 55, "#9a704d");
  rect(x + w - 20, y + 55, 7, h - 55, "#9a704d");
  rect(x, y + h - 27, w, 6, "#a68152");
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
  rect(x + w / 2 - 20, y + h, 40, 12, "#b6a583");
}
function person(x, y, npc = false, name = "") {
  shadow(x, y + 3, 23);
  const face = npc ? "down" : p.face,
    bob = !npc && p.walking ? Math.sin(animationTime * 14) * 1 : 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  if (face === "left") ctx.scale(-1, 1);
  const side = face === "left" || face === "right";
  const step = !npc && p.walking ? Math.sin(animationTime * 14) * 2 : 0;
  rect(-7, -4, 6, 8 + step, "#354b4b");
  rect(2, -4, 6, 8 - step, "#354b4b");
  rect(-8, 4 + step, 8, 3, "#493d2c");
  rect(2, 4 - step, 8, 3, "#493d2c");
  if (!npc) {
    rect(-9, -15, 18, 9, "#b95845");
    rect(-11, -13, 5, 12, "#d57349");
  }
  rect(-8, -20, 16, 15, npc ? "#73938b" : "#eee2b6");
  rect(-11, -18, 4, 10, "#e4b17a");
  rect(8, -18, 4, 10, "#e4b17a");
  rect(-7, -33, 16, 15, "#eec08b");
  rect(-10, -38, 20, 10, npc ? "#8b8170" : "#654731");
  rect(-10, -30, 4, 12, npc ? "#8b8170" : "#654731");
  rect(-6, -41, 14, 5, npc ? "#aa9873" : "#805839");
  if (face === "up") {
    rect(-7, -29, 16, 9, npc ? "#8b8170" : "#654731");
  } else if (side) {
    rect(7, -28, 3, 3, "#243c35");
    rect(9, -25, 4, 4, "#eec08b");
  } else {
    rect(-3, -28, 2, 3, "#243c35");
    rect(5, -28, 2, 3, "#243c35");
  }
  ctx.restore();
  if (name) label(x, y - 49, name);
}
function fox() {
  const { x, y } = places.fox;
  const xx = s.foxFed ? x + 36 : x;
  shadow(xx, y + 4, 32);
  rect(xx - 14, y - 12, 26, 13, "#cc793e");
  rect(xx + 7, y - 20, 14, 15, "#e59b4b");
  poly(
    [
      [xx + 8, y - 18],
      [xx + 10, y - 28],
      [xx + 17, y - 18],
    ],
    "#d8873b",
  );
  rect(xx + 16, y - 12, 9, 7, "#f1dfb1");
  rect(xx + 17, y - 17, 2, 2, "#243c35");
  poly(
    [
      [xx - 10, y - 4],
      [xx - 32, y - 17],
      [xx - 36, y - 12],
      [xx - 21, y + 1],
    ],
    "#dd8d42",
  );
  rect(xx - 35, y - 17, 8, 6, "#f1dfb1");
}
function board(x, y) {
  shadow(x, y + 4, 22);
  rect(x - 14, y - 5, 28, 10, "#936138");
  rect(x - 13, y - 6, 26, 7, "#e0b36a");
  rect(x - 9, y - 4, 19, 1, "#f4ce89");
  rect(x + 8, y - 3, 2, 3, "#95663f");
}
function gear(x, y) {
  shadow(x, y + 5, 24);
  ctx.save();
  ctx.translate(x, y - 3);
  ctx.rotate(animationTime * 0.4);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    rect(-3, -13, 6, 6, "#c5b478");
  }
  rect(-8, -8, 16, 16, "#dad09c");
  rect(-3, -3, 6, 6, "#566d62");
  ctx.restore();
}
function ground() {
  const x0 = Math.floor(cameraX / 32) * 32,
    y0 = Math.floor(cameraY / 32) * 32;
  for (let y = y0; y < cameraY + H + 32; y += 32)
    for (let x = x0; x < cameraX + W + 32; x += 32) {
      const cave = x >= 1830 && x < 2630;
      const n = (x * 17 + y * 23) % 7;
      rect(
        x,
        y,
        32,
        32,
        cave ? (n < 3 ? "#344747" : "#394d4b") : n < 3 ? "#72975c" : "#779e60",
      );
      if (cave) {
        rect(x + 7, y + 13, 12, 2, "#435a54");
      } else {
        rect(x + 6, y + 8, 2, 3, "#90b474");
        rect(x + 20, y + 24, 3, 2, "#608850");
      }
    }
  // Small paths connect every clearing; objects remain free to explore.
  rect(0, 505, 1650, 70, "#c5b47e");
  rect(445, 195, 62, 350, "#b3ab70");
  rect(155, 280, 345, 56, "#b3ab70");
  rect(465, 350, 275, 54, "#b3ab70");
  rect(396, 540, 55, 135, "#b3ab70");
  rect(1240, 380, 58, 420, "#c5b47e");
  rect(1390, 403, 135, 115, "#c5b47e");
  rect(950, 395, 120, 120, "#c5b47e");
  rect(1870, 508, 730, 63, "#607166");
  rect(2018, 280, 58, 250, "#59675e");
  rect(2255, 325, 60, 210, "#59675e");
  rect(2210, 555, 60, 112, "#59675e");
  rect(2428, 222, 64, 320, "#59675e");
  rect(2630, 505, 570, 70, "#c5b47e");
}
function draw() {
  cameraX = Math.max(0, Math.min(WORLD.width - W, p.x - W * 0.5));
  cameraY = Math.max(0, Math.min(WORLD.height - H, p.y - H * 0.54));
  ctx.fillStyle = "#759b60";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(-Math.round(cameraX), -Math.round(cameraY));
  ground();
  // River and bridge.
  rect(1650, 0, 180, WORLD.height, "#5c9f9d");
  for (let y = 0; y < WORLD.height; y += 35) {
    for (let i = 0; i < 3; i++)
      rect(
        1662 + i * 50 + Math.sin(animationTime + y) * 5,
        y,
        24,
        2,
        "#a5d7c0",
      );
  }
  rect(1642, 0, 8, WORLD.height, "#b0bc82");
  rect(1830, 0, 8, WORLD.height, "#b0bc82");
  if (s.repaired) {
    rect(1646, 479, 192, 122, "#856543");
    for (let i = 0; i < 12; i++) {
      rect(1650 + i * 15, 485, 12, 110, "#c39358");
      rect(1652 + i * 15, 485, 2, 110, "#dfb271");
    }
    rect(1645, 474, 190, 8, "#e2b475");
    rect(1645, 597, 190, 8, "#e2b475");
  } else {
    rect(1648, 481, 29, 115, "#a4824b");
    rect(1807, 481, 29, 115, "#a4824b");
    board(1665, 530);
    board(1820, 560);
  }
  // Cave boundaries and the switch-controlled room.
  rect(1830, 0, 800, 145, "#263c3e");
  rect(1830, 850, 800, 206, "#263c3e");
  for (const x of [1830, 2595]) {
    rect(x, 145, 35, 335, "#586b62");
    rect(x, 600, 35, 250, "#586b62");
  }
  for (let x = 1840; x < 2600; x += 60) {
    poly(
      [
        [x, 145],
        [x + 15, 174],
        [x + 33, 145],
      ],
      "#52665e",
    );
    rect(x, 831, 44, 20, "#51675d");
  }
  rect(2360, 145, 200, 20, "#697b6d");
  rect(2360, 145, 20, 160, "#697b6d");
  rect(2540, 145, 20, 160, "#697b6d");
  rect(2360, 285, 65, 20, "#697b6d");
  rect(2495, 285, 65, 20, "#697b6d");
  if (s.switches.length < 3) {
    rect(2425, 285, 70, 20, "#7a8f7e");
    for (let i = 0; i < 5; i++) rect(2428 + i * 14, 285, 4, 20, "#bed0a0");
  }
  if (!s.machineFixed) {
    rect(2595, 480, 35, 120, "#a4a788");
    for (let y = 480; y < 600; y += 20) rect(2595, y, 35, 4, "#627269");
  }
  // Lake and flowers.
  rect(2760, 230, 390, 235, "#579f9b");
  rect(2750, 225, 410, 7, "#b2c58d");
  rect(2750, 466, 410, 7, "#b2c58d");
  for (let i = 0; i < 24; i++)
    rect(
      2775 + ((i * 43 + animationTime * 9) % 355),
      250 + (i % 6) * 33,
      25,
      2,
      "#a1d9c3",
    );
  for (let i = 0; i < 50; i++) {
    const x = (i * 163) % 1600,
      y = 80 + ((i * 97) % 860);
    if ((x > 900 || y > 720) && Math.abs(y - 540) > 50) {
      rect(x, y, 3, 6, "#517b46");
      rect(x - 2, y - 2, 7, 4, i % 3 ? "#e3d890" : "#dcb1a0");
    }
  }
  rect(155, 250, 60, 45, "#5d6b45");
  rect(170, 263, 29, 20, "#233c2f");
  rect(places.apple.x - 8, places.apple.y - 11, 16, 18, "#b57d47");
  if (s.accepted && !s.apple && !s.foxFed) {
    rect(places.apple.x - 6, places.apple.y - 15, 12, 11, "#d36344");
    rect(places.apple.x, places.apple.y - 19, 5, 4, "#83a455");
  }
  const renderables = [
    ...trees.map((t) => ({ y: t.y, draw: () => tree(t) })),
    ...houses.map((o) => ({ y: o.y + o.h, draw: () => house(o) })),
    ...rocks.map((r) => ({ y: r.y + r.h, draw: () => rock(r) })),
    {
      y: places.jona.y,
      draw: () => {
        person(places.jona.x, places.jona.y, true, "JONA");
        if (!s.repaired)
          label(places.jona.x, places.jona.y - 61, s.accepted ? "…" : "!");
      },
    },
    {
      y: places.mina.y,
      draw: () => {
        person(places.mina.x, places.mina.y, true, "MINA");
        if (!s.caveAccepted) label(places.mina.x, places.mina.y - 61, "!");
      },
    },
    { y: places.fox.y, draw: fox },
    { y: p.y, draw: () => person(p.x, p.y) },
  ];
  renderables
    .sort((a, b) => a.y - b.y)
    .forEach((o) => {
      o.draw();
    });
  for (const item of boards)
    if (!s.boards.includes(item.id) && (item.id !== 3 || s.foxFed)) {
      board(item.x, item.y);
      rect(
        item.x - 1,
        item.y - 18 + Math.sin(animationTime * 3) * 2,
        3,
        3,
        "#ffe2a0",
      );
    }
  for (const item of gears)
    if (
      !s.gears.includes(item.id) &&
      (item.id !== 3 || s.switches.length === 3)
    )
      gear(item.x, item.y);
  for (const b of switches) {
    rect(b.x - 13, b.y - 10, 26, 22, "#718777");
    rect(
      b.x - 8,
      b.y - 15,
      16,
      9,
      s.switches.includes(b.id) ? "#edd284" : "#ac9e78",
    );
    label(b.x, b.y - 23, b.symbol);
  }
  rock({ x: places.clue.x - 22, y: places.clue.y - 24, w: 44, h: 32 });
  label(places.clue.x, places.clue.y - 8, "☾ ☀ ✦");
  rect(2475, 505, 70, 50, "#718a79");
  rect(2480, 508, 60, 5, "#b9c29b");
  for (let i = 0; i < 3; i++) {
    if (s.machineFixed) gear(2489 + i * 21, 530);
    else
      rect(
        2483 + i * 20,
        522,
        13,
        14,
        s.gears.length > i ? "#d4bb7b" : "#354d46",
      );
  }
  label(2510, 492, "WASSERMASCHINE");
  if (s.machineFixed) {
    rect(2545, 541, 95, 5, "#9ed9c3");
    for (let i = 0; i < 5; i++)
      rect(2545 + ((i * 20 + animationTime * 25) % 90), 541, 8, 2, "#deedce");
  }
  for (const t of [
    { x: 875, y: 520, text: "← WALD" },
    { x: 1560, y: 520, text: "HÖHLE →" },
    { x: 2670, y: 520, text: "SEE →" },
  ]) {
    rect(t.x - 4, t.y, 8, 21, "#926f43");
    rect(t.x - 30, t.y - 16, 60, 20, "#d9bd80");
    label(t.x, t.y - 3, t.text, "#445b3d");
  }
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
