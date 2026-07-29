# Policy Files and Baselines

`agent-preflight` treats policy as repository code. The scanner loads `.agentpreflight.json` from the target root unless `--config` provides another path.

## Policy schema

```json
{
  "policy": { "failOn": "high" },
  "ignore": ["generated/agent-notes"],
  "rules": {
    "APF009": "low",
    "APF015": "off"
  }
}
```

- `policy.failOn` sets the default blocking threshold.
- `ignore` accepts exact repository-relative files or directory prefixes.
- `rules` accepts `critical`, `high`, `medium`, `low`, or `off` for a known finding ID.

Use inline suppression for a single reviewed source line. Use an ignore for generated or intentionally unsafe fixtures. Use a rule override only when the team has decided that the default severity does not match its environment.

## Baselines

Create a baseline after reviewing the current findings:

```bash
node src/cli.js baseline . --output .agentpreflight-baseline.json
```

Then scan against it:

```bash
node src/cli.js scan . --baseline .agentpreflight-baseline.json --fail-on high
```

The baseline stores stable finding fingerprints based on path, rule ID, and matched source line. The report omits known findings and includes their count in `baseline.knownFindings`. Regenerate a baseline only through a reviewed change; it is part of the security record.

## Recommended rollout

1. Start with `--fail-on none` to collect findings.
2. Review high and critical findings; fix or baseline them deliberately.
3. Enable baseline-aware scans with `--fail-on high` in pull requests.
4. Raise the policy to `medium` when the repository has a maintenance owner for rule triage.
