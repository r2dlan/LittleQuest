# Arbeiten in Little Quest

- Biome ist verbindlich. Verwende die im Projekt festgelegte Version und `biome.json`.
- Nach Änderungen am Code: `npm run fix`, `npm run check` und `npm test` ausführen. Offene Meldungen beheben; Regeln nicht zur Umgehung abschalten.
- `npm run fix` synchronisiert auch die Android-Spielassets. `android/app/src/main/assets/` nicht direkt bearbeiten.
- Änderungen an Spiellogik, Steuerung oder Spielständen mit passenden bestehenden Tests prüfen und bei Bedarf sinnvolle Tests ergänzen.
- Android-Builds über `npm run android:build` erstellen.
- Story und Quests unter `docs/STORY.md` und `docs/quests/` aktuell halten.

## Git und Conventional Commits

- Für jedes Feature eine passende Commit-Nachricht vorbereiten: `type(scope): kurze Beschreibung`. Der Scope ist optional. Die Nachricht beschreibt die fertige Änderung.
- Zulässige Typen: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Beispiele: `feat(controls): add left-hand swipe movement`, `fix(quests): preserve progress after restart`, `docs(story): describe the lake quest`.
- Breaking Changes mit `!` kennzeichnen und im Body erklären. Die erste Zeile darf höchstens 100 Zeichen lang sein; eine Beschreibung ist Pflicht.
- Vor Commit und Push Änderungen prüfen und erforderliche Repository-Checks abschließen. Nur zum Feature gehörende Dateien aufnehmen; fremde Änderungen nicht versehentlich mit committen. Buildwerkzeuge, APKs und Geheimnisse bleiben außerhalb von Git.
- Am Feature-Ende Ergebnis und Prüfstatus nennen sowie eine passende Commit-Nachricht vorschlagen. Commit und Push erst nach ausdrücklicher Freigabe des Nutzers für dieses Feature. Freigabe für „Commit und Push“ autorisiert beide Schritte; dann ohne erneute Rückfrage ausführen.
- Keine automatische Freigabe aus früheren Features ableiten. Keine Force-Pushes, History-Rewrites oder Umgehung von Hooks ohne ausdrückliche Anweisung.
