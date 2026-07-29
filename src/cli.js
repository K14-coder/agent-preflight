#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { changedFiles } from "./git.js";
import { textReport, sarifReport } from "./reporters.js";
import { scanRepository, shouldFail } from "./scan.js";

const HELP = `agent-preflight scan [path] [options]

Options:
  --mode all|changed       Scan all agent-facing files or only files changed from --base
  --base <ref>             Git ref used by changed mode (for example origin/main)
  --all-files              Scan every text file, not only agent-facing surfaces
  --format text|json|sarif Output format (default: text)
  --output <file>          Write JSON or SARIF output to a file
  --fail-on <severity>     critical, high, medium, low, or none (default: high)
  --help                   Show this help

Suppress a reviewed finding on its source line with: agent-preflight: allow=APF001`;

function parse(argv) {
  const options = { mode: "all", format: "text", failOn: "high", allFiles: false };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--mode") options.mode = argv[++index];
    else if (argument === "--base") options.base = argv[++index];
    else if (argument === "--format" || argument === "--json") options.format = argument === "--json" ? "json" : argv[++index];
    else if (argument === "--output") options.output = argv[++index];
    else if (argument === "--fail-on") options.failOn = argv[++index];
    else if (argument === "--all-files") options.allFiles = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (!argument.startsWith("-")) positional.push(argument);
    else throw new Error(`Unknown option: ${argument}`);
  }
  return { target: positional[0] || ".", options };
}

function main() {
  const command = process.argv[2] === "scan" ? "scan" : "scan";
  const start = command === "scan" && process.argv[2] === "scan" ? 3 : 2;
  const { target, options } = parse(process.argv.slice(start));
  if (options.help) return console.log(HELP);
  if (!["all", "changed"].includes(options.mode)) throw new Error("--mode must be all or changed");
  if (!["text", "json", "sarif"].includes(options.format)) throw new Error("--format must be text, json, or sarif");
  const root = path.resolve(target);
  const changed = options.mode === "changed" ? changedFiles(root, options.base) : null;
  if (options.mode === "changed" && changed === null) throw new Error("Could not determine changed files. Supply --base inside a Git repository.");
  const result = scanRepository(root, { changedFiles: changed || undefined, allFiles: options.allFiles });
  const payload = options.format === "sarif" ? sarifReport(result) : result;
  const output = options.format === "text" ? textReport(result) : `${JSON.stringify(payload, null, 2)}\n`;
  if (options.output) fs.writeFileSync(path.resolve(options.output), output);
  else process.stdout.write(`${output.endsWith("\n") ? output : `${output}\n`}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `score=${result.score}\nfindings=${result.findings.length}\n`);
  if (shouldFail(result, options.failOn)) process.exitCode = 2;
}

try { main(); } catch (error) { console.error(`agent-preflight: ${error.message}`); process.exitCode = 1; }
