# Phase 2 投入順リスト

## 対象データ
- soft404.csv
- crawled_not_indexed.csv
- 404.csv
- ※ 重複（ユーザー指定canonical）は Phase2個別410対象から除外

## 運用ルール（共通）
- 1バッチ投入ごとに 30〜50URL を `curl -I` で確認。
- `500` が1件でも出たら即ロールバック。
- `200` の有効URLが混ざったらそのバッチを止める。

## 推奨順
1. `b1_events_legacy`: 24件
   - all: 24件 -> /Users/ns/projects/app/project-oyakonojikanlabo/tmp_oyako/phase2_batch_01_b1_events_legacy_all.conf
2. `b2_safe_legacy_prefix`: 32件
   - all: 32件 -> /Users/ns/projects/app/project-oyakonojikanlabo/tmp_oyako/phase2_batch_02_b2_safe_legacy_prefix_all.conf
3. `b3_single_ascii`: 956件
   - part1_top300: 300件 -> /Users/ns/projects/app/project-oyakonojikanlabo/tmp_oyako/phase2_batch_03_b3_single_ascii_part1_top300.conf
   - part2_rest: 656件 -> /Users/ns/projects/app/project-oyakonojikanlabo/tmp_oyako/phase2_batch_03_b3_single_ascii_part2_rest.conf
4. `b4_single_nonascii`: 75件
   - all: 75件 -> /Users/ns/projects/app/project-oyakonojikanlabo/tmp_oyako/phase2_batch_04_b4_single_nonascii_all.conf
5. `b5_multi_ascii`: 64件
   - all: 64件 -> /Users/ns/projects/app/project-oyakonojikanlabo/tmp_oyako/phase2_batch_05_b5_multi_ascii_all.conf
6. `b5_weird_chars`: 2件
   - all: 2件 -> /Users/ns/projects/app/project-oyakonojikanlabo/tmp_oyako/phase2_batch_06_b5_weird_chars_all.conf

## 優先バッチの理由
- `b1_events_legacy`: 旧構造で誤爆しにくく効果が高い。
- `b2_safe_legacy_prefix`: ディレクトリ型旧URLで現行ルートとの衝突が少ない。
- `b3_single_ascii`: 母数が大きいので `top300` 先行。
- `b4/b5/b6`: 日本語・多階層・特殊文字を含むので最後。
