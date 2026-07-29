'use strict';

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileInformation = document.getElementById('fileInformation');
const fileNameNode = document.getElementById('fileName');
const imageDimensionsNode = document.getElementById('imageDimensions');
const inputFileSizeNode = document.getElementById('inputFileSize');
const sizeStatusNode = document.getElementById('sizeStatus');
const outputFileNameNode = document.getElementById('outputFileName');
const outputFileSizeNode = document.getElementById('outputFileSize');
const exportWarning = document.getElementById('exportWarning');
const exportProgress = document.getElementById('exportProgress');
const exportProgressBar = document.getElementById('exportProgressBar');
const exportProgressText = document.getElementById('exportProgressText');

const editorViewport = document.getElementById('editorViewport');
const editorCanvas = document.getElementById('editorCanvas');
const editorContext = editorCanvas.getContext('2d', { alpha: true });
const zoomIndicator = document.getElementById('zoomIndicator');

const previewStage = document.getElementById('previewStage');
const previewCanvas = document.getElementById('previewCanvas');
const previewContext = previewCanvas.getContext('2d', { alpha: true });
const previewNote = document.getElementById('previewNote');
const expandPreviewButton = document.getElementById('expandPreviewButton');
const previewModal = document.getElementById('previewModal');
const closePreviewModal = document.getElementById('closePreviewModal');
const modalCanvasWrap = document.getElementById('modalCanvasWrap');
const modalCanvas = document.getElementById('modalCanvas');
const modalContext = modalCanvas.getContext('2d', { alpha: true });

const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const revealBoostInput = document.getElementById('revealBoost');
const revealBoostValue = document.getElementById('revealBoostValue');
const showMaskToggle = document.getElementById('showMaskToggle');
const maskAllButton = document.getElementById('maskAllButton');
const clearMaskButton = document.getElementById('clearMaskButton');
const top40Button = document.getElementById('top40Button');
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const zoomOutButton = document.getElementById('zoomOutButton');
const zoomInButton = document.getElementById('zoomInButton');
const fitButton = document.getElementById('fitButton');
const saveButton = document.getElementById('saveButton');
const saveRgbaButton = document.getElementById('saveRgbaButton');
const toast = document.getElementById('toast');
const versionBadgeNode = document.getElementById('versionBadge');
const versionDateNode = document.getElementById('versionDate');

const toolButtons = [...document.querySelectorAll('[data-tool]')];
const previewTabs = [...document.querySelectorAll('[data-preview]')];
const disabledGroups = [
  document.getElementById('toolSelector'),
  document.getElementById('brushControls'),
  document.getElementById('maskActions'),
  document.getElementById('viewControls'),
  document.getElementById('strengthControls'),
  document.getElementById('boostControls')
];

const sourceCanvas = document.createElement('canvas');
const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
const maskCanvas = document.createElement('canvas');
const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
const overlayCanvas = document.createElement('canvas');
const overlayContext = overlayCanvas.getContext('2d');
const outputCanvas = document.createElement('canvas');
const outputContext = outputCanvas.getContext('2d', { willReadFrequently: true });
const timelineCanvas = document.createElement('canvas');


const BLUE_NOISE_64 = (() => {
  const data = window.REVEAL_BLUE_NOISE_64;
  if (!data || !Array.isArray(data.ranks) || !data.size) return null;
  return {
    size: Number(data.size),
    ranks: data.ranks
  };
})();


function mergeConfig(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override.slice() : base.slice();
  if (base && typeof base === 'object') {
    const output = { ...base };
    if (override && typeof override === 'object') {
      for (const key of Object.keys(override)) {
        output[key] = key in base ? mergeConfig(base[key], override[key]) : override[key];
      }
    }
    return output;
  }
  return override === undefined ? base : override;
}

const DEFAULT_CONFIG = {
  meta: {
    version: 'v0.17.7',
    updatedAt: ''
  },
  output: {
    fileSuffix: 'reveal-nonperiodic-v0177-hires4096'
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
      checkerMode: 'bluenoise64',
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
    timelineApproximation: '元画像と範囲マスクから、保存時にだけ原寸の2値透明パターンPNG-8を一度だけ作り直します。プレビューでは、その保存画像を白背景または黒背景へ合成し、長辺900px相当へ縮小してXの表示を近似します。今回は半透明連続色面ではなく、透明/不透明の細かなパターン方式を試す実験版です。'
  }
};

const CONFIG = mergeConfig(DEFAULT_CONFIG, window.REVEAL_IMAGE_MAKER_CONFIG || {});

function applyConfigToInputs() {
  brushSizeInput.min = String(CONFIG.editor.minBrushSize);
  brushSizeInput.max = String(CONFIG.editor.maxBrushSize);
  brushSizeInput.step = String(CONFIG.editor.brushStep);
  brushSizeInput.value = String(CONFIG.editor.defaultBrushSize);
  showMaskToggle.checked = Boolean(CONFIG.editor.showMaskByDefault);
  if (top40Button) {
    top40Button.textContent = `上${CONFIG.presets.topHiddenPercent}%を隠す`;
    top40Button.title = `画像上部${CONFIG.presets.topHiddenPercent}%を特殊透過処理の対象にします`;
  }

  revealBoostInput.min = String(Math.round(CONFIG.boost.min * 100));
  revealBoostInput.max = String(Math.round(CONFIG.boost.max * 100));
  revealBoostInput.step = String(Math.max(1, Math.round(CONFIG.boost.step * 100)));
  revealBoostInput.value = String(Math.round(CONFIG.boost.default * 100));
  const isFixedBoost = Math.abs(CONFIG.boost.max - CONFIG.boost.min) < 0.0001;
  revealBoostInput.disabled = isFixedBoost;
  revealBoostInput.setAttribute('aria-disabled', String(isFixedBoost));

  if (versionBadgeNode) versionBadgeNode.textContent = CONFIG.meta?.version || 'v0.17.6';
  if (versionDateNode) versionDateNode.textContent = CONFIG.meta?.updatedAt || '';
}

applyConfigToInputs();
const timelineContext = timelineCanvas.getContext('2d', { willReadFrequently: true });
const timelineResampleCanvas = document.createElement('canvas');
const timelineResampleContext = timelineResampleCanvas.getContext('2d', { willReadFrequently: true });
const timelineBinaryCanvas = document.createElement('canvas');
const timelineBinaryContext = timelineBinaryCanvas.getContext('2d', { willReadFrequently: true });
const revealCanvas = document.createElement('canvas');
const revealContext = revealCanvas.getContext('2d', { willReadFrequently: true });
const cleanPreviewCanvas = document.createElement('canvas');
const cleanPreviewContext = cleanPreviewCanvas.getContext('2d', { willReadFrequently: true });
const cleanPreviewVisibleCanvas = document.createElement('canvas');
const cleanPreviewVisibleContext = cleanPreviewVisibleCanvas.getContext('2d', { willReadFrequently: true });
const hiddenPreviewCanvas = document.createElement('canvas');
const hiddenPreviewContext = hiddenPreviewCanvas.getContext('2d', { willReadFrequently: true });
const directSourceCanvas = document.createElement('canvas');
const directSourceContext = directSourceCanvas.getContext('2d', { willReadFrequently: true });
const directMaskCanvas = document.createElement('canvas');
const directMaskContext = directMaskCanvas.getContext('2d', { willReadFrequently: true });
const directOutputCanvas = document.createElement('canvas');
const directOutputContext = directOutputCanvas.getContext('2d', { willReadFrequently: true });

