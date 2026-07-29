# Threat Model

`agent-preflight` protects the review boundary before an AI coding agent, MCP host, CI runner, or human operator treats repository text as trusted guidance. It is designed to surface high-risk instruction and execution patterns in the files most likely to control those systems.

## In scope

- Prompt-injection-style language that attempts to remove established controls.
- Remote code execution, opaque payloads, destructive commands, credential access, and apparent data exfiltration.
- Risky MCP launch configuration, moving GitHub Action references, write-capable workflow tokens, `pull_request_target`, package lifecycle hooks, and mutable package bootstrap patterns.
- Hidden Unicode control characters and symbolic links in scanned surfaces.

## Out of scope

- Proving that every command or dependency is safe.
- Running, sandboxing, or dynamically analyzing MCP servers.
- Scanning files omitted by policy, a baseline, or the default agent-facing surface selection.
- Replacing secret scanning, dependency scanning, code review, operating-system isolation, or least-privilege permissions.

## Security properties

The CLI is deterministic and local. It does not send content to a model or remote service, execute detected commands, start MCP servers, or mutate the target repository. Findings are heuristics: a clean report means no configured rule fired, not that the repository is safe.

## Deployment guidance

Run untrusted repositories in an isolated environment. Use `pull_request` rather than `pull_request_target` for workflows that inspect untrusted code. Pin third-party GitHub Actions to commit SHAs. Give security gates read-only tokens unless a narrowly reviewed exception is required.
