#!/usr/bin/env node
import path from "node:path";
import { scanRepository } from "./scan.js";

const args = process.argv.slice(2);
const target = args.find((argument) => !argument.startsWith("-")) || ".";
const result = scanRepository(path.resolve(target));
if (args.includes("--json")) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else if (result.findings.length === 0) {
  console.log("agent-preflight: no known high-risk repository instructions found.");
} else {
  console.log(`agent-preflight: risk score ${result.score}/100`);
  for (const finding of result.findings) console.log(`${finding.severity.toUpperCase()} ${finding.file}:${finding.line} ${finding.rule} - ${finding.message}`);
}
if (result.findings.some((finding) => finding.severity === "high")) process.exitCode = 2;