const state = {
  imageLoaded: false,
  sourceFile: null,
  sourceName: 'image',
  imageWidth: 0,
  imageHeight: 0,
  sourceImageData: null,
  tool: CONFIG.editor.defaultTool,
  brushSize: Number(brushSizeInput.value),
  revealBoost: Number(revealBoostInput.value) / 100,
  showMask: Boolean(CONFIG.editor.showMaskByDefault),
  previewMode: CONFIG.preview.defaultMode,
  scale: 1,
  minScale: 0.05,
  maxScale: 12,
  offsetX: 0,
  offsetY: 0,
  operations: [],
  redoOperations: [],
  currentStroke: null,
  pointers: new Map(),
  gesture: null,
  panSession: null,
  outputVersion: 0,
  renderedOutputVersion: -1,
  encodedPreviewImage: null,
  encodedPreviewVersion: -1,
  encodedPreviewPromise: null,
  previewRefreshToken: 0,
  directPreviewVersion: -1,
  directPreviewCanvas: null,
  timelinePreviewVersion: -1,
  timelinePreviewCanvas: null,
  revealPreviewVersion: -1,
  revealPreviewCanvas: null,
  toastTimer: null
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function sanitizeBaseName(name) {
  const withoutExtension = name.replace(/\.[^.]+$/, '') || 'image';
  return withoutExtension.replace(/[\\/:*?"<>|]/g, '_').trim() || 'image';
}

function outputFileName(kind = 'png8') {
  const kindSuffix = kind === 'rgba' ? 'rgba' : 'png8';
  if (!state.imageLoaded) {
    return `${state.sourceName}-${CONFIG.output.fileSuffix}-${kindSuffix}.png`;
  }
  const directSize = getDirectOutputSize(state.imageWidth, state.imageHeight);
  const dims = `_${directSize.width}x${directSize.height}`;
  return `${state.sourceName}-${CONFIG.output.fileSuffix}-${kindSuffix}${dims}.png`;
}


function formatBoostLabel(value) {
  return `x${value.toFixed(CONFIG.boost.labelPrecision)}`;
}

function closeRenderableImage(image) {
  if (image && typeof image.close === 'function') image.close();
}

function invalidateEncodedPreview() {
  closeRenderableImage(state.encodedPreviewImage);
  state.encodedPreviewImage = null;
  state.encodedPreviewVersion = -1;
  state.encodedPreviewPromise = null;
  state.previewRefreshToken += 1;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * clamp01(amount);
}

function mixChannel(value, target, amount) {
  return clampByte(value * (1 - amount) + target * amount);
}

function getBoostNormalized(boost) {
  return clamp01((boost - CONFIG.boost.min) / Math.max(0.0001, CONFIG.boost.max - CONFIG.boost.min));
}

function applyRevealBoostToPixel(r, g, b, boost) {
  if (boost <= 1) return { r, g, b };

  const boostAmount = Math.min(0.4, boost - 1);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // 強い白飛びを避けながら、暗部だけを穏やかに持ち上げる。
  const gamma = Math.max(0.86, 0.96 - boostAmount * 0.25);
  let rr = clampByte(255 * Math.pow(r / 255, gamma));
  let gg = clampByte(255 * Math.pow(g / 255, gamma));
  let bb = clampByte(255 * Math.pow(b / 255, gamma));

  const darkFactor = clamp01((0.48 - luminance) / 0.48);
  const whiteMix = Math.min(
    0.18,
    0.01 + boostAmount * 0.08 + darkFactor * (0.025 + boostAmount * 0.18)
  );
  rr = mixChannel(rr, 255, whiteMix);
  gg = mixChannel(gg, 255, whiteMix);
  bb = mixChannel(bb, 255, whiteMix);

  // 黒い粒が極端に残る部分だけを、色を壊さない範囲で少し均す。
  const mean = (rr + gg + bb) / 3;
  const neutralize = Math.min(0.10, darkFactor * (0.02 + boostAmount * 0.14));
  rr = mixChannel(rr, mean, neutralize);
  gg = mixChannel(gg, mean, neutralize);
  bb = mixChannel(bb, mean, neutralize);

  if (luminance < 0.12) {
    const floorMix = Math.min(0.10, (0.12 - luminance) * 0.45 + boostAmount * 0.04);
    rr = mixChannel(rr, 118, floorMix);
    gg = mixChannel(gg, 118, floorMix);
    bb = mixChannel(bb, 118, floorMix);
  }

  return { r: rr, g: gg, b: bb };
}



function getDirectOutputSize(width, height) {
  const configuredLongEdge = Math.max(0, Number(CONFIG.export.maxLongEdge) || 0);
  if (configuredLongEdge <= 0) {
    return { width, height };
  }
  const longEdge = Math.max(1, width, height);
  const ratio = configuredLongEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

function createScaledSourceCanvas(source, targetWidth, targetHeight, smoothing = true) {
  const helperCanvas = document.createElement('canvas');
  helperCanvas.width = targetWidth;
  helperCanvas.height = targetHeight;
  const helperContext = helperCanvas.getContext('2d', { willReadFrequently: true });
  helperContext.clearRect(0, 0, targetWidth, targetHeight);
  helperContext.imageSmoothingEnabled = smoothing;
  helperContext.imageSmoothingQuality = 'high';
  helperContext.drawImage(source, 0, 0, targetWidth, targetHeight);
  return helperCanvas;
}

function getScaledSize(width, height, maxLongEdge) {
  const longEdge = Math.max(1, width, height);
  const ratio = Math.min(1, Math.max(1, maxLongEdge) / longEdge);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

function boostHiddenRgb(r, g, b) {
  const look = CONFIG.export.hiddenLook || {};
  const gain = Math.max(0, Number(look.brightenGain ?? 1.00));
  const offset = Number(look.brightenOffset ?? 0);
  const whiteMix = clamp01(Number(look.whiteMix ?? 0.00));
  let rr = clampByte(r * gain + offset);
  let gg = clampByte(g * gain + offset);
  let bb = clampByte(b * gain + offset);
  if (whiteMix > 0) {
    rr = clampByte(lerp(rr, 255, whiteMix));
    gg = clampByte(lerp(gg, 255, whiteMix));
    bb = clampByte(lerp(bb, 255, whiteMix));
  }
  return { r: rr, g: gg, b: bb };
}

function isHiddenPatternOpaque(x, y) {
  const look = CONFIG.export.hiddenLook || {};
  const mode = String(look.checkerMode || 'bayer4');

  if (mode === 'checker2') {
    return ((x + y) & 1) === 0;
  }

  const coverage = Math.max(1, Math.min(16, Number(look.checkerCoverage ?? 6)));

  if ((mode === 'bluenoise64' || mode === 'blue-noise-64' || mode === 'trialB') && BLUE_NOISE_64) {
    const size = BLUE_NOISE_64.size;
    const ranks = BLUE_NOISE_64.ranks;
    const total = size * size;
    const threshold = Math.max(1, Math.min(total, Math.round((coverage / 16) * total)));
    const xx = ((x % size) + size) % size;
    const yy = ((y % size) + size) % size;
    return ranks[yy * size + xx] < threshold;
  }

  const bayer4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];
  return bayer4[y & 3][x & 3] < coverage;
}

function createBinaryPatternOutput() {
  if (!state.imageLoaded) return null;
  const { width, height } = getDirectOutputSize(state.imageWidth, state.imageHeight);
  const scaledSourceCanvas = createScaledSourceCanvas(sourceCanvas, width, height, true);
  const scaledMaskCanvas = createScaledSourceCanvas(maskCanvas, width, height, true);
  const sourceData = scaledSourceCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height);
  const maskData = scaledMaskCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height);
  const outputData = new ImageData(width, height);
  const sourcePixels = sourceData.data;
  const maskPixels = maskData.data;
  const outputPixels = outputData.data;
  const preserveVisibleAlpha = Boolean(CONFIG.export.hiddenLook?.preserveVisibleAlpha);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const sourceAlpha = sourcePixels[index + 3];
      if (sourceAlpha < 1) {
        outputPixels[index] = 0;
        outputPixels[index + 1] = 0;
        outputPixels[index + 2] = 0;
        outputPixels[index + 3] = 0;
        continue;
      }

      const isVisible = maskPixels[index + 3] > 127;
      if (isVisible) {
        outputPixels[index] = sourcePixels[index];
        outputPixels[index + 1] = sourcePixels[index + 1];
        outputPixels[index + 2] = sourcePixels[index + 2];
        outputPixels[index + 3] = preserveVisibleAlpha ? sourceAlpha : 255;
        continue;
      }

      if (!isHiddenPatternOpaque(x, y)) {
        outputPixels[index] = 0;
        outputPixels[index + 1] = 0;
        outputPixels[index + 2] = 0;
        outputPixels[index + 3] = 0;
        continue;
      }

      const boosted = boostHiddenRgb(sourcePixels[index], sourcePixels[index + 1], sourcePixels[index + 2]);
      outputPixels[index] = boosted.r;
      outputPixels[index + 1] = boosted.g;
      outputPixels[index + 2] = boosted.b;
      outputPixels[index + 3] = 255;
    }
  }

  directOutputCanvas.width = width;
  directOutputCanvas.height = height;
  directOutputContext.clearRect(0, 0, width, height);
  directOutputContext.putImageData(outputData, 0, 0);

  return {
    imageData: outputData,
    selectionMaskData: maskData.data,
    canvas: directOutputCanvas,
    width,
    height
  };
}

