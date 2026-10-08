# Little Quest – Die Suche nach deinem Bruder

Du startest in deinem Zuhause und suchst deinen Bruder. Dein Freund im Dorf kennt seine Spur. Die Reise führt durch Wald, über Berge und Schnee, durch Wiesen und Wüste und endet am Strand: Dein Bruder liegt dort und sonnt sich.

## Aktueller Spielstand

Die 14 Landschaftsstationen bilden einen durchgehend begehbaren Weg. Aufgaben, Reparaturen, Dialoge und Freischaltungen sind noch nicht implementiert. Brücke und Leiter sind für die Vorschau offen. Häuser lassen sich betreten; Bewohner bewegen sich ohne Gespräche. Der Bruder liegt als Kulisse am Strand.

Bodenfarben, Wege und Pflanzen verändern sich schrittweise. Die Kamera folgt der Figur ohne Ladebildschirm zwischen Landschaften. Zurückgehen ist jederzeit möglich. Ein separater Spielstand `littlequest-journey-v1` speichert die Position dieser Reise; der bisherige Prototyp-Spielstand `littlequest-v1` bleibt erhalten. Beim ersten Start der neuen Route beginnt die Figur zu Hause.

## Die 14 Stationen

Der Bergaufstieg in S04 ist eine echte Höhenstufe: Die Felswand ist gesperrt, nur die Leiter verbindet den unteren Waldweg mit dem oberen Bergweg. Auf der Leiter nach oben bzw. unten laufen oder wischen; erst oben seitlich weitergehen. Der Rückweg funktioniert ebenfalls. Alte Vorschaupositionen in der neuen Felswand werden auf einen sicheren Weg versetzt.

| ID | Gebiet | Status | Datei |
| --- | --- | --- | --- |
| S01 | Heimat | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S01-heimat.md) |
| S02 | Dorf | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S02-dorf.md) |
| S03 | Wald · Die Brücke | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S03-wald-bruecke.md) |
| S04 | Wald · Der Aufstieg | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S04-wald-aufstieg.md) |
| S05 | Bergpfad | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S05-bergpfad.md) |
| S06 | Schneehöhen | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S06-schneehoehen.md) |
| S07 | Schneestadt | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S07-schneestadt.md) |
| S08 | Abstieg | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S08-abstieg.md) |
| S09 | Weite Wiesen | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S09-wiesen.md) |
| S10 | Wüstenrand | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S10-wuestenrand.md) |
| S11 | Wüstenstadt | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S11-wuestenstadt.md) |
| S12 | Grüne Rückkehr | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S12-gruene-rueckkehr.md) |
| S13 | Wiesendorf | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S13-wiesendorf.md) |
| S14 | Strand | Landschaft umgesetzt, Aufgaben geplant/offen | [Station](quests/S14-strand.md) |

## Mehrere Aufgaben je Station

Eine Station ist ein Gebiet und ein Storyabschnitt, keine einzelne Aufgabe. In ihrer Datei können beliebig viele Aufgaben mit stabilen IDs wie `S03-A01` und `S03-A02` definiert werden. Nummern nicht wiederverwenden. Jede Aufgabe beschreibt Voraussetzungen, Ziele, Hinweise, Abschluss, gespeicherte Veränderungen und Sonderfälle. Für ausgelagerte Aufgaben kann später eine Datei `S03-A01-holz-sammeln.md` angelegt und aus der Station verlinkt werden.

1. Passende Stationsdatei öffnen.
2. Nächste freie Aufgaben-ID bestimmen.
3. [Aufgaben-Vorlage](quests/TASK_TEMPLATE.md) als neuen Abschnitt einfügen.
4. Reihenfolge, optionale Ziele und Abhängigkeiten ausdrücklich festhalten.
5. Erst nach Implementierung und Prüfung den Status auf „Umgesetzt“ ändern.

Statusfolge: **Idee → Ausgearbeitet → In Umsetzung → Umgesetzt**. Der Landschaftsstatus wird getrennt davon geführt.

## Technische Zuordnung

`web/journey-world.js` definiert Gebiete, Übergangsfarben, den durchgehenden Weg und begehbare Geometrie. `web/journey-game.js` ist der aktive Spieleinstieg. Die Figuren verwenden die [Stil-B-Sprites](GRAPHICS.md). Questdaten werden später anhand der Stations- und Aufgaben-IDs ergänzt.

## Frühere Prototyp-Geschichten

Die ursprünglichen Aufgaben bleiben als Referenz archiviert: [Q001 – Die kaputte Brücke](quests/archive/Q001-die-kaputte-bruecke.md) und [Q002 – Die alte Wassermaschine](quests/archive/Q002-die-alte-wassermaschine.md). Sie gehören nicht zum aktuellen spielbaren Ablauf der neuen Reise. Bestehender Prototypcode und seine Tests bleiben als Referenz erhalten; die neue Route hat eigene Tests.
