# Security Policy

## Supported versions

The `main` branch is the only supported line while the project is in its first
open-source release.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Please use [GitHub Security Advisories](https://github.com/enesiyidil/stokmate/security/advisories/new)
so the report stays private until a fix is ready.

Include:

- Affected version or commit
- What you did and what you expected
- Impact (auth bypass, data leak, RCE, …)

You should hear back within 7 days. If the issue is confirmed, we will work on
a fix before any public write-up.

## Operational warnings

- Default Compose passwords (`ADMIN_PASSWORD`, `JWT_SECRET`, database, MinIO) are examples. Change them before any shared host.
- Never commit `.env`, SQL dumps, or customer exports.
- If a mail app password or JWT secret ever landed in git history, rotate it and treat the old value as public.