function createScaledMaskPreview(targetWidth, targetHeight, visibleOnly = true) {
  const helperCanvas = document.createElement('canvas');
  helperCanvas.width = targetWidth;
  helperCanvas.height = targetHeight;
  const helperContext = helperCanvas.getContext('2d', { willReadFrequently: true });
  helperContext.clearRect(0, 0, targetWidth, targetHeight);
  helperContext.imageSmoothingEnabled = true;
  helperContext.imageSmoothingQuality = 'high';
  if (visibleOnly) {
    helperContext.drawImage(maskCanvas, 0, 0, targetWidth, targetHeight);
  } else {
    helperContext.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
  }
  return helperCanvas;
}

function applyTimelineWhiteBoost(targetCanvas) {
  const context = targetCanvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = targetCanvas;
  const previewImage = context.getImageData(0, 0, width, height);
  const previewPixels = previewImage.data;

  const visibleMaskCanvas = createScaledMaskPreview(width, height, true);
  const visibleMaskData = visibleMaskCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height).data;

  for (let index = 0; index < previewPixels.length; index += 4) {
    const visible = clamp01(visibleMaskData[index + 3] / 255);
    previewPixels[index] = clampByte(lerp(255, previewPixels[index], visible));
    previewPixels[index + 1] = clampByte(lerp(255, previewPixels[index + 1], visible));
    previewPixels[index + 2] = clampByte(lerp(255, previewPixels[index + 2], visible));
    previewPixels[index + 3] = 255;
  }

  context.putImageData(previewImage, 0, 0);
  return targetCanvas;
}

function drawOutputCompositePreview(sourceCanvas, backgroundColor, targetCanvas, mode = 'timeline') {
  const simulationLongEdge = Math.max(1, Number(CONFIG.preview.simulationLongEdge) || 900);
  const target = getScaledSize(sourceCanvas.width, sourceCanvas.height, simulationLongEdge);
  targetCanvas.width = target.width;
  targetCanvas.height = target.height;
  const context = targetCanvas.getContext('2d', { willReadFrequently: true });
  context.clearRect(0, 0, target.width, target.height);
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, target.width, target.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(sourceCanvas, 0, 0, target.width, target.height);
  if (mode === 'timeline') {
    applyTimelineWhiteBoost(targetCanvas);
  }
  return targetCanvas;
}

function getDirectPreviewOutput(mode = state.previewMode) {
  if (!state.imageLoaded) return null;
  if (state.directPreviewVersion !== state.outputVersion || !state.directPreviewCanvas) {
    const output = createBinaryPatternOutput();
    state.directPreviewVersion = state.outputVersion;
    state.directPreviewCanvas = output?.canvas || null;
    state.timelinePreviewVersion = -1;
    state.timelinePreviewCanvas = null;
    state.revealPreviewVersion = -1;
    state.revealPreviewCanvas = null;
  }
  if (!state.directPreviewCanvas) return null;

  if (mode === 'reveal') {
    if (state.revealPreviewVersion === state.outputVersion && state.revealPreviewCanvas) {
      return state.revealPreviewCanvas;
    }
    state.revealPreviewCanvas = drawOutputCompositePreview(state.directPreviewCanvas, CONFIG.preview.revealBackground, revealCanvas, 'reveal');
    state.revealPreviewVersion = state.outputVersion;
    return state.revealPreviewCanvas;
  }

  if (state.timelinePreviewVersion === state.outputVersion && state.timelinePreviewCanvas) {
    return state.timelinePreviewCanvas;
  }
  state.timelinePreviewCanvas = drawOutputCompositePreview(state.directPreviewCanvas, CONFIG.preview.whiteBackground, timelineCanvas, 'timeline');
  state.timelinePreviewVersion = state.outputVersion;
  return state.timelinePreviewCanvas;
}

async function createRenderableImageFromBlob(blob) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(blob);
    } catch (error) {
      console.warn('createImageBitmap for preview failed; falling back to Image.', error);
    }
  }
  return await new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('プレビュー画像を作成できませんでした。'));
    };
    image.src = url;
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function setControlsEnabled(enabled) {
  disabledGroups.forEach((group) => {
    if (group) group.disabled = !enabled;
  });
  saveButton.disabled = !enabled;
  if (saveRgbaButton) saveRgbaButton.disabled = !enabled;
  expandPreviewButton.disabled = !enabled;
}

function updateHistoryButtons() {
  undoButton.disabled = !state.imageLoaded || state.operations.length === 0;
  redoButton.disabled = !state.imageLoaded || state.redoOperations.length === 0;
}

function markOutputDirty() {
  state.outputVersion += 1;
  state.renderedOutputVersion = -1;
  state.directPreviewVersion = -1;
  state.directPreviewCanvas = null;
  outputFileSizeNode.textContent = '保存時に計測';
  exportWarning.hidden = true;
  renderPreview();
  if (previewModal.classList.contains('is-open')) renderModalPreview();
}

function updateSizeStatus() {
  const longEdge = Math.max(state.imageWidth, state.imageHeight);
  sizeStatusNode.className = 'size-status';
  if (longEdge < 900) {
    sizeStatusNode.textContent = '900px未満：拡大して出力';
    sizeStatusNode.classList.add('warning');
  } else if (longEdge === 900) {
    sizeStatusNode.textContent = '出力サイズと一致';
    sizeStatusNode.classList.add('good');
  } else if (longEdge <= 1800) {
    sizeStatusNode.textContent = '推奨：900pxへ高品質縮小';
    sizeStatusNode.classList.add('good');
  } else {
    sizeStatusNode.textContent = '高解像度：900pxへ縮小';
    sizeStatusNode.classList.add('caution');
  }
}

