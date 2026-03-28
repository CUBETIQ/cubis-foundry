#!/usr/bin/env python3
import json
import sys
from collections import Counter


def load_entries(path):
    with open(path, "r", encoding="utf-8") as handle:
        raw = handle.read().strip()
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    entries = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            entries.append({"type": "text", "text": line})
    return entries


def main():
    if len(sys.argv) != 2:
        print("usage: console_summarize.py <console-json-or-jsonl>", file=sys.stderr)
        return 2
    entries = load_entries(sys.argv[1])
    counts = Counter()
    for entry in entries:
        counts[entry.get("type") or entry.get("level") or "unknown"] += 1
    print("Console summary")
    print(f"Total entries: {len(entries)}")
    for level, count in sorted(counts.items()):
        print(f"- {level}: {count}")
    if entries:
        print("\nLast 5 entries:")
        for entry in entries[-5:]:
            print(f"- {json.dumps(entry, ensure_ascii=True)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

