Reveal Image Maker 更新メモ

Version: v0.4.0
Updated: 2026-07-27 19:47 JST

今回の調整
- サイト右上へバージョン番号と更新日時を表示
- タイムライン側は白背景で隠し領域が目立ちにくい状態を維持
- クリック後は隠し領域が完全に消えないよう、透明度を再調整
- 隠し領域の色を非常に淡いラベンダー寄りにし、白背景ではほぼ白、黒背景では薄く見えるバランスへ変更
- ブースト1.0〜1.4でアルファが104〜120へ変化

主な設定
- hiddenAlpha: base 104 / strong 120
- whiteMix: 0.95 / 0.97
- tintColor: rgb(240,235,249)
- preview timeline alpha scale: 0.96
- preview reveal alpha scale: 1.00