function resizeDisplayCanvas(canvas, context, container) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(container.clientWidth));
  const height = Math.max(1, Math.floor(container.clientHeight));
  const pixelWidth = Math.max(1, Math.floor(width * dpr));
  const pixelHeight = Math.max(1, Math.floor(height * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
}

function fitImageToEditor() {
  if (!state.imageLoaded) return;
  const viewportWidth = Math.max(1, editorViewport.clientWidth);
  const viewportHeight = Math.max(1, editorViewport.clientHeight);
  const padding = 28;
  const fitScale = Math.min(
    Math.max(1, viewportWidth - padding * 2) / state.imageWidth,
    Math.max(1, viewportHeight - padding * 2) / state.imageHeight
  );
  state.scale = fitScale;
  state.minScale = Math.max(fitScale * 0.35, 0.02);
  state.maxScale = Math.max(fitScale * 16, 4);
  state.offsetX = (viewportWidth - state.imageWidth * state.scale) / 2;
  state.offsetY = (viewportHeight - state.imageHeight * state.scale) / 2;
  renderEditor();
}

function clampScale(value) {
  return Math.min(state.maxScale, Math.max(state.minScale, value));
}

function zoomAt(clientX, clientY, factor) {
  if (!state.imageLoaded) return;
  const rect = editorCanvas.getBoundingClientRect();
  const canvasX = clientX - rect.left;
  const canvasY = clientY - rect.top;
  const imageX = (canvasX - state.offsetX) / state.scale;
  const imageY = (canvasY - state.offsetY) / state.scale;
  const newScale = clampScale(state.scale * factor);
  state.offsetX = canvasX - imageX * newScale;
  state.offsetY = canvasY - imageY * newScale;
  state.scale = newScale;
  renderEditor();
}

function canvasPointToImage(clientX, clientY) {
  const rect = editorCanvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.offsetX) / state.scale,
    y: (clientY - rect.top - state.offsetY) / state.scale
  };
}

function isInsideImage(point) {
  return point.x >= 0 && point.y >= 0 && point.x <= state.imageWidth && point.y <= state.imageHeight;
}

function drawMaskStroke(context, operation) {
  const points = operation.points;
  if (!points.length) return;
  context.save();
  context.globalCompositeOperation = operation.mode === 'erase' ? 'destination-out' : 'source-over';
  context.strokeStyle = '#ffffff';
  context.fillStyle = '#ffffff';
  context.lineWidth = operation.radius * 2;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (points.length === 1) {
    context.beginPath();
    context.arc(points[0].x, points[0].y, operation.radius, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x, points[index].y);
    }
    context.stroke();
  }
  context.restore();
}

function applyOperation(operation) {
  if (operation.type === 'fill') {
    maskContext.save();
    maskContext.globalCompositeOperation = 'source-over';
    maskContext.fillStyle = '#ffffff';
    maskContext.fillRect(0, 0, state.imageWidth, state.imageHeight);
    maskContext.restore();
    return;
  }
  if (operation.type === 'clear') {
    maskContext.clearRect(0, 0, state.imageWidth, state.imageHeight);
    return;
  }
  if (operation.type === 'preset-top-hide') {
    const hiddenRatio = clamp01(Number(operation.percent) / 100);
    const visibleStartY = Math.round(state.imageHeight * hiddenRatio);
    maskContext.clearRect(0, 0, state.imageWidth, state.imageHeight);
    maskContext.save();
    maskContext.globalCompositeOperation = 'source-over';
    maskContext.fillStyle = '#ffffff';
    maskContext.fillRect(0, visibleStartY, state.imageWidth, state.imageHeight - visibleStartY);
    maskContext.restore();
    return;
  }
  if (operation.type === 'stroke') drawMaskStroke(maskContext, operation);
}

function rebuildMask() {
  maskContext.clearRect(0, 0, state.imageWidth, state.imageHeight);
  state.operations.forEach(applyOperation);
  renderEditor();
  markOutputDirty();
  updateHistoryButtons();
}

function commitOperation(operation) {
  state.operations.push(operation);
  state.redoOperations = [];
  updateHistoryButtons();
  markOutputDirty();
}

function renderMaskOverlay(width, height, dpr) {
  if (overlayCanvas.width !== Math.floor(width * dpr) || overlayCanvas.height !== Math.floor(height * dpr)) {
    overlayCanvas.width = Math.floor(width * dpr);
    overlayCanvas.height = Math.floor(height * dpr);
  }
  overlayContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  overlayContext.clearRect(0, 0, width, height);
  overlayContext.save();
  overlayContext.drawImage(
    maskCanvas,
    state.offsetX,
    state.offsetY,
    state.imageWidth * state.scale,
    state.imageHeight * state.scale
  );
  overlayContext.globalCompositeOperation = 'source-in';
  overlayContext.fillStyle = 'rgba(207, 63, 145, 0.76)';
  overlayContext.fillRect(0, 0, width, height);
  overlayContext.restore();
}

function renderEditor() {
  const { width, height, dpr } = resizeDisplayCanvas(editorCanvas, editorContext, editorViewport);
  editorContext.clearRect(0, 0, width, height);
  if (!state.imageLoaded) {
    zoomIndicator.textContent = '—';
    return;
  }

  const drawWidth = state.imageWidth * state.scale;
  const drawHeight = state.imageHeight * state.scale;

  editorContext.save();
  editorContext.fillStyle = 'rgba(255,255,255,.72)';
  editorContext.fillRect(state.offsetX - 1, state.offsetY - 1, drawWidth + 2, drawHeight + 2);
  editorContext.drawImage(sourceCanvas, state.offsetX, state.offsetY, drawWidth, drawHeight);
  editorContext.restore();

  if (state.showMask) {
    renderMaskOverlay(width, height, dpr);
    editorContext.save();
    editorContext.setTransform(1, 0, 0, 1, 0, 0);
    editorContext.drawImage(overlayCanvas, 0, 0);
    editorContext.restore();
  }

  editorContext.save();
  editorContext.strokeStyle = 'rgba(69, 98, 130, .55)';
  editorContext.lineWidth = 1;
  editorContext.strokeRect(state.offsetX - .5, state.offsetY - .5, drawWidth + 1, drawHeight + 1);
  editorContext.restore();

  const fitPercent = Math.max(1, Math.round(state.scale * 100));
  zoomIndicator.textContent = `${fitPercent}%`;
}

function createNonDestructivePreview(mode = state.previewMode) {
  return getDirectPreviewOutput(mode);
}

function getPreviewBackground() {
  return state.previewMode === 'reveal'
    ? CONFIG.preview.revealBackground
    : CONFIG.preview.whiteBackground;
}

function getPreviewStageClass() {
  return state.previewMode === 'reveal' ? 'background-black' : 'background-white';
}

function renderCanvasFit(context, canvas, container, source, backgroundColor) {
  const { width, height } = resizeDisplayCanvas(canvas, context, container);
  context.clearRect(0, 0, width, height);
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, width, height);
  if (!source) return;

  const padding = Math.min(30, Math.max(12, width * .04));
  const scale = Math.min(
    (width - padding * 2) / source.width,
    (height - padding * 2) / source.height
  );
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, x, y, drawWidth, drawHeight);
}

function updatePreviewNote() {
  if (!state.imageLoaded) {
    previewNote.textContent = CONFIG.notes.timelineApproximation;
  } else if (state.previewMode === 'timeline') {
    previewNote.textContent = '保存画像を白背景へ合成し、長辺900px相当へ縮小した後、実際のXタイムライン結果を優先し、選択した「見せる範囲」だけを白背景上へ表示しています。隠し領域はツール上では完全な白として表示します。';
  } else {
    previewNote.textContent = '長辺4096pxの保存画像を黒背景へ合成し、長辺900px相当へ縮小して表示しています。クリック後に色味がグレー化しにくいか、粒感やモアレが弱まるかを確認する実験用プレビューです。';
  }
}

function renderPreview() {
  previewStage.className = `preview-stage ${getPreviewStageClass()} ${state.imageLoaded ? 'has-image' : ''}`;
  if (!state.imageLoaded) {
    resizeDisplayCanvas(previewCanvas, previewContext, previewStage);
    previewContext.clearRect(0, 0, previewStage.clientWidth, previewStage.clientHeight);
    updatePreviewNote();
    return;
  }
  const source = createNonDestructivePreview(state.previewMode);
  renderCanvasFit(previewContext, previewCanvas, previewStage, source, getPreviewBackground());
  updatePreviewNote();
}

function renderModalPreview() {
  if (!state.imageLoaded) return;
  const source = createNonDestructivePreview(state.previewMode);
  renderCanvasFit(modalContext, modalCanvas, modalCanvasWrap, source, getPreviewBackground());
}

