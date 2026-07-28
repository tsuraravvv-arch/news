'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.14.0',
    updatedAt: '2026-07-28 23:30 JST'
  },

  output: {
    fileSuffix: 'reveal-dark-overlay-click-recovery-v0140'
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
      visibleColors: 168,
      hiddenColors: 87
    },
    // まずは白背景の白さをほぼ維持する前提で固定し、
    // クリック後の見え方改善はRGB側で追います。
    hiddenAlpha: {
      base: 150,
      strong: 150
    },
    hiddenAlphaAdaptive: {
      enabled: false,
      minBase: 150,
      minStrong: 150,
      maxBase: 150,
      maxStrong: 150,
      gammaBase: 1.00,
      gammaStrong: 1.00
    },
    // v0.13.0: クリック後のカラーを最優先にする色キャリア方式。
    // 大部分は白背景で隠れやすい中立画素、少数画素だけは元色を強く残し、
    // 黒背景で縮小・合成されたときに色味が感じられるようにします。
    hiddenLook: {
      targetRevealMin: 36,
      targetRevealMax: 126,
      targetGamma: 0.86,
      darkDetailThreshold: 78,
      darkDetailLift: 1.42,
      maxAlpha: 0.50,
      minAlpha: 0.14,
      visibleEdgeBoost: 0.10,
      carrierThreshold: 1,
      carrierBrightnessBoost: 1.08
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
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はクリック後 / X投稿後の鮮明さを最優先し、白背景ではほぼ白いまま、黒背景では暗い原画に近い見え方を狙う確認版です。ブーストは1.00固定です。'
  }
};
