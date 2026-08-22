import { access, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEPLOY_MARKER_FILE = '.ojl-deploy-root';
const DEPLOY_MARKER_VALUE = 'oyakonojikanlabo.jp';
export const HTACCESS_BEGIN_MARKER = '# BEGIN OJL FRONTEND';
export const HTACCESS_END_MARKER = '# END OJL FRONTEND';
export const MANAGED_DIRECTORIES = Object.freeze([
  'assets',
  'fonts',
  'icons',
  'images',
  'post-cache',
  'post-pages',
]);
const PROTECTED_SOURCE_DIRECTORIES = new Set(['lp']);

const required = (env, name) => {
  const value = String(env[name] ?? '').trim();
  if (!value) {
    throw new Error(`${name} が設定されていません`);
  }
  return value;
};

const normalizeRemotePath = (value) => {
  const normalized = value.replace(/\/+$/, '');
  if (
    !normalized.startsWith('/') ||
    normalized === '/' ||
    !/^\/[A-Za-z0-9._/-]+$/.test(normalized) ||
    normalized.includes('//') ||
    normalized.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error('DEPLOY_PATH はルート以外の安全な絶対パスで指定してください');
  }
  return normalized;
};

export const readDeployConfig = (env = process.env, cwd = process.cwd()) => {
  const host = required(env, 'DEPLOY_HOST');
  const user = required(env, 'DEPLOY_USER');
  const remotePath = normalizeRemotePath(required(env, 'DEPLOY_PATH'));
  const port = String(env.DEPLOY_PORT || '22').trim();

  if (!/^[A-Za-z0-9.-]+$/.test(host)) {
    throw new Error('DEPLOY_HOST の形式が不正です');
  }
  if (!/^[A-Za-z0-9._-]+$/.test(user)) {
    throw new Error('DEPLOY_USER の形式が不正です');
  }
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error('DEPLOY_PORT は1〜65535の整数で指定してください');
  }

  return {
    host,
    user,
    remotePath,
    port,
    sourceDir: path.resolve(cwd, env.DEPLOY_SOURCE_DIR ?? 'dist/prod'),
    excludeFile: path.resolve(cwd, env.DEPLOY_EXCLUDE_FILE ?? 'deploy/rsync-excludes.txt'),
    dryRun: String(env.DEPLOY_DRY_RUN ?? '').toLowerCase() === 'true',
  };
};

const remoteTarget = ({ user, host }) => `${user}@${host}`;

const sshBaseArgs = ({ port }) => [
  '-p',
  port,
  '-o',
  'BatchMode=yes',
  '-o',
  'StrictHostKeyChecking=yes',
];

const quoteRemotePath = (value) => `'${value}'`;

export const buildRemotePreflightCommand = ({ remotePath }) => {
  const markerPath = `${remotePath}/${DEPLOY_MARKER_FILE}`;
  const lpPath = `${remotePath}/lp`;
  return [
    `test -f ${quoteRemotePath(markerPath)}`,
    `grep -Fqx '${DEPLOY_MARKER_VALUE}' ${quoteRemotePath(markerPath)}`,
    `test -d ${quoteRemotePath(lpPath)}`,
  ].join(' && ');
};

const buildCommonRsyncArgs = (config) => {
  const sshCommand = `ssh -p ${config.port} -o BatchMode=yes -o StrictHostKeyChecking=yes`;
  const args = [
    '--archive',
    '--compress',
    '--delay-updates',
    '--human-readable',
    '--itemize-changes',
    '--exclude=.DS_Store',
    '-e',
    sshCommand,
  ];

  if (config.dryRun) {
    args.push('--dry-run');
  }

  return args;
};

// public_html直下ではファイルだけを更新し、未知のディレクトリは削除しない。
export const buildRootFileRsyncArgs = (config) => [
  ...buildCommonRsyncArgs(config),
  '--exclude=*/',
  '--exclude=.htaccess',
  `--exclude-from=${config.excludeFile}`,
  `${config.sourceDir}/`,
  `${remoteTarget(config)}:${config.remotePath}/`,
];

