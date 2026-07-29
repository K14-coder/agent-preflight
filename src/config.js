import fs from "node:fs";
import path from "node:path";
import { SEVERITY } from "./rules.js";

const CONFIG_NAME = ".agentpreflight.json";

function readJson(file, label) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { throw new Error(`Could not parse ${label}: ${error.message}`); }
}

function validateSeverity(value, label, allowOff = false) {
  if (value === "off" && allowOff) return;
  if (!(value in SEVERITY) || value === "none") throw new Error(`${label} must be critical, high, medium, low${allowOff ? ", or off" : ""}`);
}

export function loadConfig(root, configPath) {
  const file = configPath ? path.resolve(configPath) : path.join(root, CONFIG_NAME);
  if (!fs.existsSync(file)) return { file: null, ignore: [], rules: {}, policy: {} };
  const config = readJson(file, CONFIG_NAME);
  if (config.ignore !== undefined && !Array.isArray(config.ignore)) throw new Error("config.ignore must be an array of repository-relative paths");
  if (config.rules !== undefined && (config.rules === null || Array.isArray(config.rules) || typeof config.rules !== "object")) throw new Error("config.rules must be an object keyed by finding ID");
  if (config.policy !== undefined && (config.policy === null || Array.isArray(config.policy) || typeof config.policy !== "object")) throw new Error("config.policy must be an object");
  for (const [ruleId, severity] of Object.entries(config.rules || {})) validateSeverity(severity, `config.rules.${ruleId}`, true);
  if (config.policy?.failOn !== undefined) validateSeverity(config.policy.failOn, "config.policy.failOn");
  if (config.policy?.profile !== undefined && !["balanced", "strict"].includes(config.policy.profile)) throw new Error("config.policy.profile must be balanced or strict");
  if (config.policy?.maxFindings !== undefined && (!Number.isInteger(config.policy.maxFindings) || config.policy.maxFindings < 1)) throw new Error("config.policy.maxFindings must be a positive integer");
  return { file, ignore: config.ignore || [], rules: config.rules || {}, policy: config.policy || {} };
}

export function loadBaseline(file) {
  if (!file) return null;
  const baseline = readJson(path.resolve(file), "baseline");
  if (baseline.schemaVersion !== 1 || !Array.isArray(baseline.findings)) throw new Error("baseline must use schemaVersion 1 with a findings array");
  return { file: path.resolve(file), fingerprints: new Set(baseline.findings.map((finding) => finding.fingerprint).filter(Boolean)) };
}

export function baselineDocument(result) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    toolVersion: result.version,
    findings: result.findings.map(({ fingerprint, ruleId, file, snippet }) => ({ fingerprint, ruleId, file, snippet }))
  };
}
