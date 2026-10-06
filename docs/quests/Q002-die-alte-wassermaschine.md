# Q002 – Die alte Wassermaschine

**Status:** Umgesetzt
**Art:** Hauptgeschichte
**Gebiet:** Flüsterhöhle / Sonnensee
**Voraussetzung:** Q001: Brücke repariert

## Geschichte und Start

Mina, die Tüftlerin am Höhleneingang, möchte die alte Wassermaschine wieder in Betrieb nehmen. Sie soll Quellwasser ins Dorf leiten. Die Aufgabe beginnt beim Gespräch mit Mina nach dem Überqueren der Brücke.

## Ablauf

1. Minas Bitte annehmen.
2. Zwei Zahnräder zwischen den Felsen finden.
3. Den Hinweisstein lesen: „Zuerst der Mond. Dann die Sonne. Zuletzt der Stern.“
4. Die Schalter in dieser Reihenfolge drücken: Mitte → links → rechts.
5. Die geöffnete Steinkammer betreten und das dritte Zahnrad sammeln.
6. An der Maschine alle drei Zahnräder einsetzen und den Start bestätigen.
7. Durch das geöffnete Tor zum Sonnensee gehen.

Die ersten beiden Zahnräder und das Rätsel können in beliebiger Reihenfolge erledigt werden.

## Gespräche und Hinweise

Mina erklärt Maschine, Zahnräder und Kammer. Der Hinweisstein nennt die Symbolreihenfolge. Die Lichter zeigen korrekte Eingaben. Eine falsche Eingabe setzt die Reihenfolge zurück; das Rätsel kann beliebig oft wiederholt werden.

## Dauerhafte Veränderung

Die Kammer öffnet sich. Die Maschine läuft sichtbar, Wasser fließt und das Tor zum See öffnet sich. Am See erscheint der Abschlussdialog. Die Wasserversorgung des Dorfs wird erzählerisch erwähnt; ein sichtbarer Dorfbrunnen ist bisher nicht umgesetzt.

## Fortschritt

Annahme, Zahnräder, korrekte Schalterfolge, Maschinenreparatur und Seeankunft bleiben gespeichert. Zahnräder und Reparatur können nicht mehrfach belohnt werden. Rückkehr zu Mina und ins Dorf ist möglich. Alte Spielstände aus Q001 können die Aufgabe beginnen; frühere Positionen aus der Seitenansicht werden bei Migration auf sichere Kartenpositionen gesetzt.

## Umsetzung

Aktuell in `web/quest.js`, `web/world.js` und `web/game.js`. Vollständiger Ablauf, Reihenfolge, Speicherung und Zugangssperren sind automatisiert geprüft.
