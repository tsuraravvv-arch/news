Reveal Image Maker v0.17.4 binary-mask experimental

今回の目的
- これまでの「半透明RGBAを直接作る方式」から離れ、
  参考サイトの実ファイル解析に近い「PNG-8 + 2値透明パターン」方式を試す
- 保存画像自体は、透明1色と不透明色のみに限定する
- タイムライン想定プレビューは、保存画像を白背景へ合成したうえで長辺900pxへ縮小して近似する

今回の実装内容
- 出力は元画像サイズのまま保存
- PNG-8 / indexed color / 透明色1つ / 残りは不透明色
- タップ前に見せない範囲は、2x2チェッカーパターン（実質50%密度）の透明/不透明へ変換
- 不透明側のRGBは元画像色を保持（現版はブースト1.00固定）
- visible 영역/hidden 영역で別の多段アルファは使わない
- プレビューは、保存画像を白背景または黒背景へ合成して長辺900pxへ縮小したものを表示

期待する確認ポイント
1. Xへ投稿したときに、これまでの半透明方式よりグレー化が減るか
2. クリック後に色味が保たれやすくなるか
3. タイムラインでの隠れ方がまだ許容範囲か

注意
- 保存画像そのものを通常の画像ビューアで見ると、タップ前想定ほどは隠れません。
  これは仕様で、X側の縮小・平均化を前提にした実験です。


v0.17.1 changes
- preview blank bug fixed (missing getScaledSize helper)
- hidden pattern changed from 2x2 50% checker to Bayer4 6/16 coverage
- hidden opaque pixels slightly brightened to keep click-open image readable


v0.17.2 changes
- timeline preview now applies extra white concealment in hidden areas to better match X timeline
- output file generation is unchanged from v0.17.1
- reveal preview remains the same direction as v0.17.1


v0.17.3 changes
- strengthened timeline-preview concealment only
- output generation remains identical to v0.17.2 / v0.17.1
- stronger white mix and hidden-mask gamma tuning to reduce white-side show-through in the tool preview


v0.17.4 changes
- timeline preview now renders only the user-selected visible area on white
- hidden area is forced to white in the tool preview, matching the observed X timeline result
- export file generation and reveal preview are unchanged from v0.17.3
