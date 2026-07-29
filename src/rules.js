export const RULES = [
  { id: "shell-download", severity: "high", pattern: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:ba)?sh\b/i, message: "Downloads are piped directly into a shell." }, // agent-preflight: allow
  { id: "encoded-execution", severity: "high", pattern: /(?:base64\s+(?:-d|--decode)|frombase64string)\b[\s\S]{0,160}(?:\||;|&&)\s*(?:ba)?sh/i, message: "An encoded payload appears to be executed." }, // agent-preflight: allow
  { id: "destructive-delete", severity: "high", pattern: /\brm\s+(?:-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b/i, message: "Recursive forced deletion is requested." }, // agent-preflight: allow
  { id: "credential-discovery", severity: "medium", pattern: /\b(?:printenv|env|security\s+find-generic-password|cat)\b[^\n]{0,120}\b(?:token|secret|credential|\.ssh|\.aws)\b/i, message: "The instruction may discover or expose credentials." }, // agent-preflight: allow
  { id: "instruction-override", severity: "medium", pattern: /\b(?:ignore|override|bypass|disregard)\b[^\n]{0,100}\b(?:previous|system|security|safety|instructions?)\b/i, message: "The text attempts to override safety or prior instructions." } // agent-preflight: allow
];
