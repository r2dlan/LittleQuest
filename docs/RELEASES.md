# Releases mit Release Please

## Ablauf

- Jeder Push auf `main` startet Release Please. Conventional Commits bestimmen die nächste Version und das Changelog im Release-PR. Auch Dokumentation und Wartungsänderungen werden berücksichtigt.
- `always-update: true` aktualisiert den bestehenden Release-PR auch bei Änderungen auf `main`, die seine Release-Notizen nicht verändern. So übernimmt der PR beispielsweise CI-Fixes und startet mit dem aktuellen Stand seine Prüfungen erneut. Das setzt einen erfolgreichen Release-Please-Lauf mit dem eingerichteten Bot-Token voraus.
- Der Release-PR aktualisiert `package.json`, `package-lock.json`, `CHANGELOG.md` und `.github/.release-please-manifest.json`. Ausgangsversion ist `0.1.0`. Die Konfiguration liegt unter `.github/release-please-config.json`.
- Release Please verwaltet die Formatierung des Versionsmanifests. Nur für `.github/.release-please-manifest.json` ist der Biome-Formatter deaktiviert; die JSON-Prüfung und die Regeln für die übrigen Dateien bleiben aktiv.
- Nach dem Merge des Release-PRs erstellt Release Please das GitHub-Release mit einem Tag wie `v0.2.0`. Der gleiche Workflow ruft die bestehende APK-Pipeline für genau diesen Tag auf. Erst nach erfolgreichen Checks, Build und Signaturprüfung werden `LittleQuest.apk` und das zur Vorbereitung dienende, unsignierte `LittleQuest-unsigned.aab` an das Release angehängt.
- Wenn der APK-Build fehlschlägt, existiert das Release zunächst ohne APK. Nach Behebung des Buildproblems **Actions → Release Please → Run workflow** starten und unter `release-tag` das vorhandene Tag eingeben. Der Build verwendet weiterhin den Code des Tags; Codefixes benötigen deshalb einen neuen Release-Tag. Ohne Tag-Eingabe wird der normale Release-Please-Lauf ausgeführt.
- Android liest die Version aus `package.json`. Der `versionCode` wird als `major * 1000000 + minor * 1000 + patch` berechnet; Minor und Patch müssen jeweils unter 1000 bleiben, Major höchstens 2100.
- Die APK bleibt eine Debug-APK mit dem Schlüssel des jeweiligen GitHub-Runners. Für verlässliche Updates über bestehende Installationen ist später ein dauerhafter Signaturschlüssel erforderlich. Google Play wird nicht angesprochen.

## GitHub einrichten

1. Unter **Settings → Secrets and variables → Actions** das Secret `RELEASE_PLEASE_TOKEN` mit einem Bot-Token hinterlegen. Der Token braucht für dieses Repository **Contents**, **Pull requests** und **Issues** jeweils mit Schreibrechten, Metadaten lesend. Falls der Release-PR Workflowdateien ändert, sind zusätzlich Workflow-Schreibrechte nötig. Organisationsfreigaben beachten.
2. Falls nötig, unter **Settings → Actions → General** erlauben, dass GitHub Actions Pull Requests erstellt. Branch-Regeln und erforderliche Reviews gelten weiterhin; der Release-PR wird nicht automatisch gemerged.
3. Nach dem Push auf `main` den Release-PR prüfen und mergen. Anschließend liegt die getestete APK unter **Releases** als Download bereit. Die GitHub-Einstellungen und das Secret werden durch diese Dateien nicht automatisch eingerichtet.

Ein eigener Bot-Token sorgt dafür, dass Änderungen von Release Please die PR-Prüfungen starten. Das normale `GITHUB_TOKEN` würde diese Folgeereignisse unterdrücken. Der APK-Upload nutzt das kurzlebige Workflow-Token mit Schreibrecht für Repository-Inhalte.

