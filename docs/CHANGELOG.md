# Changelog

## [Unreleased]
### Added
### Changed
### Fixed
### Removed

## [flashcard-app 1.1.0] - 2026-10-22
### Added
- `flashcard-app.html` v1.1.0（シス単版・旧版2027語）: 単語の発音ボタンを追加（Web Speech API `speechSynthesis` / en-US・rate 0.9）。表面（英→日モード）に「発音」、裏面（両モード）に「単語」ボタン。`stopPropagation` でカードはめくれない。非対応端末ではボタン非表示。LEAP版 v0.3.0 と同方式。
- 版数定数 `APP_VERSION` / `APP_BUILD_DATE` / `APP_CHANGE_SUMMARY` とファイル冒頭コメントを新設（従来は版数表記なし。旧版は v1系扱いのため 1.1.0）。
### Changed
- localStorage のキー（`flashcard_progress_v2`）・保存形式は変更なし（既存の学習記録はそのまま）。

## [0.3.0] - 2026-10-22
### Added
- `flashcard-leap.html` v0.3.0（LEAP版）: 単語の発音ボタンを追加（Web Speech API `speechSynthesis` / en-US・rate 0.9）。表面（英→日モード）に「発音」、裏面（両モード）に「単語」ボタン。`stopPropagation` でカードはめくれない。非対応端末ではボタン非表示。中学版 v1.0.0 と同方式。
### Changed
- localStorage のキー・保存形式は変更なし（既存の学習記録はそのまま）。

## [1.0.0] - 2026-10-22
### Added
- `flashcard-chugaku.html` v1.0.0 を新規追加（中学英単語 1,812語のフラッシュカードPWA）。`flashcard-leap.html` v0.2.3 をコピーして作成し、LEAP 版自体は無変更。
  - 範囲選択: レベル1（中1前半・360語）／レベル2（中1・362語）／レベル3（中2・365語）／レベル4（中3・378語）／レベル5（発展・347語）／全部（1,812語）。
  - カード裏面に例文（英）と例文の和訳を表示。英文中の見出し語は太字・アクセント色で強調（語尾 e/y を除いた語幹の先頭一致）。日→英モードの裏面にも例文を表示。Y モードは全意味を開示した時点で例文も表示。
  - 発音ボタン（Web Speech API `speechSynthesis` / en-US）で単語・例文を読み上げ。`stopPropagation` でカードはめくれない。`speechSynthesis` 非対応端末ではボタンを非表示。
  - 長い単語（10文字以上）は表面で文字サイズを縮小し、幅375px でも折り返さない。裏面が長い場合はカード内でスクロール。
  - 設定画面の下に版数を表示。
- `scripts/build-chugaku-data.js` を追加。`.pipeline/artifacts/eitango/level{1..5}_part*.tsv` から `data/chugaku-words.json` を生成し、`flashcard-chugaku.html` へインライン埋め込み。件数（1,812／360・362・365・378・347）を検証し、不一致なら異常終了。
- `data/chugaku-words.json` を追加（形式: `{no, word, level, meanings:[{pos, defs}], example, exampleJa}`）。
### Changed
- localStorage キーを LEAP 版と分離（`chugaku-tango-progress_v1` / `chugaku-tango-quiz-mode`）。
- 日→英モードの Y スタイルで、めくった時点で自己評価ボタンが表示されるようにした（LEAP 版では段階開示ヒントが無く評価ボタンが出なかった）。

## [0.2.3] - 2026-05-14
### Changed
- `flashcard-leap.html`: 携帯利用を前提に**フォントサイズを全体的に拡大**。カード表面の英単語を 2.8rem/700 → 3.6rem/800、カード裏面の意味本文を 1〜1.15rem → 1.3rem、品詞バッジ・意味番号・ヒント・タッププロンプトを携帯バランスに合わせて微増。
- 携帯利用時のサイドスクロールバーを**全要素で非表示**（Chrome/Safari の `::-webkit-scrollbar { display: none }`、Firefox の `scrollbar-width: none`、Edge legacy の `-ms-overflow-style: none` を組み合わせ）。スクロール機能自体は維持（ドラッグ操作可能）。

