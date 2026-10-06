export const defaultSettings = {
  showHints: true,
  largeText: false,
  reducedMotion: false,
};
export function normalizeSettings(value) {
  return Object.fromEntries(
    Object.entries(defaultSettings).map(([key, fallback]) => [
      key,
      typeof value?.[key] === "boolean" ? value[key] : fallback,
    ]),
  );
}
