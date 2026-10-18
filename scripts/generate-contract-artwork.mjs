// Regenerate the print artwork after editing public/contract/frame.svg.
// Sharp is provided by Next.js; no remote images or fonts are needed at runtime.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
let svg = await fs.readFile(path.join(root, "public/contract/frame.svg"), "utf8");
for (const [file, mime] of [["hero-jumelles.jpg", "image/jpeg"], ["logo_complet.png", "image/png"]]) {
  const bytes = await fs.readFile(path.join(root, "public", file));
  svg = svg.replace(`/${file}`, `data:${mime};base64,${bytes.toString("base64")}`);
}
await sharp(Buffer.from(svg)).resize(1812, 2560).png().toFile(path.join(root, "public/contract/frame.png"));
console.log("Contract artwork generated: public/contract/frame.png");
