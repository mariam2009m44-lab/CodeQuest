import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ignored = new Set([".git", "node_modules", "dist", "build", ".wrangler"]);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
}

walk(process.cwd());

const failures = [];
for (const file of files.sort()) {
  const source = fs.readFileSync(file, "utf8");
  const result = spawnSync(process.execPath, ["--input-type=module", "--check"], {
    input: source,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failures.push({ file: path.relative(process.cwd(), file), output: result.stderr || result.stdout });
  }
}

if (failures.length) {
  for (const failure of failures) {
    console.error("\n" + failure.file + "\n" + failure.output);
  }
  process.exitCode = 1;
} else {
  console.log("JavaScript syntax check passed for " + files.length + " files.");
}
