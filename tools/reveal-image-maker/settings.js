'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.10.0',
    updatedAt: '2026-07-28 19:45 JST'
  },

  output: {
    fileSuffix: 'reveal-hidden-tone-v0100'
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
      base: 170,
      strong: 170
    },
    // 隠し色ごとに透明度を変え、暗い元絵ほどクリック後に残りやすくします。
    hiddenAlphaAdaptive: {
      enabled: true,
      minBase: 156,
      minStrong: 156,
      maxBase: 224,
      maxStrong: 224,
      gammaBase: 1.08,
      gammaStrong: 1.08
    },
    // 隠し領域のRGBを白に近い狭い明度帯へ圧縮し、
    // 白背景では見えにくく、黒背景では階調差が少し残る方向へ調整します。
    hiddenLook: {
      preserveSaturationBase: 0.22,
      preserveSaturationStrong: 0.22,
      tintColor: { r: 236, g: 230, b: 246 },
      tintMixBase: 0.06,
      tintMixStrong: 0.06,
      toneMinBase: 249,
      toneMinStrong: 249,
      toneMaxBase: 255,
      toneMaxStrong: 255,
      contrastBase: 42,
      contrastStrong: 42,
      hueKeepBase: 0.24,
      hueKeepStrong: 0.24,
      neutralizeBase: 0.12,
      neutralizeStrong: 0.12
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    nonDestructive: {
      timelineHiddenAlphaScale: 1.00,
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
    max: 1.00,
    step: 0.05,
    labelPrecision: 2
  },

  notes: {
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はブースト1.00固定のまま、クリック前の白さを維持しつつ、隠し領域のRGBへより多くの階調を残す調整版です。白背景では今までと同等以上に白く見せつつ、黒背景では輪郭・顔・明暗が少し分かりやすくなるかを確認します。'
  }
};
