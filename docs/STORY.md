# Little Quest – Story und Aufgaben

Diese Übersicht ist der Einstieg für neue Geschichten. Jede Quest bekommt eine eigene Datei in `docs/quests/`. Das ursprüngliche `GAME_CONCEPT.md` beschreibt die Vision; die Questdateien beschreiben den aktuellen Entwurf und die tatsächlich umgesetzten Aufgaben.

## Aktueller Rahmen

Little Quest ist ein gemütliches Abenteuer in 2D-Draufsicht. Kleine Geschichten verbinden Dorf, Wald, Höhle und See. Gespräche, Gegenstände und Umgebungsrätsel stehen im Mittelpunkt. Aufgaben sollen kurze Spielsitzungen ermöglichen und die Welt sichtbar verändern. Entwürfe verwenden die aktuelle Bewegung in vier Richtungen; neue Fähigkeiten werden ausdrücklich als Erweiterung beschrieben.

## Questübersicht

| ID | Titel | Gebiet | Voraussetzung | Status | Datei |
| --- | --- | --- | --- | --- | --- |
| Q001 | Die kaputte Brücke | Dorf / Wald | Spielbeginn | Umgesetzt | [Q001](quests/Q001-die-kaputte-bruecke.md) |
| Q002 | Die alte Wassermaschine | Höhle | Q001: Brücke repariert | Umgesetzt | [Q002](quests/Q002-die-alte-wassermaschine.md) |

Nächste freie ID: **Q003**. IDs bleiben bestehen, auch wenn Titel oder Reihenfolge sich ändern. Neue Aufgaben müssen nicht zwingend auf die vorige folgen: Nebenquests können z. B. nach Q001 im Dorf beginnen.

Status: **Idee → Ausgearbeitet → In Umsetzung → Umgesetzt**. „Ausgearbeitet“ heißt, dass die Geschichte beschrieben ist, nicht dass sie bereits gebaut wurde.

## Neue Aufgabe hinzufügen

1. `quests/QUEST_TEMPLATE.md` kopieren, z. B. als `quests/Q003-der-vermisste-hund.md`.
2. Zunächst Titel, Idee, Startbedingung, Ablauf und Veränderung der Welt ausfüllen. Ungeklärte Dinge ausdrücklich als offen markieren.
3. Die Aufgabe mit Status „Idee“ oder „Ausgearbeitet“ in die Tabelle aufnehmen und die nächste freie ID erhöhen.
4. Zur Umsetzung im Chat schreiben: „Setze Q003 aus docs/quests/Q003-der-vermisste-hund.md um.“
5. Nach Umsetzung Beschreibung mit dem Ergebnis abgleichen und Status aktualisieren. Spielfortschritt, Rückkehr ins Gebiet und bestehende Spielstände prüfen.

Du kannst auch einfach im Chat eine Geschichte erzählen. Daraus können wir eine Questdatei erstellen, bevor sie umgesetzt wird. Nicht jedes Feld muss von dir ausgefüllt werden.

## Orientierung für gute kleine Geschichten

- Eine klare Motivation: Wem helfen wir, und warum?
- Drei bis fünf verständliche Schritte; eine aktive Hauptaufgabe zur Zeit.
- Eine kleine Besonderheit statt nur noch mehr Sammelobjekte.
- Ein Hinweis, wenn der Spieler nicht weiterkommt.
- Eine sichtbare, dauerhaft gespeicherte Veränderung.
- Kein endgültiges Scheitern durch falsche Reihenfolge oder verbrauchte Gegenstände.

## Figuren und Orte

Die menschlichen Figuren verwenden den ausgewählten Stil B: detaillierte Pixelgrafik mit großen ausdrucksstarken Gesichtern, Lichtdetails und erdigen Kleidungsfarben. Die Spielfigur trägt einen roten Rucksack, Jona eine Handwerkerschürze und einen grauen Bart, Mina einen Haarknoten. Hausbewohner nutzen passende Varianten. Die transparenten Sprites in `web/assets/characters-b.png` wurden mit Imagegen direkt aus der freigegebenen B-Vorlage erstellt: drei Figuren mit Vorder-, Seiten- und Rückansichten. `web/characters.js` zeichnet die passenden Ausschnitte; links wird die Seitenansicht gespiegelt. Beim Laufen bewegen sich die Füße abwechselnd, bei „Weniger Bewegung“ bleiben die Figuren ruhig. Das Bild wird für Offline-Spiel und Android mitgeliefert.

Beim Betreten und Verlassen eines Hauses wird die Spielwelt kurz ab- und wieder eingeblendet. Der Ortswechsel erfolgt in der Mitte des Übergangs; Bewegung und weitere Türaktionen sind währenddessen gesperrt. Mit „Weniger Bewegung“ wechselt die Ansicht sofort ohne Überblendung.

Die drei Häuser im Weidendorf sind begehbar. An einer Haustür nach oben gehen oder die Interaktionstaste drücken; im Innenraum unten hinausgehen oder an der Tür interagieren. Jeder Raum enthält Möbel und zwei umhergehende Bewohner ohne Gespräche oder Aufgaben. Möbel und Wände begrenzen die Bewegung; Bewohner blockieren den Spieler nicht. Bei Pause, Gesprächen und „Weniger Bewegung“ ruhen die Animationen. Beim Neustart des Spiels steht der Spieler sicher vor dem zuletzt betretenen Haus; Questfortschritt bleibt erhalten.

| Name | Rolle und bisherige Geschichte |
| --- | --- |
| Jona | Handwerker im Weidendorf; repariert mit drei Brettern die Brücke. |
| Mina | Tüftlerin am Eingang der Flüsterhöhle; bittet um Hilfe für die Wassermaschine. |
| Fuchs | Waldbewohner; tauscht sein Brett gegen einen Apfel. |
| Hase | Hüpft während Q001 auf den Waldwegen; friedlicher Umgebungsbewohner. |
| Weidendorf | Heimatort und Ausgangspunkt. |
| Flüsterwald | Waldwege, Lichtungen und Fuchsbau. |
| Flüsterhöhle | Zahnräder, Hinweisstein, Schalterkammer und Wassermaschine. |
| Sonnensee | Nach Q002 erreichbar; Ausgangspunkt für kommende Geschichten. |

## Offene Ideen

Hier können kurze Ideen gesammelt werden, ohne sie schon als nächste Aufgabe festzulegen:

- Noch keine weiteren Aufgaben festgelegt.
