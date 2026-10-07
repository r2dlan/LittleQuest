# Little Quest

Ein kleines, gemütliches 2D-Abenteuer in Draufsicht für Android. Der spielbare Prototyp setzt **„Die kaputte Brücke“** und die anschließende Höhlenquest **„Die alte Wassermaschine“** um. Grafik wird lokal in Pixeloptik gezeichnet; keine externen Assets, Laufzeitbibliotheken oder Netzverbindung erforderlich.

## Direkt spielen

Mit Node.js 20 oder neuer im Repository:

```sh
npm start
```

Dann http://127.0.0.1:4173 öffnen. Es müssen keine Pakete installiert werden.

**Steuerung:** WASD oder Pfeiltasten zur Bewegung in vier Richtungen, E / Leertaste / Enter zum Interagieren. Auf dem Handy: auf der linken Bildschirmhälfte wischen und halten; loslassen zum Stoppen. Die Interaktionstaste bleibt rechts. Ein beweglicher Kreis zeigt die Wischrichtung. Diagonales Bewegen ist möglich und genauso schnell wie geradeaus. Pause oben rechts oder Escape. Browserfenster inaktiv: automatische Pause. Querformat ist für die Android-Version vorgesehen; der Browser unterstützt auch Hochformat.

## Als Container starten

GitHub-Releases und das Container-Package werden automatisch auf jeweils zehn Versionen begrenzt. Ältere Releases einschließlich ihrer Downloads und ältere Container-Versionen werden gelöscht; `latest` bleibt geschützt. Git-Tags bleiben erhalten. Details und die manuelle Vorschau stehen in [docs/RELEASES.md](docs/RELEASES.md).

Die gemeinsame App- und Container-Pipeline veröffentlicht erst nach beiden erfolgreichen Builds auf `main` zusätzlich als GitHub-Package **`ghcr.io/r2dlan/littlequest:latest`**. Releases erhalten einen Versions-Tag wie `v0.3.0`; jeder veröffentlichte Build außerdem `sha-<Commit-ID>`. Entwicklungs-Builds bekommen zusätzlich `v<Projektversion>-sha.<Commit-ID>`, damit sie keinen offiziellen Release-Tag überschreiben. Pull Requests und andere Branches bauen und testen nur. Der Download als Container-Archiv bleibt verfügbar.

Nach der ersten Veröffentlichung die Sichtbarkeit unter **Organisation r2dlan → Packages → littlequest → Package settings** prüfen. Neue Container-Packages sind standardmäßig privat. Für Downloads ohne Anmeldung dort auf **Public** stellen; für ein privates Package bei `ghcr.io` mit einem GitHub-Token mit `read:packages` anmelden. Falls die Organisation Package-Erstellung einschränkt, diese für GitHub Actions erlauben. Zum Veröffentlichen nutzt der Workflow das vorhandene `GITHUB_TOKEN`; ein zusätzliches Secret ist nicht erforderlich.

Mit Docker direkt starten:

```sh
docker run --detach --name littlequest --platform linux/amd64 --restart unless-stopped --publish 127.0.0.1:4173:4173 ghcr.io/r2dlan/littlequest:latest
```

Dann http://127.0.0.1:4173 öffnen. Für einen bestimmten Release `latest` durch den gewünschten Versions-Tag ersetzen. `latest` folgt dem aktuellen getesteten Stand auf `main`; ein erneuter Build eines älteren Releases verändert diesen Tag nicht.

Der Workflow **Little Quest app and container** baut Android-App und Docker-Image immer gemeinsam. Beide verwenden dieselbe Version aus `package.json` und denselben unveränderlichen Commit. Nach einer gemeinsamen Prüfung laufen die Builds parallel. Unter **Actions → Lauf → Artifacts** liegen `LittleQuest-v<Version>-<Commit>-Android` und `LittleQuest-v<Version>-<Commit>-Container`. Für Releases heißen die Archive `LittleQuest-v<Version>-Android` und `LittleQuest-v<Version>-Container`. Reine Dokumentationsänderungen starten keinen Build. Bei neuen Releases ist `LittleQuest-container.tar.gz` auch als Release-Download verfügbar. Das Image ist für Linux/amd64 gebaut; Docker Desktop auf Apple Silicon kann es mit der angegebenen Plattform starten.

Nach Download und Entpacken des Workflow-Artefakts:

```sh
docker load --input LittleQuest-container.tar.gz
docker run --detach --name littlequest --platform linux/amd64 --restart unless-stopped --publish 127.0.0.1:4173:4173 littlequest:local
```

