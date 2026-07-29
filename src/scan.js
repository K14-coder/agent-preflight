import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { RULES, SEVERITY } from "./rules.js";

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache"]);
const TEXT_LIMIT = 1024 * 1024;
const SURFACE_NAMES = new Set(["agents.md", "claude.md", "skill.md", "readme.md", "package.json", "mcp.json", ".mcp.json", "cursor-rules.md"]);

function relative(root, file) { return path.relative(root, file).split(path.sep).join("/"); }

export function detectSurface(file) {
  const normalized = file.replaceAll("\\", "/").toLowerCase();
  const name = normalized.split("/").at(-1);
  if ((normalized.startsWith(".github/workflows/") || normalized.includes("/.github/workflows/")) && /\.(?:ya?ml)$/i.test(name)) return "workflow";
  if (name.includes("mcp") && /\.(?:json|ya?ml)$/i.test(name)) return "mcp-config";
  if (name === "package.json") return "package";
  if (/\.(?:sh|bash|zsh|ps1|cmd|bat)$/i.test(name) || /(?:^|\/)(?:install|setup|bootstrap)(?:\.|$)/i.test(normalized)) return "script";
  if (SURFACE_NAMES.has(name) || /\.(?:md|mdx)$/i.test(name)) return "agent-guidance";
  return "other";
}

function shouldScan(file, allFiles) { return allFiles || detectSurface(file) !== "other"; }

function readIgnoreFile(root) {
  const file = path.join(root, ".agentpreflightignore");
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
}

function isIgnored(file, patterns) {
  return patterns.some((pattern) => file === pattern || file.startsWith(`${pattern.replace(/\/$/, "")}/`));
}

function walk(root, current = root, files = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;
    const full = path.join(current, entry.name);
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) files.push({ path: full, symlink: true });
    else if (stat.isDirectory()) walk(root, full, files);
    else if (stat.isFile() && stat.size <= TEXT_LIMIT) files.push({ path: full, symlink: false });
  }
  return files;
}

function lineAt(text, index) {
  const before = text.slice(0, index);
  const line = before.split("\n").length;
  const start = before.lastIndexOf("\n") + 1;
  const end = text.indexOf("\n", index);
  return { line, column: index - start + 1, text: text.slice(start, end === -1 ? text.length : end) };
}

function isSuppressed(line, ruleId) {
  const marker = line.match(/agent-preflight:\s*allow(?:=([A-Z0-9,\-]+))?/i);
  return Boolean(marker && (!marker[1] || marker[1].split(",").includes(ruleId)));
}

function fingerprint(file, line, rule) {
  return crypto.createHash("sha256").update(`${file}:${line}:${rule}`).digest("hex").slice(0, 16);
}

function score(findings) {
  return Math.min(100, findings.reduce((total, finding) => total + ({ critical: 45, high: 25, medium: 10, low: 3 }[finding.severity] || 0), 0));
}

export function scanRepository(root = process.cwd(), options = {}) {
  const resolvedRoot = path.resolve(root);
  const changed = options.changedFiles ? new Set(options.changedFiles.map((file) => file.replaceAll("\\", "/"))) : null;
  const ignored = [...readIgnoreFile(resolvedRoot), ...(options.ignore || [])];
  const findings = [];
  const scannedFiles = [];

  for (const file of walk(resolvedRoot)) {
    const filePath = relative(resolvedRoot, file.path);
    if (changed && !changed.has(filePath)) continue;
    if (isIgnored(filePath, ignored)) continue;
    const surface = detectSurface(filePath);
    if (!options.allFiles && surface === "other") continue;
    scannedFiles.push(filePath);
    if (file.symlink) {
      findings.push({ ruleId: "APF013", title: "Symbolic link", severity: "medium", file: filePath, line: 1, column: 1, surface, snippet: "symbolic link", message: "A symbolic link can redirect an agent outside the expected repository boundary.", remediation: "Verify the link destination before granting an agent filesystem access.", fingerprint: fingerprint(filePath, 1, "APF013") });
      continue;
    }
    let text;
    try { text = fs.readFileSync(file.path, "utf8"); } catch { continue; }
    if (text.includes("\u0000")) continue;
    for (const rule of RULES) {
      if (rule.surfaces && !rule.surfaces.includes(surface)) continue;
      const expression = new RegExp(rule.pattern.source, rule.pattern.flags.replace("g", ""));
      let match;
      while ((match = expression.exec(text))) {
        const location = lineAt(text, match.index);
        if (!isSuppressed(location.text, rule.id)) {
          findings.push({ ruleId: rule.id, title: rule.title, severity: rule.severity, file: filePath, line: location.line, column: location.column, surface, snippet: location.text.trim().slice(0, 240), message: rule.message, remediation: rule.remediation, fingerprint: fingerprint(filePath, location.line, rule.id) });
        }
        if (!expression.global) break;
      }
    }
  }

  findings.sort((a, b) => SEVERITY[b.severity] - SEVERITY[a.severity] || a.file.localeCompare(b.file) || a.line - b.line);
  return { version: "0.2.0", root: resolvedRoot, scannedFiles: scannedFiles.sort(), score: score(findings), findings, summary: Object.fromEntries(Object.keys(SEVERITY).filter((severity) => severity !== "none").map((severity) => [severity, findings.filter((finding) => finding.severity === severity).length])) };
}

export function shouldFail(result, threshold = "high") {
  if (threshold === "none") return false;
  const value = SEVERITY[threshold] ?? SEVERITY.high;
  return result.findings.some((finding) => SEVERITY[finding.severity] >= value);
}
