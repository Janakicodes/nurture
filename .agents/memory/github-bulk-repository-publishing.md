---
name: GitHub bulk repository publishing
description: Environment-specific guidance for publishing a complete repository through GitHub from Replit.
---

For full-repository publishing, prefer a normal Git push authenticated through
Replit's Git/source-control connection. Do not rely on hundreds of connector
Git Data API writes as a replacement.

**Why:** The GitHub connector can successfully authenticate, read repositories,
and create a repository, while repeated or large Git blob/tree writes may be
blocked by Cloudflare before GitHub processes them. Retrying through the
connector SDK uses the same blocked route.

**How to apply:** Use the GitHub connector for repository-management API
operations. For transferring an existing repository's complete Git history and
file tree, connect GitHub in the workspace Git pane and push the prepared local
branch to the destination remote.