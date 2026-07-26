'use strict';

// Reveal Image Maker 用サイト設定
window.REVEAL_IMAGE_MAKER_CONFIG = {
  output: {
    fileSuffix: 'reveal-nondestructive-png8'
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
    // 透明色1色を除く255色を、見せる範囲と隠す範囲へ別々に配分します。
    // 見せる範囲を多くするときも、こちらの色数が優先的に確保されます。
    palette: {
      visibleColors: 210,
      hiddenColors: 45
    },
    // 隠す範囲は市松ではなく、均一な半透明パレットとして保存します。
    hiddenAlpha: {
      base: 48,
      strong: 72
    }
  },

  preview: {
    defaultMode: 'timeline',
    expandModalEnabled: true,
    // 編集中はPNG-8化せず、元画像＋範囲マスクだけで表示します。
    nonDestructive: {
      timelineHiddenOpacity: 0.025,
      revealHiddenOpacity: 0.50,
      revealVisibleBrightness: 1.04
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
    max: 1.40,
    step: 0.05,
    labelPrecision: 2
  },

  notes: {
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。PNG-8への減色・半透明パレット化は保存時だけ行います。'
  }
};