Dann http://127.0.0.1:4173 öffnen. Ein bereits laufender lokaler Spielserver muss vorher beendet werden, da er denselben Port verwendet. Spielstände bleiben im Browser gespeichert; ein Container-Volume ist nicht erforderlich. Stoppen mit `docker stop littlequest`, entfernen mit `docker rm littlequest`.

Alternativ lokal für die eigene Architektur bauen:

```sh
docker build --tag littlequest:local .
docker run --detach --name littlequest --publish 127.0.0.1:4173:4173 littlequest:local
```

Der Container enthält nur den Server und die Webdateien, läuft ohne Root-Rechte und prüft seine Erreichbarkeit regelmäßig. `HOST` und `PORT` sind konfigurierbar; lokal bindet der Server standardmäßig an `127.0.0.1:4173`, im Container an `0.0.0.0:4173`. Für öffentliche Bereitstellung HTTPS über einen vorgeschalteten Proxy einrichten; Browser-Offlinemodus funktioniert auf localhost oder über HTTPS.

## Die erste Geschichte

1. Mit Jona im Dorf sprechen und die Aufgabe annehmen.
2. Links den Wald erkunden. Zwei Bretter liegen auf kleinen Waldlichtungen.
3. Den Apfel am Baum pflücken und mit dem Fuchs interagieren. Er kommt aus seinem Bau und gibt das dritte Brett frei.
4. Mit drei Brettern zu Jona zurückkehren und die Brücke reparieren.
5. Rechts die reparierte Brücke überqueren und den Höhleneingang erreichen.

Fortschritt und Position werden automatisch auf diesem Gerät gespeichert. Bei deaktiviertem Gerätespeicher erscheint ein Hinweis. „Neues Abenteuer starten“ setzt den Speicher nach Bestätigung zurück. Die Browser-Version kann nach dem ersten Laden durch ihren Service Worker offline starten; die Android-Version enthält alle Dateien bereits im Paket.

## Die zweite Geschichte

Nach der Brücke rechts weiterlaufen und Mina am Höhleneingang ansprechen. Zwei Zahnräder liegen zwischen den Felsen. Der Hinweisstein erklärt die Schalter: **Mond → Sonne → Stern** (mittlerer → linker → rechter Schalter). Eine falsche Eingabe setzt die Lichter zurück; das Rätsel bleibt beliebig oft lösbar. Die richtige Reihenfolge öffnet die Kammer mit dem dritten Zahnrad. Rechts an der Maschine alle drei Zahnräder einsetzen und die Maschine starten. Das Tor öffnet den Weg zum Sonnensee. Zurückkehren ins Dorf ist jederzeit möglich. Bestehende Spielstände werden übernommen.

## Android

`android/` enthält eine native Java-WebView-App ohne Internetberechtigung. Ressourcen werden von einer lokalen HTTPS-Adresse aus den eingebetteten Assets bereitgestellt. Kein Server wird für Android benötigt.

Nach Änderungen am Spiel:

```sh
npm run android:assets
```

Den Ordner `android` in Android Studio öffnen, Gradle synchronisieren und auf einem Android-Gerät oder Emulator starten. Erforderlich: JDK 17, Android SDK 36; Android Gradle Plugin 8.10.1 / Gradle-Version aus `android/gradle-version.txt`. Android Studio kann die passende Gradle-Version beim Import bereitstellen; ein Gradle-Wrapper ist noch nicht enthalten. Alternativ mit der in `android/gradle-version.txt` festgelegten Gradle-Version: `gradle -p android assembleDebug`. Die APK liegt anschließend unter `android/app/build/outputs/apk/debug/`.

**Buildstatus:** Die Debug-APK wurde erfolgreich gebaut. APK-Signatur, Paketkennung, Mindestversion und eingebettete Spieldateien wurden geprüft. Ein Lauf auf einem Android-Gerät oder Emulator wurde noch nicht geprüft. Die APK ist für lokale Tests, keine fertige Store-Version.

## Prüfung und Aufbau

```sh
npm test
```

Die Tests prüfen den vollständigen Questablauf, Wiederherstellung des Fortschritts, ungültige Spielstände und einmalige Belohnungen. `web/game.js` enthält Zeichnung, Eingaben und Dialoge; `web/world.js` Karte, Kollisionen und Startpositionen; `web/quest.js` die unabhängig geprüfte Questlogik. Android übernimmt identische Spieldateien.

## Umfang

Implementiert: Spielerfigur in vier Blickrichtungen, Bewegung in Draufsicht, Wischsteuerung mit der linken Hand, Kamera, Kollisionen mit Häusern, Bäumen, Felsen und Wasser, Dorf, Jona, Dialoge, Wald, drei Bretter, Waldwege und Lichtungen, Fuchs-/Apfelrätsel, Queststatus, sichtbare Brückenreparatur, automatisches Speichern und eine anschließende Höhle mit Mina, Zahnrädern, Schalterrätsel, reparierbarer Wassermaschine und dem Zugang zum Sonnensee.

