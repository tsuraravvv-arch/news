'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.16.0',
    updatedAt: '2026-07-29 02:56 JST'
  },

  output: {
    fileSuffix: 'reveal-direct-900-v0160'
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
      visibleColors: 160,
      hiddenColors: 95
    },
    // 900pxへ縮小した後の各画素を、そのまま連続した色面として処理します。
    // 黒背景で見える暗い像（premultiplied RGB）を先に決め、
    // 白背景では各チャンネルがほぼ白へ寄るようにRGBとアルファを逆算します。
    hiddenLook: {
      revealMin: 3,
      revealMax: 47,
      revealGamma: 0.86,
      chromaKeep: 0.42,
      whiteMargin: 5,
      maxWhiteTintDepth: 7,
      detailSharpen: 0.30,
      alphaMin: 8,
      alphaMax: 56
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
