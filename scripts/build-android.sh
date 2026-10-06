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
node sync-android.mjs
if [ -x "$project_root/.android-tools/gradle-8.9/bin/gradle" ]; then
    "$project_root/.android-tools/gradle-8.9/bin/gradle" -g "$project_root/.android-gradle" -p android --no-daemon assembleDebug
else
    gradle -p android --no-daemon assembleDebug
fi
mkdir -p dist
cp android/app/build/outputs/apk/debug/app-debug.apk dist/LittleQuest.apk
printf '\nAPK: %s/dist/LittleQuest.apk\n' "$project_root"
