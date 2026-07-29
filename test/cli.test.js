import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

const cli = (...args) => execFileSync(process.execPath, ["src/cli.js", ...args], { encoding: "utf8" });

test("explains a rule without scanning a repository", () => {
  const output = cli("explain", "APF002");
  assert.match(output, /Remote content piped to a shell/);
  assert.match(output, /Default severity: critical/);
});

test("emits a Markdown report", () => {
  const output = cli("scan", path.resolve("test/fixtures/safe-repo"), "--format", "markdown", "--fail-on", "low");
  assert.match(output, /agent-preflight:/);
  assert.match(output, /No findings/);
});

test("honors output caps without changing policy evaluation", () => {
  const output = cli("scan", path.resolve("test/fixtures/unsafe-repo"), "--format", "json", "--max-findings", "2", "--fail-on", "none");
  const report = JSON.parse(output);
  assert.equal(report.findings.length, 2);
  assert.equal(report.truncatedFindings, 7);
});
