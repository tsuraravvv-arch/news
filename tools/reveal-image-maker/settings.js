'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  output: {
    fileSuffix: 'reveal-halfalpha-v3-hidden-tone-tuned'
  },

  editor: {
    defaultTool: 'hide',
    defaultBrushSize: 52,
    minBrushSize: 8,
    maxBrushSize: 180,
    brushStep: 2,
    showMaskByDefault: true
  },

  presets: {
    topHiddenPercent: 40
  },

  export: {
    rebuildFromOriginalOnSave: true,
    // 透明色1色を除く255色を、見せる範囲と隠す範囲へ別々に配分します。
    // 見せる範囲を多くするときも、こちらの色数が優先的に確保されます。
    palette: {
      visibleColors: 228,
      hiddenColors: 20
    },
    // 隠す範囲は市松ではなく、均一な半透明パレットとして保存します。
    hiddenAlpha: {
      base: 58,
      strong: 78
    },
    // 隠し領域は白背景で目立ちにくく、黒背景ではうっすら見えるよう、
    // 元画像をかなり薄くしたうえで淡いラベンダー寄りに整えます。
    hiddenLook: {
      preserveSaturationBase: 0.10,
      preserveSaturationStrong: 0.06,
      whiteMixBase: 0.90,
      whiteMixStrong: 0.94,
      tintColor: { r: 208, g: 194, b: 236 },
      tintMixBase: 0.32,
      tintMixStrong: 0.42,
      neutralizeBase: 0.28,
      neutralizeStrong: 0.40
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    // 編集中はPNG-8化せず、元画像＋範囲マスクだけで表示します。
    nonDestructive: {
      timelineHiddenAlphaScale: 1.00,
      revealHiddenAlphaScale: 1.08,
      revealVisibleBrightness: 1.00
    },
    timelineApproximation: {
      maxLongEdge: 900,
      alphaThreshold: 130,
      edgeAlphaThreshold: 128,
      preserveMinRed: 190,
      preserveMaxLuminance: 213,
      whiteBackground: '#ffffff',
      revealBackground: '#000000'
    }
  },

  boost: {
    default: 1.00,
    min: 1.00,
    max: 1.40,
    step: 0.05,
    labelPrecision: 2
  },

  notes: {
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。PNG-8への減色・半透明パレット化は保存時だけ行います。隠す範囲は白背景で極力目立たず、黒背景ではうっすら背景が透ける方向に調整しています。'
  }
};
