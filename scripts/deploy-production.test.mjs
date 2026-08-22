import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HTACCESS_BEGIN_MARKER,
  HTACCESS_END_MARKER,
  MANAGED_DIRECTORIES,
  buildHtaccessRsyncArgs,
  buildManagedDirectoryRsyncArgs,
  buildRemotePreflightCommand,
  buildRootFileRsyncArgs,
  mergeHtaccess,
  readDeployConfig,
  validateExcludeRules,
  validateSourceDirectories,
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

  it('ルート直下は削除せず、ファイルだけを同期する', () => {
    const config = readDeployConfig({ ...validEnv, DEPLOY_DRY_RUN: 'true' }, '/workspace');
    const args = buildRootFileRsyncArgs(config);

    assert(!args.includes('--delete-delay'));
    assert(args.includes('--dry-run'));
    assert(args.includes('--exclude=*/'));
    assert(args.includes('--exclude=.htaccess'));
    assert(args.includes('--exclude-from=/workspace/deploy/rsync-excludes.txt'));
    assert.equal(args.at(-1), 'deploy-user@example.com:/home/deploy/public_html/');
  });

  it('.htaccessだけを独立して同期する', () => {
    const config = readDeployConfig({ ...validEnv, DEPLOY_DRY_RUN: 'true' }, '/workspace');
    const args = buildHtaccessRsyncArgs(config, '/tmp/ojl-deploy/.htaccess');

    assert(args.includes('--dry-run'));
    assert.equal(args.at(-2), '/tmp/ojl-deploy/.htaccess');
    assert.equal(args.at(-1), 'deploy-user@example.com:/home/deploy/public_html/.htaccess');
  });

  it('削除同期を管理対象ディレクトリの内部だけに限定する', () => {
    const config = readDeployConfig({ ...validEnv, DEPLOY_DRY_RUN: 'true' }, '/workspace');
    const args = buildManagedDirectoryRsyncArgs(config, 'post-pages');

    assert(args.includes('--delete-delay'));
    assert(args.includes('--dry-run'));
    assert.equal(args.at(-2), '/workspace/dist/prod/post-pages/');
    assert.equal(args.at(-1), 'deploy-user@example.com:/home/deploy/public_html/post-pages/');
    assert.throws(
      () => buildManagedDirectoryRsyncArgs(config, 'subdomain.example.jp'),
      /管理対象外のディレクトリ/,
    );
  });

  it('別管理ディレクトリを管理対象に含めず、未知の生成先は停止する', () => {
    assert(!MANAGED_DIRECTORIES.includes('lp'));
    assert.doesNotThrow(() => validateSourceDirectories([...MANAGED_DIRECTORIES, 'lp']));
    assert.throws(
      () => validateSourceDirectories([...MANAGED_DIRECTORIES, 'subdomain.example.jp']),
      /未登録のディレクトリ/,
    );
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

describe('.htaccessの安全な統合', () => {
  const generated = `${HTACCESS_BEGIN_MARKER}
SetEnvIf Request_URI "^/wp-json/ojl/v1/htaccess-rules/?$" AllowRestApi
RewriteRule ^new$ index.html [L]
${HTACCESS_END_MARKER}
`;

  it('OJL管理部分だけを差し替え、XServer設定を前後とも保持する', () => {
    const remote = `SetEnvIf Request_URI ".*" WpLoginNoLimit

${HTACCESS_BEGIN_MARKER}
RewriteRule ^old$ index.html [L]
${HTACCESS_END_MARKER}

SetEnvIf Request_URI ".*" AllowRestApi
`;
    const merged = mergeHtaccess(remote, generated);

    assert(merged.includes('SetEnvIf Request_URI ".*" WpLoginNoLimit'));
    assert(merged.includes('SetEnvIf Request_URI ".*" AllowRestApi'));
    assert(
      merged.includes('SetEnvIf Request_URI "^/wp-json/ojl/v1/htaccess-rules/?$" AllowRestApi'),
    );
    assert(merged.includes('RewriteRule ^new$ index.html [L]'));
    assert(!merged.includes('RewriteRule ^old$ index.html [L]'));
  });

  it('初回移行時は旧ファイルからXServerの環境変数だけを救出する', () => {
    const remote = `#####wpsecurity_login#####
SetEnvIf Request_URI ".*" WpLoginNoLimit
#####end:wpsecurity_login#####
SetEnvIf Request_URI ".*" AllowXmlrpc
SetEnvIf Request_URI ".*" AllowRestApi
SetEnvIf Request_URI "^/wp-json/ojl/v1/htaccess-rules/?$" AllowWPLoginFromCloudJP
RewriteRule ^old$ index.html [L]
`;
    const merged = mergeHtaccess(remote, generated);

    assert(merged.includes('SetEnvIf Request_URI ".*" WpLoginNoLimit'));
    assert(merged.includes('#####wpsecurity_login#####'));
    assert(merged.includes('#####end:wpsecurity_login#####'));
    assert(merged.includes('SetEnvIf Request_URI ".*" AllowXmlrpc'));
    assert(merged.includes('SetEnvIf Request_URI ".*" AllowRestApi'));
    assert(!merged.includes('RewriteRule ^old$ index.html [L]'));
    assert(!merged.includes('AllowWPLoginFromCloudJP'));
    assert.equal((merged.match(/AllowRestApi/g) ?? []).length, 2);
  });

  it('壊れた管理マーカーでは本番ファイルを生成しない', () => {
    assert.throws(
      () =>
        mergeHtaccess(`${HTACCESS_BEGIN_MARKER}\nRewriteRule ^old$ index.html [L]\n`, generated),
      /本番\.htaccessのOJL管理マーカーが不正/,
    );
    assert.throws(
      () => mergeHtaccess('', 'RewriteRule ^new$ index.html [L]\n'),
      /生成した\.htaccessにOJL管理マーカーがありません/,
    );
  });
});
