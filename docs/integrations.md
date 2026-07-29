# Integrations

## GitHub Actions

Use the composite action from [examples/github-action.yml](../examples/github-action.yml). The action writes `score` and `findings` to step outputs and appends a Markdown summary when GitHub provides `GITHUB_STEP_SUMMARY`.

For changed-files mode, `actions/checkout` must use `fetch-depth: 0` and `base` should be the pull request base SHA. That makes the comparison deterministic even when a branch is rebased.

## SARIF

SARIF lets GitHub Code Scanning display findings at exact source locations:

```yaml
- run: node src/cli.js scan . --format sarif --output agent-preflight.sarif --fail-on none
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: agent-preflight.sarif
```

Keep the scan itself local. Uploading SARIF is an intentional GitHub action, not behavior performed by the CLI.

## Markdown and JSON

`--format markdown` is designed for pull-request comments and incident tickets. `--format json` provides the full stable finding record, including `ruleId`, severity, surface, source location, remediation, and fingerprint.
