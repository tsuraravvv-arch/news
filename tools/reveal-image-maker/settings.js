'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.8.0',
    updatedAt: '2026-07-27 22:20 JST'
  },

  output: {
    fileSuffix: 'reveal-singleboost-foundation-v080'
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
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はブースト1.00固定で、まず白背景での白さを維持しつつ、黒背景での判別性が出るかを確認する基礎テストに集中します。隠す範囲はより白寄りのRGB帯へ圧縮しつつ、半透明は少し強めにしてクリック後の視認性を優先しています。'
  }
};
