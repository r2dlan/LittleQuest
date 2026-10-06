import { existsSync, readFileSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const listing = read("docs/store/listing.de.json");
const privacy = read("web/privacy-details.json");
const missing = [];
if (!listing.title || listing.title.length > 30)
  missing.push("Store-Titel fehlt oder ist länger als 30 Zeichen.");
if (!listing.shortDescription || listing.shortDescription.length > 80)
  missing.push("Kurzbeschreibung fehlt oder ist länger als 80 Zeichen.");
if (!listing.fullDescription || listing.fullDescription.length > 4000)
  missing.push("Beschreibung fehlt oder ist länger als 4000 Zeichen.");
if (!privacy.publisher || !privacy.contactEmail)
  missing.push("Herausgeber/Kontakt in den Datenschutzhinweisen ergänzen.");
try {
  if (new URL(privacy.privacyUrl).protocol !== "https:") throw new Error();
} catch {
  missing.push(
    "Öffentliche HTTPS-Datenschutz-URL in web/privacy-details.json ergänzen.",
  );
}
for (const asset of [
  "play-icon",
  "feature-graphic",
  "screenshot-01",
  "screenshot-02",
]) {
  if (
    !["png", "jpg"].some((extension) =>
      existsSync(`docs/store/assets/${asset}.${extension}`),
    )
  )
    missing.push(
      `Store-Grafik fehlt: docs/store/assets/${asset}.png oder .jpg`,
    );
}
if (missing.length) {
  console.error("Noch offen vor der Store-Veröffentlichung:");
  for (const item of missing) console.error(`- ${item}`);
  process.exitCode = 1;
} else
  console.log(
    "Store-Texte, Datenschutz-URL und vorhandene Grafiken geprüft. Manuelle Play-Console- und Gerätetests bleiben erforderlich.",
  );