function setTool(tool) {
  state.tool = tool;
  editorViewport.dataset.tool = tool;
  toolButtons.forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function beginStroke(event) {
  const point = canvasPointToImage(event.clientX, event.clientY);
  if (!isInsideImage(point)) return;
  const operation = {
    type: 'stroke',
    mode: state.tool === 'erase' ? 'erase' : 'hide',
    radius: Math.max(1, (state.brushSize / state.scale) / 2),
    points: [point]
  };
  state.currentStroke = { pointerId: event.pointerId, operation };
  drawMaskStroke(maskContext, operation);
  renderEditor();
}

function extendStroke(event) {
  if (!state.currentStroke || state.currentStroke.pointerId !== event.pointerId) return;
  const point = canvasPointToImage(event.clientX, event.clientY);
  state.currentStroke.operation.points.push(point);
  drawMaskStroke(maskContext, {
    ...state.currentStroke.operation,
    points: state.currentStroke.operation.points.slice(-2)
  });
  renderEditor();
}

function finishStroke(event) {
  if (!state.currentStroke || state.currentStroke.pointerId !== event.pointerId) return;
  const operation = state.currentStroke.operation;
  state.currentStroke = null;
  commitOperation(operation);
}

function beginPan(event) {
  state.panSession = {
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
    originX: state.offsetX,
    originY: state.offsetY
  };
  editorViewport.classList.add('is-panning');
}

function updatePan(event) {
  if (!state.panSession || state.panSession.pointerId !== event.pointerId) return;
  state.offsetX = state.panSession.originX + (event.clientX - state.panSession.clientX);
  state.offsetY = state.panSession.originY + (event.clientY - state.panSession.clientY);
  renderEditor();
}

function finishPan(event) {
  if (!state.panSession || state.panSession.pointerId !== event.pointerId) return;
  state.panSession = null;
  editorViewport.classList.remove('is-panning');
}

function pointerDistance(pointers) {
  const events = [...pointers.values()];
  if (events.length < 2) return 1;
  const [a, b] = events;
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function pointerCenter(pointers) {
  const events = [...pointers.values()];
  if (!events.length) return { x: 0, y: 0 };
  const x = events.reduce((sum, event) => sum + event.clientX, 0) / events.length;
  const y = events.reduce((sum, event) => sum + event.clientY, 0) / events.length;
  return { x, y };
}

function beginGesture() {
  const center = pointerCenter(state.pointers);
  const rect = editorCanvas.getBoundingClientRect();
  const canvasCenter = { x: center.x - rect.left, y: center.y - rect.top };
  state.gesture = {
    distance: Math.max(1, pointerDistance(state.pointers)),
    scale: state.scale,
    offsetX: state.offsetX,
    offsetY: state.offsetY,
    imageX: (canvasCenter.x - state.offsetX) / state.scale,
    imageY: (canvasCenter.y - state.offsetY) / state.scale
  };
}

function updateGesture() {
  if (!state.gesture || state.pointers.size < 2) return;
  const center = pointerCenter(state.pointers);
  const rect = editorCanvas.getBoundingClientRect();
  const canvasCenter = { x: center.x - rect.left, y: center.y - rect.top };
  const ratio = pointerDistance(state.pointers) / state.gesture.distance;
  const newScale = clampScale(state.gesture.scale * ratio);
  state.scale = newScale;
  state.offsetX = canvasCenter.x - state.gesture.imageX * newScale;
  state.offsetY = canvasCenter.y - state.gesture.imageY * newScale;
  renderEditor();
}

function endPointer(event) {
  finishStroke(event);
  finishPan(event);
  state.pointers.delete(event.pointerId);
  if (state.pointers.size < 2) state.gesture = null;
}

async function decodeImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch (error) {
      console.warn('createImageBitmap failed; falling back to Image.', error);
    }
  }
  return await new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像を読み込めませんでした。'));
    };
    image.src = url;
  });
}

async function loadFile(file) {
  if (!file) return;
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('PNG・JPEG・WebPを選択してください。');
    return;
  }

  try {
    const image = await decodeImage(file);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error('画像サイズを取得できませんでした。');

    state.sourceFile = file;
    state.sourceName = sanitizeBaseName(file.name);
    state.imageWidth = width;
    state.imageHeight = height;
    state.imageLoaded = true;
    state.operations = [];
    state.redoOperations = [];
    state.outputVersion = 1;
    state.renderedOutputVersion = -1;

    sourceCanvas.width = width;
    sourceCanvas.height = height;
    sourceContext.clearRect(0, 0, width, height);
    sourceContext.drawImage(image, 0, 0, width, height);
    state.sourceImageData = sourceContext.getImageData(0, 0, width, height);

    maskCanvas.width = width;
    maskCanvas.height = height;
    maskContext.clearRect(0, 0, width, height);

    fileNameNode.textContent = file.name;
    imageDimensionsNode.textContent = `${width} × ${height}px`;
    inputFileSizeNode.textContent = formatBytes(file.size);
    outputFileNameNode.textContent = outputFileName();
    outputFileSizeNode.textContent = '保存時に計測';
    fileInformation.hidden = false;
    updateSizeStatus();

    editorViewport.classList.remove('is-empty');
    previewStage.classList.add('has-image');
    setControlsEnabled(true);
    updateHistoryButtons();
    fitImageToEditor();
    renderPreview();
    showToast('画像を読み込みました。');
  } catch (error) {
    console.error(error);
    showToast(error.message || '画像を読み込めませんでした。');
  }
}

function applyWholeMask(type) {
  if (!state.imageLoaded) return;
  const operation = { type };
  applyOperation(operation);
  commitOperation(operation);
  renderEditor();
}

function applyTopHiddenPreset(percent = CONFIG.presets.topHiddenPercent) {
  if (!state.imageLoaded) return;
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const operation = { type: 'preset-top-hide', percent: safePercent };
  applyOperation(operation);
  commitOperation(operation);
  renderEditor();
  showToast(`上${safePercent}%を隠す範囲に設定しました。`);
}

function createColorPoint(key, count, rSum, gSum, bSum) {
  return {
    key,
    count,
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count)
  };
}

function getColorBoxStats(indices, points) {
  let rMin = 255;
  let rMax = 0;
  let gMin = 255;
  let gMax = 0;
  let bMin = 255;
  let bMax = 0;
  let count = 0;

  for (const pointIndex of indices) {
    const point = points[pointIndex];
    rMin = Math.min(rMin, point.r);
    rMax = Math.max(rMax, point.r);
    gMin = Math.min(gMin, point.g);
    gMax = Math.max(gMax, point.g);
    bMin = Math.min(bMin, point.b);
    bMax = Math.max(bMax, point.b);
    count += point.count;
  }

  return { indices, rMin, rMax, gMin, gMax, bMin, bMax, count };
}

function splitColorBox(box, points) {
  if (box.indices.length < 2) return null;

  const ranges = [
    box.rMax - box.rMin,
    box.gMax - box.gMin,
    box.bMax - box.bMin
  ];
  const channel = ranges.indexOf(Math.max(...ranges));
  const channelName = ['r', 'g', 'b'][channel];
  const sorted = [...box.indices].sort((left, right) => points[left][channelName] - points[right][channelName]);
  const target = box.count / 2;
  let cumulative = 0;
  let splitAt = 1;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    cumulative += points[sorted[index]].count;
    if (cumulative >= target) {
      splitAt = index + 1;
      break;
    }
  }

  if (splitAt <= 0 || splitAt >= sorted.length) return null;
  return [
    getColorBoxStats(sorted.slice(0, splitAt), points),
    getColorBoxStats(sorted.slice(splitAt), points)
  ];
}

