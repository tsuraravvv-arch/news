'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.16.4',
    updatedAt: '2026-07-29 05:05 JST'
  },

  output: {
    fileSuffix: 'reveal-direct-900-v0164-x-color-comp'
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
    maxLongEdge: 900,
    palette: {
      visibleColors: 112,
      hiddenColors: 142
    },
    // 900pxへ縮小した後の各画素を、そのまま連続した色面として処理します。
    // 黒背景で見える暗い像（premultiplied RGB）を先に決め、
    // 白背景では各チャンネルがほぼ白へ寄るようにRGBとアルファを逆算します。\n    // 今回は隠し領域だけ、暗部の階調・色差・輪郭を少し強めに残して、X再処理後の潰れを減らす方向へ調整します。
    hiddenLook: {
      revealMin: 7,
      revealMax: 78,
      revealGamma: 0.81,
      chromaKeep: 0.40,
      whiteMargin: 7,
      maxWhiteTintDepth: 6,
      detailSharpen: 0.44,
      alphaMin: 13,
      alphaMax: 98,
      alphaBias: 3,
      edgeAlphaBoost: 5,
      edgeLift: 9,
      saturationBoost: 0.14,
      toneContrast: 0.18,
      shadowNeutralize: 0.14,
      alphaGamma: 0.98,
      xChromaComp: 0.18,
      xAlphaComp: 4
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    whiteBackground: '#ffffff',
    revealBackground: '#000000'
  },

  boost: {
    default: 1.00,
    min: 1.00,
    max: 1.00,
    step: 0.05,
    labelPrecision: 2
  },

  notes: {
    timelineApproximation: '元画像と範囲マスクから、保存時と同じ長辺900pxの最終RGBA画素を再計算して表示します。細かな色キャリア、網点、ディザは使用しません。保存時は元画像から同じ900pxデータを一度だけ作り直し、そのデータだけでPNG-8パレットを構築します。'
  }
};
