# Rule Catalog

Each rule is deterministic, local, and paired with a source location and a suggested remediation. The scanner does not claim to prove that a repository is safe; it highlights patterns that deserve review before an agent is given authority.

| ID | Default | Intent |
| --- | --- | --- |
| APF001 | High | Flag language that tells an agent to discard established controls. |
| APF002 | Critical | Detect remote content piped into a shell. |
| APF003 | Critical | Detect encoded payloads that appear to execute. |
| APF004 | High | Detect recursive forced deletion. |
| APF005 | High | Detect apparent credential-store discovery. |
| APF006 | Critical | Detect network requests that include environment or credential material. |
| APF007 | Medium | Detect dynamic evaluation of external content. |
| APF008 | Medium | Detect MCP configurations that invoke a general-purpose shell. |
| APF009 | Medium | Detect GitHub Actions pinned to moving references. |
| APF010 | Medium | Detect write-capable GitHub Actions tokens. |
| APF011 | High | Detect hidden or bidirectional Unicode controls. |
| APF012 | High | Detect remote loading of agent instructions. |
| APF013 | Medium | Detect symbolic links in scanned surfaces. |
| APF014 | Medium | Detect verification and TLS-control bypasses. |
| APF015 | Medium | Detect mutable or direct remote package installation. |
| APF016 | High | Detect execution from temporary locations. |

Run `node src/cli.js explain APF002` for the scanner’s current remediation text. Add false-positive regressions before changing a rule pattern or severity.