function buildRegionPalette(imageData, selectionMaskData, region, maxColors, carrierHints = null) {
  const binCount = 32 * 32 * 32;
  const counts = new Uint32Array(binCount);
  const rSums = new Uint32Array(binCount);
  const gSums = new Uint32Array(binCount);
  const bSums = new Uint32Array(binCount);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    const pixelIndex = index >> 2;
    const isVisible = !selectionMaskData || selectionMaskData[index + 3] > 127;
    const isCarrier = Boolean(carrierHints && carrierHints[pixelIndex]);
    if (region === 'visible' && !isVisible) continue;
    if (region === 'hidden-neutral' && (isVisible || isCarrier)) continue;
    if (region === 'hidden-carrier' && (isVisible || !isCarrier)) continue;
    if (region === 'hidden' && isVisible) continue;

    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    counts[key] += 1;
    rSums[key] += r;
    gSums[key] += g;
    bSums[key] += b;
  }

  const points = [];
  for (let key = 0; key < binCount; key += 1) {
    if (!counts[key]) continue;
    points.push(createColorPoint(key, counts[key], rSums[key], gSums[key], bSums[key]));
  }

  if (!points.length || maxColors <= 0) {
    return { palette: [], binToPaletteIndex: new Uint16Array(binCount) };
  }

  let boxes = [getColorBoxStats(points.map((_, index) => index), points)];
  while (boxes.length < maxColors) {
    let selectedIndex = -1;
    let selectedScore = -1;
    for (let index = 0; index < boxes.length; index += 1) {
      const box = boxes[index];
      if (box.indices.length < 2) continue;
      const maxRange = Math.max(box.rMax - box.rMin, box.gMax - box.gMin, box.bMax - box.bMin);
      const score = maxRange * Math.sqrt(box.count);
      if (score > selectedScore) {
        selectedScore = score;
        selectedIndex = index;
      }
    }
    if (selectedIndex < 0) break;
    const split = splitColorBox(boxes[selectedIndex], points);
    if (!split) break;
    boxes.splice(selectedIndex, 1, split[0], split[1]);
  }

  const palette = [];
  const binToPaletteIndex = new Uint16Array(binCount);
  for (const box of boxes) {
    let total = 0;
    let rTotal = 0;
    let gTotal = 0;
    let bTotal = 0;
    for (const pointIndex of box.indices) {
      const point = points[pointIndex];
      total += point.count;
      rTotal += point.r * point.count;
      gTotal += point.g * point.count;
      bTotal += point.b * point.count;
    }
    const paletteIndex = palette.length;
    palette.push({
      r: Math.round(rTotal / total),
      g: Math.round(gTotal / total),
      b: Math.round(bTotal / total)
    });
    for (const pointIndex of box.indices) {
      binToPaletteIndex[points[pointIndex].key] = paletteIndex;
    }
  }
  return { palette, binToPaletteIndex };
}

function buildPartitionedPalette(imageData, selectionMaskData, visibleLimit, hiddenLimit) {
  const visible = buildRegionPalette(imageData, selectionMaskData, 'visible', visibleLimit);
  const hidden = buildRegionPalette(imageData, selectionMaskData, 'hidden', hiddenLimit);
  return {
    palette: [{ r: 0, g: 0, b: 0 }, ...visible.palette, ...hidden.palette],
    visiblePaletteLength: visible.palette.length,
    visibleMap: visible.binToPaletteIndex,
    hiddenMap: hidden.binToPaletteIndex
  };
}

function writeUint32BigEndian(target, offset, value) {
  target[offset] = (value >>> 24) & 255;
  target[offset + 1] = (value >>> 16) & 255;
  target[offset + 2] = (value >>> 8) & 255;
  target[offset + 3] = value & 255;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBytes = Uint8Array.from(type, (character) => character.charCodeAt(0));
  const chunk = new Uint8Array(12 + data.length);
  writeUint32BigEndian(chunk, 0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  writeUint32BigEndian(chunk, 8 + data.length, crc32(crcInput));
  return chunk;
}

function adler32(bytes) {
  let a = 1;
  let b = 0;
  const modulus = 65521;
  for (const byte of bytes) {
    a = (a + byte) % modulus;
    b = (b + a) % modulus;
  }
  return ((b << 16) | a) >>> 0;
}

function createStoredZlibStream(bytes) {
  const blockCount = Math.ceil(bytes.length / 65535);
  const output = new Uint8Array(2 + blockCount * 5 + bytes.length + 4);
  let outputOffset = 0;
  output[outputOffset++] = 0x78;
  output[outputOffset++] = 0x01;
  let inputOffset = 0;

  while (inputOffset < bytes.length) {
    const length = Math.min(65535, bytes.length - inputOffset);
    const isFinal = inputOffset + length >= bytes.length;
    output[outputOffset++] = isFinal ? 0x01 : 0x00;
    output[outputOffset++] = length & 255;
    output[outputOffset++] = (length >>> 8) & 255;
    const inverse = (~length) & 0xffff;
    output[outputOffset++] = inverse & 255;
    output[outputOffset++] = (inverse >>> 8) & 255;
    output.set(bytes.subarray(inputOffset, inputOffset + length), outputOffset);
    outputOffset += length;
    inputOffset += length;
  }

  writeUint32BigEndian(output, outputOffset, adler32(bytes));
  return output;
}

async function compressZlib(bytes) {
  if (typeof CompressionStream === 'function') {
    try {
      const compressedStream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'));
      return new Uint8Array(await new Response(compressedStream).arrayBuffer());
    } catch (error) {
      console.warn('CompressionStream failed; using uncompressed DEFLATE blocks.', error);
    }
  }
  return createStoredZlibStream(bytes);
}

function concatenateUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    output.set(array, offset);
    offset += array.length;
  }
  return output;
}

function setExportProgress(value, message, visible = true) {
  if (!exportProgress || !exportProgressBar || !exportProgressText) return;
  exportProgress.hidden = !visible;
  exportProgressBar.value = Math.max(0, Math.min(100, value));
  exportProgressText.textContent = message;
}

function yieldForPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

const HIDDEN_COMPOSITE_BIN_COUNT = 1 << 19;

function getHiddenCompositeKey(data, sourceIndex) {
  const alpha = data[sourceIndex + 3];
  const blackR = clampByte(data[sourceIndex] * alpha / 255);
  const blackG = clampByte(data[sourceIndex + 1] * alpha / 255);
  const blackB = clampByte(data[sourceIndex + 2] * alpha / 255);
  const rBin = Math.min(31, blackR >> 1);
  const gBin = Math.min(31, blackG >> 1);
  const bBin = Math.min(31, blackB >> 1);
  const aBin = Math.min(15, alpha >> 4);
  return (rBin << 14) | (gBin << 9) | (bBin << 4) | aBin;
}

function createHiddenCompositePoint(key, count, blackRSum, blackGSum, blackBSum, alphaSum) {
  return {
    key,
    count,
    blackR: blackRSum / count,
    blackG: blackGSum / count,
    blackB: blackBSum / count,
    alpha: alphaSum / count
  };
}

function getHiddenCompositeBoxStats(indices, points) {
  let blackRMin = 255;
  let blackRMax = 0;
  let blackGMin = 255;
  let blackGMax = 0;
  let blackBMin = 255;
  let blackBMax = 0;
  let alphaMin = 255;
  let alphaMax = 0;
  let count = 0;

  for (const pointIndex of indices) {
    const point = points[pointIndex];
    blackRMin = Math.min(blackRMin, point.blackR);
    blackRMax = Math.max(blackRMax, point.blackR);
    blackGMin = Math.min(blackGMin, point.blackG);
    blackGMax = Math.max(blackGMax, point.blackG);
    blackBMin = Math.min(blackBMin, point.blackB);
    blackBMax = Math.max(blackBMax, point.blackB);
    alphaMin = Math.min(alphaMin, point.alpha);
    alphaMax = Math.max(alphaMax, point.alpha);
    count += point.count;
  }

  return {
    indices,
    blackRMin,
    blackRMax,
    blackGMin,
    blackGMax,
    blackBMin,
    blackBMax,
    alphaMin,
    alphaMax,
    count
  };
}

