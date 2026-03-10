---
name: seo-fundamentals
description: "Use when implementing technical SEO, content optimization, schema markup, or Core Web Vitals improvements for search engine visibility."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0"
compatibility: Claude Code, Codex, GitHub Copilot
---
# SEO Fundamentals

## Purpose

Use when implementing technical SEO, content optimization, schema markup, or Core Web Vitals improvements for search engine visibility.

## When to Use

- Implementing technical SEO (sitemaps, robots.txt, canonical tags, HTTPS, meta tags).
- Optimizing Core Web Vitals (LCP, INP, CLS) for search ranking.
- Adding structured data and schema markup (Article, FAQPage, Product, Organization).
- Improving content quality using E-E-A-T framework.
- Auditing a site for SEO issues and prioritizing fixes.

## Instructions

1. Audit technical SEO fundamentals — sitemaps, robots.txt, canonical tags, HTTPS, meta tags.
2. Measure Core Web Vitals — LCP < 2.5s, INP < 200ms, CLS < 0.1.
3. Implement structured data with appropriate schema types.
4. Evaluate content quality against E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
5. Prioritize fixes by impact: content quality > backlinks > page experience > technical SEO.

### Baseline standards

- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- Every page must have unique title + meta description.
- XML sitemap must be current and submitted.
- Canonical tags must prevent duplicate content issues.
- Schema markup must validate against Google's structured data testing tool.

### Ranking factors priority

| Priority | Factor                                     |
| -------- | ------------------------------------------ |
| 1        | Content quality and relevance              |
| 2        | Backlink profile                           |
| 3        | Page experience (Core Web Vitals)          |
| 4        | Technical SEO (crawlability, indexability) |
| 5        | Content freshness                          |

### Schema types reference

| Type           | Use For                   |
| -------------- | ------------------------- |
| Article        | Blog posts, news articles |
| Organization   | Company info, contact     |
| FAQPage        | FAQ sections              |
| Product        | E-commerce product pages  |
| Review         | User reviews, ratings     |
| BreadcrumbList | Navigation breadcrumbs    |
| HowTo          | Step-by-step guides       |

### Constraints

- Never use hidden text, keyword stuffing, or cloaking.
- Never create doorway pages or thin content for ranking.
- Always follow Google's webmaster guidelines.
- Always validate schema markup before deploying.

## Output Format

Provide SEO audit findings, implementation guidance, schema markup code, and Core Web Vitals optimization recommendations.

## References

No reference files for this skill right now.

## Scripts

No helper scripts are required for this skill right now.

## Examples

- "Audit this Next.js site for SEO issues and prioritize fixes"
- "Add structured data markup for our product pages"
- "Improve Core Web Vitals scores on our landing pages"
