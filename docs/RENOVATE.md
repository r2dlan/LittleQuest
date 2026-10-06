# Automatische Versionsupdates

## Verhalten

- Zeitzone: **Europe/Berlin**.
- Neue Update-Branches und Pull Requests: **montags, 09:00 bis vor 15:00 Uhr**, inklusive automatischer Sommer-/Winterzeitumstellung.
- Bestehende Renovate-Branches werden bei jedem Bot-Lauf auf den aktuellen Stand von `main` gebracht (`rebaseWhen: behind-base-branch`, `updateNotScheduled: true`). Dafür startet der Bot auch bei jedem Push auf `main`. Diese Aktualisierungen sind außerhalb des Montagfensters erlaubt; dabei können auch neuere, mindestens sieben Tage alte Versionen in bestehende Update-Branches aufgenommen werden. Neue Commits auf den PR-Branches lösen die jeweils passenden Checks erneut aus.
- Eigene Commits auf Renovate-Branches können die automatische Aktualisierung verhindern. Bei Bedarf im PR die Rebase-/Retry-Checkbox aktivieren und den Renovate-Workflow manuell starten; dabei kann Renovate eigene Änderungen am Update-Branch verwerfen.
- Renovate läuft stündlich um Minute 17 im passenden UTC-Fenster. GitHub kann geplante Läufe verzögern; die Renovate-Konfiguration setzt das lokale Zeitfenster durch. Dies ist kein garantierter Lauf exakt um 09:00 Uhr.
- Neue Versionen werden erst berücksichtigt, wenn ihre Veröffentlichung mindestens **sieben Tage** zurückliegt. Fehlt ein verlässlicher Veröffentlichungszeitpunkt, wird die Version nicht automatisch freigegeben. Das betrifft das Alter der neuen Version, nicht das Alter der aktuell installierten Version.
- Jede Aktualisierung kommt als Pull Request mit Conventional Commit, z. B. `chore(deps): update dependency …`.
- Automerge gilt wie gewünscht auch für Major-Updates; jeder PR muss zuvor alle Statuschecks bestehen. Fehlerhafte oder noch laufende Checks verhindern das Merge.
- Renovate merged selbst per Squash (`platformAutomerge: false`), statt einen ungeprüften nativen Auto-Merge zu aktivieren. Nach grünen PR-Prüfungen läuft der Bot erneut und kann mergen, auch außerhalb des Update-Zeitfensters. Er prüft dabei nochmals den aktuellen Zustand.
- npm-Abhängigkeiten und Lockfile, GitHub Actions, Gradle-Plugins sowie die Gradle-Version werden gepflegt. Biome-Paket und Konfigurationsschema landen gemeinsam in einem PR.

## Einmalig auf GitHub einrichten

1. Diese Änderungen nach Freigabe auf den Default-Branch pushen.
2. Ein dediziertes Bot-Konto oder einen geeigneten Personal Access Token für dieses Repository verwenden. Als Secret unter **Settings → Secrets and variables → Actions → New repository secret** den Namen **RENOVATE_TOKEN** hinterlegen. Den Token nicht in Dateien oder Chatnachrichten schreiben.
3. Der Token braucht Lesezugriff auf Metadaten und Checks sowie Schreibrechte für Repository-Inhalte, Pull Requests und Issues (Dependency Dashboard). Für Aktualisierungen von Workflowdateien braucht er zusätzlich **Workflows: read and write**. Bei klassischen Tokens entsprechen dem `repo` und `workflow`. Organisationsfreigaben müssen ggf. durch einen Admin bestätigt werden.
4. Beim Branch-Schutz für den Default-Branch **Validate Renovate configuration**, **Code quality and tests** und **Build Android APK** nicht pauschal als Pflichtchecks verlangen: Diese Workflows laufen abhängig von den geänderten Dateien. Andernfalls bleiben PRs ohne passende Änderungen beim Merge blockiert. Bereits konfigurierte Pflichtchecks müssen entsprechend angepasst werden; die Repository-Dateien ändern diese GitHub-Einstellung nicht. Renovate wartet weiterhin auf alle tatsächlich gestarteten Checks. Squash-Merges müssen erlaubt sein. Erforderliche manuelle Reviews können Automerge blockieren; solche Regeln nicht stillschweigend umgehen.
5. Unter **Actions → Renovate → Run workflow** einen ersten Lauf starten. Außerhalb des Zeitfensters werden keine neuen Versionsupdates erstellt; bestehende grüne Update-PRs können gemerged werden.

Das normale `GITHUB_TOKEN` wird nicht als Bot-Token verwendet: Damit erzeugte Änderungen starten die notwendigen PR-Workflows nicht zuverlässig. Die Workflows führen Code aus Update-PRs ohne Bot-Secret aus. Der Bot selbst verwendet immer die Konfiguration vom vertrauenswürdigen Default-Branch.

Solange Secret und Push fehlen, ist Renovate vorbereitet, aber nicht aktiv. GitHub-Einstellungen und Secrets werden durch die Dateien nicht automatisch gesetzt.

## Workflows

- `.github/workflows/renovate.yml`: Pushes auf `main` zum Aktualisieren bestehender PRs, Montagstermine, manueller Start und erneuter Lauf nach erfolgreichen Renovate-PR-Prüfungen.
- `.github/workflows/renovate-config.yml`: offizieller Validator bei Pushes und Pull Requests mit Änderungen an `.github/renovate.json` oder einem der beiden Renovate-Workflows; ohne Bot-Token, außerdem manuell startbar. Reine App- oder Dokumentationsänderungen starten keine Renovate-Validierung.
- `.github/workflows/check.yml`: Biome, Tests, synchronisierte Android-Assets und signierte Test-APK; automatisch nur bei App- oder Buildänderungen, außerdem manuell startbar.

`.github/renovate.json` enthält die Repository-Regeln. Die eingesetzte Renovate-Version ist festgelegt. `android/gradle-version.txt` ist die gemeinsame Quelle für die lokale und die CI-Gradle-Version. Die automatisierten Prüfungen müssen erfolgreich sein; notwendige Änderungen an Buildwerkzeugen werden andernfalls manuell im betreffenden Update-PR gelöst.

Eine Veröffentlichung bei Google Play erfolgt weiterhin nicht.

Referenzen: [Renovate-Zeitplanung](https://docs.renovatebot.com/key-concepts/scheduling/), [Automerge](https://docs.renovatebot.com/key-concepts/automerge/), [GitHub Action und Bot-Token](https://github.com/renovatebot/github-action).
