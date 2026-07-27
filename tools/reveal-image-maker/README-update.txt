Reveal Image Maker 更新メモ（v3 hidden tone tuned）

今回の調整
- 隠し領域のアルファを下げ、白背景で元絵が透けにくい方向へ調整
- 隠し領域の色を薄いラベンダー寄りに寄せ、黒背景では無彩色すぎない見え方へ調整
- プレビューの黒背景側は、保存後の見え方に寄せるため隠し領域の見えを少し強めに補正

主な変更値
- hiddenAlpha: base 58 / strong 78
- preserveSaturation: 0.10 -> 0.06
- whiteMix: 0.90 -> 0.94
- tintColor: rgb(208,194,236)
- tintMix: 0.32 -> 0.42
- neutralize: 0.28 -> 0.40
