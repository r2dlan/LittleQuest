# Releases auf Cloudflare Pages

Das Spiel ist unter [littlequest.daniel-andres.com](https://littlequest.daniel-andres.com) verfügbar. Die Domain gehört zum Pages-Projekt `littlequest`.

Nach einem neuen GitHub-Release veröffentlicht der Workflow **Release Please** genau dessen Webversion auf Cloudflare Pages. Er wartet auf die gemeinsamen Android-/Container-Builds, die Package-Veröffentlichung und das Anhängen der Release-Downloads. Normale Pushes und Pull Requests veröffentlichen keine Pages-Version.

## Einmalig einrichten

1. In Cloudflare **Workers & Pages → Create → Pages → Direct Upload** ein Pages-Projekt anlegen, zum Beispiel `littlequest`. Die Produktionsbranch muss `main` sein. Für ein bestehendes Projekt mit Git-Integration automatische Deployments auf allen Branches deaktivieren; sonst veröffentlicht Cloudflare zusätzlich jeden Push.
2. Einen Cloudflare-API-Token mit **Account → Cloudflare Pages → Edit** für den betreffenden Account erstellen. Die Account-ID aus dem Cloudflare-Dashboard kopieren. Kein Global API Key erforderlich.
3. Im GitHub-Repository unter **Settings → Secrets and variables → Actions** hinterlegen:

| Typ | Name | Inhalt |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare-API-Token |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Account-ID |
| Variable (optional) | `CLOUDFLARE_PAGES_PROJECT` | Abweichender Projektname; ohne Angabe wird `littlequest` verwendet |

Token nicht ins Repository oder in Chatnachrichten schreiben. Der Workflow meldet fehlende Angaben ausdrücklich und bricht vor dem Upload ab. Die GitHub-Umgebung `cloudflare-pages` zeigt nach einem erfolgreichen Deployment dessen URL an.

## Versionsbindung und Offline-Updates

Das Deployment checkt denselben Commit aus, aus dem die App und der Container gebaut wurden. `scripts/prepare-pages.mjs` erstellt daraus `dist/pages`; die Dateien unter `web/` und die Android-Assets werden nicht verändert. Ein falscher Release-Tag wird abgewiesen.

Der Service Worker erhält einen Cache-Namen aus Version, Commit und Dateiinhalten. Dadurch wird beim nächsten Besuch eine geänderte Version erkannt und ihr Offline-Cache neu aufgebaut. `sw.js` wird mit `Cache-Control: no-cache` ausgeliefert; `release.json` enthält Version, Tag und Commit ohne Browser-Cache. Spielstände im lokalen Speicher bleiben erhalten. Eine bereits geöffnete Spielsitzung lässt sich nach einem Release neu laden, um die neue Version zu nutzen.

Wrangler ist im Workflow auf eine feste Version gepinnt; Renovate aktualisiert diese nach den vorhandenen Regeln. Der Upload nutzt die Node.js-24-kompatible Wrangler-Action. Es ist kein laufender Server und kein Container auf Cloudflare erforderlich.

## Wiederholen und ältere Versionen

- Schlägt ausschließlich Pages fehl, im GitHub-Lauf **Re-run failed jobs** wählen, nachdem die Ursache behoben wurde. Release-Downloads und Package bleiben bestehen.
- Unter **Actions → Release Please → Run workflow** kann ein vorhandener `release-tag` erneut gebaut werden. Standardmäßig verändert das die Website nicht. Nur wenn **deploy-pages** aktiviert wird, veröffentlicht der Workflow den gewählten Release auch auf der Produktionsseite. Ein älterer Tag setzt die Website damit auf diese Version zurück.
- Der gewählte Release muss das Vorbereitungsskript enthalten; ältere Tags vor dieser Einrichtung benötigen einen neuen Release.

Die Haupt-README verlinkt die öffentliche Spieladresse. Für die öffentliche Datenschutzseite müssen die Angaben zu Hosting und die tatsächliche URL abschließend ergänzt werden; siehe [Google-Play-Vorbereitung](store/PLAY_STORE.md).

Quellen: [Cloudflare: CI mit Direct Upload](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/), [automatische Git-Deployments deaktivieren](https://developers.cloudflare.com/pages/configuration/git-integration/).
