# Phase 2 適用シーケンス（実行順）

1. `phase2_batch_01_b1_events_legacy_all.conf`（24件）
2. `phase2_batch_02_b2_safe_legacy_prefix_all.conf`（32件）
3. `phase2_batch_03_b3_single_ascii_part1_top300.conf`（300件）
4. `phase2_batch_04_b4_single_nonascii_all.conf`（75件）
5. `phase2_batch_05_b5_multi_ascii_all.conf`（64件）
6. `phase2_batch_06_b5_weird_chars_all.conf`（2件）
7. `phase2_batch_03_b3_single_ascii_part2_rest.conf`（656件）

## 各バッチ反映後の確認

```bash
# 代表5件だけ確認（対象バッチ先頭から）
head -n 20 /path/to/batch.conf | rg '^# /' | head -n 5 | sed 's/^# //' | awk '{print $1}' | while read -r p; do
  curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" -I "https://oyakonojikanlabo.jp${p}"
done
```

期待値:
- 旧URL: `410`
- 有効URL: `200`（この確認対象には含めない）

## ロールバック

- 問題が出たバッチのみ `.htaccess` から削除し、他バッチは維持。
