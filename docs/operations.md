# Operating Agent Preflight

## Small repositories

Run a full scan in pull requests with the balanced profile and block high findings. Keep `.agentpreflight.json` small and prefer fixing findings over downgrading them.

## Existing repositories

Run report-only scans first, review the initial findings, then create a baseline. Use changed-files mode with that baseline in pull requests. This creates a clear security promise: existing debt remains visible, while new high-risk content does not merge silently.

## High-assurance repositories

Use `profile: strict`, pin all actions, upload SARIF, and require security review for baseline or policy changes. Limit output with `maxFindings` only for presentation; run an uncapped JSON or SARIF scan when reviewing the full finding set.

## Triage

1. Run `agent-preflight explain APFxxx`.
2. Read the exact source line and its surrounding execution path.
3. Fix the source where possible.
4. For a justified exception, add a narrow inline suppression, policy override, or baseline entry in a reviewed pull request.
5. Add a regression fixture when changing a rule.

Never paste real credentials into an issue to demonstrate a token-shaped finding. Revoke a possibly exposed credential before opening a public discussion.
