'use strict';

window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.18.1',
    updatedAt: '2026-07-29 21:40 JST'
  },

  output: {
    fileSuffix: 'rv181'
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
    aspectRatio: '3:4',
    resolutions: [
      { id: 'compat', width: 1086, height: 1448, label: '1086×1448', note: '投稿成功例基準' },
      { id: 'mid', width: 1440, height: 1920, label: '1440×1920', note: '中解像度' },
      { id: 'mid-high', width: 1728, height: 2304, label: '1728×2304', note: '中高解像度' },
      { id: 'high', width: 2304, height: 3072, label: '2304×3072', note: '高解像度' },
      { id: 'max', width: 3072, height: 4096, label: '3072×4096', note: '失敗例との境界比較' }
    ],
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
    timelineApproximation: '投稿成功例と失敗例の境界を調べるため、同じ編集内容から5段階の3:4解像度を選んでPNG-8へ変換し、隠し領域だけを1px単位の2×2対角チェッカー（透明/不透明の2値）にします。見せる範囲は完全不透明、隠し範囲は50%市松です。プレビューは白背景または黒背景へ合成し、長辺900px相当へ縮小してXの見え方を近似します。'
  }
};
