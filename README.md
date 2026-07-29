# agent-preflight

> Stop risky agent instructions before they reach Codex, Claude Code, Cursor, an MCP host, or a CI runner.

[![CI](https://github.com/K14-coder/agent-preflight/actions/workflows/ci.yml/badge.svg)](https://github.com/K14-coder/agent-preflight/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Local only](https://img.shields.io/badge/privacy-local--only-0f766e)](#privacy-model)

AI coding tools read instructions and execute workflows with the permissions you give them. `agent-preflight` is a local-first security gate that scans the files most likely to influence that behavior: agent guidance, MCP configuration, package scripts, installers, and GitHub Actions workflows.

It never executes an MCP server, evaluates a script, uploads repository content, or requires an API key.

## The 30-second setup

Add a pull-request gate to your repository:

```yaml
name: Agent preflight
on:
  pull_request:
    paths:
      - "**/*.md"
      - "**/*.json"
      - "**/*.yml"
      - "**/*.yaml"
      - "**/*.sh"

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: K14-coder/agent-preflight@v0.4.0
        with:
          mode: changed
          base: ${{ github.event.pull_request.base.sha }}
          fail-on: high
```

The action fails on new high- or critical-severity findings and exposes `score` and `findings` as step outputs.

## Why v0.4 is useful in a real repository

Security gates fail when they force a team to clean up every historical problem before they can protect the next pull request. v0.4 uses reviewed policy files and baselines, so the first adoption can report known debt while still blocking newly introduced high-risk instructions.

```bash
# Capture the current reviewed state once.
node src/cli.js baseline . --output .agentpreflight-baseline.json

# Fail only on findings that are not in that baseline.
node src/cli.js scan . --baseline .agentpreflight-baseline.json --fail-on high
```

Commit both the baseline and the policy review that approved it. Baselines are evidence of accepted risk, not a way to silence unknown findings.

v0.4 adds strict policy profiles, native GitHub file annotations, multiple independent findings per file, bounded output for large repositories, checks for hard-coded token shapes, `pull_request_target`, MCP package bootstrapping, lifecycle hooks, and verification-control bypasses.

## What a finding looks like

```text
CRITICAL APF002 AGENTS.md:4:6
  Remote content is piped directly into a shell.
  Fix: Download, inspect, checksum, and run a pinned artifact instead of piping remote content to a shell.
```

Try the deliberately unsafe demo repository from a checkout:

```bash
git clone https://github.com/K14-coder/agent-preflight.git
cd agent-preflight
npm test
npm run demo
```

## Scan modes

```bash
# All agent-facing surfaces in a repository
node src/cli.js scan /path/to/repository --fail-on high

# Only files changed from a reviewed base
node src/cli.js scan . --mode changed --base origin/main --fail-on high

# Integrate with another tool or upload results to GitHub code scanning
node src/cli.js scan . --format sarif --output agent-preflight.sarif

# Raise medium findings under a strict profile and bound terminal output
node src/cli.js scan . --profile strict --max-findings 50
```

To upload SARIF in GitHub Actions:

```yaml
- run: node src/cli.js scan . --format sarif --output agent-preflight.sarif --fail-on none
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: agent-preflight.sarif
```

## What it scans

By default, the scanner limits itself to agent-facing surfaces so normal application code does not create noise:

- `AGENTS.md`, `CLAUDE.md`, `SKILL.md`, `README.md`, and other Markdown guidance
- MCP JSON/YAML configuration
- `package.json` and installer or shell scripts
- GitHub Actions workflow files

Use `--all-files` when auditing a repository more broadly.

## Built-in checks

| Rule | Risk | Default severity |
| --- | --- | --- |
| `APF001` | Instruction override | High |
| `APF002` | Remote content piped to a shell | Critical |
| `APF003` | Encoded payload execution | Critical |
| `APF004` | Recursive forced deletion | High |
| `APF005` | Credential discovery | High |
| `APF006` | Potential credential exfiltration | Critical |
| `APF007` | Dynamic evaluation of external content | Medium |
| `APF008` | MCP shell launcher | Medium |
| `APF009` | Unpinned GitHub Action | Medium |
| `APF010` | Write-capable workflow token | Medium |
| `APF011` | Hidden Unicode control character | High |
| `APF012` | Remote instruction loading | High |
| `APF013` | Symbolic link | Medium |
| `APF014` | Verification bypass | Medium |
| `APF015` | Unpinned package installation | Medium |
| `APF016` | Temporary executable launch | High |
| `APF017` | Hard-coded credential-shaped token | High |
| `APF018` | `pull_request_target` workflow | High |
| `APF019` | MCP package bootstrap | High |
| `APF020` | Package lifecycle hook | Medium |

## Policy and suppressions

Choose the policy that fits the environment:

```bash
--fail-on critical  # only block the highest-risk findings
--fail-on high      # default
--fail-on medium    # use for hardening programs
--fail-on none      # report only
```

For a reviewed, intentional exception, add a narrow source-line suppression:

```text
agent-preflight: allow=APF009
```

Suppressions are intentionally local and visible in code review. A clean scan is not a security guarantee; review any finding and run untrusted repositories in an isolated environment.

To omit an intentional fixture or generated directory, add a repository-relative path to `.agentpreflightignore`. Directory entries apply to their contents; keep ignores narrow and explain them in review.

### Versioned policy

Check in `.agentpreflight.json` to make policy visible in review:

```json
{
  "policy": { "failOn": "high" },
  "ignore": ["docs/generated"],
  "rules": {
    "APF009": "low",
    "APF015": "off"
  }
}
```

`off` must be used sparingly. Prefer lowering severity when a control is still worth tracking. See [policy guidance](docs/policies.md), the [full rule catalog](docs/rules.md), and [CI integrations](docs/integrations.md).

Set `"profile": "strict"` to escalate medium findings to high, and set `"maxFindings": 50` to cap presentation output without changing the underlying JSON or SARIF workflow you retain for review.

### Explain a finding

```bash
node src/cli.js explain APF002
```

This prints the rule’s default severity, why it fires, and its remediation. Use it in issue triage rather than treating a rule ID as an opaque error.

## Privacy model

`agent-preflight` is offline by design. It makes no network requests, collects no telemetry, and reads only the repository you explicitly scan. It does not start MCP servers or execute detected commands.

Read the [threat model](docs/threat-model.md) and [operations guide](docs/operations.md) before treating a clean report as a merge decision.

## Roadmap

- Baseline files and finding-delta reports for large existing repositories
- Reusable policy packs for Codex, Claude Code, Cursor, and MCP deployments
- Signed npm package and GitHub release automation
- More syntax-aware rules with focused false-positive regression fixtures

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md). Rule proposals need a safe reproduction fixture and an expected finding ID.

## License

[MIT](LICENSE)
