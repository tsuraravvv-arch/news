# Tsurara Trend Notes Prototype

GitHub Pages向けの静的サイトプロトタイプです。

## ファイル構成

- `index.html`：トップページ
- `style.css`：デザイン
- `script.js`：記事表示、カテゴリフィルター、コピー機能
- `data/articles.json`：記事データ

## 使い方

1. GitHubリポジトリにこの中身をアップロードします。
2. GitHub Pagesで公開します。
3. 記事を増やす場合は `data/articles.json` に項目を追加します。

## 注意

ローカルで `index.html` を直接開くと、ブラウザによっては `articles.json` を読み込めない場合があります。
その場合は VS Code の Live Server などで確認してください。
