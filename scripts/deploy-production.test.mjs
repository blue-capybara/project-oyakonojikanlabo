import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildRemotePreflightCommand,
  buildRsyncArgs,
  readDeployConfig,
  validateExcludeRules,
} from './deploy-production.mjs';

const validEnv = {
  DEPLOY_HOST: 'example.com',
  DEPLOY_USER: 'deploy-user',
  DEPLOY_PATH: '/home/deploy/public_html/',
  DEPLOY_PORT: '2222',
};

describe('本番デプロイ設定', () => {
  it('ルート以外の安全なデプロイ先だけを許可する', () => {
    const config = readDeployConfig(validEnv, '/workspace');
    assert.equal(config.remotePath, '/home/deploy/public_html');
    assert.equal(config.port, '2222');
    assert.equal(config.dryRun, false);

    assert.throws(
      () => readDeployConfig({ ...validEnv, DEPLOY_PATH: '/' }),
      /ルート以外の安全な絶対パス/,
    );
    assert.throws(
      () => readDeployConfig({ ...validEnv, DEPLOY_PATH: '/home/../etc' }),
      /ルート以外の安全な絶対パス/,
    );
  });

  it('削除同期と除外ファイルを必ず使用する', () => {
    const config = readDeployConfig({ ...validEnv, DEPLOY_DRY_RUN: 'true' }, '/workspace');
    const args = buildRsyncArgs(config);

    assert(args.includes('--delete-delay'));
    assert(args.includes('--dry-run'));
    assert(args.includes('--exclude-from=/workspace/deploy/rsync-excludes.txt'));
    assert.equal(args.at(-1), 'deploy-user@example.com:/home/deploy/public_html/');
  });

  it('本番ルートのマーカーと別管理LPを同期前後に確認する', () => {
    const config = readDeployConfig(validEnv, '/workspace');
    const command = buildRemotePreflightCommand(config);

    assert(command.includes(".ojl-deploy-root'"));
    assert(command.includes("grep -Fqx 'oyakonojikanlabo.jp'"));
    assert(command.includes("test -d '/home/deploy/public_html/lp'"));
  });

  it('除外設定からLP保護を削除できない', () => {
    assert.doesNotThrow(() => validateExcludeRules('/lp\n/lp/***\n/.ojl-deploy-root\n'));
    assert.throws(() => validateExcludeRules('/.ojl-deploy-root\n'), /rsync除外設定に \/lp\//);
  });
});
