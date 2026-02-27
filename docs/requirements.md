# RFC単語帳アプリ 要件定義書

## 1. プロジェクト概要

### 1.1 アプリ名
**rfc-tangocho**（RFC単語帳）

### 1.2 目的
RFCの番号とその名称を効率よく暗記するためのWebアプリ。
クイズ形式で繰り返し学習することで、RFC番号と仕様名の対応関係を定着させる。

### 1.3 ターゲットユーザー
- ネットワークエンジニア・プロトコル学習者
- RFC仕様を参照する機会が多い開発者
- 技術試験・資格の学習者

### 1.4 デプロイ先
**GitHub Pages**（静的サイト）

---

## 2. 機能要件

### 2.1 クイズモード（必須・メイン機能）

#### 出題形式
- **RFC番号 → 名称を答える**: RFC番号を提示し、その仕様名を4択から選ぶ
- **名称 → RFC番号を答える**: 仕様名を提示し、RFC番号を4択から選ぶ

#### クイズフロー
1. 出題形式を選択（番号→名称 / 名称→番号）
2. 出題数を選択（10問 / 20問 / 全問）
3. カテゴリを選択（全カテゴリ / 特定カテゴリ）
4. クイズ開始 → 1問ずつ出題
5. 回答後に正解・不正解をフィードバック
6. 全問終了後にスコアを表示（正解数 / 出題数、正解率）
7. 結果画面から再チャレンジ or トップに戻る

#### 選択肢の生成
- 正解1つ＋同カテゴリから類似番号3つをランダムで選ぶ
- 選択肢はシャッフルして表示

### 2.2 フラッシュカードモード（任意・補助機能）

- カードの表面にRFC番号を表示
- クリック/タップで裏返し、名称と説明を表示
- 「覚えた」「もう一度」でカードを振り分け
- 全カードを見終わったら終了・リセット可能

### 2.3 一覧・検索モード（任意）

- RFC番号と名称の一覧表示
- キーワード検索（RFC番号 or 名称の部分一致）
- カテゴリフィルタ

---

## 3. データ要件

### 3.1 データ管理方針

- **JSONファイルをリポジトリに含めて管理**
- データの追加・修正はPull Requestで行う
- アプリ実行時にJSONをfetchして利用（ビルド不要）

### 3.2 データファイル構成

```
data/
├── rfcs.json        # RFC一覧データ（メイン）
└── categories.json  # カテゴリ定義
```

### 3.3 rfcs.json スキーマ

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
  },
  {
    "number": 9110,
    "name": "HTTP Semantics",
    "shortName": "HTTP",
    "category": "application",
    "obsoletedBy": null,
    "obsoletes": [2616, 7230, 7231, 7232, 7233, 7235],
    "note": "HTTP/1.1の現行仕様"
  }
]
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `number` | integer | ✓ | RFC番号 |
| `name` | string | ✓ | RFC正式名称 |
| `shortName` | string | | 略称・通称 |
| `category` | string | ✓ | カテゴリID（categories.jsonを参照）|
| `obsoletedBy` | integer or null | | このRFCを廃止した新しいRFC番号 |
| `obsoletes` | integer[] or null | | このRFCが廃止した旧RFC番号リスト |
| `note` | string | | 補足説明 |

### 3.4 categories.json スキーマ

```json
[
  { "id": "application",    "label": "アプリケーション層" },
  { "id": "transport",      "label": "トランスポート層" },
  { "id": "network-layer",  "label": "ネットワーク層" },
  { "id": "security",       "label": "セキュリティ" },
  { "id": "infrastructure", "label": "インフラ・管理" },
  { "id": "other",          "label": "その他" }
]
```

### 3.5 初期収録RFC（案）

代表的なRFCを優先的に収録する。以下はカテゴリ別の例：

**アプリケーション層**
- RFC 9110: HTTP Semantics
- RFC 9112: HTTP/1.1
- RFC 9113: HTTP/2
- RFC 9114: HTTP/3
- RFC 1034 / 1035: DNS
- RFC 5321: SMTP
- RFC 7540: HTTP/2（旧、廃止済）

**トランスポート層**
- RFC 793: TCP
- RFC 768: UDP
- RFC 9000: QUIC

**ネットワーク層**
- RFC 791: IP (IPv4)
- RFC 8200: IPv6
- RFC 792: ICMP

**セキュリティ**
- RFC 8446: TLS 1.3
- RFC 6749: OAuth 2.0
- RFC 7519: JWT

**インフラ・管理**
- RFC 7230–7235: HTTP/1.1（廃止済、HTTP関連）
- RFC 2119: RFC用語（MUST, SHOULDなど）
- RFC 8174: RFC用語補足

