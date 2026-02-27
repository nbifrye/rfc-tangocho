# CLAUDE.md — RFC単語帳 AI開発ガイド

AIアシスタント（Claude等）が**「どう作業するか」**を定めたファイル。
**「何を作るか」**の仕様は [docs/requirements.md](docs/requirements.md)、**プロジェクト概要**は [README.md](README.md) を参照。

---

## ドキュメント構成と責務

| ファイル | 対象読者 | 責務 |
|---|---|---|
| `README.md` | 初訪問者・ユーザー | アプリの概要・起動方法・ドキュメントへの入口 |
| `CLAUDE.md`（本ファイル） | AIアシスタント | 作業手順・コーディング規約・自律改善ループ |
| `docs/requirements.md` | 設計者・開発者・AI | 機能仕様・データスキーマ・画面設計の単一の源泉（SSOT） |

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
│   ├── rfcs.json           # RFC一覧データ（スキーマ: requirements.md §3.3）
│   └── categories.json     # カテゴリ定義（スキーマ: requirements.md §3.4）
├── docs/
│   └── requirements.md     # 仕様の単一の源泉（SSOT）
├── README.md               # プロジェクト概要（ユーザー向け）
└── CLAUDE.md               # このファイル（AI向け）
```

---

## 開発環境

- **起動:** `python -m http.server 8080` → `http://localhost:8080`（README.md 参照）
- **テスト:** 自動テストなし。ローカルHTTPサーバーでブラウザ手動確認
- **デプロイ:** `main` ブランチへのプッシュで GitHub Pages に自動反映（GitHub Actions不使用）

> 機能仕様・データスキーマ・開発フェーズは [docs/requirements.md](docs/requirements.md) §2〜§8 を参照。

---

## コーディング規約

### JavaScript
- **ES Modules** を使用（`type="module"`）。`import` / `export` で各モジュールを分離
- ビルドツール・バンドラなし
- `async/await` を使った非同期処理（Promise チェーンより優先）
- グローバル変数は使わず、モジュールスコープで管理

### 命名規則
- JSファイル名: **camelCase**（例: `app.js`, `quiz.js`）
- CSS クラス名: **kebab-case**（例: `quiz-card`, `answer-btn`）
- カテゴリID: **kebab-case**（例: `network-layer`, `application-layer`）
- localStorage キー: `rfc-tangocho-progress`（固定）
- localStorage 内の RFC番号キー: 数値を文字列化（例: `"793"`）

### エラーハンドリング実装パターン

| エラー種別 | 実装すべき対応 |
|---|---|
| ネットワークエラー（fetch失敗） | エラーメッセージ + リトライボタン表示 |
| HTTPエラー（4xx/5xx） | エラーコード付きメッセージ + リトライボタン表示 |
| JSONパースエラー | エラーメッセージ表示（リトライ不可） |
| localStorage利用不可 | 進捗機能を無効化、一度だけ通知 |
| `category` が未知のID | `"other"` にフォールバック（コンソール警告） |

### 実装時の非機能要件チェックリスト

- [ ] 初回表示3秒以内（GitHub Pages CDN経由）
- [ ] レスポンシブデザイン（PC・スマートフォン・タブレット）
- [ ] キーボード操作対応（クイズ: 数字キーで選択、Enter/Spaceで次へ）
- [ ] モダンブラウザ対応（Chrome・Firefox・Safari・Edge 最新版）
- [ ] `localStorage` 利用不可時のグレースフルデグラデーション

---

## Claudeの自律改善ループ

課題発見 → 実装 → 確認 → コミット のサイクルを繰り返す。

### ステップ1: 現状把握

```bash
git status && git log --oneline -10
ls index.html css/ js/ data/ 2>/dev/null || echo "未実装"
```

### ステップ2: 課題の特定

以下の優先順位で確認する:

1. **未実装ファイルの検出** — `js/`, `css/`, `data/` の各ファイルが存在するか
2. **データ品質チェック** — `data/rfcs.json` のスキーマ準拠（requirements.md §3.3 基準）
3. **コード品質チェック** — ES Modules・エラーハンドリング・アクセシビリティ
4. **要件との照合** — `docs/requirements.md` の仕様と実装の差分を特定

### ステップ3: 実装

- 最小限の変更を心がける（over-engineering不可）
- コメントは自明でない箇所にのみ記述

### ステップ4: 動作確認

```bash
python -m http.server 8080 &
# http://localhost:8080 で手動確認後
kill %1
```

### ステップ5: コミット＆プッシュ

```bash
git add <ファイル名>   # 具体的なファイル名を指定（git add . は使わない）
git commit -m "<type>: <概要>"
git push -u origin <ブランチ名>
```

コミット後は**ステップ1に戻り**次の課題を特定する。実装の優先順位は requirements.md §8（開発フェーズ）を参照。

---

## Gitワークフロー

### ブランチ戦略
- **`main`**: 本番（GitHub Pages公開ブランチ）。直接プッシュ禁止、Pull Request経由
- **`claude/*`**: Claude による開発ブランチ（例: `claude/add-claude-documentation-iY1H4`）

### コミットメッセージ規約

```
<type>: <概要（日本語可）>

type:
  feat     - 新機能追加
  fix      - バグ修正
  data     - データファイルの追加・修正
  docs     - ドキュメント更新
  style    - コードスタイル（機能変更なし）
  refactor - リファクタリング
```

---

*最終更新: 2026-02-27*
