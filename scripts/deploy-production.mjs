import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEPLOY_MARKER_FILE = '.ojl-deploy-root';
const DEPLOY_MARKER_VALUE = 'oyakonojikanlabo.jp';
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
  `--exclude-from=${config.excludeFile}`,
  `${config.sourceDir}/`,
  `${remoteTarget(config)}:${config.remotePath}/`,
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

  console.log('deploy: 同期後のデプロイ先を再確認します');
  await run('ssh', [...sshBaseArgs(config), target, preflight]);
  console.log(config.dryRun ? 'deploy: dry-runが完了しました' : 'deploy: 本番同期が完了しました');
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  deployProduction().catch((error) => {
    console.error('deploy: failed', error);
    process.exitCode = 1;
  });
}
