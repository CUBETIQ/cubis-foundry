---
name: vercel-domains
description: "Vercel domain management: custom domains, DNS records, nameservers, SSL certificates, domain ownership verification, and static IP configuration."
license: MIT
metadata:
  author: cubis-foundry
  version: "1.0.0"
  domain: vercel
  triggers: vercel, domain, dns, nameservers, ssl, certificate, custom domain, cname, static ip, domain ownership
  role: specialist
  scope: implementation
  output-format: checklist
  related-skills: devops-engineer, vercel-deployments, vercel-platform
  consolidates: vercel-dns-records, vercel-nameservers, vercel-ssl-certificates, vercel-domain-ownership-claims, vercel-static-ips
---

# Vercel Domains

## Purpose
Manage custom domains on Vercel including DNS configuration, nameserver delegation, SSL certificate provisioning, domain ownership verification, and static IP assignment.

## When To Use
- Adding a custom domain to a Vercel project.
- Configuring DNS records (A, CNAME, TXT, MX) for a domain.
- Delegating nameservers to Vercel for full DNS management.
- Troubleshooting SSL certificate provisioning failures.
- Claiming domain ownership for enterprise configurations.
- Assigning dedicated static IPs for allowlist-based firewall rules.

## Domain Areas

### Custom Domains
- Add domains in Vercel project settings.
- Configure redirect from www ↔ apex and production ↔ preview.

### DNS Records
- Manage A, AAAA, CNAME, TXT, MX, SRV records via Vercel DNS.
- Priority ordering for MX and SRV records.

### Nameservers
- Delegate domain to Vercel nameservers for managed DNS.
- Validate propagation with `dig`/`nslookup`.

### SSL Certificates
- Automatic cert provisioning via Let's Encrypt.
- Troubleshoot DNS validation challenges.
- Wildcard cert requirements for multi-tenant setups.

### Domain Ownership Claims
- Verify domain ownership using TXT record DNS challenges.
- Required for enterprise team domain assignment.

### Static IPs
- Enable dedicated static egress IPs for firewall allowlisting.
- Document IPs for downstream system configuration.

## Operating Checklist
1. Confirm ownership and DNS authority for each managed domain.
2. Apply changes with TTL and propagation windows accounted for.
3. Validate SSL cert provisioning and auto-renewal is active.
4. Complete domain ownership claim if required by enterprise team.
5. Document static IPs and communicate to downstream firewall owners.
6. Prepare rollback records for every production DNS change.

## Output Contract
- DNS record configuration plan with TTL values
- SSL certificate provisioning status and validation method
- Nameserver delegation steps and verification commands
- Static IP assignments and downstream firewall change requests
- Residual risks (propagation delays, cert failures)
