#!/usr/bin/env python3
"""
Universal Optimization Loop for skill-creator.

Identical logic to run_loop.py but uses the universal platform adapter so it
works on Claude Code, OpenAI Codex, GitHub Copilot, and Google Gemini.

Usage:
    python -m scripts.run_loop_universal \\
        --eval-set evals/trigger_eval.json \\
        --skill-path ./my-skill \\
        --model <model-id> \\
        [--platform claude_code|openai_codex|github_copilot|google_gemini] \\
        [--max-iterations 5] \\
        [--verbose]
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import tempfile
import time
import webbrowser
from pathlib import Path

from scripts.generate_report import generate_html
from scripts.platform_adapter import (
    Platform,
    detect_platform,
    get_capabilities,
    improve_description_universal,
)
from scripts.run_eval_universal import run_eval_universal
from scripts.utils import parse_skill_md


def split_eval_set(eval_set: list[dict], holdout: float, seed: int = 42):
    random.seed(seed)
    trigger = [e for e in eval_set if e.get("should_trigger", True)]
    no_trigger = [e for e in eval_set if not e.get("should_trigger", True)]
    random.shuffle(trigger)
    random.shuffle(no_trigger)
    n_t = max(1, int(len(trigger) * holdout)) if trigger else 0
    n_n = max(1, int(len(no_trigger) * holdout)) if no_trigger else 0
    test = trigger[:n_t] + no_trigger[:n_n]
    train = trigger[n_t:] + no_trigger[n_n:]
    return train, test


def run_loop_universal(
    eval_set: list[dict],
    skill_path: Path,
    platform: Platform,
    description_override: str | None,
    num_workers: int,
    timeout: int,
    max_iterations: int,
    runs_per_query: int,
    trigger_threshold: float,
    holdout: float,
    model: str | None,
    verbose: bool,
    live_report_path: Path | None = None,
    log_dir: Path | None = None,
) -> dict:
    caps = get_capabilities(platform)
    name, original_description, content = parse_skill_md(skill_path)
    current_description = description_override or original_description

    if verbose:
        print(f"Platform: {caps.name}", file=sys.stderr)
        print(f"Skill: {name}", file=sys.stderr)

    if holdout > 0 and caps.supports_skill_triggering:
        train_set, test_set = split_eval_set(eval_set, holdout)
        if verbose:
            print(f"Split: {len(train_set)} train, {len(test_set)} test", file=sys.stderr)
    else:
        train_set = eval_set
        test_set = []

    history = []
    exit_reason = "unknown"

    for iteration in range(1, max_iterations + 1):
        if verbose:
            print(f"\n{'='*60}", file=sys.stderr)
            print(f"Iteration {iteration}/{max_iterations} [{caps.name}]", file=sys.stderr)
            print(f"Description: {current_description}", file=sys.stderr)
            print(f"{'='*60}", file=sys.stderr)

        all_queries = train_set + test_set
        t0 = time.time()
        all_results = run_eval_universal(
            eval_set=all_queries,
            skill_name=name,
            skill_description=current_description,
            skill_body=content,
            platform=platform,
            num_workers=num_workers,
            timeout=timeout,
            model=model,
            runs_per_query=runs_per_query,
            trigger_threshold=trigger_threshold,
            verbose=verbose,
        )
        eval_elapsed = time.time() - t0

        if test_set and caps.supports_skill_triggering:
            train_queries = {q.get("query", q.get("prompt", "")) for q in train_set}
            train_r = [r for r in all_results["results"] if r["query"] in train_queries]
            test_r = [r for r in all_results["results"] if r["query"] not in train_queries]
        else:
            train_r = all_results["results"]
            test_r = []

        def make_summary(results):
            passed = sum(1 for r in results if r["pass"])
            return {"passed": passed, "failed": len(results) - passed, "total": len(results)}

        train_summary = make_summary(train_r)
        test_summary = make_summary(test_r) if test_r else None

        history.append({
            "iteration": iteration,
            "description": current_description,
            "train_passed": train_summary["passed"],
            "train_failed": train_summary["failed"],
            "train_total": train_summary["total"],
            "train_results": train_r,
            "test_passed": test_summary["passed"] if test_summary else None,
            "test_failed": test_summary["failed"] if test_summary else None,
            "test_total": test_summary["total"] if test_summary else None,
            "test_results": test_r if test_r else None,
            # backward compat
            "passed": train_summary["passed"],
            "failed": train_summary["failed"],
            "total": train_summary["total"],
            "results": train_r,
        })

        if live_report_path:
            partial = {
                "original_description": original_description,
                "best_description": current_description,
                "best_score": "in progress",
                "iterations_run": len(history),
                "holdout": holdout,
                "train_size": len(train_set),
                "test_size": len(test_set),
                "history": history,
            }
            live_report_path.write_text(generate_html(partial, auto_refresh=True, skill_name=name), encoding="utf-8")

        if verbose:
            print(
                f"Train: {train_summary['passed']}/{train_summary['total']} "
                f"({eval_elapsed:.1f}s)",
                file=sys.stderr,
            )
            if test_summary:
                print(f"Test:  {test_summary['passed']}/{test_summary['total']}", file=sys.stderr)

        if train_summary["failed"] == 0:
            exit_reason = f"all_passed (iteration {iteration})"
            if verbose:
                print(f"\nAll train queries passed on iteration {iteration}!", file=sys.stderr)
            break

        if iteration == max_iterations:
            exit_reason = f"max_iterations ({max_iterations})"
            break

        if verbose:
            print("Improving description...", file=sys.stderr)

        blinded_history = [
            {k: v for k, v in h.items() if not k.startswith("test_")}
            for h in history
        ]

        new_description = improve_description_universal(
            skill_name=name,
            skill_content=content,
            current_description=current_description,
            eval_results={"results": train_r, "summary": train_summary},
            history=blinded_history,
            model=model,
            platform=platform,
            log_dir=log_dir,
            iteration=iteration,
        )

        if verbose:
            print(f"Proposed: {new_description}", file=sys.stderr)

        current_description = new_description

    if test_set and test_r:
        best = max(history, key=lambda h: h["test_passed"] or 0)
        best_score = f"{best['test_passed']}/{best['test_total']}"
    else:
        best = max(history, key=lambda h: h["train_passed"])
        best_score = f"{best['train_passed']}/{best['train_total']}"

    return {
        "exit_reason": exit_reason,
        "platform": platform.value,
        "original_description": original_description,
        "best_description": best["description"],
        "best_score": best_score,
        "best_train_score": f"{best['train_passed']}/{best['train_total']}",
        "best_test_score": f"{best['test_passed']}/{best['test_total']}" if test_set else None,
        "final_description": current_description,
        "iterations_run": len(history),
        "holdout": holdout,
        "train_size": len(train_set),
        "test_size": len(test_set),
        "history": history,
    }


def main():
    parser = argparse.ArgumentParser(description="Universal eval + improve loop")
    parser.add_argument("--eval-set", required=True)
    parser.add_argument("--skill-path", required=True)
    parser.add_argument("--platform", default=None,
                        help="claude_code | openai_codex | github_copilot | google_gemini")
    parser.add_argument("--description", default=None)
    parser.add_argument("--num-workers", type=int, default=5)
    parser.add_argument("--timeout", type=int, default=60)
    parser.add_argument("--max-iterations", type=int, default=5)
    parser.add_argument("--runs-per-query", type=int, default=3)
    parser.add_argument("--trigger-threshold", type=float, default=0.5)
    parser.add_argument("--holdout", type=float, default=0.4)
    parser.add_argument("--model", default=None)
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--report", default="auto")
    parser.add_argument("--results-dir", default=None)
    args = parser.parse_args()

    eval_set_raw = json.loads(Path(args.eval_set).read_text(encoding="utf-8"))
    eval_set = eval_set_raw if isinstance(eval_set_raw, list) else eval_set_raw.get("evals", [])
    skill_path = Path(args.skill_path)
    platform = Platform(args.platform) if args.platform else detect_platform()

    name, _, _ = parse_skill_md(skill_path)

    if args.report != "none":
        if args.report == "auto":
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            live_report_path = Path(tempfile.gettempdir()) / f"skill_report_{skill_path.name}_{timestamp}.html"
        else:
            live_report_path = Path(args.report)
        live_report_path.write_text(
            "<html><body><h1>Starting optimization loop...</h1>"
            "<meta http-equiv='refresh' content='5'></body></html>",
            encoding="utf-8"
        )
        webbrowser.open(str(live_report_path))
    else:
        live_report_path = None

    results_dir = None
    if args.results_dir:
        timestamp = time.strftime("%Y-%m-%d_%H%M%S")
        results_dir = Path(args.results_dir) / timestamp
        results_dir.mkdir(parents=True, exist_ok=True)

    log_dir = results_dir / "logs" if results_dir else None

    output = run_loop_universal(
        eval_set=eval_set,
        skill_path=skill_path,
        platform=platform,
        description_override=args.description,
        num_workers=args.num_workers,
        timeout=args.timeout,
        max_iterations=args.max_iterations,
        runs_per_query=args.runs_per_query,
        trigger_threshold=args.trigger_threshold,
        holdout=args.holdout,
        model=args.model,
        verbose=args.verbose,
        live_report_path=live_report_path,
        log_dir=log_dir,
    )

    json_output = json.dumps(output, indent=2)
    print(json_output)

    if results_dir:
        (results_dir / "results.json").write_text(json_output, encoding="utf-8")

    if live_report_path:
        live_report_path.write_text(generate_html(output, auto_refresh=False, skill_name=name), encoding="utf-8")
        print(f"\nReport: {live_report_path}", file=sys.stderr)

    if results_dir and live_report_path:
        (results_dir / "report.html").write_text(generate_html(output, auto_refresh=False, skill_name=name), encoding="utf-8")


if __name__ == "__main__":
    main()
