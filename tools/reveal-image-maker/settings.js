'use strict';

window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.17.8',
    updatedAt: '2026-07-29 13:05 JST'
  },

  output: {
    fileSuffix: 'reveal-hybrid32-v0178-hires4096'
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
    maxLongEdge: 4096,
    palette: {
      visibleColors: 254,
      hiddenColors: 0
    },
    hiddenLook: {
      checkerMode: 'bluenoise32',
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
    timelineApproximation: '元画像と範囲マスクから、保存時にだけ長辺4096px相当の高解像度画像を一度だけ作り直します。今回はBayer4と64x64非周期の中間案として、32x32の準非周期ドット配置（Trial C）でPNG-8（比較用本命）とRGBA PNG（診断用）を保存できます。プレビューでは保存画像を白背景または黒背景へ合成し、長辺900px相当へ縮小してXの表示を近似します。'
  }
};
