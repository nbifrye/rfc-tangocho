# CLAUDE.md — RFC単語帳 (rfc-tangocho) AI開発ガイド

このファイルはAIアシスタント（Claude等）がこのリポジトリを理解し、自律的に開発・改善を行うためのリファレンスです。

---

## プロジェクト概要

**アプリ名:** RFC単語帳 (rfc-tangocho)
**目的:** RFC番号と仕様名を効率よく暗記するためのWebアプリ。クイズ・フラッシュカード・一覧検索の3モードを提供する。
**デプロイ先:** GitHub Pages（`main` ブランチのルートを直接公開）
**技術スタック:** HTML5 + CSS3 + バニラJavaScript（ES Modules）+ JSON、**ビルドツール不要**

詳細な要件は [`docs/requirements.md`](docs/requirements.md) を参照。

---

## ディレクトリ構成

```
rfc-tangocho/
├── index.html              # エントリーポイント（SPA的に画面を切り替える）
├── css/
│   └── style.css           # スタイルシート
├── js/
│   ├── app.js              # アプリケーションエントリ・画面ルーティング
│   ├── quiz.js             # クイズロジック（出題・採点・選択肢生成・進捗記録）
│   ├── flashcard.js        # フラッシュカードロジック
│   ├── search.js           # 一覧・検索・フィルタロジック
│   ├── data.js             # JSONロード・管理・エラーハンドリング
│   └── storage.js          # localStorage操作（進捗CRUD）
├── data/
│   ├── rfcs.json           # RFC一覧データ（メイン）
│   └── categories.json     # カテゴリ定義
├── docs/
│   └── requirements.md     # 要件定義書（詳細仕様）
├── README.md               # プロジェクト概要（ユーザー向け）
└── CLAUDE.md               # このファイル（AI開発ガイド）
```

---

## ローカル開発

### 起動方法

```bash
# Python 3（推奨）
python -m http.server 8080
# ブラウザで http://localhost:8080 を開く
```

> **重要:** `file://` プロトコルでは `fetch()` によるJSONロードができないため、必ずHTTPサーバー経由で確認すること。

### テスト・CI

- **自動テストフレームワーク:** 未設定（バニラJS・静的サイトのため）
- **動作確認:** ローカルHTTPサーバーでブラウザ手動確認
- **デプロイ:** `main` ブランチへのプッシュで GitHub Pages に自動反映（GitHub Actions不使用）

---

## データスキーマ

### `data/rfcs.json`

```json
[
  {
    "number": 791,
    "name": "Internet Protocol",
    "shortName": "IP",
    "category": "network-layer",
    "obsoletedBy": null,
    "obsoletes": null,
    "note": ""
  }
]
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `number` | integer | ✓ | RFC番号 |
| `name` | string | ✓ | RFC正式名称 |
| `shortName` | string | | 略称・通称（省略時は `""`） |
| `category` | string | ✓ | categories.json のカテゴリID |
| `obsoletedBy` | integer[] \| null | | このRFCを廃止した新しいRFC番号リスト |
| `obsoletes` | integer[] \| null | | このRFCが廃止した旧RFC番号リスト |
| `note` | string | | 補足説明（省略時は `""`） |

### `data/categories.json`

```json
[
  { "id": "application-layer",  "label": "アプリケーション層" },
  { "id": "transport-layer",    "label": "トランスポート層" },
  { "id": "network-layer",      "label": "ネットワーク層" },
  { "id": "security",           "label": "セキュリティ" },
  { "id": "infrastructure",     "label": "インフラ・管理" },
  { "id": "other",              "label": "その他" }
]
```

### localStorage（キー: `rfc-tangocho-progress`）

```json
{
  "rfcs": {
    "793": { "correct": 3, "incorrect": 1, "lastSeen": "2026-02-27T10:00:00Z" },
    "9110": { "correct": 0, "incorrect": 2, "lastSeen": "2026-02-26T08:30:00Z" }
  },
  "lastQuizAt": "2026-02-27T10:05:00Z"
}
```

---

## コーディング規約

### JavaScript
- **ES Modules** を使用（`type="module"`）
- `import` / `export` で各モジュールを分離
- ビルドツールなし・バンドラなし
- `async/await` を使った非同期処理（Promise チェーンより優先）
- グローバル変数は使わず、モジュールスコープで管理

### ファイル・変数命名
- JSファイル名: **camelCase**（例: `app.js`, `quiz.js`）
- CSS クラス名: **kebab-case**（例: `quiz-card`, `answer-btn`）
- カテゴリID: **kebab-case**（例: `network-layer`, `application-layer`）
- localStorage キー: `rfc-tangocho-progress`（固定）
- RFC番号キー（localStorage内）: 数値を文字列化（例: `"793"`）

### データ整合性
- `category` フィールドが `categories.json` に存在しない場合は `"other"` にフォールバック
- RFC件数が0件の場合は全モードで「データが登録されていません。」を表示

### エラーハンドリング
| エラー種別 | 対応 |
|---|---|
| ネットワークエラー（fetch失敗） | エラーメッセージ + リトライボタン表示 |
| HTTPエラー（4xx/5xx） | エラーコード付きメッセージ + リトライボタン表示 |
| JSONパースエラー | エラーメッセージ表示（リトライ不可） |
| localStorage利用不可 | 進捗機能を無効化、一度だけ通知 |

---

## 機能仕様サマリー

### クイズモード（SCR-01〜SCR-04）
- 出題形式: RFC番号→名称 / 名称→RFC番号
- 出題数: 10問 / 20問 / 全問
- カテゴリ絞り込み・廃止済RFC含める/除外オプション
- 選択肢: 正解1 + 同カテゴリから3つ（不足時は他カテゴリで補完）、常に4択
- フィードバック: 正解=緑ハイライト、不正解=赤+正解緑ハイライト、`note` があれば表示
- 結果: スコア（正解数/出題数）表示 → 再チャレンジ or トップ

### フラッシュカードモード（SCR-05）
- カード表: RFC番号（+カテゴリ名）
- カード裏: 名称・shortName・note
- 「覚えた」でデッキから除外、localStorage の `correct` をインクリメント
- 「もう一度」でデッキ末尾に戻す
- 全カード「覚えた」で完了画面

### 一覧・検索モード（SCR-06）
- RFC番号・名称でリアルタイム検索
- カテゴリフィルタ（複数選択可）
- 廃止済RFC表示/非表示切り替え
- RFC番号順 / カテゴリ順 ソート
- 各RFC に進捗（正解回数/挑戦回数）表示

---

## 開発フェーズ

| フェーズ | 内容 | 主な成果物 |
|---|---|---|
| Phase 1 | データ整備 | `data/rfcs.json`, `data/categories.json` |
| Phase 2 | 基本UI + クイズ機能 | `index.html`, `css/style.css`, `js/app.js`, `js/quiz.js`, `js/storage.js`, `js/data.js` |
| Phase 3 | フラッシュカード機能 | `js/flashcard.js` + SCR-05 |
| Phase 4 | 一覧・検索機能 | `js/search.js` + SCR-06 |
| Phase 5 | 進捗可視化 | トップ進捗サマリー・苦手問題オプション有効化 |

---

## Claudeの自律改善ループ手順

このセクションは、Claudeが**自律的に課題発見→実装→検証→コミット**のサイクルを回すためのガイドです。

### ステップ1: 現状把握

```bash
# リポジトリの状態確認
git status
git log --oneline -10

