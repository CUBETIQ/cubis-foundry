export function renderInitWelcome({ version }: { version: string }) {
  const safeVersion = String(version || "").trim() || "dev";
  const lines = [
    "╔══════════════════════════════════════════════════════════════╗",
    "║                     Cubis Foundry CLI                      ║",
    "║                      Interactive Init                      ║",
    "╚══════════════════════════════════════════════════════════════╝",
    "",
    "      ██████╗",
    "     ██╔════╝",
    "     ██║      Cubis Foundry",
    "     ██║      C icon",
    "     ╚██████╗",
    "      ╚═════╝",
    "",
    `CLI Version ${safeVersion}`,
    "",
  ];
  return lines.join("\n");
}
