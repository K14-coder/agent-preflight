import { execFileSync } from "node:child_process";

export function changedFiles(root, base) {
  const range = base ? `${base}...HEAD` : "HEAD~1...HEAD";
  try {
    return execFileSync("git", ["diff", "--name-only", "--diff-filter=ACMR", range], { cwd: root, encoding: "utf8" })
      .split("\n").map((file) => file.trim()).filter(Boolean);
  } catch {
    return null;
  }
}
