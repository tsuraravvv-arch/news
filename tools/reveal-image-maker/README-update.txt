Reveal Image Maker v0.17.6 compare build

目的
- 高解像度4096px出力を維持したまま、PNG-8ファイルだけX投稿に失敗するのかを切り分ける
- 同一画素内容を PNG-8 と RGBA PNG の両方で保存し、Xへの投稿可否を比較する

実装内容
- 出力は長辺4096px相当（縦横比維持）
- 2値透明パターン生成はこれまで通り Bayer4
- 「PNG-8を保存」: indexed color / tRNS のPNG-8を書き出す
- 「RGBA PNGを保存（診断用）」: 同じ imageData をそのまま標準的なRGBA PNGとして書き出す
- タイムライン/クリック後プレビューは v0.17.5 を維持

確認したい点
1. RGBA PNGはXへ投稿できるか
2. PNG-8だけ失敗するか
3. もしRGBAも失敗するなら、解像度4096pxや画素内容そのものが原因候補
4. RGBAだけ成功するなら、PNG-8構造またはXとの互換性が原因候補
