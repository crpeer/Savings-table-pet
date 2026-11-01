import { cp, mkdir, rm } from "node:fs/promises";

const outputDir = "www";
const files = ["index.html", "style.css", "manifest.webmanifest", "sw.js"];
const directories = ["src", "assets"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const file of files) {
  await cp(file, `${outputDir}/${file}`);
}

for (const directory of directories) {
  await cp(directory, `${outputDir}/${directory}`, { recursive: true });
}

console.log(`Web assets copied to ${outputDir}/`);
