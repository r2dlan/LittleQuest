# LittleQuest entwickeln

## Lokal starten

Mit Node.js 22 oder neuer im Repository:

```sh
npm start
```

Dann http://127.0.0.1:4173 öffnen. Für das Spielen sind keine installierten npm-Pakete nötig. Beenden mit Ctrl + C. `HOST` und `PORT` sind optional konfigurierbar; standardmäßig bindet der Server an `127.0.0.1:4173`.

## Aufbau

- `web/journey-game.js`: aktiver Einstieg, Darstellung der Reise, Eingaben und Häuser.
- `web/journey-world.js`: 14 Stationen, Landschaftsübergänge, Weg und Kollisionen.
- `web/characters.js`, `web/assets/characters-b.png` und `web/assets/characters-desert.png`: Figuren im Stil B, eigene Bewohner für die Wüstenstadt. Erstellung und Prompts stehen in `docs/GRAPHICS.md`.
- `docs/STORY.md` und `docs/quests/S*.md`: roter Faden und mehrere Aufgaben je Station; Aufgaben bisher Entwurf.
- `web/game.js`, `web/world.js` und `web/quest.js`: frühere Prototypgeschichten als Referenz. `world.js` stellt außerdem die gemeinsame Innenraumgeometrie bereit.
- `web/settings.js`: lokale Einstellungen.
- `server.mjs`: Webserver für Browser und Container.
- `android/`: Java-WebView-App mit denselben Spieldateien, ohne Internetberechtigung.

Die Android-App enthält alle Ressourcen im Paket. Die Browser-Version kann nach dem ersten Laden offline starten; dafür ist localhost oder HTTPS erforderlich. Spielstände werden getrennt im Browser und in der App gespeichert.

## Code prüfen

Für Entwicklungswerkzeuge und Git-Hooks einmalig:

```sh
npm ci
npm run hooks:install
```

Vor Abschluss einer Codeänderung:

```sh
npm run fix
npm run check
npm test
```

Biome-Version und Regeln stehen in `package.json` und `biome.json`. Warnungen lassen die Prüfung fehlschlagen. `npm run fix` synchronisiert auch die Android-Assets; diese nicht direkt bearbeiten. Die empfohlenen VS-Code-Einstellungen und die Biome-Erweiterung unterstützen Formatierung und Importorganisation.

Die Tests prüfen unter anderem beide Geschichten, Spielstände, Kollisionen, Steuerung, Server, gemeinsame Buildversionen und Bereinigung. Die Git-Hooks prüfen Codequalität, Tests und Conventional Commits; sie verändern Dateien nicht automatisch. Verbindliche Arbeitsregeln stehen in [AGENTS.md](../AGENTS.md).

## Android bauen

Benötigt werden JDK 17, Android SDK 36 und die Gradle-Version aus `android/gradle-version.txt`. Das Android Gradle Plugin ist in `android/build.gradle` festgelegt. Der Ordner `android` kann auch in Android Studio geöffnet werden; ein Gradle-Wrapper ist noch nicht enthalten.

`npm run android:build` synchronisiert die Assets und erstellt `dist/LittleQuest.apk`. Projektspezifische Werkzeuge unter `.android-tools/` und der Cache unter `.android-gradle/` bleiben außerhalb von Git. Alternativ mit der festgelegten Gradle-Version `gradle -p android assembleDebug` ausführen; vorher `npm run android:assets` verwenden.

`npm run android:bundle` erzeugt ein unsigniertes AAB. Für signierte APK/AAB dienen `npm run android:release` und die [Signierungsanleitung](store/SIGNING.md). Der [gemeinsame GitHub-Build](RELEASES.md) erstellt App und Container aus demselben Commit und derselben Version.

Debug-APKs verschiedener GitHub-Läufe oder lokaler Builds können unterschiedliche Signaturen haben. Bei einem Installationskonflikt ist eine Deinstallation nötig; dabei geht der App-Spielstand verloren. Für verlässliche Updates ist ein dauerhafter Signierschlüssel erforderlich.

## Spiel und Story weiterentwickeln

Die beiden vorhandenen Geschichten stehen in [STORY.md](STORY.md) und den verlinkten Quest-Dokumenten. Neue Aufgaben mit der [Quest-Vorlage](quests/QUEST_TEMPLATE.md) beschreiben und in der Story-Übersicht eintragen.

Spielstände aus der früheren Seitenansicht werden automatisch übernommen: Questfortschritt bleibt erhalten, alte Positionen werden auf sichere Startpunkte übertragen. Änderungen an Bewegung oder Speicherformat müssen diese Migration weiterhin berücksichtigen.

Weitere Gebiete und Fähigkeiten sind im [Spielkonzept](GAME_CONCEPT.md) beschrieben. Ton und Musik sind noch nicht enthalten.

## Commits und Veröffentlichung

Conventional Commits verwenden: `type(scope): Beschreibung`, maximal 100 Zeichen in der ersten Zeile. Die zulässigen Typen und der Freigabeablauf stehen in [AGENTS.md](../AGENTS.md).

[Releases](RELEASES.md), [Renovate](RENOVATE.md) und die [Google-Play-Vorbereitung](store/PLAY_STORE.md) dokumentieren die jeweilige Einrichtung. Es gibt keinen automatischen Google-Play-Upload.
