'use strict';

// Reveal Image Maker 用サイト設定
// 必要な項目だけを書き換えれば、そのまま GitHub Pages へ配置して使えます。
window.REVEAL_IMAGE_MAKER_CONFIG = {
  output: {
    // 出力ファイル名: 元名-<fileSuffix>.png
    fileSuffix: 'reveal-x900-preview-png8'
  },

  editor: {
    defaultTool: 'hide',
    defaultBrushSize: 52,
    minBrushSize: 8,
    maxBrushSize: 180,
    brushStep: 2,
    showMaskByDefault: true
  },

  preview: {
    // timeline / reveal
    defaultMode: 'timeline',
    expandModalEnabled: true,
    timelineApproximation: {
      // X のタイムライン派生画像に寄せるため、保存予定PNG-8をこの長辺へ縮小して近似します。
      maxLongEdge: 900,

      // 半透明を白背景へ近づける際の2値化しきい値
      alphaThreshold: 130,
      edgeAlphaThreshold: 128,

      // 輪郭の淡い色が一部だけ残る傾向に合わせた補助条件
      preserveMinRed: 190,
      preserveMaxLuminance: 213,

      whiteBackground: '#ffffff',
      revealBackground: '#000000'
    }
  },

  boost: {
    // 初期値は 1.00 を採用。まずは開いた後の見え方を優先し、必要に応じて上げる想定です。
    default: 1.00,
    min: 1.00,
    max: 1.40,
    step: 0.05,
    labelPrecision: 2
  },

  notes: {
    timelineApproximation: '保存予定PNG-8を長辺900pxへ縮小・透明度2値化したあと、白背景へ合成するX近似プレビューを表示します。'
  }
};
