'use strict';

window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.17.2',
    updatedAt: '2026-07-29 07:00 JST'
  },

  output: {
    fileSuffix: 'reveal-png8-binary-v0172'
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
      checkerMode: 'bayer4',
      checkerCoverage: 6,
      brightenGain: 1.10,
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
    timelineWhiteBoost: 0.48,
    timelineHiddenGamma: 0.9
  },

  boost: {
    default: 1.00,
    min: 1.00,
    max: 1.00,
    step: 0.05,
    labelPrecision: 2
  },

  notes: {
    timelineApproximation: '元画像と範囲マスクから、保存時にだけ原寸の2値透明パターンPNG-8を一度だけ作り直します。プレビューでは、その保存画像を白背景または黒背景へ合成し、長辺900px相当へ縮小してXの表示を近似します。今回は半透明連続色面ではなく、透明/不透明の細かなパターン方式を試す実験版です。'
  }
};