## [0.2.2] - 2026-05-14
### Fixed
- `flashcard-leap.html`: クイズ画面右上の「終了」ボタンをタップしても無反応で、セットアップ画面（ホーム）に戻れないバグを修正。v0.2.0 のデザイン刷新時に click イベントハンドラのバインドが欠落していた箇所を補修し、復帰関数 `exitToSetup()` を整備。
### Added
- 終了時の挙動：セッション統計をクリア、フリップ状態をリセット、Yモードの段階開示インデックスをリセット、学習進捗を localStorage に保存してからホームへ復帰。
- Escape キーでもセッション中断→ホームに戻れるショートカット追加。

## [0.2.1] - 2026-05-14
### Fixed
- `flashcard-leap.html`: v0.2.0 で発生していたカードフリップ3D CSS実装のバグを修正。原因は `perspective` / `transform-style: preserve-3d` / `backface-visibility: hidden` の設定不備および表面要素への `rotateY(180deg)` 誤適用。症状は (1) カード表面で英単語が左右反転（鏡像）表示、(2) 裏面要素（自己評価ボタン・「Yモードで見直す」ボタン）がタップ前の表面段階で混在表示、(3) 「タップで答えを表示」プロンプトと裏面コンテンツの重複表示。標準的な flip card 実装（親要素に perspective、子要素に preserve-3d、表裏それぞれに backface-visibility）に書き直して解消。
- 既存 `flashcard-app.html`（旧版）の動作する3Dフリップ実装を参考に修正したため、デザイン（ダーク+ガラスモーフィズム）と3モード機能（X一括/Y段階/シンプル）は維持。

## [0.2.0] - 2026-05-14
### Added
- 出題モード3択（X: 一括想起 / Y: 段階開示 / シンプル）をセットアップ画面に追加。選択は localStorage キー `leap-revised-quiz-mode` に保存。
- Xモード：表面に「意味数」ヒント表示、裏面で自己評価。
- Yモード：タップごとに意味が1つずつ開示される段階表示。
- 動的自己評価ボタン：単語の総意味数に応じてボタン構成が変わる（1意味=3段階、2意味=3段階、3意味=4段階、4意味以上=4段階）。新ラベル「あやふや」は内部評価では「なんとなく」相当として保存（既存統計と互換）。
- Xモード裏面に「Yモードで見直す」ボタン（カードごとのモード切替を可能に）。
### Changed
- デザインを全面刷新。ダークモード（深紺〜黒グラデ）+ ガラスモーフィズム（半透明カード+backdrop-filter blur）+ パープル/インディゴ系アクセント。発光ベースの影で夜間学習にも対応。
- 英単語表示のサイズとウェイトを強化（2.5〜3rem、weight 700）。

## [0.1.1] - 2026-05-14
### Fixed
- `flashcard-leap.html`: 外部JSON fetch を `<script id="leap-data" type="application/json">` によるインライン埋め込みに変更。file:// プロトコル（ダブルクリック起動）でCORS制限により動作しなかった問題を解消。`data/leap-words.json` 本体は再生成用に残置。

## [0.1.0] - 2026-05-14
### Added
- `flashcard-leap.html`: 「改訂版 必携 英単語 LEAP」（竹岡広信著、数研出版、全2300語）対応のフラッシュカードPWA。既存 `flashcard-app.html`（旧版2027語）の並行版として新規作成。
- `data/leap-words.json`: 2300語データ（単語・意味・品詞・通し番号）。データソースは ukaru-eigo.com/leap-modified-list/（個人利用許諾）。
- `scripts/build-leap-data.js`: ukaru-eigo.com からdefuddleで取得したmarkdownをパースしてJSON化する1回限りのNodeスクリプト。
- 章分割は機械的4分割（1-575 / 576-1150 / 1151-1725 / 1726-2300）。本体LEAPの章境界情報は将来取得できれば差し替え予定。
- localStorage キーは `leap-revised-*` プレフィックスで既存と分離。
