import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const BEGIN_MARKER = '# BEGIN OJL URL LIFECYCLE';
const END_MARKER = '# END OJL URL LIFECYCLE';
const BASIC_AUTH_PATTERNS = [
  /^\s*AuthUserFile\b/i,
  /^\s*AuthName\b/i,
  /^\s*AuthType\s+BASIC\b/i,
  /^\s*Require\s+valid-user\b/i,
  /^\s*AuthBasicProvider\b/i,
  /^\s*AuthGroupFile\b/i,
  /^\s*Satisfy\b/i,
];

const getRulesEndpoint = () => {
  if (process.env.URL_LIFECYCLE_RULES_ENDPOINT) {
    return process.env.URL_LIFECYCLE_RULES_ENDPOINT;
  }

  const graphqlEndpoint = process.env.WP_GRAPHQL_ENDPOINT ?? 'https://cms.oyakonojikanlabo.jp/graphql';

  try {
    const parsed = new URL(graphqlEndpoint);
    return `${parsed.origin}/wp-json/ojl/v1/htaccess-rules`;
  } catch {
    return 'https://cms.oyakonojikanlabo.jp/wp-json/ojl/v1/htaccess-rules';
  }
};

const buildLifecycleBlock = (rules) => {
  const cleanedRules = rules.trim();
  const lines = [BEGIN_MARKER, '# このブロックは scripts/postbuild.mjs により自動更新されます。'];

  if (cleanedRules) {
    lines.push(cleanedRules);
  } else {
    lines.push('# (no lifecycle rules)');
  }

  lines.push(END_MARKER);
  return `${lines.join('\n')}\n`;
};

const injectLifecycleBlock = (baseHtaccess, rules) => {
  const block = buildLifecycleBlock(rules);
  const beginIndex = baseHtaccess.indexOf(BEGIN_MARKER);
  const endIndex = baseHtaccess.indexOf(END_MARKER);

  if (beginIndex >= 0 && endIndex > beginIndex) {
    const afterEnd = endIndex + END_MARKER.length;
    const before = baseHtaccess.slice(0, beginIndex);
    const after = baseHtaccess.slice(afterEnd).replace(/^\n*/, '\n');
    return `${before}${block}${after}`;
  }

  const rewriteEngineRegex = /(RewriteEngine\s+On\s*\n)/i;
  if (rewriteEngineRegex.test(baseHtaccess)) {
    return baseHtaccess.replace(rewriteEngineRegex, `$1\n${block}`);
  }

  return `${block}\n${baseHtaccess}`;
};

const stripBasicAuthDirectives = (input) => {
  const lines = input.split('\n');
  let removed = 0;

  const filtered = lines.filter((line) => {
    const shouldRemove = BASIC_AUTH_PATTERNS.some((pattern) => pattern.test(line));
    if (shouldRemove) {
      removed += 1;
      return false;
    }
    return true;
  });

  return {
    content: filtered.join('\n').replace(/^\n+/, ''),
    removed,
  };
};

const fetchLifecycleRules = async () => {
  const endpoint = getRulesEndpoint();
  const headers = {
    Accept: 'application/json',
  };

  const token = process.env.URL_LIFECYCLE_API_TOKEN?.trim();
  if (token) {
    headers['x-ojl-token'] = token;
  }

  try {
    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.includes('application/json')) {
      const body = await response.json();
      if (body && typeof body.rules === 'string') {
        console.log(`postbuild: fetched lifecycle rules from ${endpoint}`);
        return body.rules;
      }
      throw new Error('rules field is missing in JSON response');
    }

    const plainText = await response.text();
    console.log(`postbuild: fetched lifecycle rules from ${endpoint} (plain text)`);
    return plainText;
  } catch (error) {
    console.warn(`postbuild: failed to fetch lifecycle rules from ${endpoint}`, error);
    return '';
  }
};

async function main() {
  const projectRoot = process.cwd();
  const source = path.join(projectRoot, '.htaccess');
  const outDir = process.env.BUILD_OUT_DIR ?? 'dist';
  const distDir = path.join(projectRoot, outDir);
  const destination = path.join(distDir, '.htaccess');

  try {
    await access(source);
  } catch {
    console.warn('postbuild: skipped generating .htaccess (source file not found)');
    return;
  }

  await mkdir(distDir, { recursive: true });

  try {
    const rawBaseHtaccess = await readFile(source, 'utf8');
    const { content: baseHtaccess, removed } = stripBasicAuthDirectives(rawBaseHtaccess);
    if (removed > 0) {
      console.warn(`postbuild: removed ${removed} BASIC auth directive(s) from source .htaccess`);
    }
    const lifecycleRules = await fetchLifecycleRules();
    const mergedHtaccess = injectLifecycleBlock(baseHtaccess, lifecycleRules);

    await writeFile(destination, mergedHtaccess, 'utf8');
    console.log(`postbuild: generated .htaccess into ${outDir}/`);
  } catch (error) {
    console.error('postbuild: failed to generate .htaccess', error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('postbuild: unexpected error', error);
  process.exitCode = 1;
});
