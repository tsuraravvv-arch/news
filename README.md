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


## v4 adjustments
- COMMUNITY / TAROT バナーをコンパクトなアイコン型に戻しました。
- バナーが増えた場合、横スクロール／スマホのフリックで切り替えられます。
- デスクトップでは最大3件程度、タブレットでは2件程度、スマホでは1件強が見える幅にしています。


## v5 adjustments
- ヘッダー内の「つららの大アルカナ占い」「コミュニティリンク」ボタンを削除しました。
- ヘッダー右側の `images/banners/hero.png` はそのまま差し込み可能です。
- COMMUNITY / TAROT のリンクバナーをさらに低くし、細い横スクロール導線にしました。


## v6 adjustments
- バナー画像が上部に大きく表示される問題を修正しました。
- 細長いバナーの左側に正方形画像、右側にタイトル・説明が入るレイアウトを強制指定しました。
- バナー画像の推奨サイズは 512×512px または 800×800px の正方形です。


## v7 adjustments
- タイトル部を全面画像ヘッダーに変更しました。
- `images/banners/hero.png` を背景全面に表示し、下部にタイトルと説明文を重ねます。
- ヘッダー画像の推奨サイズは 1600×900px 以上、16:9です。
- 文字は下側に載るため、画像下部は暗め・シンプルな背景にすると読みやすくなります。


## v8 adjustments
- hero.png を16:9ではなく、横長ヘッダーバナー向けに調整しました。
- 推奨サイズは 1600×420px / 1800×480px / 2000×520px 程度です。
- ヘッダー枠いっぱいに画像を表示し、タイトルと説明文を画像下部に重ねます。


## v9 adjustments
- ヘッダー説明文を修正しました。
- サイト名を Tsurara Idea Lab に更新しました。
- COMMUNITY のタイトル・説明文を修正しました。
- TAROT のタイトル・説明文を修正しました。
- 細いバナー内で説明文が収まりやすいようフォントサイズと行数を調整しました。


## v10 adjustments
- 左側カードの色帯を「ID / 日付 / タイトル」に変更しました。
- カード本文は「タグ＋説明文」に整理しました。
- 右側の詳細に生成画像を表示できる枠を追加しました。

### 生成画像の追加方法
記事公開後でも、以下の場所に画像をアップロードすると詳細ページに表示されます。

例：
- `images/articles/EV00034.png`
- `images/articles/AI00028.png`

ファイル名は記事IDと同じにしてください。画像が存在しない場合、画像枠は自動で非表示になります。

別名やjpg/webpを使いたい場合は、`data/articles.json` の記事に以下を追加してください。

```json
"image": "images/articles/sample.jpg"
```


## v11 adjustments
- 記事詳細内の生成画像をサムネイル表示にし、クリックで元画像を別タブ表示できるようにしました。
- 既存の `images/articles/記事ID.png` 運用はそのままです。


## v12 adjustments
- ヘッダー説明文の途中に改行を追加しました。


## v13 adjustments
- 記事詳細の生成画像を、切り抜き表示ではなく「元画像の縮小版」として表示するよう調整しました。
- 画像全体が見えるように、`object-fit: contain` と中央配置を適用しました。
- クリックすると、引き続き元画像を別タブで開けます。


## v14 adjustments
- 記事詳細内の生成画像をクリックすると、別タブではなくページ内モーダルで拡大表示するように変更しました。
- 背景クリック、右上の×ボタン、Escキーで閉じられます。
- 既存の `images/articles/記事ID.png` 運用はそのままです。


## v15 adjustments
- FA00015「ネオロリータ×テック素材の軽サイバー系が増加」を `data/articles.json` に追加しました。
- 記事画像を追加する場合は `images/articles/FA00015.png` をアップロードしてください。


## v16 adjustments
- 「掲載メモ」の見出しを削除しました。
- カテゴリタグを左寄せにしました。
- フィルターに「オリジナル」を追加しました。
- タイトル・概要・タグ・使いどころ・プロンプト・メモを対象にした文字検索機能を追加しました。
- 検索文字とタグ選択を初期化するリセットボタンを追加しました。


## v17 adjustments
- フィルター色を整理しました。
  - オリジナル：黄色
  - AI生成関連：青
  - ファッション：ピンク系
  - 季節・イベント：青緑系