Referenz: [Release Please Action](https://github.com/googleapis/release-please-action).

## Container-Downloads

Bei einem neuen Release baut der wiederverwendbare Workflow `container.yml` das Docker-Image aus exakt demselben Release-Tag. Nach Codeprüfungen und Spieltests startet die Pipeline den Container und prüft die Auslieferung der Spiel- und Datenschutzdateien. Das Image wird als `LittleQuest-container.tar.gz` exportiert und zusammen mit APK und AAB an das Release angehängt. Die Veröffentlichung der Downloads wartet auf beide Builds; bei einem Fehler den vorhandenen Release-Tag über den manuellen Release-Please-Lauf erneut bauen lassen.

Das Archiv enthält das Linux/amd64-Image `littlequest:local`. Lade- und Startanleitung stehen im Abschnitt „Als Container starten“ der Haupt-README. Eigenständige Container-Builds bei Push/PR oder manueller Ausführung stehen 14 Tage als Workflow-Artefakte bereit.

Zusätzlich veröffentlicht ein separater Job das bereits getestete Image unter `ghcr.io/r2dlan/littlequest`: `latest` für `main`, der Release-Tag für Releases und `sha-<Commit-ID>` für beide. Ein Release-Build überschreibt `latest` nicht. Pull Requests und andere Branches erhalten keinen Veröffentlichungsjob. Nur dieser Job erhält `packages: write`; er authentifiziert sich mit dem kurzlebigen `GITHUB_TOKEN`. Der aufrufende Release-Workflow reicht dieses Recht explizit weiter. Das OCI-Source-Label verknüpft das Package mit dem Repository. Nach der ersten Veröffentlichung die standardmäßig private Package-Sichtbarkeit prüfen und bei gewünschtem öffentlichem Zugriff in den Package-Einstellungen ändern.

Referenz: [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

## Aufbewahrung: zehn Versionen

Der Workflow **Keep last 10 releases and container versions** räumt nach erfolgreichen Container- und Release-Workflows auf `main` sowie täglich auf. Ein manueller Start zeigt standardmäßig nur eine Vorschau; für tatsächliches Löschen `dry-run` deaktivieren.

- Releases: Die zehn zuletzt veröffentlichten Releases (einschließlich Pre-Releases) bleiben erhalten. Entwürfe werden nicht mitgezählt oder gelöscht. Ältere Releases werden mit ihren APK-, AAB- und Container-Downloads entfernt. Die Git-Tags und Commit-Historie bleiben erhalten.
- Package `ghcr.io/r2dlan/littlequest`: Zehn Container-Versionen nach Erstellungsdatum bleiben erhalten. Eine Version ist ein Image-Digest; mehrere Tags desselben Images zählen zusammen als eine Version. Auch Versionen ohne Tags zählen mit. Die mit `latest` markierte Version ist geschützt und zählt zu den zehn behaltenen Versionen. Bei gleichzeitiger Veröffentlichung kann vorübergehend eine weitere Version bleiben; der nächste Lauf bereinigt erneut.
- Die Bereinigung liest alle API-Seiten, bevor sie löscht. API- oder Berechtigungsfehler lassen den Lauf fehlschlagen. Fehlendes Package vor dem ersten Upload wird übersprungen.

GitHub Actions benötigt **Admin-Zugriff auf das Package** zum Löschen von Versionen. Vom Repository-Workflow veröffentlichte Packages erhalten diesen Zugriff normalerweise automatisch; bei einem vorhandenen Package unter **Package settings → Manage Actions access** prüfen. Die Löschberechtigung nutzt `GITHUB_TOKEN`, kein zusätzliches Secret. GitHub kann das Löschen stark heruntergeladener öffentlicher Package-Versionen einschränken; der Workflow meldet dann den API-Fehler, statt eine erfolgreiche Bereinigung vorzutäuschen.

Referenz: [GitHub: Packages löschen und wiederherstellen](https://docs.github.com/en/packages/learn-github-packages/deleting-and-restoring-a-package).

## Store-Builds

Für Google Play stehen ein gesonderter manueller signierter Build und die [Signierungsanleitung](store/SIGNING.md) bereit. Die normalen Release-Please-Downloads bleiben eine Debug-APK und ein unsigniertes AAB; sie sind nicht als Play-Store-Upload gedacht.
