export const STAGE_WIDTH = 800;
export const JOURNEY_WORLD = { width: STAGE_WIDTH * 14 + 320, height: 1100 };
export const stages = [
  {
    id: "S01",
    name: "Heimat",
    biome: "home",
    ground: "#88a969",
    path: "#caba88",
    hint: "Dein Zuhause. Hier beginnt die Suche nach deinem Bruder.",
  },
  {
    id: "S02",
    name: "Dorf",
    biome: "village",
    ground: "#80a166",
    path: "#c7b280",
    hint: "Hier lebt dein Freund. Später weiß er, wohin dein Bruder gegangen ist.",
  },
  {
    id: "S03",
    name: "Wald · Die Brücke",
    biome: "forest",
    ground: "#5e8655",
    path: "#b7a577",
    hint: "Ein Waldweg führt über den Fluss. Die Brücke ist für die Landschaftsvorschau offen.",
  },
  {
    id: "S04",
    name: "Wald · Der Aufstieg",
    biome: "highForest",
    ground: "#77865c",
    path: "#b9a784",
    hint: "Die Bäume werden lichter. Die Leiter führt zum Berg; die Reparaturaufgabe folgt später.",
  },
  {
    id: "S05",
    name: "Bergpfad",
    biome: "mountain",
    ground: "#93927b",
    path: "#c0b59b",
    hint: "Fels und Gräser begleiten den offenen Weg über den Berg.",
  },
  {
    id: "S06",
    name: "Schneehöhen",
    biome: "snowMountain",
    ground: "#dbe4e2",
    path: "#b9c5c6",
    hint: "Auf den Gipfeln bleibt der erste Schnee liegen.",
  },
  {
    id: "S07",
    name: "Schneestadt",
    biome: "snowTown",
    ground: "#e9efec",
    path: "#bcc6be",
    hint: "Eine Stadt zwischen Schnee und Tannen. Ihre Aufgaben sind noch offen.",
  },
  {
    id: "S08",
    name: "Abstieg",
    biome: "descent",
    ground: "#9dad83",
    path: "#c6bc99",
    hint: "Der Schnee schmilzt, der Bergpfad wird wieder grün.",
  },
  {
    id: "S09",
    name: "Weite Wiesen",
    biome: "meadow",
    ground: "#95b575",
    path: "#d3c18b",
    hint: "Blumen und Gras begleiten dich durch die Wiesen.",
  },
  {
    id: "S10",
    name: "Wüstenrand",
    biome: "desert",
    ground: "#dec58a",
    path: "#ebd59f",
    hint: "Das Gras wird spärlicher, warme Sanddünen tauchen auf.",
  },
  {
    id: "S11",
    name: "Wüstenstadt",
    biome: "desertTown",
    ground: "#dfc08a",
    path: "#ead19d",
    hint: "Zelte, Palmen und ein Brunnen mitten im Sand. Die Bewohner tragen weiße Gewänder.",
  },
  {
    id: "S12",
    name: "Grüne Rückkehr",
    biome: "newMeadow",
    ground: "#9bb87c",
    path: "#d6c493",
    hint: "Die Dünen gehen langsam wieder in eine grüne Wiese über.",
  },
  {
    id: "S13",
    name: "Wiesendorf",
    biome: "meadowVillage",
    ground: "#86aa71",
    path: "#d2bd88",
    hint: "Ein kleines Dorf vor der Küste. Der Weg führt weiter zum Meer.",
  },
  {
    id: "S14",
    name: "Strand",
    biome: "beach",
    ground: "#e7d8a2",
    path: "#eddfb5",
    hint: "Hier endet die Reise. Dein Bruder entspannt am Strand.",
  },
];
export const mountain = { start: 2800, end: 6400 };
export const ladder = { x: 2850, y: 600, bottom: 600, top: 340 };
const valleyPathY = (x) => 550 + Math.sin(x / 470) * 55;
export const mountainEdgeY = (x) =>
  420 + Math.max(0, Math.min(1, (x - 5600) / 800)) * 230;
export function pathY(x) {
  if (x >= 2700 && x < ladder.x) {
    const progress = Math.min(1, (x - 2700) / (mountain.start - 24 - 2700));
    return valleyPathY(2700) * (1 - progress) + ladder.bottom * progress;
  }
  if (x >= ladder.x && x < mountain.end) {
    const plateau = ladder.top + Math.sin((x - ladder.x) / 430) * 25;
    const descent = Math.max(0, Math.min(1, (x - 5600) / 800));
    return plateau * (1 - descent) + valleyPathY(x) * descent;
  }
  return valleyPathY(x);
}
export function onJourneyLadder(p) {
  return (
    Math.abs(p.x - ladder.x) <= 12 &&
    p.y > ladder.top + 8 &&
    p.y < ladder.bottom + 8
  );
}
export const shorelineY = (x) =>
  1100 -
  Math.max(0, Math.min(1, (x - 10550) / 350)) * 310 +
  Math.sin(x / 190) * 10;