- 記事カードの色も、AI/FA/EVで判別しやすいように調整しました。
- `datetime` が現在から7日以内の記事に、カードタイトル右端へ赤文字の `New` バッジを自動表示します。


## v18 adjustments
- `New` バッジの判定期間を7日以内から2日以内に変更しました。


## v19 adjustments
- バナー欄に「活用ガイド」ボタンを追加しました。
- クリックするとページ内モーダルで操作方法と活用のコツを表示します。
- ガイドには、プロンプトの性質、環境差、サンプル画像の作り方、キーワード追加の推奨を掲載しています。


## v20 adjustments
- 活用ガイドボタンの「?」部分を画像差し込み式に変更しました。
- `images/banners/guide.png` に 512×512px のPNG画像を置くと表示されます。


## v21 adjustments
- 活用ガイドボタンが button 要素のため、ブラウザ標準の余白が入りアイコンだけ揃いにくい問題を修正しました。
- `guide.png` を他のバナーアイコンと同じく 72×72px の正方形枠にぴったり収めるようにしました。


## v22b adjustments
- EV00045「全国で『梅雨前の青空』投稿がラストスパート傾向」を追加しました。
- AI00039「『エレベーター鏡セルフィー』構図がSNS系AI画像で急増」を追加しました。
- 記事画像を追加する場合は `images/articles/EV00045.png` / `images/articles/AI00039.png` をアップロードしてください。


## v23 adjustments
- 活用ガイド内の「Sora」表記を削除し、画像生成サービス例として `ChatGPT Images、Gemini、Midjourneyなど` に変更しました。


## v24 adjustments
- 検索欄の横に「画像から検索」ボタンを追加しました。
- クリックすると、`images/articles/記事ID.png` が存在する記事だけを画像ギャラリーとして表示します。
- サムネイルをクリックすると、対応する記事詳細へジャンプします。
- ディレクトリ一覧はGitHub Pagesでは取得できないため、`articles.json` の記事IDをもとに画像の有無を確認して表示します。


## v25 adjustments
- オリジナル記事は `type: "OR"` / `typeLabel: "オリジナル"` で判定する仕様にしました。
- 互換性のため、従来どおり `trendElements` に「オリジナル」が入っている記事もオリジナル扱いします。
- オリジナル記事のカードタイトル帯をゴールド系にしました。
- オリジナルフィルターもゴールド系に調整しました。


## v32 adjustments
- 活用ガイド内に「著作物に関わるプロンプトの公開ポリシー」セクションを追加しました。
- `images/guide/prompt-policy.png` を表示するようにしました。
- 既存の `data/articles.json` を誤って上書きしないよう、差し替え用ZIPには index.html / style.css / script.js / README.md のみを入れています。


## v39 adjustments
- 記事カードの `New` バッジ表示条件を、現在時刻から24時間以内に変更しました。


## v43 adjustments
- `New` バッジの判定基準を記事本文の `datetime` ではなく、公開・追加日時に近い `publishedAt` 優先に変更しました。
- 判定順は `publishedAt` → `uploadedAt` → `createdAt` → `datetime` です。
- しきい値は引き続き24時間以内です。
- 今後の記事には `publishedAt: "YYYY-MM-DD HH:mm"` を入れる運用にします。


## v50 adjustments
- 記事一覧の上に「おすすめプロンプト」セクションを追加しました。
- `featured: true` の記事を最大6件まで固定表示します。
- カテゴリフィルターに「おすすめ」を追加しました。
- EV10001をおすすめ記事として登録する統合版 `articles.json` も作成しました。


## v52 featured icon image support
- おすすめプロンプトの左側アイコン枠を、画像差し替え対応にしました。
- 画像は `images/featured/<記事ID>.png` に配置してください。
- 推奨サイズは 512x512 の正方形 PNG です。
- 画像が未配置のときは、従来どおりグラデーションのフォールバック表示になります。

例:
- `images/featured/EV10001.png`
- `images/featured/EV00083.png`


## v53 featured common icon
- おすすめプロンプトのアイコンを、記事ID別ではなく共通画像に変更しました。
- 共通画像は `images/featured/featured.png` に配置してください。
- 推奨サイズは 512x512 の正方形 PNG です。
- 個別に変えたい記事がある場合だけ、記事JSONに `featuredIcon` を追加すると個別画像を指定できます。
  例: `"featuredIcon": "images/featured/EV10001.png"`
