# Claude Code Instructions (Project Rules)

あなたはこのリポジトリの開発アシスタントです。
目的は「変更内容が後から誰でも追える」状態を維持することです。

---

## 0. 最重要方針（必ず守る）

- 変更のたびに「何をしたか」「なぜしたか」「影響範囲」を記録する
- バージョン情報は README だけでなく **コード内にも必ず記載** する
- 履歴（CHANGELOG）を必ず更新する
- 仕様（SPEC）/ 意思決定（ADR）も必要に応じて追加・更新する

---

## 1. バージョニング規約

- バージョン形式：`MAJOR.MINOR.PATCH`
  - MAJOR: 互換性を壊す変更
  - MINOR: 機能追加（互換性あり）
  - PATCH: バグ修正 / 軽微な改善
- 変更を入れる際は、今回の変更がどれに当たるか理由も添えて提案し、更新する

---

## 2. 変更時に必ず更新するファイル

| ファイル | 更新タイミング |
|---|---|
| `CHANGELOG.md`（ルート or docs/） | **毎回必ず** |
| コード内バージョン定数 | **毎回必ず**（後述のセクション参照） |
| `README.md` | 概要・セットアップ・使い方が変わるとき |
| `docs/SPEC.md` | 仕様が変わる / 仕様を明文化したいとき |
| `docs/ADR.md` | 判断理由を残すべきとき |

---

## 3. コード内バージョン情報の書き方

プロジェクトの技術スタックに応じて、以下のいずれかで管理する。

### GAS プロジェクト（clasp 使用）の場合

メインの .gs/.js ファイルの先頭、または専用の Version.gs に以下を定義する：

```javascript
const APP_VERSION = "1.0.0";
const APP_BUILD_DATE = "YYYY-MM-DD";
const APP_CHANGE_SUMMARY = "変更の要約";
```

主要エントリポイント（`doGet()` / `onOpen()` / トリガー関数）の先頭で `logAppVersion()` を呼ぶ。

### Firebase / PWA プロジェクトの場合

`package.json` の `version` フィールドで管理する。
アプリ内に表示用のバージョン定数も持つこと。

### スタンドアロン HTML の場合

HTMLファイルの先頭コメントにバージョン・更新日を記載する。

---

## 4. GAS 開発で守るべき制約

GAS には以下のプラットフォーム制限がある。コード変更時は常にこれを意識すること。

| 制約 | 上限 |
|---|---|
| スクリプト実行時間 | **6分**（超えるなら分割処理を設計） |
| UrlFetch 呼び出し | **20,000回/日** |
| CacheService | **100KB/キー**、合計 **25MB** |
| メール送信 | **100通/日** |
| SpreadsheetApp 呼び出し | 極力まとめる（getRange→getValues を1回で取得） |

**パフォーマンス原則：**
- SpreadsheetApp の呼び出しは最小限にする（ループ内で getRange しない）
- 大量データは getValues() で一括取得 → 配列操作 → setValues() で一括書き込み
- 外部API呼び出しには CacheService でキャッシュを検討する
- Gemini API を使う場合は RPD（リクエスト/日）制限にも注意

---

## 5. ファイル構成パターン

### GAS Web App（標準パターン）

```
/
├── Code.gs（or Code.js）    ← メインロジック + doGet/doPost
├── [機能名].gs              ← 機能ごとに分割（例: GeminiService.gs, SheetService.gs）
├── index.html               ← メインUI
├── css.html                 ← スタイルシート（<style>タグごと記載）
├── js.html                  ← クライアント側JS（<script>タグごと記載）
├── appsscript.json          ← GAS マニフェスト
├── .clasp.json              ← clasp 設定
├── CLAUDE.md                ← このファイル
├── README.md
├── CHANGELOG.md
└── docs/
    ├── SPEC.md
    └── ADR.md
```

### HTML テンプレートの include パターン

GAS の Web App では、CSS と JS を別ファイル（css.html, js.html）に分離し、
index.html 内で `<?!= include('css') ?>` `<?!= include('js') ?>` で読み込む。
この構成を崩さないこと。

---

## 6. 外部 API 連携時のルール

外部APIを使うプロジェクトでは、以下を守る：

- APIキーは **スクリプトプロパティ**（PropertiesService）に格納する。コードに直書きしない
- API 呼び出しは専用の Service ファイルに集約する（例: `GeminiService.gs`, `TaskService.gs`）
- API のレスポンスは `{ success: boolean, data?: any, error?: string }` 形式で統一する
- エラー時は try-catch で捕捉し、ユーザーに分かるメッセージを返す

---

## 7. CHANGELOG の書き方

```
## [Unreleased]
### Added（新機能）
### Changed（変更）
### Fixed（バグ修正）
### Removed（削除）
```

- まず Unreleased に書く
- リリース時に `[x.y.z] - YYYY-MM-DD` を切って、Unreleased を空に戻す

---

## 8. 出力フォーマット（回答ルール）

作業依頼を受けたら、必ず次の順で出力する：

1. **変更方針**（バージョン更新案を含む）
2. **変更するファイル一覧**
3. **実装**（変更コード全文 or 差分）
4. **ドキュメント更新案**（CHANGELOG / SPEC / ADR / README）
5. **動作確認チェックリスト**

---

## 9. 禁止事項

- 変更履歴が残らないままコードだけを修正しない
- バージョン更新を README だけに閉じない
- 「対応しました」だけの曖昧な記録で終わらせない
- API キーやパスワードをコードに直接書かない
- SpreadsheetApp をループ内で何度も呼ばない

---

## 10. 技術スタック（参考情報）

主に以下の技術を使う。プロジェクトによって組み合わせが異なる。

- **Google Apps Script**（clasp でローカル開発、V8 ランタイム）
- **Google Workspace 連携**（スプレッドシート / Gmail / カレンダー / ドライブ / タスク）
- **外部 API**（Gemini API / LINE WORKS API など）
- **Firebase**（Firestore / Authentication / Hosting）— 一部プロジェクト
- **フロントエンド**（HTML5 / CSS3 / Vanilla JavaScript / SVG チャート）
- **Git + GitHub** でバージョン管理
