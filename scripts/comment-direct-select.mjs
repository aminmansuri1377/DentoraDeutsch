/**
 * One-time source edit: comment out the redundant "Direkt auswählen" selector.
 * The code is deliberately preserved in a JSX comment for easy restoration.
 * Fails closed if the component structure differs: never comments out a large
 * surrounding page and never silently reports success without an edit.
 *
 * Run from the project root: node scripts/comment-direct-select.mjs
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";

const root = join(process.cwd(), "src", "features", "learning", "components");
const targetText = "Direkt auswählen";
const marker = "ZAHN_UNI_DIRECT_SELECT_DISABLED";
const files = (await readdir(root)).filter((name) => name.endsWith(".tsx"));
const matches = [];
for (const filename of files) {
  const path = join(root, filename);
  const source = await readFile(path, "utf8");
  if (!source.includes(targetText)) continue;
  if (source.includes(marker)) {
    console.log(`Already commented: ${filename}`);
    continue;
  }
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (tree.parseDiagnostics.length) {
    throw new Error(`${filename} contains JSX syntax errors before editing; nothing changed.`);
  }
  const candidates = [];
  function visit(node) {
    if (ts.isJsxElement(node)) {
      const text = node.getText(tree);
      // Find the smallest containing JSX wrapper with both the label and select.
      if (text.includes(targetText) && /<\s*(?:select|Select)\b/.test(text)) {
        candidates.push({ node, length: text.length });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  candidates.sort((a, b) => a.length - b.length);
  const found = candidates[0];
  if (!found || found.length > 4500) {
    throw new Error(`${filename}: could not safely isolate the "Direkt auswählen" selector. No file was changed.`);
  }
  const start = found.node.getStart(tree);
  const end = found.node.getEnd();
  const original = source.slice(start, end);
  if (original.includes("*/")) {
    throw new Error(`${filename}: the block contains an existing comment; no file was changed.`);
  }
  const replacement = `{/* ${marker}: redundant selector; the specialty picker above remains active.\n${original}\n*/}`;
  const modified = source.slice(0, start) + replacement + source.slice(end);
  const check = ts.createSourceFile(filename, modified, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (check.parseDiagnostics.length) {
    throw new Error(`${filename}: JSX validation failed after edit; no file was changed.`);
  }
  matches.push({ path, filename, modified });
}
if (matches.length > 1) {
  throw new Error(`Found ${matches.length} possible selectors: no files were changed.`);
}
if (matches.length === 0) {
  // An already-commented selector is an idempotent no-op.
  const all = await Promise.all(files.map((name) => readFile(join(root, name), "utf8")));
  if (!all.some((content) => content.includes(marker))) {
    throw new Error('Could not find "Direkt auswählen" in the learning components. No files were changed.');
  }
} else {
  await writeFile(matches[0].path, matches[0].modified, "utf8");
  console.log(`Commented redundant selector in ${matches[0].filename}; other selectors remain intact.`);
}
