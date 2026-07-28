'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.11.0',
    updatedAt: '2026-07-28 20:20 JST'
  },

  output: {
    fileSuffix: 'reveal-hidden-tone-v0110'
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
    // v0.11.0: 白寄せしつつ各チャンネル差を残す高輝度カラー方式。
    // 目的は「白背景で白いまま」「黒背景で灰色ベタや黒反転っぽさを弱める」ことです。
    hiddenLook: {
      whiteLiftDarkBase: 0.84,
      whiteLiftDarkStrong: 0.84,
      whiteLiftBrightBase: 0.95,
      whiteLiftBrightStrong: 0.95,
      toneFloorBase: 236,
      toneFloorStrong: 236,
      toneCeilBase: 252,
      toneCeilStrong: 252,
      toneContrastBase: 8,
      toneContrastStrong: 8,
      chromaKeepBase: 0.56,
      chromaKeepStrong: 0.56,
      neutralizeBase: 0.06,
      neutralizeStrong: 0.06,
      hueRestoreBase: 0.18,
      hueRestoreStrong: 0.18,
      tintColor: { r: 236, g: 230, b: 246 },
      tintMixBase: 0.04,
      tintMixStrong: 0.04
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    nonDestructive: {
      timelineHiddenAlphaScale: 1.00,
      revealHiddenAlphaScale: 1.18,
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
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はブースト1.00固定のまま、クリック前の白さを大きく崩さず、クリック後に灰色ベタや黒反転っぽさが出にくいよう、隠し領域のRGB生成を高輝度・色相保持寄りへ切り替えた確認版です。'
  }
};