---

## 4. 非機能要件

### 4.1 動作環境
- **ブラウザ**: モダンブラウザ（Chrome, Firefox, Safari, Edge の最新版）
- **デバイス**: PC・スマートフォン・タブレット対応（レスポンシブ）
- **オフライン**: 非対応（初回ロード時にJSONを取得）

### 4.2 パフォーマンス
- 初回表示: 3秒以内（GitHub Pages CDN経由）
- データ量: RFC数100件程度を想定（将来的に300件まで拡張可）

### 4.3 アクセシビリティ
- キーボード操作対応（クイズの回答選択）
- 適切なコントラスト比

### 4.4 データ永続化
- **学習進捗はlocalStorageに保存**
  - 各RFCの正解回数・不正解回数
  - 最終クイズ実施日時
- ブラウザをまたいでの同期は対象外

---

## 5. 技術スタック

### 5.1 推奨構成

| 項目 | 採用技術 | 理由 |
|---|---|---|
| HTML/CSS | HTML5 + CSS3 | 標準技術、依存なし |
| JavaScript | バニラJS（ES Modules） | ビルドステップ不要、GitHub Pagesと相性良好 |
| データ形式 | JSON | 可読性高く、PR管理に適する |
| ホスティング | GitHub Pages | 静的サイト配信、無料 |

### 5.2 ディレクトリ構成（案）

```
rfc-tangocho/
├── index.html          # エントリーポイント
├── css/
│   └── style.css       # スタイルシート
├── js/
│   ├── app.js          # アプリケーションエントリ
│   ├── quiz.js         # クイズロジック
│   ├── flashcard.js    # フラッシュカードロジック
│   ├── data.js         # JSONロード・管理
│   └── storage.js      # localStorage操作
├── data/
│   ├── rfcs.json       # RFC一覧データ
│   └── categories.json # カテゴリ定義
├── docs/
│   └── requirements.md # 本要件定義書
└── README.md
```

### 5.3 GitHub Pages デプロイ方法
- GitHub リポジトリの Settings > Pages で `main` ブランチのルートディレクトリ（`/`）を公開元に設定
- `main` ブランチへのマージが即時反映される
- GitHub Actions は使用しない（ビルド不要のため設定不要）

---

## 6. 画面設計（概要）

### 6.1 画面一覧

| 画面ID | 画面名 | 説明 |
|---|---|---|
| SCR-01 | トップ画面 | モード選択（クイズ / フラッシュカード / 一覧） |
| SCR-02 | クイズ設定画面 | 出題形式・出題数・カテゴリ選択 |
| SCR-03 | クイズ問題画面 | 問題表示・4択選択 |
| SCR-04 | クイズ結果画面 | スコア・正解一覧・再挑戦ボタン |
| SCR-05 | フラッシュカード画面 | カードめくり学習 |
| SCR-06 | 一覧・検索画面 | RFC一覧・キーワード検索・フィルタ |

### 6.2 ワイヤーフレーム（クイズ問題画面）

```
┌─────────────────────────────────────┐
│  RFC単語帳  [一覧] [設定]            │
├─────────────────────────────────────┤
│  問 3 / 10        正解率: 67%        │
│  ━━━━━━━━━━━━━━━━━━━ (30%)          │
│                                     │
│  次のRFC番号の仕様名は？             │
│                                     │
│  ╔═══════════╗                       │
│  ║  RFC 793  ║                       │
│  ╚═══════════╝                       │
│                                     │
│  ① HTTP Semantics                   │
│  ② Transmission Control Protocol   │
│  ③ Internet Protocol               │
│  ④ QUIC: A UDP-Based Transport     │
│                                     │
└─────────────────────────────────────┘
```

---

## 7. 今後の拡張候補（スコープ外）

- RFC廃止済み表示（Obsoleted表示）
- SNSシェア機能（スコア共有）
- CSV/JSONインポート機能（カスタム単語セット）
- ダークモード対応
- i18n対応（英語UI）

---

## 8. 開発フェーズ案

| フェーズ | 内容 | 成果物 |
|---|---|---|
| Phase 1 | データ整備 | `rfcs.json`, `categories.json` の初期データ作成 |
| Phase 2 | 基本UI実装 | トップ画面 + クイズ機能（SCR-01〜SCR-04） |
| Phase 3 | GitHub Pages 設定確認 | GitHub Settings > Pages で `main` ブランチのルートを公開元に設定 |
| Phase 4 | フラッシュカード機能追加 | SCR-05 実装 |
| Phase 5 | 一覧・検索機能追加 | SCR-06 実装 |
| Phase 6 | 学習進捗保存 | localStorage連携 |

---

*作成日: 2026-02-27*
