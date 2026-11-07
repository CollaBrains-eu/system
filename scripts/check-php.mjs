import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";
import PhpParser from "php-parser";

const root = resolve(import.meta.dirname, "..");
const parser = new PhpParser({
  parser: { php7: true, suppressErrors: false },
  ast: { withPositions: true },
});
const files = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const file = resolve(directory, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (file.endsWith(".php")) files.push(file);
  }
}
walk(resolve(root, "wordpress"));
let failed = false;
for (const file of files) {
  try {
    parser.parseCode(readFileSync(file, "utf8"), file);
    console.log(`✓ ${relative(root, file)}`);
  } catch (error) {
    failed = true;
    console.error(`✗ ${relative(root, file)}: ${error.message}`);
  }
}
if (failed) process.exit(1);
console.log(`\n${files.length} PHP files parsed successfully.`);