Weitere Gebiete, Doppelsprung, Dash, Schwimmen, Klettern und zusätzliche Geschichten bleiben bewusst spätere Ausbaustufen gemäß Konzept. Ton und Musik sind noch nicht enthalten. Keine Kämpfe im ersten Prototyp.

## Umstellung auf Draufsicht

Questfortschritt aus der früheren Seitenansicht wird automatisch übernommen. Alte Figurenpositionen werden auf sichere Startpunkte im Dorf, am Höhleneingang oder am See übertragen. Neue Spielstände speichern beide Kartenkoordinaten. Sprungpassagen wurden durch Waldwege und Felsbereiche ersetzt. Das dritte Zahnrad bleibt hinter einer echten, durch das Schalterrätsel geöffneten Tür. Brücke und Höhlentor verhindern den Zugang auch bei diagonaler Bewegung.

Die Tests prüfen beide Questabläufe, Spielstandmigration, gleichmäßige Bewegung, Hinderniskollisionen und die Erreichbarkeit aller Questziele mit dem vollständigen Kollisionsbereich der Figur.

## Story weiterentwickeln

Die [Story-Übersicht](docs/STORY.md) dokumentiert Figuren, vorhandene Aufgaben und den Ablauf für neue Ideen. Für jede neue Aufgabe die [Quest-Vorlage](docs/quests/QUEST_TEMPLATE.md) kopieren und in der Übersicht verlinken. Die vorhandenen Geschichten sind als Q001 und Q002 dokumentiert; die nächste freie ID ist Q003.

## APK aufs Handy übertragen

Die installierbare Testdatei liegt unter `dist/LittleQuest.apk` (Android 8.0 oder neuer). Per USB oder deiner bevorzugten Dateiübertragung auf das Handy kopieren und dort in der Dateien-App öffnen. Falls Android nachfragt, die Installation aus dieser Quelle für die Übertragung erlauben. Die App heißt **Little Quest**, läuft im Querformat und enthält beide Geschichten offline. Der Browser-Spielstand wird nicht automatisch aufs Handy übertragen; die Android-App hat einen eigenen lokalen Spielstand.

Für weitere Builds auf diesem Mac:

```sh
npm run android:build
```

Die projektspezifischen Werkzeuge liegen in `.android-tools/`, der Gradle-Cache in `.android-gradle/`; beide sind von Git ausgeschlossen. Der Build synchronisiert die Spielassets automatisch und aktualisiert `dist/LittleQuest.apk`. Die APK ist mit dem lokalen Android-Debugschlüssel signiert. Für Updates diese Signatur beibehalten; ohne passenden Schlüssel lässt sich die bestehende Installation nicht aktualisieren.

## Biome und automatische Prüfungen

Einmalig `npm ci` ausführen. Biome ist auf Version 2.5.14 festgelegt; Regeln und Formatierung stehen in `biome.json`.

- `npm run fix`: Formatierung, Importreihenfolge und sichere Korrekturen anwenden; Android-Spielassets aktualisieren. Meldungen ohne sichere automatische Korrektur manuell beheben.
- `npm run check`: alle Biome-Regeln prüfen; auch Warnungen lassen den Check fehlschlagen.
- `npm test`: Spieltests ausführen.

In VS Code die empfohlene Biome-Erweiterung installieren. Die Repository-Einstellungen aktivieren Formatierung, Importorganisation und sichere Korrekturen beim expliziten Speichern.

Der Commit-Hook ist in diesem Checkout bereits aktiviert und prüft Biome sowie Tests. In weiteren Checkouts nach `npm ci` einmal `npm run hooks:install` ausführen. Der Hook verändert keine Dateien automatisch.

Der GitHub-Workflow `.github/workflows/check.yml` prüft einmalig Biome, Tests, die gemeinsame Version und synchronisierte Android-Assets. Danach baut er Android-App und Container parallel. Änderungen an Spiel, Android, Server, Tests oder Builddateien lösen immer beide Builds aus. Reine Dokumentationsänderungen starten diese Pipeline nicht. Repository-Regeln zum verpflichtenden Bestehen vor dem Merge sind noch nicht konfiguriert; bestehende Regeln nach der Workflow-Umstellung auf die aktuellen Check-Namen prüfen.