export const buildHtaccessRsyncArgs = (config, localPath) => [
  ...buildCommonRsyncArgs(config),
  localPath,
  `${remoteTarget(config)}:${config.remotePath}/.htaccess`,
];

// 削除同期は、このプロジェクトが所有するディレクトリの内部だけに限定する。
export const buildManagedDirectoryRsyncArgs = (config, directory) => {
  if (!MANAGED_DIRECTORIES.includes(directory)) {
    throw new Error(`管理対象外のディレクトリは削除同期できません: ${directory}`);
  }

  return [
    ...buildCommonRsyncArgs(config),
    '--delete-delay',
    `${config.sourceDir}/${directory}/`,
    `${remoteTarget(config)}:${config.remotePath}/${directory}/`,
  ];
};

export const validateSourceDirectories = (directories) => {
  const unknown = directories.filter(
    (directory) =>
      !MANAGED_DIRECTORIES.includes(directory) && !PROTECTED_SOURCE_DIRECTORIES.has(directory),
  );

  if (unknown.length > 0) {
    throw new Error(
      `生成物に未登録のディレクトリがあります。管理対象か保護対象かを明示してください: ${unknown.join(', ')}`,
    );
  }
};

export const validateExcludeRules = (content) => {
  const rules = new Set(
    String(content)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')),
  );

  if (!rules.has('/lp') || !rules.has('/lp/***') || !rules.has('/.ojl-deploy-root')) {
    throw new Error('rsync除外設定に /lp/ またはデプロイ先マーカーの保護がありません');
  }
};

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`${command} が失敗しました (${signal ? `signal: ${signal}` : `exit: ${code}`})`),
      );
    });
  });

const runCapture = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      const detail = stderr.trim();
      reject(
        new Error(
          `${command} が失敗しました (${signal ? `signal: ${signal}` : `exit: ${code}`})${detail ? `: ${detail}` : ''}`,
        ),
      );
    });
  });

const findManagedHtaccessRange = (content, sourceName) => {
  const beginIndex = content.indexOf(HTACCESS_BEGIN_MARKER);
  const endIndex = content.indexOf(HTACCESS_END_MARKER);
  const hasBegin = beginIndex >= 0;
  const hasEnd = endIndex >= 0;

  if (hasBegin !== hasEnd || (hasBegin && endIndex <= beginIndex)) {
    throw new Error(`${sourceName}のOJL管理マーカーが不正です`);
  }
  if (!hasBegin) {
    return null;
  }
  if (
    content.indexOf(HTACCESS_BEGIN_MARKER, beginIndex + HTACCESS_BEGIN_MARKER.length) >= 0 ||
    content.indexOf(HTACCESS_END_MARKER, endIndex + HTACCESS_END_MARKER.length) >= 0
  ) {
    throw new Error(`${sourceName}のOJL管理マーカーが重複しています`);
  }

  return {
    beginIndex,
    endIndex: endIndex + HTACCESS_END_MARKER.length,
  };
};

const joinHtaccessSections = (sections) => {
  const content = sections
    .map((section) => section.trim())
    .filter(Boolean)
    .join('\n\n');
  return content ? `${content}\n` : '';
};

