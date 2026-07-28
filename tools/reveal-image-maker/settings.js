'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.12.0',
    updatedAt: '2026-07-28 21:20 JST'
  },

  output: {
    fileSuffix: 'reveal-positive-composite-v0120'
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
    // まずは白背景の白さをほぼ維持する前提で固定し、
    // クリック後の見え方改善はRGB側で追います。
    hiddenAlpha: {
      base: 168,
      strong: 168
    },
    hiddenAlphaAdaptive: {
      enabled: true,
      minBase: 154,
      minStrong: 154,
      maxBase: 218,
      maxStrong: 218,
      gammaBase: 1.10,
      gammaStrong: 1.10
    },
    // v0.12.0: 正方向の合成計算へ切り替え。
    // 白背景ではほぼ白を維持しつつ、黒背景では元絵の明暗に沿って
    // うっすら見えるよう、隠し色の平均輝度とアルファをセットで決めます。
    hiddenLook: {
      hiddenMeanDarkBase: 232,
      hiddenMeanDarkStrong: 232,
      hiddenMeanBrightBase: 246,
      hiddenMeanBrightStrong: 246,
      revealMeanDarkBase: 68,
      revealMeanDarkStrong: 68,
      revealMeanBrightBase: 154,
      revealMeanBrightStrong: 154,
      whiteTargetDarkBase: 249,
      whiteTargetDarkStrong: 249,
      whiteTargetBrightBase: 248,
      whiteTargetBrightStrong: 248,
      preliftBase: 0.88,
      preliftStrong: 0.88,
      chromaKeepBase: 0.40,
      chromaKeepStrong: 0.40,
      neutralizeBase: 0.08,
      neutralizeStrong: 0.08,
      hueRestoreBase: 0.26,
      hueRestoreStrong: 0.26,
      tintColor: { r: 236, g: 230, b: 246 },
      tintMixBase: 0.03,
      tintMixStrong: 0.03
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    nonDestructive: {
      timelineHiddenAlphaScale: 1.00,
      revealHiddenAlphaScale: 1.00,
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
    max: 1.00,
    step: 0.05,
    labelPrecision: 2
  },

  notes: {
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はブースト1.00固定のまま、白背景では現在と同等以上の白さを維持しつつ、黒背景では元絵の明暗が正方向に残るよう、隠し領域のRGBとアルファをセットで再計算する確認版です。'
  }
};
