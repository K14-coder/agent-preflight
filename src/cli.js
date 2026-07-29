#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { baselineDocument, loadBaseline, loadConfig } from "./config.js";
import { changedFiles } from "./git.js";
import { markdownReport, sarifReport, textReport } from "./reporters.js";
import { RULES } from "./rules.js";
import { scanRepository, shouldFail } from "./scan.js";

const HELP = `agent-preflight <command> [path] [options]

Commands:
  scan      Scan a repository (default command)
  baseline  Write a reviewed finding baseline
  explain   Explain a rule, for example: agent-preflight explain APF002

Scan options:
  --mode all|changed              Scan all agent-facing files or only files changed from --base
  --base <ref>                    Git ref used by changed mode (for example origin/main)
  --all-files                     Scan every text file, not only agent-facing surfaces
  --config <file>                 Use an explicit .agentpreflight.json policy file
  --baseline <file>               Omit matching reviewed findings from the result
  --format text|json|markdown|sarif  Output format (default: text)
  --output <file>                 Write report or baseline output to a file
  --fail-on <severity>            critical, high, medium, low, or none
  --help                          Show this help

Suppression: agent-preflight: allow=APF001
Policy file: .agentpreflight.json`;

function parse(argv) {
  const options = { mode: "all", format: "text", allFiles: false };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--mode") options.mode = argv[++index];
    else if (argument === "--base") options.base = argv[++index];
    else if (argument === "--format" || argument === "--json") options.format = argument === "--json" ? "json" : argv[++index];
    else if (argument === "--output") options.output = argv[++index];
    else if (argument === "--fail-on") options.failOn = argv[++index];
    else if (argument === "--config") options.config = argv[++index];
    else if (argument === "--baseline") options.baseline = argv[++index];
    else if (argument === "--all-files") options.allFiles = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (!argument.startsWith("-")) positional.push(argument);
    else throw new Error(`Unknown option: ${argument}`);
  }
  return { target: positional[0] || ".", options };
}

function write(output, file) {
  if (file) fs.writeFileSync(path.resolve(file), output);
  else process.stdout.write(`${output.endsWith("\n") ? output : `${output}\n`}`);
}

function explain(ruleId) {
  const rule = RULES.find((candidate) => candidate.id === ruleId.toUpperCase());
  if (!rule) throw new Error(`Unknown rule: ${ruleId}`);
  return `# ${rule.id}: ${rule.title}\n\n- Default severity: ${rule.severity}\n- Finding: ${rule.message}\n- Remediation: ${rule.remediation}`;
}

function scan(target, options, command) {
  const root = path.resolve(target);
  const config = loadConfig(root, options.config);
  const baseline = loadBaseline(options.baseline);
  if (!["all", "changed"].includes(options.mode)) throw new Error("--mode must be all or changed");
  if (!["text", "json", "markdown", "sarif"].includes(options.format)) throw new Error("--format must be text, json, markdown, or sarif");
  const changed = options.mode === "changed" ? changedFiles(root, options.base) : null;
  if (options.mode === "changed" && changed === null) throw new Error("Could not determine changed files. Supply --base inside a Git repository.");
  const result = scanRepository(root, { changedFiles: changed || undefined, allFiles: options.allFiles, ignore: config.ignore, rules: config.rules, baselineFingerprints: baseline?.fingerprints });
  if (command === "baseline") {
    const output = `${JSON.stringify(baselineDocument(result), null, 2)}\n`;
    write(output, options.output || path.join(root, ".agentpreflight-baseline.json"));
    return;
  }
  const output = options.format === "sarif" ? `${JSON.stringify(sarifReport(result), null, 2)}\n` : options.format === "json" ? `${JSON.stringify(result, null, 2)}\n` : options.format === "markdown" ? markdownReport(result) : textReport(result);
  write(output, options.output);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `score=${result.score}\nfindings=${result.findings.length}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdownReport(result)}\n`);
  if (shouldFail(result, options.failOn || config.policy.failOn || "high")) process.exitCode = 2;
}

function main() {
  const first = process.argv[2];
  const command = ["scan", "baseline", "explain"].includes(first) ? first : "scan";
  const start = command === first ? 3 : 2;
  if (["--help", "-h", undefined].includes(first)) return console.log(HELP);
  if (command === "explain") return console.log(explain(process.argv[3] || ""));
  const { target, options } = parse(process.argv.slice(start));
  if (options.help) return console.log(HELP);
  scan(target, options, command);
}

try { main(); } catch (error) { console.error(`agent-preflight: ${error.message}`); process.exitCode = 1; }
