'use strict';

window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.17.9',
    updatedAt: '2026-07-29 15:40 JST'
  },

  output: {
    fileSuffix: 'rv179a'
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
    stableCanvas: {
      enabled: true,
      aspectRatio: '3:4',
      subjectScale: 0.86,
      anchorX: 0.5,
      anchorY: 0.56
    },
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
    timelineApproximation: '元画像と範囲マスクから、保存時にだけ長辺4096px相当の高解像度画像を一度だけ作り直します。今回はX表示安定モード（3:4固定キャンバス＋被写体を少し小さめに配置）を追加した Trial A です。保存時は長辺4096px・短辺3072pxの縦長キャンバスへ再配置し、短いファイル名で PNG-8（比較用本命）とRGBA PNG（診断用）を書き出します。プレビューでは保存画像を白背景または黒背景へ合成し、長辺900px相当へ縮小してXの表示を近似します。'
  }
};
