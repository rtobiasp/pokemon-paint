import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "www");
const files = ["index.html", "pintar.html", "favicon.svg", "site.webmanifest"];
const directories = ["css", "js"];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const file of files) {
  cpSync(resolve(root, file), resolve(output, file));
}

for (const directory of directories) {
  cpSync(resolve(root, directory), resolve(output, directory), {
    recursive: true,
  });
}