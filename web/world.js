export const WORLD = { width: 3200, height: 1056 };
export const places = {
  jona: { x: 1270, y: 540 },
  fox: { x: 190, y: 315 },
  apple: { x: 425, y: 650 },
  mina: { x: 1940, y: 540 },
  clue: { x: 2240, y: 650 },
  machine: { x: 2510, y: 540 },
};
export const boards = [
  { id: 1, x: 675, y: 380 },
  { id: 2, x: 480, y: 230 },
  { id: 3, x: 245, y: 315 },
];
export const gears = [
  { id: 1, x: 2060, y: 290 },
  { id: 2, x: 2290, y: 350 },
  { id: 3, x: 2460, y: 230 },
];
export const switches = [
  { id: 1, x: 2190, y: 480, symbol: "☀" },
  { id: 2, x: 2290, y: 480, symbol: "☾" },
  { id: 3, x: 2390, y: 480, symbol: "✦" },
];
export const houses = [
  { x: 1000, y: 260, w: 170, h: 135 },
  { x: 1400, y: 280, w: 165, h: 125 },
  { x: 1130, y: 725, w: 165, h: 135 },
];
export const rocks = [
  { x: 555, y: 460, w: 90, h: 65 },
  { x: 330, y: 420, w: 70, h: 55 },
  { x: 760, y: 700, w: 85, h: 55 },
  { x: 2090, y: 370, w: 80, h: 60 },
  { x: 2190, y: 245, w: 90, h: 65 },
  { x: 2350, y: 620, w: 65, h: 65 },
  { x: 2530, y: 355, w: 60, h: 65 },
];
export const trees = [];
for (let row = 0; row < 12; row++)
  for (let col = 0; col < 11; col++) {
    const x = 70 + col * 76 + (row % 2) * 20,
      y = 95 + row * 76;
    // Keep central trails and collectible clearings open.
    if (
      Math.abs(y - 540) < 80 ||
      Math.abs(x - 470) < 60 ||
      (Math.abs(y - 315) < 58 && x < 340) ||
      (Math.abs(y - 230) < 48 && x > 355 && x < 570) ||
      (Math.abs(y - 380) < 55 && x > 570) ||
      (Math.abs(x - 425) < 80 && Math.abs(y - 650) < 65)
    )
      continue;
    trees.push({ x, y });
  }
for (const [x, y] of [
  [955, 160],
  [1170, 160],
  [1430, 170],
  [1535, 740],
  [1420, 890],
  [1010, 910],
  [2940, 185],
  [3040, 230],
  [2970, 850],
  [2800, 885],
])
  trees.push({ x, y });
export function obstacleList(s) {
  const obstacles = [
    ...houses,
    ...rocks,
    ...trees.map((t) => ({ x: t.x - 13, y: t.y - 10, w: 26, h: 26 })),
    { x: 155, y: 250, w: 60, h: 45 },
    { x: 2475, y: 505, w: 70, h: 50 },
  ];
  // A river can only be crossed along the repaired bridge.
  obstacles.push(
    { x: 1650, y: 0, w: 180, h: 480 },
    { x: 1650, y: 600, w: 180, h: 456 },
  );
  if (!s.repaired) obstacles.push({ x: 1650, y: 480, w: 180, h: 120 });
  // Cave walls leave a corridor at each entrance.
  obstacles.push(
    { x: 1830, y: 0, w: 800, h: 145 },
    { x: 1830, y: 850, w: 800, h: 206 },
    { x: 1830, y: 145, w: 35, h: 335 },
    { x: 1830, y: 600, w: 35, h: 250 },
    { x: 2595, y: 145, w: 35, h: 335 },
    { x: 2595, y: 600, w: 35, h: 250 },
  );
  if (!s.machineFixed) obstacles.push({ x: 2595, y: 480, w: 35, h: 120 });
  // Third gear is in a room with one switch-controlled door.
  obstacles.push(
    { x: 2360, y: 145, w: 20, h: 160 },
    { x: 2360, y: 145, w: 200, h: 20 },
    { x: 2540, y: 145, w: 20, h: 160 },
    { x: 2360, y: 285, w: 65, h: 20 },
    { x: 2495, y: 285, w: 65, h: 20 },
  );
  if (s.switches.length < 3) obstacles.push({ x: 2425, y: 285, w: 70, h: 20 });
  // Shore, pond and inhabitants have physical footprints.
  obstacles.push({ x: 2760, y: 230, w: 390, h: 235 });
  for (const name of ["jona", "mina", "fox"]) {
    const t = places[name];
    obstacles.push({ x: t.x - 12, y: t.y - 7, w: 24, h: 18 });
  }
  return obstacles;
}
export function canStand(x, y, s) {
  if (x < 25 || y < 45 || x > WORLD.width - 25 || y > WORLD.height - 25)
    return false;
  return !obstacleList(s).some(
    (o) => x + 9 > o.x && x - 9 < o.x + o.w && y + 7 > o.y && y - 7 < o.y + o.h,
  );
}
export function move(p, dx, dy, s) {
  const length = Math.hypot(dx, dy);
  if (!length) return;
  const steps = Math.ceil(length / 4);
  for (let i = 0; i < steps; i++) {
    if (canStand(p.x + dx / steps, p.y, s)) p.x += dx / steps;
    if (canStand(p.x, p.y + dy / steps, s)) p.y += dy / steps;
  }
}
export function spawn(s) {
  let p;
  if (s.viewVersion === 2 && Number.isFinite(s.y)) {
    p = { x: s.x, y: s.y };
  } else {
    p = s.lakeReached
      ? { x: 2760, y: 550 }
      : s.caveAccepted
        ? { x: 1980, y: 580 }
        : s.finished
          ? { x: 1885, y: 545 }
          : s.repaired
            ? { x: 1560, y: 540 }
            : { x: 1210, y: 550 };
  }
  if (!canStand(p.x, p.y, s))
    p = s.machineFixed
      ? { x: 2690, y: 540 }
      : s.caveAccepted
        ? { x: 1980, y: 580 }
        : { x: 1210, y: 550 };
  return p;
}
export function nearby(p, t, r = 58) {
  return Math.hypot(p.x - t.x, p.y - t.y) < r;
}
