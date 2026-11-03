import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import openapiTS, { astToString, COMMENT_HEADER } from "openapi-typescript";

const specPath = path.resolve(
  process.env.API_SPEC_PATH ??
    "../interior_api/internal/apidocs/openapi.yaml",
);
const outputPath = path.resolve("src/lib/api/generated/schema.d.ts");
const ast = await openapiTS(pathToFileURL(specPath));
const generated = `${COMMENT_HEADER}${astToString(ast)}`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== generated) {
    throw new Error(
      `Generated API types are stale. Run npm run api:generate using ${specPath}.`,
    );
  }
  console.log("Generated API types match the backend OpenAPI contract.");
} else {
  await writeFile(outputPath, generated);
  console.log(`Generated ${path.relative(process.cwd(), outputPath)} from ${specPath}.`);
}
