'use strict';

window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.18.0',
    updatedAt: '2026-07-29 17:10 JST'
  },

  output: {
    fileSuffix: 'rv180'
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
    maxLongEdge: 0,
    palette: {
      visibleColors: 254,
      hiddenColors: 0
    },
    hiddenLook: {
      checkerMode: 'checker2',
      checkerCoverage: 8,
      brightenGain: 1.00,
      brightenOffset: 0,
      whiteMix: 0.00,
      preserveVisibleAlpha: false
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    whiteBackground: '#ffffff',
    revealBackground: '#000000',
    simulationLongEdge: 900,
    timelineWhiteBoost: 1.00,
    timelineHiddenGamma: 1.00,
    timelinePreviewMode: 'visible-only'
  },

  boost: {
    default: 1.00,
    min: 1.00,
    max: 1.00,
    step: 0.05,
    labelPrecision: 2
  },

  notes: {
    timelineApproximation: '解析した参考PNGと同じ方向へ寄せ、元画像サイズのままPNG-8へ変換し、隠し領域だけを1px単位の2×2対角チェッカー（透明/不透明の2値）にします。見せる範囲は完全不透明、隠し範囲は50%市松です。プレビューは白背景または黒背景へ合成し、長辺900px相当へ縮小してXの見え方を近似します。'
  }
};
