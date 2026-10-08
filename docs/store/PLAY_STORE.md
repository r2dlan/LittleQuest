# Google-Play-Vorbereitung

Stand: 6. Oktober 2026. Vorbereitung, noch keine Store-Einreichung.

Die lokale Entwicklung verwendet inzwischen die 14-Stationen-Landschaftsvorschau der [neuen Reise](../STORY.md). Aufgaben sind noch nicht umgesetzt. Store-Texte und bisherige Screenshots zeigen den älteren Prototyp und müssen vor einer Einreichung mit dem finalen Spiel abgeglichen werden.

## Vorbereitet

- Herausgeber: Daniel Andres; Kontakt: moin@daniel-andres.com.
- Gewünschte Zielgruppe: ab 6 Jahren. Das ist keine bereits erteilte USK-/IARC-Altersfreigabe.
- Store-Texte und Angaben: `listing.de.json`.
- Datenschutztext im Spiel und als separat hostbare Seite: `web/privacy.html`. Herausgeber/Kontakt unter `web/privacy-details.json`.
- Android API 36, nicht debuggbares Release-App-Bundle, optionale Upload-Key-Signierung. Die normale CI baut Debug-APK und **unsigniertes** AAB als Vorbereitung. Der manuelle Workflow **Signed Android release build** baut signierte APK/AAB, sobald die vier Secrets hinterlegt sind.
- Automatische Pause/Speicherung beim App-Wechsel; explizites Fortsetzen, Steuerungshilfe, lokal gespeicherte Einstellungen für Hinweise, größere Texte und reduzierte Animationen.

## Noch vor Veröffentlichung erledigen

- [ ] Entwicklerkonto-Typ festlegen, Identitäts-/Organisationsprüfung der Play Console abschließen. Für persönliche Konten nach dem 13. November 2023: geschlossener Test mit mindestens 12 Testern, die 14 Tage durchgehend angemeldet sind, anschließend Produktionszugriff beantragen.
- [ ] Öffentliche HTTPS-Adresse für `privacy.html` einrichten. Erreichbar ohne Login, keine PDF. URL in `privacy-details.json` und Play Console eintragen. Tatsächlichen Hostinganbieter und seine Datenverarbeitung im Datenschutztext ergänzen. Datenschutztext vor Veröffentlichung abschließend prüfen, einschließlich Kontaktanfragen und gegebenenfalls weiterer Anbieter.
- [ ] Play App Signing aktivieren und einen dauerhaften Upload-Key sicher verwahren. Secrets siehe `SIGNING.md`. Testschlüssel aus der Buildprüfung sind ausschließlich für Tests und dürfen nicht als Produktionsschlüssel verwendet werden.
- [ ] Store-Grafiken abschließend prüfen: Icon 512 × 512 PNG und Feature-Grafik 1024 × 500 PNG ohne Transparenz liegen als Entwürfe mit SVG-Quellen vor. Zwei echte Aufnahmen aus der Webversion im Format 1920 × 1080 zeigen Gameplay und Einstellungen (`assets/screenshot-01.jpg`, `assets/screenshot-02.jpg`). Vor Einreichung mit der finalen Android-Version vergleichen. Für bessere Spiele-Präsentation zusätzlich drei Gameplay-Aufnahmen planen. Keine erfundenen Spielinhalte darstellen.
- [ ] Offizielle Altersbewertung über den IARC-Fragebogen einholen. Keine USK-6-Grafik vor erteilter Bewertung verwenden.
- [ ] Zielgruppen im Formular auswählen. „Ab 6“ berührt die Google-Altersgruppe 6–8; bei zusätzlichem Publikum auch 9–12 und weitere passende Gruppen auswählen. Bei Kindern als Zielgruppe gilt die Families-Richtlinie. Kein künstlicher Erwachsenen-Zielgruppenwechsel, um sie zu umgehen.
- [ ] Werbung: nein; In-App-Käufe: nein; App-Zugriff: vollständig ohne Login. Datensicherheit nach aktuellem Funktionsumfang: App sammelt/teilt keine Daten außerhalb des Geräts. Vor Abgabe das finale Bundle und sämtliche Abhängigkeiten/SDKs prüfen. Website-Hosting und Kontakt-E-Mails separat in der Datenschutzerklärung beschreiben.
- [ ] Geräte-Testplan unten durchführen und Ergebnis festhalten. Android-16-Verhalten, Systemleisten, Displayausschnitte und große Displays prüfen.
- [ ] `npm run store:check` ausführen. Es prüft Texte, HTTPS-URL und vorhandene Grafikdateien; es ersetzt keine inhaltliche Freigabe oder Play-Console-Prüfung.
- [ ] Signiertes AAB in den internen/geschlossenen Test hochladen und den Pre-launch report prüfen. Es gibt bewusst keinen automatischen Google-Play-Upload.

## Testplan auf echten Geräten

| Test | Erwartung | Ergebnis |
|---|---|---|
| Neue Reise in beide Richtungen erkunden | Alle 14 Stationen, Brücke, Aufstieg, Häuser und Strand erreichbar | Offen |
| Spätere Aufgaben vollständig spielen | Erst nach Implementierung anhand der Stationsdateien prüfen | Noch nicht implementiert |
| Während Bewegung Home drücken, App zurückholen | Stillstand, Pausenmenü, keine klemmende Steuerung | Offen |
| Während eines Dialogs App wechseln | Dialog bleibt nach Fortsetzen nutzbar | Offen |
| App schließen/Prozess beenden, neu öffnen | Zuletzt gespeicherter Fortschritt und Einstellungen wiederhergestellt | Offen |
| Neustart bestätigen/abbrechen | Nur Bestätigung setzt Spielstand zurück; Einstellungen bleiben | Offen |
| Flugmodus, Erststart | Komplettes Spiel und Datenschutz offline erreichbar | Offen |
| Kleine Displays, Pixel 6, Android 16, Tablet | Menüs scrollbar, Text lesbar, Touchziele erreichbar | Offen |
| Bildschirm drehen/Größe ändern | Fortschritt erhalten, Spielfeld korrekt skaliert | Offen |
| Große Texte, reduzierte Bewegung | Keine abgeschnittenen Bedienelemente, Toasts verschwinden weiterhin | Offen |
| App-Update mit dauerhaftem Schlüssel | Installation aktualisiert, Spielstand erhalten | Offen |
| TalkBack/Schaltersteuerung | Menü lesbar; Canvas-Spiel hat bislang keine vollständige nichtvisuelle Alternative | Offen |

Die App enthält keine eigenen nativen `.so`-Bibliotheken. Die 16-KB-Seitengrößen-Anforderung ist damit voraussichtlich ohne eigene native Anpassungen erfüllbar; finalen Bundle-Inhalt prüfen, besonders nach SDK-Erweiterungen.

## Offizielle Quellen

- [Target API](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Datenschutz](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Datensicherheit](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Altersbewertung](https://support.google.com/googleplay/android-developer/answer/9859655)
- [Families](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Store-Grafiken](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Tests persönlicher Konten](https://support.google.com/googleplay/android-developer/answer/14151465)
- [16-KB-Seitengrößen](https://developer.android.com/guide/practices/page-sizes)
