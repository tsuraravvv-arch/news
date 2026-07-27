'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.9.0',
    updatedAt: '2026-07-27 23:10 JST'
  },

  output: {
    fileSuffix: 'reveal-adaptive-alpha-v090'
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
      base: 158,
      strong: 158
    },
    // 隠し色ごとに透明度を変え、暗い元絵ほどクリック後に残りやすくします。
    hiddenAlphaAdaptive: {
      enabled: true,
      minBase: 146,
      minStrong: 146,
      maxBase: 210,
      maxStrong: 210,
      gammaBase: 1.15,
      gammaStrong: 1.15
    },
    // 隠し領域のRGBを白に近い狭い明度帯へ圧縮し、
    // 白背景では見えにくく、黒背景では階調差が少し残る方向へ調整します。
    hiddenLook: {
      preserveSaturationBase: 0.16,
      preserveSaturationStrong: 0.16,
      tintColor: { r: 234, g: 228, b: 245 },
      tintMixBase: 0.10,
      tintMixStrong: 0.10,
      toneMinBase: 247,
      toneMinStrong: 247,
      toneMaxBase: 254,
      toneMaxStrong: 254,
      contrastBase: 24,
      contrastStrong: 24,
      hueKeepBase: 0.14,
      hueKeepStrong: 0.14,
      neutralizeBase: 0.18,
      neutralizeStrong: 0.18
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
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はブースト1.00固定のまま、隠し範囲の透明度だけを色ごとに変える基礎改善版です。クリック前の白さは維持しつつ、暗い元絵ほどクリック後に少し見えやすくなるかを確認します。'
  }
};
