# Releases mit Release Please

## Ablauf

- Jeder Push auf `main` startet Release Please. Conventional Commits bestimmen die nächste Version und das Changelog im Release-PR. Auch Dokumentation und Wartungsänderungen werden berücksichtigt.
- `always-update: true` aktualisiert den bestehenden Release-PR auch bei Änderungen auf `main`, die seine Release-Notizen nicht verändern. So übernimmt der PR beispielsweise CI-Fixes und startet mit dem aktuellen Stand seine Prüfungen erneut. Das setzt einen erfolgreichen Release-Please-Lauf mit dem eingerichteten Bot-Token voraus.
- Der Release-PR aktualisiert `package.json`, `package-lock.json`, `CHANGELOG.md` und `.github/.release-please-manifest.json`. Ausgangsversion ist `0.1.0`. Die Konfiguration liegt unter `.github/release-please-config.json`.
- Release Please verwaltet die Formatierung des Versionsmanifests. Nur für `.github/.release-please-manifest.json` ist der Biome-Formatter deaktiviert; die JSON-Prüfung und die Regeln für die übrigen Dateien bleiben aktiv.
- Nach dem Merge des Release-PRs erstellt Release Please das GitHub-Release mit einem Tag wie `v0.2.0`. Der gleiche Workflow ruft die bestehende APK-Pipeline für genau diesen Tag auf. Erst nach erfolgreichen Checks, Build und Signaturprüfung wird `LittleQuest.apk` an das Release angehängt.
- Wenn der APK-Build fehlschlägt, existiert das Release zunächst ohne APK. Nach Behebung des Buildproblems **Actions → Release Please → Run workflow** starten und unter `release-tag` das vorhandene Tag eingeben. Der Build verwendet weiterhin den Code des Tags; Codefixes benötigen deshalb einen neuen Release-Tag. Ohne Tag-Eingabe wird der normale Release-Please-Lauf ausgeführt.
- Android liest die Version aus `package.json`. Der `versionCode` wird als `major * 1000000 + minor * 1000 + patch` berechnet; Minor und Patch müssen jeweils unter 1000 bleiben, Major höchstens 2100.
- Die APK bleibt eine Debug-APK mit dem Schlüssel des jeweiligen GitHub-Runners. Für verlässliche Updates über bestehende Installationen ist später ein dauerhafter Signaturschlüssel erforderlich. Google Play wird nicht angesprochen.

## GitHub einrichten

1. Unter **Settings → Secrets and variables → Actions** das Secret `RELEASE_PLEASE_TOKEN` mit einem Bot-Token hinterlegen. Der Token braucht für dieses Repository **Contents**, **Pull requests** und **Issues** jeweils mit Schreibrechten, Metadaten lesend. Falls der Release-PR Workflowdateien ändert, sind zusätzlich Workflow-Schreibrechte nötig. Organisationsfreigaben beachten.
2. Falls nötig, unter **Settings → Actions → General** erlauben, dass GitHub Actions Pull Requests erstellt. Branch-Regeln und erforderliche Reviews gelten weiterhin; der Release-PR wird nicht automatisch gemerged.
3. Nach dem Push auf `main` den Release-PR prüfen und mergen. Anschließend liegt die getestete APK unter **Releases** als Download bereit. Die GitHub-Einstellungen und das Secret werden durch diese Dateien nicht automatisch eingerichtet.

Ein eigener Bot-Token sorgt dafür, dass Änderungen von Release Please die PR-Prüfungen starten. Das normale `GITHUB_TOKEN` würde diese Folgeereignisse unterdrücken. Der APK-Upload nutzt das kurzlebige Workflow-Token mit Schreibrecht für Repository-Inhalte.

Referenz: [Release Please Action](https://github.com/googleapis/release-please-action).