`AGENTS.md` verpflichtet auch zukünftige Arbeiten im Repository zu diesen Prüfungen. Generierte Android-Assets und lokale Buildwerkzeuge sind aus Biome ausgeschlossen; die Web-Quelldateien werden geprüft und anschließend synchronisiert.

## Commit-Regeln

Conventional Commits verwenden: `type(scope): Beschreibung` (Scope optional), maximal 100 Zeichen in der ersten Zeile. Typen: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Breaking Changes mit `!` markieren und im Body erklären.

Der lokale `commit-msg`-Hook prüft diese Konvention. Er wird zusammen mit dem vorhandenen Prüf-Hook durch `npm run hooks:install` aktiviert; in diesem Checkout sind beide aktiv.

Beispiele:

```text
feat(controls): add left-hand swipe movement
fix(quests): preserve progress after restart
docs(story): describe the lake quest
```

Codex bereitet am Feature-Ende eine passende Nachricht vor. Commit und Push erfolgen erst nach deiner ausdrücklichen Freigabe für dieses Feature, zum Beispiel „Freigegeben, bitte committen und pushen.“

## App und Container auf GitHub bauen

Der Workflow **Little Quest app and container** startet für Änderungen an App-, Server-, Test- und Builddateien. Markdown-Dateien sind ausgeschlossen. Änderungen ausschließlich an Dokumentation, Agent-Anweisungen oder Renovate starten keinen Build. Manuell lässt er sich über **Actions → Little Quest app and container → Run workflow** starten. Nach der gemeinsamen Prüfung baut er mit Java 17, der festgelegten Gradle-Version und Android SDK 36 eine Debug-APK und ein unsigniertes AAB, prüft die APK-Signatur und baut/testet parallel das Container-Image.

Nach erfolgreichem Lauf unter **Actions → Lauf → Artifacts** das Archiv mit Endung `-Android` herunterladen und entpacken. Es enthält `LittleQuest.apk` und `LittleQuest-unsigned.aab`; das Archiv mit Endung `-Container` enthält das Docker-Image. Version und Commit stehen in beiden Artefaktnamen. Downloads werden 14 Tage aufbewahrt. Release Please veröffentlicht alle drei Dateien gemeinsam als Release-Downloads. Es gibt keinen Google-Play-Upload.

GitHub baut auf jedem frischen Runner mit einem eigenen Debugschlüssel. Deshalb lassen sich diese Test-APKs nicht zuverlässig als Update über die lokal signierte App installieren. Eine bestehende Installation gegebenenfalls vorher deinstallieren (löscht ihren Spielstand). Ein dauerhafter Signaturschlüssel für Updates wird vor einer späteren Veröffentlichung separat eingerichtet.

Die Pipeline wird erst nach Commit und Push auf GitHub ausgeführt. Lokal sind die Checks und der Android-Build geprüft; der erste GitHub-Lauf steht noch aus.

## Releases

Release Please aktualisiert bei jedem Push auf `main` einen Release-PR mit Version und Changelog. Nach dessen Merge entsteht ein GitHub-Release; die geprüfte APK des Release-Tags wird als Download angehängt. Einrichtung des Secrets `RELEASE_PLEASE_TOKEN`, Ablauf und Wiederholung eines Builds sind in [docs/RELEASES.md](docs/RELEASES.md) beschrieben.

## Renovate

Die Renovate GitHub App erstellt Versionsupdates montags zwischen 09:00 und 15:00 Uhr (Europe/Berlin) als Pull Requests und merged sie nach erfolgreichen Checks. Konfiguration, Validierungsworkflow und GitHub-Einrichtung sind in [docs/RENOVATE.md](docs/RENOVATE.md) beschrieben. Ein eigener Renovate-Bot-Workflow und das Repository-Secret `RENOVATE_TOKEN` sind dafür nicht erforderlich.

## Vorbereitung für Google Play

LittleQuest richtet sich an Spieler ab 6 Jahren. Store-Texte, Datenschutzangaben und der Testplan liegen unter [docs/store/PLAY_STORE.md](docs/store/PLAY_STORE.md). Die Android-App verwendet API 36. `npm run android:bundle` baut ein unsigniertes Release-App-Bundle; `npm run android:release` erstellt mit den vier Signierungsvariablen eine signierte APK und ein AAB. Der manuelle Workflow **Signed Android release build** nutzt dafür die hinterlegten Upload-Key-Secrets. Es gibt weiterhin keinen Google-Play-Upload.

Im Pausenmenü findest du Steuerungshilfe, Datenschutz und Einstellungen für Hinweise, größere Texte und reduzierte Animationen. Einstellungen und Spielstand werden getrennt lokal gespeichert. `npm run store:check` zeigt offene Store-Texte, Datenschutz-URL und Grafikdateien an.
