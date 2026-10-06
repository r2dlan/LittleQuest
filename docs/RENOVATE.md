# Automatische Versionsupdates

## Betrieb über die Renovate GitHub App

Die zentral installierte Renovate GitHub App verwaltet r2dlan/LittleQuest. Die Konfiguration unter .github/renovate.json bleibt erhalten. Der zusätzliche Bot-Workflow wurde entfernt, damit nicht zwei Bots dieselben Updates und Dashboards bearbeiten. Die App verwendet eigene Zugangsdaten; RENOVATE_TOKEN wird nicht mehr benötigt. Release Please läuft unabhängig davon mit RELEASE_PLEASE_TOKEN weiter.

## Verhalten

- Zeitzone: **Europe/Berlin**.
- Neue Update-Branches und Pull Requests: **montags, 09:00 bis vor 15:00 Uhr**, inklusive Sommer-/Winterzeitumstellung. Die App läuft nach ihrem eigenen Zeitplan; das Fenster erlaubt Updates, garantiert aber keinen Lauf zu einer bestimmten Minute.
- Bestehende Renovate-Branches werden bei den App-Läufen auf den aktuellen Stand von main gebracht (rebaseWhen: behind-base-branch, updateNotScheduled: true). Diese Aktualisierungen sind auch außerhalb des Montagfensters erlaubt; dabei können neuere, mindestens sieben Tage alte Versionen in bestehende Update-Branches aufgenommen werden. Die passenden Checks laufen anschließend erneut. Es gibt keinen eigenen Workflow mehr, der Renovate bei jedem Push auf main startet.
- Eigene Commits auf Renovate-Branches können die automatische Aktualisierung verhindern. Bei Bedarf im PR oder Dependency Dashboard die Rebase-/Retry-Checkbox aktivieren. Renovate kann dabei eigene Änderungen am Update-Branch verwerfen.
- Neue Versionen müssen mindestens **sieben Tage** veröffentlicht sein. Ohne verlässlichen Veröffentlichungszeitpunkt erfolgt keine automatische Freigabe.
- Jede Aktualisierung kommt als Pull Request mit Conventional Commit.
- Automerge gilt auch für Major-Updates. Renovate merged selbst per Squash (platformAutomerge: false), sobald der PR aktuell und die Checks erfolgreich sind. Das erfolgt bei einem folgenden App-Lauf, auch außerhalb des Update-Zeitfensters; grüne Checks bedeuten keinen sofortigen Merge.
- npm-Abhängigkeiten, Lockfile, GitHub Actions, Gradle-Plugins und die Gradle-Version werden gepflegt. Biome-Paket und Konfigurationsschema landen gemeinsam in einem PR. Die Docker-Version des Konfigurationsvalidators wird separat gepflegt; die Version der zentral betriebenen App wird nicht durch dieses Repository gesteuert.

## GitHub-Einrichtung und Umstellung

1. In der Installation der Renovate GitHub App Zugriff auf r2dlan/LittleQuest sicherstellen.
2. Nach dem Push dieser Umstellung das vom persönlichen Benutzer erstellte **Dependency Dashboard** schließen. Das Dashboard von **renovate[bot]** behalten.
3. Das Repository-Secret RENOVATE_TOKEN löschen, sofern es keine andere Verwendung hat. Falls derselbe zugrunde liegende Token auch als RELEASE_PLEASE_TOKEN verwendet wird, diesen Token nicht widerrufen und das Release-Please-Secret behalten.
4. Vom persönlichen Bot erstellte offene Update-PRs prüfen. Duplikate zu App-PRs schließen; die App muss fremde PRs nicht übernehmen. Das Schließen des alten Dashboards allein beendet den eigenen Bot nicht — dafür wird der alte Workflow entfernt.
5. Squash-Merges erlauben. **Validate Renovate configuration**, **Code quality and tests** und **Build Android APK** nicht pauschal als Pflichtchecks verlangen: Sie starten abhängig von den geänderten Dateien. Sonst blockieren fehlende Checks PRs ohne passende Änderungen. Renovate wartet weiterhin auf tatsächlich gestartete Checks; Review- und Branch-Regeln gelten zusätzlich.

Die Repository-Dateien ändern weder die App-Installation noch GitHub-Secrets, Dashboards oder Branch-Regeln automatisch.

## Validierung und Builds

- .github/workflows/renovate-config.yml: offizieller Validator bei Änderungen an .github/renovate.json oder am Validierungsworkflow; außerdem manuell startbar, ohne Bot-Token.
- .github/workflows/check.yml: Biome, Tests, synchronisierte Android-Assets und signierte Test-APK bei App-/Buildänderungen, außerdem manuell und für Releases startbar.

android/gradle-version.txt bleibt die gemeinsame Quelle für lokale und CI-Gradle-Versionen. Eine Veröffentlichung bei Google Play erfolgt nicht.

Referenzen: [Renovate GitHub App](https://docs.renovatebot.com/getting-started/installing-onboarding/), [Zeitplanung](https://docs.renovatebot.com/key-concepts/scheduling/), [Automerge](https://docs.renovatebot.com/key-concepts/automerge/).