function splitHiddenCompositeBox(box, points) {
  if (box.indices.length < 2) return null;
  const ranges = [
    box.blackRMax - box.blackRMin,
    box.blackGMax - box.blackGMin,
    box.blackBMax - box.blackBMin,
    (box.alphaMax - box.alphaMin) * 1.15
  ];
  const properties = ['blackR', 'blackG', 'blackB', 'alpha'];
  const property = properties[ranges.indexOf(Math.max(...ranges))];
  const sorted = [...box.indices].sort((left, right) => points[left][property] - points[right][property]);
  const target = box.count / 2;
  let cumulative = 0;
  let splitAt = 1;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    cumulative += points[sorted[index]].count;
    if (cumulative >= target) {
      splitAt = index + 1;
      break;
    }
  }

  if (splitAt <= 0 || splitAt >= sorted.length) return null;
  return [
    getHiddenCompositeBoxStats(sorted.slice(0, splitAt), points),
    getHiddenCompositeBoxStats(sorted.slice(splitAt), points)
  ];
}

function buildHiddenCompositePalette(imageData, selectionMaskData, maxColors) {
  const counts = new Uint32Array(HIDDEN_COMPOSITE_BIN_COUNT);
  const blackRSums = new Uint32Array(HIDDEN_COMPOSITE_BIN_COUNT);
  const blackGSums = new Uint32Array(HIDDEN_COMPOSITE_BIN_COUNT);
  const blackBSums = new Uint32Array(HIDDEN_COMPOSITE_BIN_COUNT);
  const alphaSums = new Uint32Array(HIDDEN_COMPOSITE_BIN_COUNT);
  const data = imageData.data;

  for (let sourceIndex = 0; sourceIndex < data.length; sourceIndex += 4) {
    const alpha = data[sourceIndex + 3];
    if (alpha < 1) continue;
    const isVisible = !selectionMaskData || selectionMaskData[sourceIndex + 3] > 127;
    if (isVisible) continue;
    const key = getHiddenCompositeKey(data, sourceIndex);
    counts[key] += 1;
    blackRSums[key] += clampByte(data[sourceIndex] * alpha / 255);
    blackGSums[key] += clampByte(data[sourceIndex + 1] * alpha / 255);
    blackBSums[key] += clampByte(data[sourceIndex + 2] * alpha / 255);
    alphaSums[key] += alpha;
  }

  const points = [];
  for (let key = 0; key < HIDDEN_COMPOSITE_BIN_COUNT; key += 1) {
    if (!counts[key]) continue;
    points.push(createHiddenCompositePoint(
      key,
      counts[key],
      blackRSums[key],
      blackGSums[key],
      blackBSums[key],
      alphaSums[key]
    ));
  }

  if (!points.length || maxColors <= 0) {
    return { palette: [], binToPaletteIndex: new Uint16Array(HIDDEN_COMPOSITE_BIN_COUNT) };
  }

  let boxes = [getHiddenCompositeBoxStats(points.map((_, index) => index), points)];
  while (boxes.length < maxColors) {
    let selectedIndex = -1;
    let selectedScore = -1;
    for (let index = 0; index < boxes.length; index += 1) {
      const box = boxes[index];
      if (box.indices.length < 2) continue;
      const maxRange = Math.max(
        box.blackRMax - box.blackRMin,
        box.blackGMax - box.blackGMin,
        box.blackBMax - box.blackBMin,
        (box.alphaMax - box.alphaMin) * 1.15
      );
      const score = maxRange * Math.sqrt(box.count);
      if (score > selectedScore) {
        selectedScore = score;
        selectedIndex = index;
      }
    }
    if (selectedIndex < 0) break;
    const split = splitHiddenCompositeBox(boxes[selectedIndex], points);
    if (!split) break;
    boxes.splice(selectedIndex, 1, split[0], split[1]);
  }

  const palette = [];
  const binToPaletteIndex = new Uint16Array(HIDDEN_COMPOSITE_BIN_COUNT);
  for (const box of boxes) {
    let total = 0;
    let blackRTotal = 0;
    let blackGTotal = 0;
    let blackBTotal = 0;
    let alphaTotal = 0;
    for (const pointIndex of box.indices) {
      const point = points[pointIndex];
      total += point.count;
      blackRTotal += point.blackR * point.count;
      blackGTotal += point.blackG * point.count;
      blackBTotal += point.blackB * point.count;
      alphaTotal += point.alpha * point.count;
    }

    const alpha = Math.max(1, clampByte(alphaTotal / total));
    const paletteIndex = palette.length;
    palette.push({
      r: clampByte((blackRTotal / total) * 255 / alpha),
      g: clampByte((blackGTotal / total) * 255 / alpha),
      b: clampByte((blackBTotal / total) * 255 / alpha),
      a: alpha
    });
    for (const pointIndex of box.indices) {
      binToPaletteIndex[points[pointIndex].key] = paletteIndex;
    }
  }

  return { palette, binToPaletteIndex };
}


async function encodeIndexedPng(imageData, selectionMaskData = null, onProgress = null) {
  const { width, height, data } = imageData;
  const configuredColors = Math.max(1, Math.min(254, CONFIG.export.palette.visibleColors ?? 254));

  onProgress?.(28, '保存画像の不透明ピクセルを解析しています…');
  await yieldForPaint();
  const opaquePalette = buildRegionPalette(imageData, null, 'visible', configuredColors);

  const palette = [
    { r: 0, g: 0, b: 0, a: 0 },
    ...opaquePalette.palette.map((color) => ({ ...color, a: 255 }))
  ];

  const paletteBytes = new Uint8Array(palette.length * 3);
  const alphaBytes = new Uint8Array(palette.length);
  for (let index = 0; index < palette.length; index += 1) {
    paletteBytes[index * 3] = palette[index].r;
    paletteBytes[index * 3 + 1] = palette[index].g;
    paletteBytes[index * 3 + 2] = palette[index].b;
    alphaBytes[index] = palette[index].a;
  }

  onProgress?.(56, 'PNG-8パレットへ割り当てています…');
  await yieldForPaint();
  const scanlines = new Uint8Array((width + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width + 1);
    scanlines[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (y * width + x) * 4;
      if (data[sourceIndex + 3] < 1) {
        scanlines[rowOffset + x + 1] = 0;
        continue;
      }
      const key = ((data[sourceIndex] >> 3) << 10)
        | ((data[sourceIndex + 1] >> 3) << 5)
        | (data[sourceIndex + 2] >> 3);
      scanlines[rowOffset + x + 1] = 1 + opaquePalette.binToPaletteIndex[key];
    }
  }

  const ihdr = new Uint8Array(13);
  writeUint32BigEndian(ihdr, 0, width);
  writeUint32BigEndian(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 3;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const srgb = Uint8Array.from([1]);

  onProgress?.(84, 'PNG-8を圧縮しています…');
  await yieldForPaint();
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const compressed = await compressZlib(scanlines);
  const pngBytes = concatenateUint8Arrays([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('sRGB', srgb),
    makePngChunk('PLTE', paletteBytes),
    makePngChunk('tRNS', alphaBytes),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', new Uint8Array(0))
  ]);
  onProgress?.(96, 'ダウンロードファイルを準備しています…');
  return new Blob([pngBytes], { type: 'image/png' });
}

function triggerBlobDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function encodeRgbaPng(imageData, onProgress) {
  onProgress?.(70, 'RGBA PNGを構成しています…');
  await yieldForPaint();
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.putImageData(imageData, 0, 0);
  onProgress?.(88, 'RGBA PNGを変換しています…');
  await yieldForPaint();
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('RGBA PNGの生成に失敗しました。'));
    }, 'image/png');
  });
  onProgress?.(96, 'ダウンロードファイルを準備しています…');
  return blob;
}

