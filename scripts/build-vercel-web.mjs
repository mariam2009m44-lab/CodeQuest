import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");

const allowedDirectories = ["assets", "css", "js", "json"];
const allowedRootExtensions = new Set([
  ".html", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif",
  ".ico", ".json", ".xml", ".txt", ".webmanifest"
]);
const excludedRootFiles = new Set([
  "firebase.json", "firestore.rules", "README.md", "Procfile",
  "vercel.json", ".gitignore"
]);

async function copyIfExists(source, destination) {
  try {
    await fs.cp(source, destination, {
      recursive: true,
      force: true,
      filter: async (entry) => {
        const name = path.basename(entry);
        return ![
          "node_modules", ".git", "__pycache__", ".venv",
          "venv", "tests", "test", "coverage"
        ].includes(name);
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

for (const directory of allowedDirectories) {
  await copyIfExists(
    path.join(root, directory),
    path.join(output, directory)
  );
}

// The legacy site also uses shared CSS from src/styles; do not publish React source.
await copyIfExists(
  path.join(root, "src", "styles"),
  path.join(output, "src", "styles")
);

for (const entry of await fs.readdir(root, { withFileTypes: true })) {
  if (!entry.isFile() || excludedRootFiles.has(entry.name)) continue;
  const extension = path.extname(entry.name).toLowerCase();
  if (!allowedRootExtensions.has(extension)) continue;
  await fs.copyFile(
    path.join(root, entry.name),
    path.join(output, entry.name)
  );
}

console.log("Prepared isolated static website output at dist/.");
