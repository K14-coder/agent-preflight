const LEVELS = { critical: "error", high: "error", medium: "warning", low: "note" };

export function textReport(result) {
  const count = result.findings.length;
  const header = `agent-preflight scanned ${result.scannedFiles.length} agent-facing files | risk score ${result.score}/100 | ${count} finding${count === 1 ? "" : "s"}`;
  if (!count) return `${header}\nNo findings at the selected policy level.`;
  const truncated = result.truncatedFindings ? `\n\nOutput limited; ${result.truncatedFindings} lower-priority finding${result.truncatedFindings === 1 ? "" : "s"} omitted.` : "";
  return [header, "", ...result.findings.map((finding) => `${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.file}:${finding.line}:${finding.column}\n  ${finding.message}\n  Fix: ${finding.remediation}`)].join("\n") + truncated;
}

export function sarifReport(result) {
  const rules = new Map();
  for (const finding of result.findings) {
    if (!rules.has(finding.ruleId)) rules.set(finding.ruleId, { id: finding.ruleId, name: finding.title, shortDescription: { text: finding.message }, help: { text: finding.remediation }, defaultConfiguration: { level: LEVELS[finding.severity] } });
  }
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{ tool: { driver: { name: "agent-preflight", informationUri: "https://github.com/K14-coder/agent-preflight", rules: [...rules.values()] } }, results: result.findings.map((finding) => ({ ruleId: finding.ruleId, level: LEVELS[finding.severity], message: { text: `${finding.message} ${finding.remediation}` }, partialFingerprints: { agentPreflight: finding.fingerprint }, locations: [{ physicalLocation: { artifactLocation: { uri: finding.file }, region: { startLine: finding.line, startColumn: finding.column } } }] })) }]
  };
}

export function markdownReport(result) {
  const summary = `**agent-preflight:** scanned ${result.scannedFiles.length} agent-facing files, risk score **${result.score}/100**, ${result.findings.length} new finding${result.findings.length === 1 ? "" : "s"}.`;
  if (!result.findings.length) return `${summary}\n\nNo findings at the selected policy level.`;
  const rows = result.findings.map((finding) => `| ${finding.severity.toUpperCase()} | \`${finding.ruleId}\` | \`${finding.file}:${finding.line}\` | ${finding.message} |`).join("\n");
  const baseline = result.baseline ? `\n\n${result.baseline.knownFindings} known baseline finding${result.baseline.knownFindings === 1 ? " was" : "s were"} omitted.` : "";
  const truncated = result.truncatedFindings ? `\n\n${result.truncatedFindings} lower-priority finding${result.truncatedFindings === 1 ? "" : "s"} omitted by the configured limit.` : "";
  const details = result.findings.map((finding) => `<details><summary><code>${finding.ruleId}</code> ${finding.file}:${finding.line}</summary>\n\n${finding.remediation}\n\n</details>`).join("\n");
  return `${summary}\n\n| Severity | Rule | Location | Finding |\n| --- | --- | --- | --- |\n${rows}${baseline}${truncated}\n\n${details}`;
}

export function githubAnnotations(result) {
  const escape = (value) => String(value).replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A").replaceAll(",", "%2C").replaceAll(":", "%3A");
  return result.findings.map((finding) => {
    const level = finding.severity === "critical" || finding.severity === "high" ? "error" : finding.severity === "medium" ? "warning" : "notice";
    return `::${level} file=${escape(finding.file)},line=${finding.line},col=${finding.column},title=${escape(finding.ruleId)}::${escape(finding.message)}`;
  }).join("\n");
}
