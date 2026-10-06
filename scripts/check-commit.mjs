import { readFileSync } from "node:fs";

export function validateCommit(message) {
  const subject = message.split(/\r?\n/, 1)[0];
  if (subject.length > 100)
    return "Die erste Zeile darf höchstens 100 Zeichen haben.";
  if (
    !/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9][a-zA-Z0-9._/-]*\))?!?: \S.*$/.test(
      subject,
    )
  ) {
    return "Conventional Commit erwartet: type(scope): Beschreibung, z. B. feat(controls): add swipe movement";
  }
  if (
    /^[^:]+!:/.test(subject) &&
    !message
      .split(/\r?\n/)
      .slice(1)
      .some((line) => line.trim())
  ) {
    return "Breaking Changes mit ! bitte im Commit-Body erklären.";
  }
  return null;
}

if (process.argv[2]) {
  const error = validateCommit(readFileSync(process.argv[2], "utf8"));
  if (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
