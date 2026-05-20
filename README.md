# Tsurara Trend Notes Prototype

GitHub Pages用の静的サイトプロトタイプです。

## ファイル配置

リポジトリ直下に以下を置いてください。

```text
index.html
style.css
script.js
README.md
data/articles.json
images/banners/
images/thumbnails/
```

## 画像の差し替え

以下のファイル名で画像を置くと、自動的に表示されます。
画像がない場合は、画像枠を非表示にしてテキストだけで表示します。

```text
images/banners/hero.png       トップのタイトル横画像
images/banners/community.png  COMMUNITYバナー画像
images/banners/tarot.png      占いバナー画像
```

推奨サイズは以下です。

```text
hero.png       1600 × 900px 以上、16:9推奨
community.png 800 × 450px 以上、16:9推奨
tarot.png     800 × 450px 以上、16:9推奨
```

実際の表示ではトリミングされることがあるため、重要な文字や顔は中央寄せにしてください。

## 記事データ

記事は `data/articles.json` を編集して追加します。
出典URLや英語プロンプトは空でも問題ありません。

```json
{
  "datetime": "2026-05-19 09:00",
  "category": "EV",
  "categoryLabel": "季節・イベント",
  "id": "EV00034",
  "title": "梅雨入り前の「五月晴れ」シーズン",
  "summary": "概要文",
  "trendElements": ["青空", "洗濯物"],
  "useCases": ["朝の挨拶イラスト"],
  "promptJa": "日本語プロンプト",
  "promptEn": "English prompt",
  "noteTitle": "画像生成メモ",
  "notes": ["メモ1"],
  "sourceUrl": ""
}
```

## 今回の調整内容

- 全体の最大横幅を広げました。
- 掲載メモ2列は維持しつつ、右側の記事詳細パネルを掲載メモ欄と同じくらいの横幅にしました。
- タイトルエリア、COMMUNITY、占いバナーに画像を置けるようにしました。
- 掲載メモの色帯にIDとタイトルを表示するようにしました。
- タグ、カテゴリ、日付、本文を本文側に移動しました。
- 掲載メモ1件ごとの縦幅を狭くし、一覧性を上げました。


## v3 adjustments
- カードタイトル帯のコントラスト改善
- 本文テキストの可読性改善
- COMMUNITY / TAROT バナーを横長画像向けレイアウトに調整
