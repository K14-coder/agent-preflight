# agent-preflight

> Scan a repository for risky instructions before giving it to an AI coding agent.

`agent-preflight` is a local, zero-dependency CLI for a simple question: *is this repository asking my agent to do something surprising?* It looks for common prompt-injection, credential-discovery, destructive-command, encoded-execution, and symbolic-link patterns before an agent receives broad filesystem or shell access.

```bash
git clone https://github.com/K14-coder/agent-preflight.git
cd agent-preflight
node src/cli.js /path/to/untrusted-repository --json
```

It exits with code `2` when it finds a high-severity pattern, which makes it usable in pre-commit hooks and CI. Once published to npm, it can be invoked with `npx agent-preflight`.

## What it checks

- Downloads piped into a shell
- Encoded payloads that appear to execute
- Forced recursive deletion
- Attempts to discover common credential locations
- Attempts to direct agents around earlier safeguards
- Symbolic links that deserve manual review

This is a lightweight heuristic, not a security guarantee. Review findings and run unknown code in an isolated environment.

For an intentional fixture or reviewed false positive, append `agent-preflight: allow` on the same line. Keep suppressions rare and explain them in review.

## Development

```bash
npm test
```

## Privacy

The CLI never sends repository content, filenames, telemetry, or diagnostics over the network. It only reads the directory you pass to it.

## Contributing

Issues and focused pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and report vulnerabilities through [SECURITY.md](SECURITY.md).

## Keywords

AI agent security, coding agent safety, prompt injection detection, Claude Code security, Codex security, Cursor security, repository supply-chain security.

## License

[MIT](LICENSE)
