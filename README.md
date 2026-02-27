# RFC単語帳 (rfc-tangocho)

RFCの番号とその名称をクイズ形式で学習できるWebアプリです。
GitHub Pagesで動作する静的サイトとして実装します。

## 機能

- **クイズモード**: RFC番号↔名称の4択クイズ
- **フラッシュカードモード**: カードをめくって確認する学習
- **一覧・検索**: RFC一覧のキーワード検索・カテゴリフィルタ

## デプロイ

[GitHub Pages](https://nbifrye.github.io/rfc-tangocho/) でホストされています。

## 開発

### ローカル確認

ビルド不要です。ローカルHTTPサーバーで `index.html` を開いてください。

```bash
# Python 3
python -m http.server 8080
# → http://localhost:8080 を開く
```

> `file://` プロトコルでは JSON の fetch ができないため、HTTPサーバー経由での確認が必要です。

### データの追加・修正

RFC データは `data/rfcs.json` で管理しています。
追加・修正はPull Requestで行ってください。
スキーマの詳細は [要件定義書 §3](docs/requirements.md) を参照。

## ドキュメント

- [要件定義書](docs/requirements.md) — 機能仕様・データスキーマ・画面設計
- [AI開発ガイド](CLAUDE.md) — AIアシスタント向けの作業手順・規約

## 技術スタック

- HTML5 + CSS3 + バニラJavaScript（ES Modules）
- データ: JSON（ビルド不要）
- ホスティング: GitHub Pages
- デプロイ: GitHub Pages（mainブランチのルートを直接公開）
