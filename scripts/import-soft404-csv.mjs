import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { parseSoft404Csv } from './url-lifecycle-soft404.mjs';

const DETAIL_ORDER = [
  'imported',
  'alreadyCovered',
  'skippedValid',
  'skippedRedirected',
  'skippedInvalid',
];

const getImportEndpoint = () => {
  if (process.env.URL_LIFECYCLE_IMPORT_ENDPOINT) {
    return process.env.URL_LIFECYCLE_IMPORT_ENDPOINT;
  }

  const graphqlEndpoint =
    process.env.WP_GRAPHQL_ENDPOINT ?? 'https://cms.oyakonojikanlabo.jp/graphql';

  try {
    const parsed = new URL(graphqlEndpoint);
    return `${parsed.origin}/wp-json/ojl/v1/import-soft404`;
  } catch {
    return 'https://cms.oyakonojikanlabo.jp/wp-json/ojl/v1/import-soft404';
  }
};

const formatDetailLine = (item) => {
  const parts = [];

  if (item.path) parts.push(item.path);
  if (item.rawUrl && !item.path) parts.push(item.rawUrl);
  if (item.status) parts.push(`status=${item.status}`);
  if (item.reason) parts.push(`reason=${item.reason}`);
  if (item.redirectTo) parts.push(`redirectTo=${item.redirectTo}`);
  if (item.lastCrawled) parts.push(`lastCrawled=${item.lastCrawled}`);
  if (item.source) parts.push(`source=${item.source}`);

  return `- ${parts.join(' | ')}`;
};

const printDetails = (details) => {
  for (const bucket of DETAIL_ORDER) {
    const section = details?.[bucket];
    if (!section || !Array.isArray(section.items)) continue;

    console.log(`\n[${bucket}] ${section.items.length}件`);
    for (const item of section.items) {
      console.log(formatDetailLine(item));
    }

    if ((section.truncatedCount ?? 0) > 0) {
      console.log(`... and ${section.truncatedCount} more`);
    }
  }
};

async function main() {
  const args = process.argv.slice(2);
  const inputArg = args.find((arg) => !arg.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const includeDetails = args.includes('--details');
  const limitArg = args.find((arg) => arg.startsWith('--limit='));
  const parsedSampleLimit = limitArg ? Number.parseInt(limitArg.slice('--limit='.length), 10) : 200;
  const sampleLimit =
    Number.isFinite(parsedSampleLimit) && parsedSampleLimit > 0 ? parsedSampleLimit : 200;

  if (!inputArg) {
    console.error(
      'usage: node scripts/import-soft404-csv.mjs <input.csv> [--dry-run] [--details] [--limit=200]\nexample: npm run import:soft404 -- /path/to/表.csv --dry-run --details --limit=50',
    );
    process.exitCode = 1;
    return;
  }

  const projectRoot = process.cwd();
  const inputPath = path.resolve(projectRoot, inputArg);
  const sourceText = await readFile(inputPath, 'utf8');
  const rows = parseSoft404Csv(sourceText);
  const endpoint = getImportEndpoint();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const token = process.env.URL_LIFECYCLE_API_TOKEN?.trim();
  if (token) {
    headers['x-ojl-token'] = token;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      rows,
      dryRun,
      includeDetails,
      sampleLimit,
    }),
  });

  const responseText = await response.text();
  let body = null;

  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      body = responseText;
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${responseText}`);
  }

  console.log(`import-soft404: sent ${rows.length} row(s) to ${endpoint}`);
  if (body && typeof body === 'object' && 'result' in body && body.result) {
    console.log(JSON.stringify(body.result, null, 2));

    if (includeDetails && body.result.details) {
      printDetails(body.result.details);
    }
  }
}

main().catch((error) => {
  console.error('import-soft404: failed', error);
  process.exitCode = 1;
});