// 初回移行時は、XServerがOFF設定やホワイトリストとして追加した環境変数を救出する。
const extractLegacyServerDirectives = (remoteHtaccess, managedBlock) => {
  const managedLines = new Set(
    managedBlock
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
  const remoteLines = remoteHtaccess.split(/\r?\n/);
  const preservedIndexes = new Set();
  const seen = new Set();

  for (const [index, line] of remoteLines.entries()) {
    const trimmed = line.trim();
    const isDeprecatedOjlException =
      /\^\/wp-json\/ojl\/v1\/htaccess-rules\/\?\$.*AllowWPLoginFromCloudJP/i.test(trimmed);
    if (
      !/^SetEnvIf(?:NoCase)?\s+/i.test(trimmed) ||
      isDeprecatedOjlException ||
      managedLines.has(trimmed) ||
      seen.has(trimmed)
    ) {
      continue;
    }
    preservedIndexes.add(index);
    seen.add(trimmed);

    for (const adjacentIndex of [index - 1, index + 1]) {
      if (/^\s*#{3,}.*(?:wpsecurity|xserver).*#{3,}\s*$/i.test(remoteLines[adjacentIndex] ?? '')) {
        preservedIndexes.add(adjacentIndex);
      }
    }
  }

  return remoteLines.filter((_, index) => preservedIndexes.has(index)).join('\n');
};

export const mergeHtaccess = (remoteHtaccess, generatedHtaccess) => {
  const generatedRange = findManagedHtaccessRange(generatedHtaccess, '生成した.htaccess');
  if (!generatedRange) {
    throw new Error('生成した.htaccessにOJL管理マーカーがありません');
  }

  const managedBlock = generatedHtaccess.slice(generatedRange.beginIndex, generatedRange.endIndex);
  const remoteRange = findManagedHtaccessRange(remoteHtaccess, '本番.htaccess');

  if (remoteRange) {
    return joinHtaccessSections([
      remoteHtaccess.slice(0, remoteRange.beginIndex),
      managedBlock,
      remoteHtaccess.slice(remoteRange.endIndex),
    ]);
  }

  return joinHtaccessSections([
    extractLegacyServerDirectives(remoteHtaccess, managedBlock),
    managedBlock,
  ]);
};

const readRemoteHtaccess = (config) => {
  const htaccessPath = `${config.remotePath}/.htaccess`;
  const command = `if [ -f ${quoteRemotePath(htaccessPath)} ]; then cat -- ${quoteRemotePath(htaccessPath)}; fi`;
  return runCapture('ssh', [...sshBaseArgs(config), remoteTarget(config), command]);
};

export async function deployProduction(env = process.env) {
  const config = readDeployConfig(env);
  await Promise.all([access(config.sourceDir), access(config.excludeFile)]);
  validateExcludeRules(await readFile(config.excludeFile, 'utf8'));

  const sourceEntries = await readdir(config.sourceDir, { withFileTypes: true });
  validateSourceDirectories(
    sourceEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  );
  await Promise.all(
    MANAGED_DIRECTORIES.map((directory) => access(path.join(config.sourceDir, directory))),
  );

  const target = remoteTarget(config);
  const preflight = buildRemotePreflightCommand(config);

  console.log('deploy: 本番デプロイ先と /lp/ 保護条件を確認します');
  await run('ssh', [...sshBaseArgs(config), target, preflight]);

  const [remoteHtaccess, generatedHtaccess] = await Promise.all([
    readRemoteHtaccess(config),
    readFile(path.join(config.sourceDir, '.htaccess'), 'utf8'),
  ]);
  const mergedHtaccess = mergeHtaccess(remoteHtaccess, generatedHtaccess);
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'ojl-deploy-'));
  const mergedHtaccessPath = path.join(temporaryDirectory, '.htaccess');
  await writeFile(mergedHtaccessPath, mergedHtaccess, 'utf8');

  try {
    console.log(
      config.dryRun
        ? 'deploy: 管理対象ディレクトリだけでdry-runを実行します'
        : 'deploy: 管理対象ディレクトリだけを本番同期します',
    );
    for (const directory of MANAGED_DIRECTORIES) {
      console.log(`deploy: ${directory}/ を同期します`);
      await run('rsync', buildManagedDirectoryRsyncArgs(config, directory));
    }

    console.log('deploy: ルート直下のファイルを更新します（未管理ディレクトリは保持します）');
    await run('rsync', buildRootFileRsyncArgs(config));

    console.log('deploy: XServer設定を保持して.htaccessのOJL管理部分だけを更新します');
    await run('rsync', buildHtaccessRsyncArgs(config, mergedHtaccessPath));

    console.log('deploy: 同期後のデプロイ先を再確認します');
    await run('ssh', [...sshBaseArgs(config), target, preflight]);
    console.log(config.dryRun ? 'deploy: dry-runが完了しました' : 'deploy: 本番同期が完了しました');
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  deployProduction().catch((error) => {
    console.error('deploy: failed', error);
    process.exitCode = 1;
  });
}
