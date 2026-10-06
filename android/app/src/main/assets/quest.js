export const freshState = () => ({
  version: 1,
  accepted: false,
  boards: [],
  apple: false,
  foxFed: false,
  repaired: false,
  finished: false,
  caveAccepted: false,
  gears: [],
  switches: [],
  machineFixed: false,
  lakeReached: false,
  viewVersion: 2,
  x: 1210,
  y: 550,
});
export function normalizeSave(v) {
  const s = freshState();
  if (v?.version !== 1) return s;
  for (const k of [
    "accepted",
    "apple",
    "foxFed",
    "repaired",
    "finished",
    "caveAccepted",
    "machineFixed",
    "lakeReached",
  ])
    s[k] = v[k] === true;
  s.boards = [
    ...new Set(
      Array.isArray(v.boards)
        ? v.boards.filter((v) => [1, 2, 3].includes(v))
        : [],
    ),
  ];
  s.repaired = s.repaired && s.accepted && s.boards.length === 3;
  s.finished = s.finished && s.repaired;
  s.caveAccepted = s.caveAccepted && s.repaired;
  s.gears = [
    ...new Set(
      Array.isArray(v.gears)
        ? v.gears.filter((n) => [1, 2, 3].includes(n))
        : [],
    ),
  ];
  s.switches =
    Array.isArray(v.switches) &&
    v.switches.length <= 3 &&
    v.switches.every((n, i) => n === [2, 1, 3][i])
      ? v.switches.slice()
      : [];
  if (!s.caveAccepted) {
    s.gears = [];
    s.switches = [];
  }
  s.machineFixed =
    s.machineFixed &&
    s.caveAccepted &&
    s.gears.length === 3 &&
    s.switches.length === 3;
  s.lakeReached = s.lakeReached && s.machineFixed;
  if (Number.isFinite(v.x)) s.x = Math.max(35, Math.min(3175, v.x));
  s.viewVersion = v.viewVersion === 2 ? 2 : 1;
  if (s.viewVersion === 2 && Number.isFinite(v.y))
    s.y = Math.max(45, Math.min(1031, v.y));
  return s;
}
export function collectBoard(s, id) {
  if (
    !s.accepted ||
    s.boards.includes(id) ||
    ![1, 2, 3].includes(id) ||
    (id === 3 && !s.foxFed)
  )
    return false;
  s.boards.push(id);
  return true;
}
export function feedFox(s) {
  if (!s.accepted || !s.apple || s.foxFed) return false;
  s.apple = false;
  s.foxFed = true;
  return true;
}
export function repairBridge(s) {
  if (!s.accepted || s.boards.length !== 3 || s.repaired) return false;
  s.repaired = true;
  return true;
}
export function objective(s) {
  if (s.lakeReached)
    return [
      "Der See im Sonnenlicht",
      "Zwei Geschichten geschafft. Kehre jederzeit ins Dorf zurück.",
    ];
  if (s.machineFixed)
    return ["Das Tor ist offen!", "Folge dem Weg rechts zum See."];
  if (s.caveAccepted)
    return s.gears.length === 3
      ? [
          "Die alte Maschine",
          "Bring die Zahnräder zur Maschine rechts in der Höhle.",
        ]
      : [
          `Die alte Maschine · ${s.gears.length}/3`,
          s.switches.length === 3
            ? "Die geheime Kammer ist offen. Finde alle Zahnräder."
            : "Finde Zahnräder. Der Hinweisstein erklärt die Schalter.",
        ];
  if (s.finished)
    return ["Hinter der Brücke", "Sprich mit Mina am Höhleneingang."];
  if (s.repaired)
    return ["Die Brücke steht!", "Überquere die Brücke rechts vom Dorf."];
  if (!s.accepted) return ["Ein neuer Morgen", "Sprich mit Jona im Dorf."];
  if (s.boards.length === 3)
    return ["Zurück zu Jona", "Drei Bretter! Bring sie ins Dorf."];
  return [
    `Die kaputte Brücke · ${s.boards.length}/3`,
    s.foxFed
      ? "Sammle die übrigen Bretter im Wald."
      : s.apple
        ? "Bring den Apfel zum Fuchs im Wald."
        : "Erkunde die Waldwege links vom Dorf.",
  ];
}

export function collectGear(s, id) {
  if (
    !s.caveAccepted ||
    s.gears.includes(id) ||
    ![1, 2, 3].includes(id) ||
    (id === 3 && s.switches.length !== 3)
  )
    return false;
  s.gears.push(id);
  return true;
}
export function pressSwitch(s, id) {
  if (!s.caveAccepted || s.switches.length === 3) return false;
  if (id !== [2, 1, 3][s.switches.length]) {
    s.switches = [];
    return false;
  }
  s.switches.push(id);
  return true;
}
export function fixMachine(s) {
  if (
    !s.caveAccepted ||
    s.gears.length !== 3 ||
    s.switches.length !== 3 ||
    s.machineFixed
  )
    return false;
  s.machineFixed = true;
  return true;
}
