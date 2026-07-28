'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  meta: {
    version: 'v0.13.0',
    updatedAt: '2026-07-28 22:05 JST'
  },

  output: {
    fileSuffix: 'reveal-click-color-priority-v0130'
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
      visibleColors: 222,
      hiddenColors: 32
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
    // v0.13.0: クリック後のカラーを最優先にする色キャリア方式。
    // 大部分は白背景で隠れやすい中立画素、少数画素だけは元色を強く残し、
    // 黒背景で縮小・合成されたときに色味が感じられるようにします。
    hiddenLook: {
      neutralRevealDark: 34,
      neutralRevealBright: 82,
      neutralChromaSpread: 5,
      carrierRevealDark: 62,
      carrierRevealBright: 122,
      carrierChromaSpread: 24,
      carrierThreshold: 2,
      neutralMinAlpha: 0.18,
      carrierMinAlpha: 0.30,
      foregroundCeiling: 250
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
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はクリック後のカラーを最優先し、大部分を白く隠す中立画素、少数を色味保持用の画素として生成する確認版です。ブーストは1.00固定です。'
  }
};
