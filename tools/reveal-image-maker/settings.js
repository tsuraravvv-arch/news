'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.7.0',
    updatedAt: '2026-07-27 21:45 JST'
  },

  output: {
    fileSuffix: 'reveal-click-visibility-priority-v070'
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
      base: 124,
      strong: 148
    },
    // 隠し領域のRGBを白に近い狭い明度帯へ圧縮し、
    // 白背景では見えにくく、黒背景では階調差が少し残る方向へ調整します。
    hiddenLook: {
      preserveSaturationBase: 0.14,
      preserveSaturationStrong: 0.10,
      tintColor: { r: 234, g: 228, b: 245 },
      tintMixBase: 0.08,
      tintMixStrong: 0.12,
      toneMinBase: 242,
      toneMinStrong: 238,
      toneMaxBase: 251,
      toneMaxStrong: 248,
      contrastBase: 12,
      contrastStrong: 18,
      hueKeepBase: 0.12,
      hueKeepStrong: 0.18,
      neutralizeBase: 0.16,
      neutralizeStrong: 0.22
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    nonDestructive: {
      timelineHiddenAlphaScale: 1.00,
      revealHiddenAlphaScale: 1.16,
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
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。PNG-8への減色・半透明パレット化は保存時だけ行います。隠す範囲はクリック前の白さを維持したまま、クリック後の視認性を優先して改善するため、より白寄りのRGBと高めの半透明を両立させています。'
  }
};