# 実装済みファイルの確認
ls -la
ls js/ css/ data/ 2>/dev/null || echo "未実装"
```

### ステップ2: 課題の特定

以下の観点で改善点を探す:

1. **未実装ファイルの検出**
   - `js/`, `css/`, `data/` ディレクトリ・各ファイルが存在するか確認
   - `index.html` の有無を確認

2. **データ品質チェック**
   - `data/rfcs.json` が存在する場合、スキーマに準拠しているか確認
   - `category` フィールドの値が `categories.json` のIDと一致しているか確認
   - `obsoletedBy` / `obsoletes` が配列またはnullになっているか確認

3. **コード品質チェック**
   - ES Module の `import`/`export` が正しく使われているか
   - エラーハンドリング（fetch失敗・localStorage不可）が実装されているか
   - アクセシビリティ（キーボード操作対応）が考慮されているか

4. **要件との照合**
   - `docs/requirements.md` の仕様と実装が一致しているか
   - 未実装のフェーズ・機能を特定する

### ステップ3: 実装

- **最小限の変更を心がける**（over-engineering不可）
- 1つのPRで1つの機能・修正に集中する
- コメントは自明でない箇所にのみ記述

### ステップ4: 動作確認

```bash
# ローカルHTTPサーバーを起動して手動確認
python -m http.server 8080 &
# http://localhost:8080 で確認後、サーバーを停止
kill %1
```

### ステップ5: コミット＆プッシュ

```bash
# 変更をステージング（具体的なファイル名を指定）
git add <ファイル名>

# コミット（変更内容を明確に記述）
git commit -m "feat: <機能名>を実装"

# プッシュ（必ず開発ブランチへ）
git push -u origin claude/add-claude-documentation-iY1H4
```

### ループの繰り返し

コミット後は**ステップ1に戻り**、次の課題を特定して改善を継続する。
優先度は以下の順序:

1. `data/rfcs.json` と `data/categories.json` の整備（Phase 1）
2. `index.html` + 基本CSS・JS骨格の実装（Phase 2前半）
3. クイズ機能の実装（Phase 2後半）
4. フラッシュカード機能の実装（Phase 3）
5. 一覧・検索機能の実装（Phase 4）
6. 進捗可視化の実装（Phase 5）

---

## Gitワークフロー

### ブランチ戦略
- **`main`**: 本番（GitHub Pages公開ブランチ）
- **`master`**: 旧デフォルトブランチ（現在は未使用）
- **`claude/*`**: Claude による開発ブランチ（このファイルは `claude/add-claude-documentation-iY1H4`）

### プッシュ時の注意
- ブランチ名は `claude/` で始まり、セッションIDで終わること
- `main` への直接プッシュは禁止（Pull Request経由）

### コミットメッセージ規約
```
<type>: <日本語または英語で概要>

type の種類:
  feat     - 新機能追加
  fix      - バグ修正
  data     - データファイルの追加・修正
  docs     - ドキュメント更新
  style    - コードスタイル（機能変更なし）
  refactor - リファクタリング
```

---

## 非機能要件チェックリスト

実装時に以下を確認する:

- [ ] 初回表示3秒以内（GitHub Pages CDN経由）
- [ ] レスポンシブデザイン（PC・スマートフォン・タブレット）
- [ ] キーボード操作対応（クイズ: 数字キーで選択、Enter/Spaceで次へ）
- [ ] 適切なコントラスト比（WCAG AA準拠目標）
- [ ] モダンブラウザ対応（Chrome・Firefox・Safari・Edge 最新版）
- [ ] `localStorage` 利用不可時のグレースフルデグラデーション

---

*最終更新: 2026-02-27*
