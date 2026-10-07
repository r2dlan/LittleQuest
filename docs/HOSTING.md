# LittleQuest im Container betreiben

## Container herunterladen und starten

GitHub-Releases und das Container-Package werden automatisch auf jeweils zehn Versionen begrenzt. Ältere Releases einschließlich ihrer Downloads und ältere Container-Versionen werden gelöscht; `latest` bleibt geschützt. Git-Tags bleiben erhalten. Details und die manuelle Vorschau stehen in [docs/RELEASES.md](RELEASES.md).

Die gemeinsame App- und Container-Pipeline veröffentlicht erst nach beiden erfolgreichen Builds auf `main` zusätzlich als GitHub-Package **`ghcr.io/r2dlan/littlequest:latest`**. Releases erhalten einen Versions-Tag wie `v0.3.0`; jeder veröffentlichte Build außerdem `sha-<Commit-ID>`. Entwicklungs-Builds bekommen zusätzlich `v<Projektversion>-sha.<Commit-ID>`, damit sie keinen offiziellen Release-Tag überschreiben. Pull Requests und andere Branches bauen und testen nur. Der Download als Container-Archiv bleibt verfügbar.

Nach der ersten Veröffentlichung die Sichtbarkeit unter **Organisation r2dlan → Packages → littlequest → Package settings** prüfen. Neue Container-Packages sind standardmäßig privat. Für Downloads ohne Anmeldung dort auf **Public** stellen; für ein privates Package bei `ghcr.io` mit einem GitHub-Token mit `read:packages` anmelden. Falls die Organisation Package-Erstellung einschränkt, diese für GitHub Actions erlauben. Zum Veröffentlichen nutzt der Workflow das vorhandene `GITHUB_TOKEN`; ein zusätzliches Secret ist nicht erforderlich.

Mit Docker direkt starten:

```sh
docker run --detach --name littlequest --restart unless-stopped --publish 127.0.0.1:4173:4173 ghcr.io/r2dlan/littlequest:latest
```

Dann http://127.0.0.1:4173 öffnen. Für einen bestimmten Release `latest` durch den gewünschten Versions-Tag ersetzen. `latest` folgt dem aktuellen getesteten Stand auf `main`; ein erneuter Build eines älteren Releases verändert diesen Tag nicht.

Der Workflow **Little Quest app and container** baut Android-App und Docker-Image immer gemeinsam. Beide verwenden dieselbe Version aus `package.json` und denselben unveränderlichen Commit. Nach einer gemeinsamen Prüfung laufen die Builds parallel. Unter **Actions → Lauf → Artifacts** liegen `LittleQuest-v<Version>-<Commit>-Android` und `LittleQuest-v<Version>-<Commit>-Container`. Für Releases heißen die Archive `LittleQuest-v<Version>-Android` und `LittleQuest-v<Version>-Container`. Reine Dokumentationsänderungen starten keinen Build. Bei neuen Releases ist `LittleQuest-container.tar.gz` auch als Release-Download verfügbar. Das Image enthält Linux/amd64 für Intel/AMD und Linux/arm64 für Apple Silicon und ARM-Systeme. Docker wählt beim Download die passende Variante automatisch.

Nach Download und Entpacken des Workflow-Artefakts:

```sh
docker load --input LittleQuest-container.tar.gz
docker run --detach --name littlequest --restart unless-stopped --publish 127.0.0.1:4173:4173 littlequest:local
```

Dann http://127.0.0.1:4173 öffnen. Ein bereits laufender lokaler Spielserver muss vorher beendet werden, da er denselben Port verwendet. Spielstände bleiben im Browser gespeichert; ein Container-Volume ist nicht erforderlich. Stoppen mit `docker stop littlequest`, entfernen mit `docker rm littlequest`.

Alternativ lokal für die eigene Architektur bauen:

```sh
docker build --tag littlequest:local .
docker run --detach --name littlequest --publish 127.0.0.1:4173:4173 littlequest:local
```

Der Container enthält nur den Server und die Webdateien, läuft ohne Root-Rechte und prüft seine Erreichbarkeit regelmäßig. `HOST` und `PORT` sind konfigurierbar; lokal bindet der Server standardmäßig an `127.0.0.1:4173`, im Container an `0.0.0.0:4173`. Für öffentliche Bereitstellung HTTPS über einen vorgeschalteten Proxy einrichten; Browser-Offlinemodus funktioniert auf localhost oder über HTTPS.


Das Container-Archiv enthält beide Plattformen. Zum Laden aller Varianten ist Docker mit aktiviertem containerd-Image-Store erforderlich (bei aktuellen Docker-Desktop-Versionen standardmäßig vorhanden). Alternativ das öffentliche Package direkt nutzen; dafür ist kein spezieller Image-Store erforderlich.
