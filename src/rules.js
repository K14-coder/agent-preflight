export const SEVERITY = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };

export const RULES = [
  {
    id: "APF001",
    title: "Instruction override",
    severity: "high",
    pattern: /\b(?:ignore|disregard|override|bypass)\b[^\n]{0,120}\b(?:previous|prior|system|security|safety|instructions?)\b/i,
    message: "This text asks an agent to discard earlier instructions or safeguards.",
    remediation: "Remove the override. State the task and explicit, reviewable constraints instead."
  },
  {
    id: "APF002",
    title: "Remote content piped to a shell",
    severity: "critical",
    pattern: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/i,
    message: "Remote content is piped directly into a shell.",
    remediation: "Download, inspect, checksum, and run a pinned artifact instead of piping remote content to a shell."
  },
  {
    id: "APF003",
    title: "Encoded payload execution",
    severity: "critical",
    pattern: /(?:base64\s+(?:-d|--decode)|frombase64string|atob\()[\s\S]{0,180}(?:\||;|&&|\)|\$\()[\s\S]{0,40}(?:eval|(?:ba)?sh|powershell|iex)/i,
    message: "An encoded payload appears to be decoded and executed.",
    remediation: "Keep executable instructions in reviewable source files; never decode and execute opaque payloads."
  },
  {
    id: "APF004",
    title: "Destructive filesystem command",
    severity: "high",
    pattern: /\brm\s+(?:-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b|\bRemove-Item\b[^\n]{0,100}-Recurse[^\n]{0,100}-Force/i,
    message: "A recursive forced-delete command was found.",
    remediation: "Require a narrow, explicit path and user confirmation before destructive operations."
  },
  {
    id: "APF005",
    title: "Credential discovery",
    severity: "high",
    pattern: /\b(?:cat|find|printenv|env|security\s+find-generic-password|Get-ChildItem)\b[^\n]{0,160}(?:\.ssh|\.aws|\.npmrc|\.env|\b(?:token|secret|credential|keychain)\b)/i,
    message: "The instruction appears to discover, read, or enumerate credentials.",
    remediation: "Use a narrowly scoped secret provider and never instruct an agent to enumerate local credential stores."
  },
  {
    id: "APF006",
    title: "Potential credential exfiltration",
    severity: "critical",
    pattern: /\b(?:curl|wget|Invoke-WebRequest|fetch)\b[^\n]{0,220}(?:\$\{?(?:[A-Z][A-Z0-9_]*?(?:TOKEN|SECRET|KEY)|HOME|USERPROFILE)\b|\/proc\/self\/environ|\.ssh|\.aws)/i,
    message: "A network request appears to include environment or credential material.",
    remediation: "Remove credential-bearing arguments from network requests and use an approved secret exchange instead."
  },
  {
    id: "APF007",
    title: "Unsafe dynamic evaluation",
    severity: "medium",
    pattern: /\b(?:eval|exec|Invoke-Expression|iex)\s*\(?[^\n]{0,140}(?:\$\(|curl|wget|request|fetch|process\.env)/i,
    message: "Dynamic evaluation appears to consume external or environment-derived content.",
    remediation: "Parse structured input and use an allowlist; do not dynamically evaluate external content."
  },
  {
    id: "APF008",
    title: "MCP shell launcher",
    severity: "medium",
    pattern: /"command"\s*:\s*"(?:sh|bash|zsh|fish|cmd(?:\.exe)?|powershell(?:\.exe)?)"/i,
    surfaces: ["mcp-config"],
    message: "An MCP server configuration launches a general-purpose shell.",
    remediation: "Point the configuration at a pinned server executable rather than a general-purpose shell."
  },
  {
    id: "APF009",
    title: "Unpinned GitHub Action",
    severity: "medium",
    pattern: /\buses:\s*[^\s@]+@(?:main|master|latest)\b/i,
    surfaces: ["workflow"],
    message: "A GitHub Action uses a moving reference.",
    remediation: "Pin the action to a full commit SHA and document the version in a comment."
  },
  {
    id: "APF010",
    title: "Write-capable workflow token",
    severity: "medium",
    pattern: /\b(?:contents|actions|pull-requests|issues)\s*:\s*write\b/i,
    surfaces: ["workflow"],
    message: "The workflow requests write permissions.",
    remediation: "Grant the least privilege required and avoid write tokens for workflows that process untrusted input."
  },
  {
    id: "APF011",
    title: "Hidden Unicode control character",
    severity: "high",
    pattern: /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/,
    message: "Hidden or bidirectional Unicode control characters can change how instructions are displayed.",
    remediation: "Remove the control characters and keep security-sensitive instructions plain and visible."
  },
  {
    id: "APF012",
    title: "Remote instruction loading",
    severity: "high",
    pattern: /\b(?:curl|wget|fetch|Invoke-WebRequest)\b[^\n]{0,180}\b(?:AGENTS\.md|CLAUDE\.md|SKILL\.md|instructions?|prompt)\b/i,
    message: "The text fetches agent instructions from a remote location.",
    remediation: "Vendor and review agent instructions in the repository; do not load mutable remote guidance at runtime."
  },
  {
    id: "APF014",
    title: "Verification bypass",
    severity: "medium",
    pattern: /(?:--no-verify|--no-gpg-checks|GIT_SSL_NO_VERIFY\s*=\s*(?:1|true)|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*0)\b/i,
    message: "A command disables a verification or transport-security control.",
    remediation: "Fix the verification failure or explicitly scope and document an audited exception."
  },
  {
    id: "APF015",
    title: "Unpinned package installation",
    severity: "medium",
    pattern: /\b(?:npm|pnpm|yarn|pip(?:x)?|uv)\s+(?:install|add|run)\b[^\n]{0,180}(?:https?:\/\/|git\+|@(?:latest|next)\b)/i,
    message: "A package install uses a mutable or direct remote reference.",
    remediation: "Pin the package version or immutable commit and record the source in the lockfile."
  },
  {
    id: "APF016",
    title: "Temporary executable launch",
    severity: "high",
    pattern: /\b(?:chmod\s+\+x\s+\/tmp\/|(?:ba)?sh\s+\/tmp\/|\.\/tmp\/)[^\n]{0,160}/i,
    message: "A command executes content from a temporary location.",
    remediation: "Store reviewed executables in version control or verify a pinned artifact before execution."
  },
  {
    id: "APF017",
    title: "Hard-coded credential-shaped token",
    severity: "high",
    pattern: /\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,})\b/,
    message: "A token-shaped credential appears directly in a scanned file.",
    remediation: "Revoke the token if it is real, remove it from version control, and use a scoped secret provider."
  },
  {
    id: "APF018",
    title: "pull_request_target workflow",
    severity: "high",
    pattern: /\bon\s*:\s*pull_request_target\b|\bpull_request_target\s*:/i,
    surfaces: ["workflow"],
    message: "The workflow runs in the base repository security context for pull-request activity.",
    remediation: "Use pull_request for untrusted code; isolate pull_request_target workflows and never check out or execute pull-request head content."
  },
  {
    id: "APF019",
    title: "MCP package bootstrap",
    severity: "high",
    pattern: /"command"\s*:\s*"(?:npx|pnpx|uvx)"[\s\S]{0,320}"(?:-y|--yes)"/i,
    surfaces: ["mcp-config"],
    message: "An MCP configuration installs and executes a package without an interactive review step.",
    remediation: "Pin a reviewed package version or commit and install it through a controlled dependency workflow."
  },
  {
    id: "APF020",
    title: "Package lifecycle hook",
    severity: "medium",
    pattern: /"(?:preinstall|install|postinstall|prepublishOnly|prepare)"\s*:/i,
    surfaces: ["package"],
    message: "A package lifecycle hook can execute automatically during install or publish.",
    remediation: "Keep lifecycle hooks minimal, documented, and free of network downloads or credential access."
  }
];
