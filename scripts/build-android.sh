#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
project_root="$(pwd)"
if [ -d "$project_root/.android-tools/jdk/Contents/Home" ]; then
    export JAVA_HOME="$project_root/.android-tools/jdk/Contents/Home"
fi
if [ -d "$project_root/.android-tools/sdk" ]; then
    export ANDROID_HOME="$project_root/.android-tools/sdk"
fi
gradle_version="$(cat android/gradle-version.txt)"
mode="${1:---debug}"
case "$mode" in
    --debug) tasks="assembleDebug" ;;
    --bundle) tasks="bundleRelease" ;;
    --release)
        : "${ANDROID_KEYSTORE_PATH:?Set ANDROID_KEYSTORE_PATH for signed release builds}"
        : "${ANDROID_KEYSTORE_PASSWORD:?Set ANDROID_KEYSTORE_PASSWORD}"
        : "${ANDROID_KEY_ALIAS:?Set ANDROID_KEY_ALIAS}"
        : "${ANDROID_KEY_PASSWORD:?Set ANDROID_KEY_PASSWORD}"
        tasks="assembleRelease bundleRelease"
        ;;
    *) printf 'Usage: %s [--debug|--bundle|--release]\n' "$0" >&2; exit 1 ;;
esac
node sync-android.mjs
if [ -x "$project_root/.android-tools/gradle-$gradle_version/bin/gradle" ]; then
    "$project_root/.android-tools/gradle-$gradle_version/bin/gradle" -g "$project_root/.android-gradle" -p android --no-daemon $tasks
else
    gradle -p android --no-daemon $tasks
fi
mkdir -p dist
case "$mode" in
    --debug)
        cp android/app/build/outputs/apk/debug/app-debug.apk dist/LittleQuest.apk
        printf '\nAPK: %s/dist/LittleQuest.apk\n' "$project_root"
        ;;
    --bundle)
        if [ -n "${ANDROID_KEYSTORE_PATH:-}" ]; then bundle_name="LittleQuest.aab"; else bundle_name="LittleQuest-unsigned.aab"; fi
        cp android/app/build/outputs/bundle/release/app-release.aab "dist/$bundle_name"
        printf '\nApp Bundle: %s/dist/%s\n' "$project_root" "$bundle_name"
        ;;
    --release)
        cp android/app/build/outputs/apk/release/app-release.apk dist/LittleQuest-release.apk
        cp android/app/build/outputs/bundle/release/app-release.aab dist/LittleQuest.aab
        printf '\nSigned release APK and App Bundle: %s/dist/\n' "$project_root"
        ;;
esac
