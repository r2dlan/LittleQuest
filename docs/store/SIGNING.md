# Release-Signierung

Für Google Play einen dauerhaften Upload-Key verwenden und Play App Signing einrichten. Für Installationen außerhalb von Google Play ist ein dauerhafter App-Signierschlüssel erforderlich; Play kann einen anderen App-Signierschlüssel verwenden. APKs mit unterschiedlichen Signierschlüsseln können einander nicht als Update ersetzen.

## Lokal

Mit einem vorhandenen Keystore diese Umgebungsvariablen setzen:

- `ANDROID_KEYSTORE_PATH`: absoluter Pfad zur Keystore-Datei.
- `ANDROID_KEYSTORE_PASSWORD`: Passwort der Datei.
- `ANDROID_KEY_ALIAS`: Alias des Schlüssels.
- `ANDROID_KEY_PASSWORD`: Passwort des Schlüssels.

`npm run android:release` erstellt `dist/LittleQuest-release.apk` und `dist/LittleQuest.aab`. Es bricht ohne alle vier Angaben ab und verwendet niemals automatisch den Debugschlüssel. `npm run android:bundle` erzeugt ohne Signierungsvariablen `dist/LittleQuest-unsigned.aab`; dieses ist nicht für einen Play-Upload bereit.

Keystore und Passwörter nicht ins Repository oder in Chatnachrichten schreiben. Schlüsseldateien sind zusätzlich von Git ausgeschlossen. Schlüssel mit Backup sicher aufbewahren.

## GitHub

Als Repository-Secrets hinterlegen:

- `ANDROID_KEYSTORE_BASE64`: Base64-Inhalt der Keystore-Datei (Base64 ist nur eine Transportkodierung).
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Unter **Actions → Signed Android release build → Run workflow** einen freigegebenen Release-Tag oder Commit angeben. Der Workflow prüft Code und Tests, baut und überprüft die Signaturen. Der Keystore liegt nur vorübergehend auf dem Runner und wird anschließend gelöscht. APK/AAB stehen als Workflow-Artefakte bereit. Es erfolgt kein Upload zu Google Play und keine automatische Veröffentlichung der signierten Dateien.

Referenzen: [Android-Signierung](https://developer.android.com/studio/publish/app-signing), [GitHub-Secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).
