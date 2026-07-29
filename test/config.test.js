import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { baselineDocument, loadBaseline, loadConfig } from "../src/config.js";
import { scanRepository, shouldFail } from "../src/scan.js";

test("applies repository policy rule severities", () => {
  const directory = path.resolve("test/fixtures/configured-repo");
  const config = loadConfig(directory);
  const unconfigured = scanRepository(directory);
  assert.deepEqual(unconfigured.findings.map((finding) => [finding.ruleId, finding.severity]), [["APF014", "medium"], ["APF015", "medium"]]);
  const result = scanRepository(directory, { ignore: config.ignore, rules: config.rules });
  assert.deepEqual(result.findings.map((finding) => [finding.ruleId, finding.severity]), [["APF015", "low"]]);
  assert.equal(shouldFail(result, config.policy.failOn), false);
});

test("baseline documents omit known findings from a later scan", () => {
  const directory = path.resolve("test/fixtures/unsafe-repo");
  const initial = scanRepository(directory);
  const baselinePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "agent-preflight-baseline-")), "baseline.json");
  fs.writeFileSync(baselinePath, JSON.stringify(baselineDocument(initial)));
  const baseline = loadBaseline(baselinePath);
  const result = scanRepository(directory, { baselineFingerprints: baseline.fingerprints });
  assert.equal(result.findings.length, 0);
  assert.deepEqual(result.baseline, { knownFindings: 9, newFindings: 0 });
});
