import { cp, mkdir } from "node:fs/promises";

await mkdir("android/app/src/main/assets", { recursive: true });
await cp("web", "android/app/src/main/assets", { recursive: true });
console.log("Android-Spielassets aktualisiert.");
