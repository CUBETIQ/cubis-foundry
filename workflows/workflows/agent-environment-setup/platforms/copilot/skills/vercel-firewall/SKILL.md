---
name: vercel-firewall
description: "Vercel security controls: WAF core, custom firewall rules, rate limiting, bot management, and BotID fingerprinting for DDoS protection, abuse prevention, and traffic filtering."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, firewall, waf, rate limiting, bot protection, botid, ddos, abuse, traffic filtering, custom rules
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: secure-code-guardian, security-reviewer, vercel-observability, vercel-domains
  consolidates: vercel-firewall-core, vercel-waf-custom-rules, vercel-waf-rate-limiting, vercel-bot-management, vercel-botid
---

# Vercel Firewall

## Purpose
Protect Vercel deployments from abuse, DDoS, bots, and malicious traffic using WAF custom rules, rate limiting, bot management, and BotID fingerprinting.

## When To Use
- Setting up WAF rules to block or challenge malicious requests.
- Implementing rate limiting to prevent API abuse.
- Detecting and blocking bad bots while allowing good bots.
- Using BotID for persistent bot fingerprinting.
- Configuring IP allowlists/blocklists and geo-based rules.

## Domain Areas

### WAF Core & Custom Rules
- Create IP-based, header-based, path-based, and geo-based rules.
- Actions: `deny`, `challenge`, `log`, `redirect`.
- Set rule priority and conflict resolution order.

### Rate Limiting
- Configure request rate limits per IP, route, or user segment.
- Define burst allowances and penalty durations.
- Use sliding window vs fixed window strategies.

### Bot Management
- Distinguish good bots (crawlers, monitors) from bad bots.
- Apply challenge pages or blocks for detected bots.
- Maintain an up-to-date allowed bot list.

### BotID
- Enable persistent bot fingerprinting via BotID header.
- Use BotID signals in downstream application logic.
- Monitor and tune BotID confidence thresholds.

## Operating Checklist
1. Audit current attack patterns and abuse vectors before rule creation.
2. Define rule priorities and test in log-only mode first.
3. Set rate limits with appropriate burst allowances to avoid false positives.
4. Enable and tune bot management; validate good-bot pass-through.
5. Monitor firewall metrics post-deploy for false positive spikes.
6. Document all rules with justification for future maintenance.

## Output Contract
- WAF rule set definition with priorities and actions
- Rate limiting configuration per route/IP
- Bot management policy and BotID integration plan
- Monitoring thresholds and alert definitions
- False positive mitigation strategy
