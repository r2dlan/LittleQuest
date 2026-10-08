# Little Quest

Ein gemütliches 2D-Abenteuer in Draufsicht für Spieler ab 6 Jahren. Erkunde das Dorf und den Wald, hilf beim Reparieren einer Brücke und entdecke das Geheimnis der alten Wassermaschine.

## Im Browser spielen

[Little Quest direkt spielen](https://littlequest.daniel-andres.com) – auf dem Smartphone oder Computer, ohne Installation.

## Auf Android spielen

Lade **LittleQuest.apk** aus dem [aktuellen Release](https://github.com/r2dlan/LittleQuest/releases/latest) herunter und öffne die Datei auf deinem Smartphone. Falls Android nachfragt, erlaube die Installation aus dieser Quelle. Benötigt wird Android 8.0 oder neuer.

Das Spiel läuft im Querformat und vollständig offline. Die APK ist aktuell eine Testversion; ein Play-Store-Download ist noch nicht verfügbar.

## Mit Docker spielen

Mit installiertem Docker das öffentliche Image starten, ohne Anmeldung:

```sh
docker run -d --name littlequest --pull always -p 127.0.0.1:4173:4173 ghcr.io/r2dlan/littlequest:latest
```

Danach [Little Quest im Browser öffnen](http://localhost:4173). Weitere Optionen stehen in der [Container-Anleitung](docs/HOSTING.md).

## Steuerung

- **Handy:** Links wischen und halten zum Bewegen, loslassen zum Stoppen. Rechts die Interaktionstaste drücken.
- **Tastatur:** WASD oder Pfeiltasten zum Bewegen, E / Leertaste / Enter zum Interagieren.
- **Pause:** Oben rechts oder mit Escape. Dort findest du Hilfe, Datenschutz und Einstellungen für größere Texte und weniger Animationen.

Dein Fortschritt wird automatisch auf dem jeweiligen Gerät gespeichert. „Neues Abenteuer starten“ setzt den Spielstand nach Bestätigung zurück.

## Weitere Informationen

[Dokumentation](docs/README.md) · [Änderungen und Versionen](https://github.com/r2dlan/LittleQuest/releases)
