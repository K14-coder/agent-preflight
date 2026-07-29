const LEVELS = { critical: "error", high: "error", medium: "warning", low: "note" };

export function textReport(result) {
  const count = result.findings.length;
  const header = `agent-preflight scanned ${result.scannedFiles.length} agent-facing files | risk score ${result.score}/100 | ${count} finding${count === 1 ? "" : "s"}`;
  if (!count) return `${header}\nNo findings at the selected policy level.`;
  return [header, "", ...result.findings.map((finding) => `${finding.severity.toUpperCase()} ${finding.ruleId} ${finding.file}:${finding.line}:${finding.column}\n  ${finding.message}\n  Fix: ${finding.remediation}`)].join("\n");
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
