'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.15.0',
    updatedAt: '2026-07-29 03:20 JST'
  },

  output: {
    fileSuffix: 'reveal-separated-color-carrier-v0150'
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
      visibleColors: 194,
      neutralColors: 28,
      carrierColors: 32
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
    // v0.15.0: 白く隠す中立画素と、元色を保持する色キャリア画素を完全分離します。
    // キャリアは別パレット・別アルファで保存し、平均化による色濁りを防ぎます。
    hiddenLook: {
      neutralHiddenMeanDark: 232,
      neutralHiddenMeanBright: 246,
      neutralRevealDark: 52,
      neutralRevealBright: 112,
      neutralWhiteTarget: 250,
      neutralPrelift: 0.90,
      neutralChromaKeep: 0.10,
      carrierAlpha: 112,
      baseCarrierThreshold: 1,
      colorCarrierThreshold: 2,
      edgeCarrierThreshold: 6,
      edgeThreshold: 26,
      chromaThreshold: 24
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
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はクリック後 / X投稿後のカラーと鮮明さを最優先し、白く隠す中立画素と元色を残す色キャリア画素を別パレットで保存する確認版です。ブーストは1.00固定です。'
  }
};
