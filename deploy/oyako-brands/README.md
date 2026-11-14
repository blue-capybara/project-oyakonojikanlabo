# 独立HTMLの反映準備物

本番へ配置する対象は`index.html`だけです。本番変更・デプロイはまだ行っていません。

既存の単数形`oyako-brand/index.html`は保持し、複数形`oyako-brands/index.html`を新設します。現在の`.htaccess`のままで表示できます。

手順、検証結果、ロールバック、任意の保護設定については[調査報告書](../../docs/OYAKO_BRANDS_STATIC_DIRECTORY.md)を参照してください。

`manifest.json`、`source-base.json`、各パッチは確認用です。本番の公開ディレクトリへアップロードしないでください。
