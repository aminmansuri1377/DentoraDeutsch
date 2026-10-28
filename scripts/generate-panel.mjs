import { readFile, mkdir, writeFile } from "node:fs/promises";
import internals from "@prisma/internals";
const { getDMMF } = internals;
const { datamodel } = await getDMMF({
  datamodel: await readFile("prisma/schema.prisma", "utf8"),
});
await mkdir("src/generated", { recursive: true });
await writeFile(
  "src/generated/panel-schema.json",
  JSON.stringify(datamodel, null, 2) + "\n",
);
console.log(`Panel schema generated: ${datamodel.models.length} models.`);
