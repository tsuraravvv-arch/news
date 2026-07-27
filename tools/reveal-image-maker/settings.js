'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  output: {
    fileSuffix: 'reveal-halfalpha-v4-balanced-reveal'
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
      base: 104,
      strong: 120
    },
    // 隠し領域は白背景で目立ちにくく、黒背景ではうっすら見えるよう、
    // 元画像をかなり薄くしたうえで淡いラベンダー寄りに整えます。
    hiddenLook: {
      preserveSaturationBase: 0.13,
      preserveSaturationStrong: 0.10,
      whiteMixBase: 0.95,
      whiteMixStrong: 0.97,
      tintColor: { r: 240, g: 235, b: 249 },
      tintMixBase: 0.18,
      tintMixStrong: 0.26,
      neutralizeBase: 0.22,
      neutralizeStrong: 0.30
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    // 編集中はPNG-8化せず、元画像＋範囲マスクだけで表示します。
    nonDestructive: {
      timelineHiddenAlphaScale: 0.96,
      revealHiddenAlphaScale: 1.00,
      revealVisibleBrightness: 1.01
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
