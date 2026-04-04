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
        if isinstance(data, dict) and isinstance(data.get("requests"), list):
            return data["requests"]
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
            continue
    if entries:
        return entries
    raise SystemExit("unsupported network capture format")


def main():
    if len(sys.argv) != 2:
        print("usage: network_summarize.py <requests-json>", file=sys.stderr)
        return 2
    entries = load_entries(sys.argv[1])
    by_status = Counter()
    by_method = Counter()
    failures = []
    for entry in entries:
        method = entry.get("method", "UNKNOWN")
        status = str(entry.get("status", "unknown"))
        by_method[method] += 1
        by_status[status] += 1
        if isinstance(entry.get("status"), int) and entry["status"] >= 400:
            failures.append(entry)
    print("Network summary")
    print(f"Total requests: {len(entries)}")
    print("By method:")
    for method, count in sorted(by_method.items()):
        print(f"- {method}: {count}")
    print("By status:")
    for status, count in sorted(by_status.items()):
        print(f"- {status}: {count}")
    if failures:
        print("\nFailing requests:")
        for entry in failures[:10]:
            print(f"- {entry.get('method', 'UNKNOWN')} {entry.get('status')} {entry.get('url', '')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

