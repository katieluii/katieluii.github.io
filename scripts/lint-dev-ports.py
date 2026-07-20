#!/usr/bin/env python3
"""Guardrail for the per-checkout dev-port scheme (vite.config.ts).

The vite config derives a deterministic dev port from the checkout's path so
parallel checkouts never collide on 5173. A LITERAL port hardcoded elsewhere
(.env, a config, a compose file) silently bypasses that scheme and re-introduces
the collision. This lint greps tracked config-ish files for literal dev ports and
warns. Advisory by default; pass --strict to exit non-zero (for a preflight hook).

Usage:
  python3 scripts/lint-dev-ports.py           # warn only, exit 0
  python3 scripts/lint-dev-ports.py --strict   # exit 1 if any hardcoded port found
"""
import re
import subprocess
import sys
from pathlib import Path

# Ports that would collide with the derived scheme's territory or the old default.
SUSPECT = re.compile(r"\b(5173|517[0-9]|4[0-9]{3})\b")
# Files where a literal dev port would bypass the scheme.
SCAN_GLOBS = (
    ".env", ".env.*", "*.env",
    "vite.config.*", "*.config.ts", "*.config.js",
    "docker-compose*.y*ml", "package.json",
)
# The derived-port line in vite.config.ts is the scheme itself — not a violation.
ALLOW_SUBSTR = ("portFromPath", "process.env.PORT", "devPort")


def tracked_files() -> list[Path]:
    try:
        out = subprocess.run(
            ["git", "ls-files"], capture_output=True, text=True, check=True
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    return [Path(p) for p in out.splitlines() if p]


def matches_glob(path: Path) -> bool:
    return any(path.match(g) for g in SCAN_GLOBS)


def main() -> int:
    strict = "--strict" in sys.argv
    findings: list[str] = []
    for path in tracked_files():
        if not matches_glob(path) or not path.exists():
            continue
        try:
            text = path.read_text(errors="replace")
        except OSError:
            continue
        # The file that OWNS the derivation scheme is the source of truth, not a
        # violation — skip it wholesale (identified by its scheme markers).
        if any(a in text for a in ALLOW_SUBSTR):
            continue
        for n, line in enumerate(text.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith(("//", "#", "*")):
                continue
            if SUSPECT.search(line):
                findings.append(f"  {path}:{n}: {stripped}")

    if findings:
        print("Hardcoded dev port(s) found — these bypass the per-checkout port scheme:")
        print("\n".join(findings))
        print("\nFix: remove the literal port and let vite.config.ts derive it, "
              "or set PORT=xxxx in your shell for an intentional override.")
        return 1 if strict else 0

    print("OK: no hardcoded dev ports bypassing the per-checkout scheme.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
