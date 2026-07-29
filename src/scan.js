import fs from "node:fs";
import path from "node:path";
import { RULES } from "./rules.js";

const IGNORED = new Set([".git", "node_modules", "dist", "build", "coverage", ".next"]);
const TEXT_LIMIT = 512 * 1024;

function walk(root, current = root, files = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(current, entry.name);
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) {
      files.push({ path: full, symlink: true });
    } else if (stat.isDirectory()) {
      walk(root, full, files);
    } else if (stat.isFile() && stat.size <= TEXT_LIMIT) {
      files.push({ path: full, symlink: false });
    }
  }
  return files;
}

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

function isAllowed(text, index) {
  const line = text.split("\n")[lineNumber(text, index) - 1];
  return line.includes("agent-preflight: allow");
}

export function scanRepository(root = process.cwd()) {
  const findings = [];
  for (const file of walk(root)) {
    const relativePath = path.relative(root, file.path) || path.basename(file.path);
    if (file.symlink) {
      findings.push({ rule: "symlink", severity: "medium", file: relativePath, line: 1, message: "Symbolic link: verify its destination before granting an agent access." });
      continue;
    }
    let text;
    try { text = fs.readFileSync(file.path, "utf8"); } catch { continue; }
    if (text.includes("\u0000")) continue;
    for (const rule of RULES) {
      const match = rule.pattern.exec(text);
      if (match && !isAllowed(text, match.index)) findings.push({ rule: rule.id, severity: rule.severity, file: relativePath, line: lineNumber(text, match.index), message: rule.message });
    }
  }
  const score = findings.reduce((total, finding) => total + (finding.severity === "high" ? 30 : 10), 0);
  return { root: path.resolve(root), score: Math.min(score, 100), findings };
}
