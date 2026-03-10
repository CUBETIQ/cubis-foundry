#!/usr/bin/env python3
"""
Universal Eval Runner for skill-creator.

Wraps the original run_eval.py (Claude Code) and adds support for
OpenAI Codex, GitHub Copilot, and Google Gemini via the platform adapter.

On Claude Code: uses the original trigger-detection mechanism (command files + stream events).
On other platforms: runs the query with skill injected and scores response quality.

Usage:
    python -m scripts.run_eval_universal \\
        --eval-set evals/evals.json \\
        --skill-path ./my-skill \\
        [--platform claude_code|openai_codex|github_copilot|google_gemini] \\
        [--model <model-id>] \\
        [--num-workers 5] \\
        [--timeout 60]
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

from scripts.platform_adapter import Platform, detect_platform, get_capabilities, run_query
from scripts.utils import parse_skill_md


def _normalize_eval_item(item: dict) -> dict:
    """Normalize eval item field names for cross-runner compatibility.

    Maps 'prompt' <-> 'query' and defaults 'should_trigger' to True.
    Returns a new dict so the original is not mutated.
    """
    out = dict(item)
    if "query" not in out and "prompt" in out:
        out["query"] = out["prompt"]
    if "prompt" not in out and "query" in out:
        out["prompt"] = out["query"]
    out.setdefault("should_trigger", True)
    return out


def _assertion_text(assertion: str | dict) -> str:
    """Extract assertion text from either a plain string or a dict with 'text' key."""
    if isinstance(assertion, str):
        return assertion
    return assertion.get("text", "") if isinstance(assertion, dict) else str(assertion)


def score_response(response: str, expected_output: str, assertions: list) -> dict:
    """
    Quality-based scoring for platforms that don't support trigger detection.
    Returns pass/fail + evidence.

    Assertions can be plain strings or dicts with a 'text' key.
    """
    if not response or response.startswith("[ERROR]"):
        return {"pass": False, "score": 0.0, "evidence": response or "Empty response"}

    response_lower = response.lower()
    passed_assertions: list[str] = []
    failed_assertions: list[str] = []

    for assertion in assertions:
        text = _assertion_text(assertion)
        text_lower = text.lower()
        if text_lower and text_lower in response_lower:
            passed_assertions.append(text)
        elif text_lower:
            failed_assertions.append(text)

    if not assertions:
        # No assertions — check against expected output keywords
        if expected_output:
            keywords = [w for w in expected_output.lower().split() if len(w) > 4]
            hits = sum(1 for kw in keywords if kw in response_lower)
            score = hits / len(keywords) if keywords else 0.5
        else:
            score = 0.5  # No way to judge
        return {"pass": score >= 0.5, "score": score, "evidence": f"Keyword coverage: {score:.0%}"}

    total = len(assertions)
    passed = len(passed_assertions)
    score = passed / total
    evidence = f"{passed}/{total} assertions met"
    if failed_assertions:
        evidence += f". Missing: {', '.join(failed_assertions[:3])}"
    return {"pass": score >= 0.5, "score": score, "evidence": evidence}


def run_eval_universal(
    eval_set: list[dict],
    skill_name: str,
    skill_description: str,
    skill_body: str,
    platform: Platform,
    num_workers: int = 5,
    timeout: int = 60,
    model: str | None = None,
    runs_per_query: int = 1,
    trigger_threshold: float = 0.5,
    project_root: Path | None = None,
    verbose: bool = False,
) -> dict:
    """
    Run the eval set on the given platform. Returns results dict compatible
    with the original run_eval.py output schema.
    """
    caps = get_capabilities(platform)

    # Normalize field names so items work with both runners
    eval_set = [_normalize_eval_item(item) for item in eval_set]

    # ── Claude Code: use original trigger-detection ──────────────────────────
    if caps.supports_skill_triggering:
        from scripts.run_eval import run_eval, find_project_root
        root = project_root or find_project_root()
        return run_eval(
            eval_set=eval_set,
            skill_name=skill_name,
            description=skill_description,
            num_workers=num_workers,
            timeout=timeout,
            project_root=root,
            runs_per_query=runs_per_query,
            trigger_threshold=trigger_threshold,
            model=model,
        )

    # ── Other platforms: quality-based eval ─────────────────────────────────
    if verbose:
        print(
            f"[{caps.name}] Running quality-based eval ({len(eval_set)} items, "
            f"{runs_per_query} run(s) each, {num_workers} workers)",
            file=sys.stderr,
        )

    results = []

    def run_one(item: dict, run_idx: int) -> dict:
        qr = run_query(
            query=item["prompt"],
            skill_name=skill_name,
            skill_description=skill_description,
            skill_body=skill_body,
            platform=platform,
            model=model,
            timeout=timeout,
        )
        score = score_response(
            response=qr.response,
            expected_output=item.get("expected_output", ""),
            assertions=item.get("assertions", []),
        )
        return {
            "eval_id": item.get("id", run_idx),
            "prompt": item["prompt"],
            "response": qr.response,
            "score": score,
            "run_idx": run_idx,
            "duration_ms": qr.duration_ms,
            "error": qr.error,
        }

    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {
            executor.submit(run_one, item, run_idx): (item, run_idx)
            for item in eval_set
            for run_idx in range(runs_per_query)
        }
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception as e:
                item, _ = futures[future]
                results.append({
                    "eval_id": item.get("id", "?"),
                    "prompt": item["prompt"],
                    "response": "",
                    "score": {"pass": False, "score": 0.0, "evidence": str(e)},
                    "run_idx": 0,
                    "duration_ms": 0,
                    "error": str(e),
                })

    # Aggregate by eval_id (average across runs_per_query)
    by_id: dict[Any, list[dict]] = defaultdict(list)
    for r in results:
        by_id[r["eval_id"]].append(r)

    agg_results = []
    for eval_id, runs in by_id.items():
        avg_score = sum(r["score"]["score"] for r in runs) / len(runs)
        did_pass = avg_score >= 0.5
        # Find the matching eval item (tolerant of missing id field)
        matching = [i for i in eval_set if str(i.get("id", "")) == str(eval_id)]
        should_trigger = matching[0].get("should_trigger", True) if matching else True
        agg_results.append({
            "query": runs[0]["prompt"],
            "should_trigger": should_trigger,
            "trigger_rate": avg_score,
            "triggers": sum(1 for r in runs if r["score"]["pass"]),
            "runs": len(runs),
            "pass": did_pass,
            "avg_score": avg_score,
            "best_response": max(runs, key=lambda r: r["score"]["score"])["response"],
        })

    passed = sum(1 for r in agg_results if r["pass"])
    total = len(agg_results)
    return {
        "skill_name": skill_name,
        "description": skill_description,
        "platform": platform.value,
        "results": agg_results,
        "summary": {"total": total, "passed": passed, "failed": total - passed},
    }


def main():
    parser = argparse.ArgumentParser(description="Universal eval runner for skill-creator")
    parser.add_argument("--eval-set", required=True, help="Path to evals.json")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--platform", default=None, help="Platform override (claude_code|openai_codex|github_copilot|google_gemini)")
    parser.add_argument("--description", default=None, help="Override description")
    parser.add_argument("--model", default=None, help="Model ID")
    parser.add_argument("--num-workers", type=int, default=5)
    parser.add_argument("--timeout", type=int, default=60)
    parser.add_argument("--runs-per-query", type=int, default=1)
    parser.add_argument("--trigger-threshold", type=float, default=0.5)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    eval_set = json.loads(Path(args.eval_set).read_text(encoding="utf-8"))
    skill_path = Path(args.skill_path)
    name, description, body = parse_skill_md(skill_path)
    description = args.description or description

    platform = Platform(args.platform) if args.platform else detect_platform()

    if args.verbose:
        caps = get_capabilities(platform)
        print(f"Platform: {caps.name}", file=sys.stderr)

    evals = eval_set if isinstance(eval_set, list) else eval_set.get("evals", [])

    output = run_eval_universal(
        eval_set=evals,
        skill_name=name,
        skill_description=description,
        skill_body=body,
        platform=platform,
        num_workers=args.num_workers,
        timeout=args.timeout,
        model=args.model,
        runs_per_query=args.runs_per_query,
        trigger_threshold=args.trigger_threshold,
        verbose=args.verbose,
    )

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
