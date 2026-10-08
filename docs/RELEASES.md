# Releases mit Release Please

## Ablauf

- Jeder Push auf `main` startet Release Please. Conventional Commits bestimmen die nächste Version und das Changelog im Release-PR. Auch Dokumentation und Wartungsänderungen werden berücksichtigt.
- `always-update: true` aktualisiert den bestehenden Release-PR auch bei Änderungen auf `main`, die seine Release-Notizen nicht verändern. So übernimmt der PR beispielsweise CI-Fixes und startet mit dem aktuellen Stand seine Prüfungen erneut. Das setzt einen erfolgreichen Release-Please-Lauf mit dem eingerichteten Bot-Token voraus.
- Der Release-PR aktualisiert `package.json`, `package-lock.json`, `CHANGELOG.md` und `.github/.release-please-manifest.json`. Ausgangsversion ist `0.1.0`. Die Konfiguration liegt unter `.github/release-please-config.json`.
- Release Please verwaltet die Formatierung des Versionsmanifests. Nur für `.github/.release-please-manifest.json` ist der Biome-Formatter deaktiviert; die JSON-Prüfung und die Regeln für die übrigen Dateien bleiben aktiv.
- Nach dem Merge des Release-PRs erstellt Release Please das GitHub-Release mit einem Tag wie `v0.2.0`. Der gleiche Workflow ruft die gemeinsame App- und Container-Pipeline für genau diesen Tag auf. Der Tag muss exakt `v<package.json-Version>` entsprechen; andernfalls endet der Build vor der Erstellung von Paketen. Erst nach erfolgreichen Checks, Build und Signaturprüfung werden `LittleQuest.apk`, das zur Vorbereitung dienende, unsignierte `LittleQuest-unsigned.aab` und `LittleQuest-container.tar.gz` an das Release angehängt. Die Veröffentlichung wartet auf beide Builds und die Package-Veröffentlichung.
- Wenn einer der Builds oder die Package-Veröffentlichung fehlschlägt, existiert das Release zunächst ohne die gemeinsamen Downloads. Nach Behebung des Buildproblems **Actions → Release Please → Run workflow** starten und unter `release-tag` das vorhandene Tag eingeben. Der Build verwendet weiterhin den Code des Tags; Codefixes benötigen deshalb einen neuen Release-Tag. Ohne Tag-Eingabe wird der normale Release-Please-Lauf ausgeführt.
- Android liest die Version aus `package.json`. Der `versionCode` wird als `major * 1000000 + minor * 1000 + patch` berechnet; Minor und Patch müssen jeweils unter 1000 bleiben, Major höchstens 2100.
- Die APK bleibt eine Debug-APK mit dem Schlüssel des jeweiligen GitHub-Runners. Für verlässliche Updates über bestehende Installationen ist später ein dauerhafter Signaturschlüssel erforderlich. Google Play wird nicht angesprochen.

## GitHub einrichten

1. Unter **Settings → Secrets and variables → Actions** das Secret `RELEASE_PLEASE_TOKEN` mit einem Bot-Token hinterlegen. Der Token braucht für dieses Repository **Contents**, **Pull requests** und **Issues** jeweils mit Schreibrechten, Metadaten lesend. Falls der Release-PR Workflowdateien ändert, sind zusätzlich Workflow-Schreibrechte nötig. Organisationsfreigaben beachten.
2. Falls nötig, unter **Settings → Actions → General** erlauben, dass GitHub Actions Pull Requests erstellt. Branch-Regeln und erforderliche Reviews gelten weiterhin; der Release-PR wird nicht automatisch gemerged.
3. Nach dem Push auf `main` den Release-PR prüfen und mergen. Anschließend liegt die getestete APK unter **Releases** als Download bereit. Die GitHub-Einstellungen und das Secret werden durch diese Dateien nicht automatisch eingerichtet.

Ein eigener Bot-Token sorgt dafür, dass Änderungen von Release Please die PR-Prüfungen starten. Das normale `GITHUB_TOKEN` würde diese Folgeereignisse unterdrücken. Der APK-Upload nutzt das kurzlebige Workflow-Token mit Schreibrecht für Repository-Inhalte.

