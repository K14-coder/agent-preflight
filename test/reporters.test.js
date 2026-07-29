import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { sarifReport, textReport } from "../src/reporters.js";
import { scanRepository } from "../src/scan.js";

test("builds valid SARIF locations and actionable text", () => {
  const result = scanRepository(path.resolve("test/fixtures/unsafe-repo"));
  const sarif = sarifReport(result);
  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].results[0].ruleId, "APF002");
  assert.match(textReport(result), /Fix: Download, inspect, checksum/);
});
