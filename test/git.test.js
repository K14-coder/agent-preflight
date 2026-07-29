import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { changedFiles } from "../src/git.js";

const git = (args, cwd) => execFileSync("git", args, { cwd, stdio: "ignore" });

test("lists files changed from a supplied Git base", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "agent-preflight-git-"));
  git(["init", "-q"], directory);
  git(["config", "user.name", "Tests"], directory);
  git(["config", "user.email", "tests@example.com"], directory);
  fs.writeFileSync(path.join(directory, "AGENTS.md"), "Run the test suite.\n");
  git(["add", "AGENTS.md"], directory);
  git(["commit", "-qm", "baseline"], directory);
  fs.writeFileSync(path.join(directory, "AGENTS.md"), "Run the updated test suite.\n");
  git(["add", "AGENTS.md"], directory);
  git(["commit", "-qm", "change"], directory);
  assert.deepEqual(changedFiles(directory, "HEAD~1"), ["AGENTS.md"]);
});