async function saveOutput(kind = 'png8') {
  if (!state.imageLoaded) return;
  const isRgba = kind === 'rgba';
  saveButton.disabled = true;
  if (saveRgbaButton) saveRgbaButton.disabled = true;
  saveButton.textContent = isRgba ? 'PNG-8を保存' : '保存画像を作成中…';
  if (saveRgbaButton) saveRgbaButton.textContent = isRgba ? '保存画像を作成中…' : 'RGBA PNGを保存（診断用）';
  setExportProgress(5, '元画像と範囲マスクを読み込んでいます…');
  try {
    await yieldForPaint();
    setExportProgress(18, isRgba ? '元画像から長辺4096pxのRGBA診断画像を生成しています…' : '元画像から長辺4096pxの高解像度2値透明パターンを生成しています…');
    await yieldForPaint();

    const exportResult = createBinaryPatternOutput();
    if (!exportResult) throw new Error('保存画像を生成できませんでした。');
    const blob = isRgba
      ? await encodeRgbaPng(exportResult.imageData, (value, message) => setExportProgress(value, message))
      : await encodeIndexedPng(exportResult.imageData, exportResult.selectionMaskData, (value, message) => setExportProgress(value, message));

    const name = outputFileName(isRgba ? 'rgba' : 'png8');
    outputFileNameNode.textContent = name;
    outputFileSizeNode.textContent = formatBytes(blob.size);
    if (blob.size > 5 * 1024 * 1024) {
      exportWarning.hidden = false;
      exportWarning.textContent = `出力ファイルは${formatBytes(blob.size)}です。Xの静止画像上限を超える可能性があるため、投稿時にご確認ください。`;
    } else {
      exportWarning.hidden = false;
      exportWarning.textContent = isRgba
        ? 'RGBA PNG は診断用です。同じ画素内容を標準的なRGBA PNGで保存し、X投稿可否をPNG-8版と比較してください。'
        : 'PNG-8 は本命の比較対象です。もし投稿に失敗し、RGBA版だけ成功するなら、PNG-8構造側に原因がある可能性があります。';
    }

    triggerBlobDownload(blob, name);
    setExportProgress(100, isRgba ? 'RGBA PNGを作成しました。' : 'PNG-8を作成しました。');
    showToast(isRgba ? 'RGBA PNG（診断用）を保存しました。' : 'PNG-8を保存しました。');
  } catch (error) {
    console.error(error);
    setExportProgress(0, '保存処理に失敗しました。');
    showToast(error.message || '保存に失敗しました。');
  } finally {
    saveButton.disabled = false;
    if (saveRgbaButton) saveRgbaButton.disabled = false;
    saveButton.textContent = 'PNG-8を保存';
    if (saveRgbaButton) saveRgbaButton.textContent = 'RGBA PNGを保存（診断用）';
    setTimeout(() => setExportProgress(0, '', false), 1800);
  }
}

fileInput.addEventListener('change', () => loadFile(fileInput.files?.[0]));
['dragenter', 'dragover'].forEach((type) => {
  dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.add('is-dragover');
  });
});
['dragleave', 'drop'].forEach((type) => {
  dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.remove('is-dragover');
  });
});
dropZone.addEventListener('drop', (event) => loadFile(event.dataTransfer?.files?.[0]));

toolButtons.forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool)));
brushSizeInput.addEventListener('input', () => {
  state.brushSize = Number(brushSizeInput.value);
  brushSizeValue.textContent = `${state.brushSize}px`;
});
revealBoostInput.addEventListener('input', () => {
  if (revealBoostInput.disabled) return;
  state.revealBoost = Number(revealBoostInput.value) / 100;
  revealBoostValue.textContent = formatBoostLabel(state.revealBoost);
  previewTabs.forEach((item) => {
    const active = item.dataset.preview === state.previewMode;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
  });
  markOutputDirty();
});
showMaskToggle.addEventListener('change', () => {
  state.showMask = showMaskToggle.checked;
  renderEditor();
});
maskAllButton.addEventListener('click', () => applyWholeMask('fill'));
clearMaskButton.addEventListener('click', () => applyWholeMask('clear'));
top40Button.addEventListener('click', () => applyTopHiddenPreset());
undoButton.addEventListener('click', () => {
  const operation = state.operations.pop();
  if (!operation) return;
  state.redoOperations.push(operation);
  rebuildMask();
});
redoButton.addEventListener('click', () => {
  const operation = state.redoOperations.pop();
  if (!operation) return;
  state.operations.push(operation);
  rebuildMask();
});
fitButton.addEventListener('click', fitImageToEditor);
zoomInButton.addEventListener('click', () => {
  const rect = editorCanvas.getBoundingClientRect();
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
});
zoomOutButton.addEventListener('click', () => {
  const rect = editorCanvas.getBoundingClientRect();
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, .8);
});

previewTabs.forEach((tab) => tab.addEventListener('click', () => {
  state.previewMode = tab.dataset.preview;
  previewTabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
  });
  renderPreview();
}));

editorCanvas.addEventListener('wheel', (event) => {
  if (!state.imageLoaded) return;
  event.preventDefault();
  zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.12 : .89);
}, { passive: false });

editorCanvas.addEventListener('pointerdown', (event) => {
  if (!state.imageLoaded) return;
  event.preventDefault();
  editorCanvas.setPointerCapture(event.pointerId);
  state.pointers.set(event.pointerId, event);

  if (event.pointerType === 'touch' && state.pointers.size >= 2) {
    beginGesture();
    return;
  }
  if (state.tool === 'pan' || event.button === 1 || event.button === 2) beginPan(event);
  else beginStroke(event);
});

editorCanvas.addEventListener('pointermove', (event) => {
  if (!state.imageLoaded) return;
  if (state.pointers.has(event.pointerId)) state.pointers.set(event.pointerId, event);
  if (state.gesture && state.pointers.size >= 2) {
    event.preventDefault();
    updateGesture();
    return;
  }
  if (state.panSession) updatePan(event);
  else extendStroke(event);
});

['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
  editorCanvas.addEventListener(type, endPointer);
});
editorCanvas.addEventListener('contextmenu', (event) => event.preventDefault());

saveButton.addEventListener('click', () => saveOutput('png8'));
if (saveRgbaButton) saveRgbaButton.addEventListener('click', () => saveOutput('rgba'));
expandPreviewButton.addEventListener('click', () => {
  if (!state.imageLoaded) return;
  previewModal.classList.add('is-open');
  previewModal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(renderModalPreview);
});
closePreviewModal.addEventListener('click', () => {
  previewModal.classList.remove('is-open');
  previewModal.setAttribute('aria-hidden', 'true');
});
previewModal.addEventListener('click', (event) => {
  if (event.target === previewModal) closePreviewModal.click();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && previewModal.classList.contains('is-open')) closePreviewModal.click();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && state.imageLoaded) {
    event.preventDefault();
    if (event.shiftKey) redoButton.click();
    else undoButton.click();
  }
});

const resizeObserver = new ResizeObserver(() => {
  renderEditor();
  renderPreview();
  if (previewModal.classList.contains('is-open')) renderModalPreview();
});
resizeObserver.observe(editorViewport);
resizeObserver.observe(previewStage);
resizeObserver.observe(modalCanvasWrap);

revealBoostValue.textContent = formatBoostLabel(state.revealBoost);
previewTabs.forEach((item) => {
  const active = item.dataset.preview === state.previewMode;
  item.classList.toggle('is-active', active);
  item.setAttribute('aria-selected', String(active));
});
setTool(CONFIG.editor.defaultTool);
setControlsEnabled(false);
renderEditor();
renderPreview();
