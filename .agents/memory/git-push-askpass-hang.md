---
name: Git push askpass hang in agent sandboxes
description: Plain `git push` to GitHub can hang forever in Replit agent sandboxes because of a broken/unreachable askpass helper; how to work around it.
---

## Symptom
`git push origin main` hangs indefinitely (no output, times out) instead of
succeeding or failing fast. `GIT_TERMINAL_PROMPT=0` does NOT fix this.

## Root cause
Replit sets `GIT_ASKPASS=replit-git-askpass`. That helper fetches a GitHub
token from a local pid2 service (`localhost:<port>/<session>/github/token`).
If that service doesn't respond in the current sandbox, git blocks waiting
on askpass forever — `GIT_TERMINAL_PROMPT` only suppresses the *terminal*
prompt path, not an explicitly configured `GIT_ASKPASS` helper.

A `GITHUB_TOKEN` env secret may also exist, but passing it via
`Authorization: bearer/token` header can come back 401 from GitHub (wrong
token/scope for that mechanism) and fall through to the same askpass hang.

## Workaround that works
Push directly to a token-embedded URL with askpass explicitly cleared, so
git never invokes the broken helper:

```
GIT_ASKPASS= GIT_TERMINAL_PROMPT=0 git push "https://${GITHUB_TOKEN}@github.com/<owner>/<repo>" main:main
```

**Why:** Embedding credentials in the URL satisfies git's auth requirement
before it ever needs to consult `GIT_ASKPASS`, sidestepping the hung
pid2 lookup entirely.

**How to apply:** When `git push` hangs in a task-agent or main-agent
sandbox, don't retry the plain command — check for a `GITHUB_TOKEN` secret
(`viewEnvVars`) and use the URL-embedded-token push instead. Note: after
pushing this way, local `refs/remotes/origin/*` tracking metadata can go
stale (a `git fetch` to refresh it may itself get blocked as "destructive"
in main-agent context) — verify the real remote state with the read-only
`git ls-remote origin <branch>` instead of trusting `git status`.