export const shorelineX = (y) =>
  11135 + Math.sin(y / 130) * 12 - Math.max(0, y - 650) * 0.06;
export const stageAt = (x) =>
  stages[Math.max(0, Math.min(13, Math.floor(x / STAGE_WIDTH)))];
const rgb = (hex) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
export function landscapeAt(x) {
  const position = Math.max(0, Math.min(13, x / STAGE_WIDTH - 0.5));
  const left = Math.floor(position);
  const right = Math.min(13, left + 1);
  const amount = position - left;
  const mix = (key) => {
    const a = rgb(stages[left][key]),
      b = rgb(stages[right][key]);
    return `#${a
      .map((v, i) =>
        Math.round(v + (b[i] - v) * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  };
  return { ground: mix("ground"), path: mix("path"), left, right, amount };
}
export const journeyHouses = [];
for (const index of [0, 1, 6, 10, 12]) {
  const count = index === 0 ? 1 : 3;
  for (let n = 0; n < count; n++) {
    const x = index * STAGE_WIDTH + 170 + n * 185;
    journeyHouses.push({
      x,
      y: pathY(x) - 210 - (n % 2) * 30,
      w: 135,
      h: 112,
      biome: stages[index].biome,
      kind: index === 10 ? "tent" : "house",
      name:
        index === 0
          ? "DEIN ZUHAUSE"
          : `${stages[index].name} · ${index === 10 ? "Zelt" : "Haus"} ${n + 1}`,
    });
  }
}
export const river = { x: 1990, w: 100 };
export const snowCave = {
  x: 4355,
  y: 105,
  w: 130,
  h: 110,
  kind: "cave",
  biome: "snowMountain",
  name: "GIPFELHÖHLE",
};
journeyHouses.push(snowCave);
export const homeForest = { start: 0, end: 140 };
export const homeRoadStart = journeyHouses[0].x + journeyHouses[0].w / 2;
const home = journeyHouses[0];
export const homeGardenTrees = [
  { x: home.x - 48, y: home.y + 42 },
  { x: home.x - 40, y: home.y + 110 },
  { x: home.x + 24, y: home.y - 14 },
  { x: home.x + 88, y: home.y - 20 },
  { x: home.x + home.w + 39, y: home.y + 29 },
  { x: home.x + home.w + 48, y: home.y + 112 },
];
export const brother = { x: 10820, y: pathY(10820) + 95 };
export const beachBar = { x: 10595, y: 280, w: 165, h: 112 };
export const beachLoungers = [
  { x: 10700, y: 660 },
  { x: brother.x, y: brother.y, brother: true },
  { x: 11065, y: 650 },
];
export const beachPier = { x: 10920, w: 70, end: 1040 };
export const fountain = { x: 8400, y: pathY(8400) + 100, w: 76, h: 54 };
export const meadowLake = { x: 9230, y: 790, rx: 145, ry: 92 };
export function camelPose(index, time) {
  const phase = time * 0.12 + index * 2.2;
  const x = (index ? 8580 : 7410) + Math.sin(phase) * (index ? 120 : 150);
  return {
    x,
    y: pathY(x) + (index ? 245 : 150) + Math.sin(phase * 2) * 8,
    facing: Math.cos(phase) >= 0 ? 1 : -1,
  };
}
export const meadowWildlife = [
  { kind: "hedgehog", x: 6300, offset: -170, radius: 28 },
  { kind: "rabbit", x: 6670, offset: 155, radius: 65 },
  { kind: "deer", x: 7050, offset: -150, radius: 80 },
  { kind: "fox", x: 6900, offset: 235, radius: 60 },
  { kind: "fox", x: 8930, offset: -145, radius: 65 },
  { kind: "hedgehog", x: 9410, offset: -135, radius: 30 },
  { kind: "rabbit", x: 9810, offset: 155, radius: 70 },
  { kind: "deer", x: 10070, offset: 235, radius: 75 },
];
export function wildlifePose(index, time) {
  const animal = meadowWildlife[index];
  const phase = time * (animal.kind === "hedgehog" ? 0.13 : 0.2) + index * 1.7;
  const x = animal.x + Math.sin(phase) * animal.radius;
  return {
    kind: animal.kind,
    x,
    y: pathY(x) + animal.offset + Math.sin(phase * 2) * 7,
    facing: Math.cos(phase) >= 0 ? 1 : -1,
  };
}
export function lakeFishPose(index, time) {
  const phase = time * (0.24 + index * 0.035) + index * 1.7;
  const radius = 0.34 + index * 0.08;
  return {
    x: meadowLake.x + Math.cos(phase) * meadowLake.rx * radius,
    y: meadowLake.y + Math.sin(phase) * meadowLake.ry * radius,
    angle: Math.atan2(
      Math.cos(phase) * meadowLake.ry,
      -Math.sin(phase) * meadowLake.rx,
    ),
    tail: Math.sin(time * 7 + index * 2) * 2,
  };
}
export function journeyDoor(p) {
  return journeyHouses.findIndex(
    (h) =>
      Math.abs(p.x - h.x - h.w / 2) < 25 &&
      p.y >= h.y + h.h &&
      p.y <= h.y + h.h + 38,
  );
}
export function canWalkJourney(x, y) {
  if (
    x < 30 ||
    y < 90 ||
    x > JOURNEY_WORLD.width - 35 ||
    y > JOURNEY_WORLD.height - 35
  )
    return false;
  if (x + 9 > shorelineX(y)) return false;
  if (x - 9 < homeForest.end) return false;
  if (
    homeGardenTrees.some(
      (tree) => Math.abs(x - tree.x) < 24 && Math.abs(y - tree.y) < 17,
    )
  )
    return false;
  // A cliff separates the valley from the plateau. Its western edge cannot
  // be bypassed; the ladder is the sole passage until the eastern descent.
  if (
    x + 9 > mountain.start &&
    x - 9 < mountain.start + 20 &&
    y < ladder.bottom - 10
  )
    return false;
  if (
    x + 9 > mountain.start &&
    x - 9 < mountain.end &&
    y + 7 > mountainEdgeY(x)
  ) {
    const ladderPassage =
      Math.abs(x - ladder.x) <= 12 && y <= ladder.bottom + 8;
    const approach = x <= ladder.x + 20 && y >= ladder.bottom - 7;
    if (!ladderPassage && !approach) return false;
  }
  // The open bridge is the only crossing; tasks will gate it in a later feature.
  if (
    x + 9 > river.x &&
    x - 9 < river.x + river.w &&
    Math.abs(y - pathY(x)) > 43
  )
    return false;
  if (x > 10550 && y + 7 > shorelineY(x)) {
    const onPier =
      Math.abs(x - beachPier.x) <= beachPier.w / 2 - 9 &&
      y <= beachPier.end - 12;
    if (!onPier) return false;
  }
  if (
    x + 9 > beachBar.x &&
    x - 9 < beachBar.x + beachBar.w &&
    y + 7 > beachBar.y &&
    y - 7 < beachBar.y + beachBar.h
  )
    return false;
  if (
    beachLoungers.some(
      (chair) => Math.abs(x - chair.x) < 53 && Math.abs(y - chair.y) < 25,
    )
  )
    return false;
  if (
    ((x - meadowLake.x) / (meadowLake.rx + 9)) ** 2 +
      ((y - meadowLake.y) / (meadowLake.ry + 7)) ** 2 <=
    1
  )
    return false;
  if (
    x + 9 > fountain.x - fountain.w / 2 &&
    x - 9 < fountain.x + fountain.w / 2 &&
    y + 7 > fountain.y - fountain.h / 2 &&
    y - 7 < fountain.y + fountain.h / 2
  )
    return false;
  return !journeyHouses.some(
    (h) => x + 9 > h.x && x - 9 < h.x + h.w && y + 7 > h.y && y - 7 < h.y + h.h,
  );
}
export function moveJourney(p, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
  for (let i = 0; i < steps; i++) {
    if (canWalkJourney(p.x + dx / steps, p.y)) p.x += dx / steps;
    if (canWalkJourney(p.x, p.y + dy / steps)) p.y += dy / steps;
  }
}
export const journeySpawn = { x: 238, y: pathY(238) };
export const journeyRoute = [
  ...Array.from({ length: Math.ceil((ladder.x - 238) / 4) }, (_, i) => {
    const x = Math.min(ladder.x - 1, 238 + i * 4);
    return { x, y: pathY(x) };
  }),
  { x: ladder.x, y: ladder.bottom },
  { x: ladder.x, y: ladder.top },
  ...Array.from(
    { length: Math.ceil((STAGE_WIDTH * 14 - 140 - ladder.x) / 4) + 1 },
    (_, i) => {
      const x = Math.min(STAGE_WIDTH * 14 - 140, ladder.x + i * 4);
      return { x, y: pathY(x) };
    },
  ),
];
export function normalizeJourneySave(value) {
  if (
    value?.version === 1 &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    canWalkJourney(value.x, value.y)
  )
    return { version: 1, x: value.x, y: value.y };
  if (
    value?.version === 1 &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    value.x >= mountain.start &&
    value.x < mountain.end
  ) {
    const x = Math.max(ladder.x, value.x),
      y = pathY(x);
    if (canWalkJourney(x, y)) return { version: 1, x, y };
  }
  return { version: 1, ...journeySpawn };
}
