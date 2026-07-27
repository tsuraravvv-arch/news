'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.5.0',
    updatedAt: '2026-07-27 11:05 JST'
  },

  output: {
    fileSuffix: 'reveal-balanced-rgb-preserved-v050'
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
    palette: {
      visibleColors: 228,
      hiddenColors: 20
    },
    // 隠し領域が完全消失しないよう、前版よりアルファを戻します。
    hiddenAlpha: {
      base: 100,
      strong: 128
    },
    // 元画像のRGBを残したまま、白背景では目立ちにくく、
    // 黒背景ではうっすら見える程度の淡色化へ寄せます。
    hiddenLook: {
      preserveSaturationBase: 0.38,
      preserveSaturationStrong: 0.28,
      whiteMixBase: 0.72,
      whiteMixStrong: 0.80,
      tintColor: { r: 225, g: 219, b: 239 },
      tintMixBase: 0.08,
      tintMixStrong: 0.14,
      neutralizeBase: 0.08,
      neutralizeStrong: 0.14,
      shadowFloorBase: 0.18,
      shadowFloorStrong: 0.24
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    nonDestructive: {
      timelineHiddenAlphaScale: 0.96,
      revealHiddenAlphaScale: 1.22,
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
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。PNG-8への減色・半透明パレット化は保存時だけ行います。隠す範囲は元画像の色を薄く残したまま、白背景では目立ちにくく、黒背景ではうっすら見える方向へ調整しています。'
  }
};
