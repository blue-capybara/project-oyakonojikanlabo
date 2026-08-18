import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEPLOY_MARKER_FILE = '.ojl-deploy-root';
const DEPLOY_MARKER_VALUE = 'oyakonojikanlabo.jp';

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

export const buildRsyncArgs = (config) => {
  const sshCommand = `ssh -p ${config.port} -o BatchMode=yes -o StrictHostKeyChecking=yes`;
  const args = [
    '--archive',
    '--compress',
    '--delete-delay',
    '--delay-updates',
    '--human-readable',
    '--itemize-changes',
    `--exclude-from=${config.excludeFile}`,
    '-e',
    sshCommand,
  ];

  if (config.dryRun) {
    args.push('--dry-run');
  }

  args.push(`${config.sourceDir}/`, `${remoteTarget(config)}:${config.remotePath}/`);
  return args;
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

  const target = remoteTarget(config);
  const preflight = buildRemotePreflightCommand(config);

  console.log('deploy: 本番デプロイ先と /lp/ 保護条件を確認します');
  await run('ssh', [...sshBaseArgs(config), target, preflight]);

  console.log(config.dryRun ? 'deploy: dry-runを実行します' : 'deploy: 本番同期を実行します');
  await run('rsync', buildRsyncArgs(config));

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