Referenz: [Release Please Action](https://github.com/googleapis/release-please-action).

## Aussagekräftige Release-Merge-Nachrichten

Release Please setzt den PR-Titel auf `chore(release): release LittleQuest <Version>`, zum Beispiel `chore(release): release LittleQuest 0.6.0`. Dieser Titel soll auch die erste Zeile des Merge-Commits sein; die Release-Notizen bilden die Beschreibung. Agents übernehmen das nach Merge-Freigabe ausdrücklich. Bevorzugte Methode ist **Squash and merge**.

Damit auch manuelle Merges den passenden Text automatisch vorschlagen, einmal in [Settings → General → Pull Requests](https://github.com/r2dlan/LittleQuest/settings) einstellen:

- Unter **Allow squash merging** die Standardnachricht **Pull request title and description** auswählen.
- Falls **Allow merge commits** verwendet wird, dort ebenfalls **Pull request title and description** auswählen.

Diese Einstellungen gelten für alle PRs im Repository; die erlaubten Merge-Methoden bleiben unverändert. Ohne diese GitHub-Einstellung ändert der neue Release-PR-Titel allein die Standardnachricht eines normalen Merge-Commits nicht. Vor dem Bestätigen eines Merges Titel und Beschreibung prüfen. Bereits bestehende Commits bleiben unverändert.

Quellen: [Release-Please-Titel konfigurieren](https://github.com/googleapis/release-please/blob/main/docs/customizing.md#pull-request-title), [GitHub-Merge-Nachrichten konfigurieren](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-merging-for-pull-requests).

## Container-Downloads

Bei einem neuen Release baut der gemeinsame Workflow `check.yml` Android-App und Docker-Image aus exakt demselben Release-Tag. Nach Codeprüfungen und Spieltests startet die Pipeline den Container und prüft die Auslieferung der Spiel- und Datenschutzdateien. Das Image wird als `LittleQuest-container.tar.gz` exportiert und zusammen mit APK und AAB an das Release angehängt. Die Veröffentlichung der Downloads wartet auf beide Builds; bei einem Fehler den vorhandenen Release-Tag über den manuellen Release-Please-Lauf erneut bauen lassen.

Das Archiv enthält die Linux/amd64- und Linux/arm64-Varianten des Images `littlequest:local`. Lade- und Startanleitung stehen in [HOSTING.md](HOSTING.md). Gemeinsame App- und Container-Builds bei Push/PR oder manueller Ausführung stehen 14 Tage als Workflow-Artefakte bereit.

Zusätzlich veröffentlicht ein separater Job das bereits getestete Image unter `ghcr.io/r2dlan/littlequest`: `latest` für `main`, der Release-Tag für Releases und `sha-<Commit-ID>` für beide. Entwicklungs-Builds erhalten zusätzlich `v<Projektversion>-sha.<Commit-ID>`, ohne offizielle Versions-Tags zu überschreiben. Das OCI-Version-Label entspricht der Android-Version aus `package.json`. Die Package-Veröffentlichung wartet auf beide erfolgreichen Builds. Ein Release-Build überschreibt `latest` nicht. Pull Requests und andere Branches erhalten keinen Veröffentlichungsjob. Nur dieser Job erhält `packages: write`; er authentifiziert sich mit dem kurzlebigen `GITHUB_TOKEN`. Der aufrufende Release-Workflow reicht dieses Recht explizit weiter. Das OCI-Source-Label verknüpft das Package mit dem Repository. Nach der ersten Veröffentlichung die standardmäßig private Package-Sichtbarkeit prüfen und bei gewünschtem öffentlichem Zugriff in den Package-Einstellungen ändern.

Referenz: [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

## Aufbewahrung: zehn Versionen

Der Workflow **Keep last 10 releases and container versions** räumt nach erfolgreichen gemeinsamen Build- und Release-Workflows auf `main` sowie täglich auf. Ein manueller Start zeigt standardmäßig nur eine Vorschau; für tatsächliches Löschen `dry-run` deaktivieren.

- Releases: Die zehn zuletzt veröffentlichten Releases (einschließlich Pre-Releases) bleiben erhalten. Entwürfe werden nicht mitgezählt oder gelöscht. Ältere Releases werden mit ihren APK-, AAB- und Container-Downloads entfernt. Die Git-Tags und Commit-Historie bleiben erhalten.
- Package `ghcr.io/r2dlan/littlequest`: Zehn Container-Versionen nach Erstellungsdatum bleiben erhalten. Eine Version ist ein gemeinsamer Image-Index (bei älteren Builds ein einzelnes Image); mehrere Tags desselben Eintrags zählen zusammen als eine Version. Die von behaltenen Indizes referenzierten Plattform-Images bleiben zusätzlich geschützt. Verwaiste Images ohne übergeordneten Index zählen als eigenständige Versionen. Die mit `latest` markierte Version ist geschützt und zählt zu den zehn behaltenen Versionen. Bei gleichzeitiger Veröffentlichung kann vorübergehend eine weitere Version bleiben; der nächste Lauf bereinigt erneut.
- Die Bereinigung liest alle API-Seiten, bevor sie löscht. API- oder Berechtigungsfehler lassen den Lauf fehlschlagen. Fehlendes Package vor dem ersten Upload wird übersprungen.

GitHub Actions benötigt **Admin-Zugriff auf das Package** zum Löschen von Versionen. Vom Repository-Workflow veröffentlichte Packages erhalten diesen Zugriff normalerweise automatisch; bei einem vorhandenen Package unter **Package settings → Manage Actions access** prüfen. Die Löschberechtigung nutzt `GITHUB_TOKEN`, kein zusätzliches Secret. GitHub kann das Löschen stark heruntergeladener öffentlicher Package-Versionen einschränken; der Workflow meldet dann den API-Fehler, statt eine erfolgreiche Bereinigung vorzutäuschen.

Referenz: [GitHub: Packages löschen und wiederherstellen](https://docs.github.com/en/packages/learn-github-packages/deleting-and-restoring-a-package).

## Store-Builds

Für Google Play stehen ein gesonderter manueller signierter Build und die [Signierungsanleitung](store/SIGNING.md) bereit. Die normalen Release-Please-Downloads bleiben eine Debug-APK und ein unsigniertes AAB; sie sind nicht als Play-Store-Upload gedacht.

## Gemeinsame Pipeline

`check.yml` ersetzt die getrennten Android- und Container-Workflows. Version und Commit werden einmal ermittelt; alle Folgejobs checken diesen Commit aus. `package-lock.json` muss dieselbe Version enthalten. Artefaktnamen enthalten die Version und außerhalb eines Releases zusätzlich den Commit. Codequalität, Tests und Asset-Synchronisierung werden einmal geprüft; Android und Container bauen anschließend parallel. Beide Jobs sind Voraussetzung für die Package-Veröffentlichung. Reine Dokumentationsänderungen bleiben ausgeschlossen.

Auch der manuelle signierte Android-Workflow baut zunächst das passende Android-/Container-Paar und signiert danach die Android-Version desselben Commits. Dieser vorbereitende Build veröffentlicht kein Package. Die tägliche Bereinigung führt ausschließlich das bereits geprüfte Bereinigungsskript aus; sie installiert keine Entwicklungspakete und wiederholt keine Spieltests.

## Cloudflare Pages

Nach einem neuen Release und erfolgreichen Builds veröffentlicht ein nachgelagerter Job die Webversion desselben Commits auf Cloudflare Pages. Er wartet auf die Release-Downloads und verwendet die GitHub-Secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` sowie den voreingestellten Projektnamen `littlequest` (optional überschreibbar mit `CLOUDFLARE_PAGES_PROJECT`). Ohne Konfiguration meldet der Deployment-Job einen Fehler; die bereits erstellten Release-Pakete bleiben erhalten. Ein normaler Push oder Pull Request führt kein Pages-Deployment aus.

Beim manuellen Wiederaufbau eines vorhandenen Release-Tags wird die Website nur mit aktivierter Option `deploy-pages` veröffentlicht. Diese Option kann bei einem alten Tag einen bewussten Rollback auslösen. Einrichtung, Offline-Cache und Wiederholung stehen in [CLOUDFLARE.md](CLOUDFLARE.md).

## Mehrere Container-Plattformen

Der gemeinsame Build erstellt `linux/amd64` und `linux/arm64`, lädt beide Varianten in den containerd-Image-Store und prüft jeweils Server und Spieldateien. ARM64 wird auf dem Build-Runner mit QEMU ausgeführt. Erst nach beiden Plattformtests und erfolgreichem Android-Build wird genau dieses getestete Image veröffentlicht. Die Pipeline prüft anschließend den öffentlichen Image-Index auf beide Plattformen. Zusätzliche Provenance-/SBOM-Manifeste sind für diesen Build deaktiviert. Die zehn behaltenen Package-Versionen umfassen ihre referenzierten Plattform-Images; Bereinigung und Veröffentlichung werden gegeneinander serialisiert.
