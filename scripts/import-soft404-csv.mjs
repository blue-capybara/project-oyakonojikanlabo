import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  LOCAL_SOFT404_CSV_RELATIVE_PATH,
  parseSoft404Csv,
  serializeSoft404Csv,
} from './url-lifecycle-local-rules.mjs';

async function main() {
  const inputArg = process.argv[2];
  const outputArg = process.argv[3];

  if (!inputArg) {
    console.error(
      'usage: node scripts/import-soft404-csv.mjs <input.csv> [output.csv]\nexample: npm run import:soft404 -- /path/to/表.csv',
    );
    process.exitCode = 1;
    return;
  }

  const projectRoot = process.cwd();
  const inputPath = path.resolve(projectRoot, inputArg);
  const outputPath = outputArg
    ? path.resolve(projectRoot, outputArg)
    : path.join(projectRoot, LOCAL_SOFT404_CSV_RELATIVE_PATH);

  const sourceText = await readFile(inputPath, 'utf8');
  const rows = parseSoft404Csv(sourceText);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serializeSoft404Csv(rows), 'utf8');

  console.log(
    `import-soft404: wrote ${rows.length} row(s) to ${path.relative(projectRoot, outputPath) || outputPath}`,
  );
}

main().catch((error) => {
  console.error('import-soft404: failed', error);
  process.exitCode = 1;
});
