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
    version: 'v0.12.0',
    updatedAt: ''
  },
  output: {
    fileSuffix: 'reveal-positive-composite-v0120'
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
      visibleColors: 228,
      hiddenColors: 20
    },
    hiddenAlpha: {
      base: 124,
      strong: 148
    },
    hiddenAlphaAdaptive: {
      enabled: true,
      minBase: 146,
      minStrong: 146,
      maxBase: 210,
      maxStrong: 210,
      gammaBase: 1.15,
      gammaStrong: 1.15
    },
    hiddenLook: {
      hiddenMeanDarkBase: 232,
      hiddenMeanDarkStrong: 232,
      hiddenMeanBrightBase: 246,
      hiddenMeanBrightStrong: 246,
      revealMeanDarkBase: 68,
      revealMeanDarkStrong: 68,
      revealMeanBrightBase: 154,
      revealMeanBrightStrong: 154,
      whiteTargetDarkBase: 249,
      whiteTargetDarkStrong: 249,
      whiteTargetBrightBase: 248,
      whiteTargetBrightStrong: 248,
      preliftBase: 0.88,
      preliftStrong: 0.88,
      chromaKeepBase: 0.40,
      chromaKeepStrong: 0.40,
      neutralizeBase: 0.08,
      neutralizeStrong: 0.08,
      hueRestoreBase: 0.26,
      hueRestoreStrong: 0.26,
      tintColor: { r: 236, g: 230, b: 246 },
      tintMixBase: 0.03,
      tintMixStrong: 0.03
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
    max: 1.40,
    step: 0.05,
    labelPrecision: 2
  },
  notes: {
    timelineApproximation: '編集時は元画像と範囲マスクだけを使った非破壊プレビューを表示します。現版はブースト1.00固定のまま、白背景では現在と同等以上の白さを維持しつつ、黒背景では元絵の明暗が正方向に残るよう、隠し領域のRGBとアルファをセットで再計算する確認版です。'
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

  if (versionBadgeNode) versionBadgeNode.textContent = CONFIG.meta?.version || 'v0.8.0';
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

function outputFileName() {
  return `${state.sourceName}-${CONFIG.output.fileSuffix}.png`;
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

function getHiddenRegionAlpha(boost) {
  const base = CONFIG.export.hiddenAlpha?.base ?? 86;
  const strong = CONFIG.export.hiddenAlpha?.strong ?? 112;
  return clampByte(lerp(base, strong, getBoostNormalized(boost)));
}

function applyHiddenStyleToPixel(r, g, b, boost) {
  const boosted = applyRevealBoostToPixel(r, g, b, boost);
  const normalized = getBoostNormalized(boost);
  const hiddenLook = CONFIG.export.hiddenLook || {};

  const hiddenMeanDark = lerp(
    hiddenLook.hiddenMeanDarkBase ?? 232,
    hiddenLook.hiddenMeanDarkStrong ?? 232,
    normalized
  );
  const hiddenMeanBright = lerp(
    hiddenLook.hiddenMeanBrightBase ?? 246,
    hiddenLook.hiddenMeanBrightStrong ?? 246,
    normalized
  );
  const prelift = lerp(
    hiddenLook.preliftBase ?? 0.88,
    hiddenLook.preliftStrong ?? 0.88,
    normalized
  );
  const chromaKeep = lerp(
    hiddenLook.chromaKeepBase ?? 0.40,
    hiddenLook.chromaKeepStrong ?? 0.40,
    normalized
  );
  const neutralize = lerp(
    hiddenLook.neutralizeBase ?? 0.08,
    hiddenLook.neutralizeStrong ?? 0.08,
    normalized
  );
  const hueRestore = lerp(
    hiddenLook.hueRestoreBase ?? 0.26,
    hiddenLook.hueRestoreStrong ?? 0.26,
    normalized
  );
  const tintMix = lerp(
    hiddenLook.tintMixBase ?? 0.03,
    hiddenLook.tintMixStrong ?? 0.03,
    normalized
  );
  const tintColor = hiddenLook.tintColor || { r: 236, g: 230, b: 246 };

  const luminance = 0.299 * boosted.r + 0.587 * boosted.g + 0.114 * boosted.b;
  const luminance01 = luminance / 255;
  const targetMean = lerp(hiddenMeanDark, hiddenMeanBright, Math.pow(luminance01, 0.90));

  let rr = lerp(boosted.r, 255, prelift);
  let gg = lerp(boosted.g, 255, prelift);
  let bb = lerp(boosted.b, 255, prelift);

  let mean = (rr + gg + bb) / 3;
  const meanShift = targetMean - mean;
  rr += meanShift;
  gg += meanShift;
  bb += meanShift;

  mean = (rr + gg + bb) / 3;
  rr = lerp(mean, rr, chromaKeep);
  gg = lerp(mean, gg, chromaKeep);
  bb = lerp(mean, bb, chromaKeep);

  mean = (rr + gg + bb) / 3;
  rr = lerp(rr, mean, neutralize);
  gg = lerp(gg, mean, neutralize);
  bb = lerp(bb, mean, neutralize);

  const hueMix = hueRestore * (0.92 - 0.28 * luminance01);
  rr = lerp(rr, boosted.r, hueMix);
  gg = lerp(gg, boosted.g, hueMix);
  bb = lerp(bb, boosted.b, hueMix);

  rr = lerp(rr, tintColor.r, tintMix);
  gg = lerp(gg, tintColor.g, tintMix);
  bb = lerp(bb, tintColor.b, tintMix);

  rr = clampByte(Math.max(targetMean - 18, Math.min(252, rr)));
  gg = clampByte(Math.max(targetMean - 18, Math.min(252, gg)));
  bb = clampByte(Math.max(targetMean - 18, Math.min(252, bb)));

  return { r: rr, g: gg, b: bb };
}

function getAdaptiveHiddenAlphaFromLuminance(luminance, boost, hiddenPixel = null) {
  const adaptive = CONFIG.export.hiddenAlphaAdaptive || {};
  const hiddenLook = CONFIG.export.hiddenLook || {};
  const normalized = getBoostNormalized(boost);
  const luminance01 = clamp01(luminance / 255);

  const hiddenMeanDark = lerp(hiddenLook.hiddenMeanDarkBase ?? 232, hiddenLook.hiddenMeanDarkStrong ?? 232, normalized);
  const hiddenMeanBright = lerp(hiddenLook.hiddenMeanBrightBase ?? 246, hiddenLook.hiddenMeanBrightStrong ?? 246, normalized);
  const revealMeanDark = lerp(hiddenLook.revealMeanDarkBase ?? 68, hiddenLook.revealMeanDarkStrong ?? 68, normalized);
  const revealMeanBright = lerp(hiddenLook.revealMeanBrightBase ?? 154, hiddenLook.revealMeanBrightStrong ?? 154, normalized);
  const whiteTargetDark = lerp(hiddenLook.whiteTargetDarkBase ?? 249, hiddenLook.whiteTargetDarkStrong ?? 249, normalized);
  const whiteTargetBright = lerp(hiddenLook.whiteTargetBrightBase ?? 248, hiddenLook.whiteTargetBrightStrong ?? 248, normalized);

  const hiddenMean = hiddenPixel
    ? ((hiddenPixel.r + hiddenPixel.g + hiddenPixel.b) / 3)
    : lerp(hiddenMeanDark, hiddenMeanBright, Math.pow(luminance01, 0.90));

  const revealMeanTarget = lerp(revealMeanDark, revealMeanBright, Math.pow(luminance01, 0.92));
  const whiteTarget = lerp(whiteTargetDark, whiteTargetBright, Math.pow(luminance01, 0.92));

  let alpha01 = revealMeanTarget / Math.max(1, hiddenMean);
  const maxAlphaByWhite = (255 - whiteTarget) / Math.max(1, 255 - hiddenMean);
  alpha01 = Math.min(alpha01, maxAlphaByWhite);

  // 旧版のalpha最小値設定は白背景を暗くしすぎたため、v0.12では
  // 正方向の見え方を優先しつつ、穏やかな固定範囲だけを設けます。
  alpha01 = Math.max(0.18, Math.min(0.62, alpha01));

  return clampByte(clamp01(alpha01) * 255);
}

function getSourcePixelLuminanceAtIndex(sourcePixels, index) {
  return 0.299 * sourcePixels[index] + 0.587 * sourcePixels[index + 1] + 0.114 * sourcePixels[index + 2];
}

function createExportImageData(selectionMaskData) {
  const sourceData = state.sourceImageData;
  const exportData = new ImageData(new Uint8ClampedArray(sourceData.data), state.imageWidth, state.imageHeight);
  const pixels = exportData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 1) continue;
    const isVisible = !selectionMaskData || selectionMaskData[index + 3] > 32;
    if (isVisible) continue;
    const hiddenStyled = applyHiddenStyleToPixel(pixels[index], pixels[index + 1], pixels[index + 2], state.revealBoost);
    pixels[index] = hiddenStyled.r;
    pixels[index + 1] = hiddenStyled.g;
    pixels[index + 2] = hiddenStyled.b;
  }

  return exportData;
}

function getSelectionMaskData() {
  if (!state.imageLoaded) return null;
  return maskContext.getImageData(0, 0, state.imageWidth, state.imageHeight).data;
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
  expandPreviewButton.disabled = !enabled;
}

function updateHistoryButtons() {
  undoButton.disabled = !state.imageLoaded || state.operations.length === 0;
  redoButton.disabled = !state.imageLoaded || state.redoOperations.length === 0;
}

function markOutputDirty() {
  state.outputVersion += 1;
  state.renderedOutputVersion = -1;
  outputFileSizeNode.textContent = '保存時に計測';
  exportWarning.hidden = true;
  renderPreview();
  if (previewModal.classList.contains('is-open')) renderModalPreview();
}

function updateSizeStatus() {
  const longEdge = Math.max(state.imageWidth, state.imageHeight);
  sizeStatusNode.className = 'size-status';
  if (longEdge < 800) {
    sizeStatusNode.textContent = '低解像度：効果が不安定になる可能性';
    sizeStatusNode.classList.add('warning');
  } else if (longEdge < 1200) {
    sizeStatusNode.textContent = '使用可能：テスト推奨';
    sizeStatusNode.classList.add('caution');
  } else if (longEdge <= 1600) {
    sizeStatusNode.textContent = '暫定推奨サイズ';
    sizeStatusNode.classList.add('good');
  } else if (longEdge <= 2000) {
    sizeStatusNode.textContent = '使用可能：X側の縮小に注意';
    sizeStatusNode.classList.add('caution');
  } else {
    sizeStatusNode.textContent = '高解像度：出力容量に注意';
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

function getXTimelineSize(width, height) {
  const maxLongEdge = CONFIG.preview.timelineApproximation.maxLongEdge;
  const ratio = Math.min(1, maxLongEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

function applyXTimelineAlphaApproximation(imageData) {
  const pixels = imageData.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;

    // Xの900px派生PNGを比較した結果、半透明は保持されず、
    // ほぼ「透明 / 不透明」の2値へ戻されていました。
    let keepOpaque = alpha >= CONFIG.preview.timelineApproximation.alphaThreshold;

    // 128付近では淡い輪郭色の一部だけが残る傾向があったため、
    // 測定結果に基づく小さな残存条件を加えます。
    if (!keepOpaque
      && alpha >= CONFIG.preview.timelineApproximation.edgeAlphaThreshold
      && red > CONFIG.preview.timelineApproximation.preserveMinRed
      && luminance <= CONFIG.preview.timelineApproximation.preserveMaxLuminance) {
      keepOpaque = true;
    }

    pixels[index + 3] = keepOpaque ? 255 : 0;
  }
  return imageData;
}

function createVisibleLayerAtSize(width, height) {
  cleanPreviewVisibleCanvas.width = width;
  cleanPreviewVisibleCanvas.height = height;
  cleanPreviewVisibleContext.clearRect(0, 0, width, height);
  cleanPreviewVisibleContext.imageSmoothingEnabled = true;
  cleanPreviewVisibleContext.imageSmoothingQuality = 'high';
  cleanPreviewVisibleContext.drawImage(sourceCanvas, 0, 0, width, height);
  cleanPreviewVisibleContext.globalCompositeOperation = 'destination-in';
  cleanPreviewVisibleContext.drawImage(maskCanvas, 0, 0, width, height);
  cleanPreviewVisibleContext.globalCompositeOperation = 'source-over';
  return cleanPreviewVisibleCanvas;
}

function createHiddenLayerAtSize(width, height, options = {}) {
  const alphaScale = options.alphaScale ?? 1;
  const sourceForLuminance = options.sourceForLuminance || sourceCanvas;

  hiddenPreviewCanvas.width = width;
  hiddenPreviewCanvas.height = height;
  hiddenPreviewContext.clearRect(0, 0, width, height);
  hiddenPreviewContext.imageSmoothingEnabled = true;
  hiddenPreviewContext.imageSmoothingQuality = 'high';
  hiddenPreviewContext.drawImage(sourceCanvas, 0, 0, width, height);

  const hiddenImageData = hiddenPreviewContext.getImageData(0, 0, width, height);
  const pixels = hiddenImageData.data;

  timelineResampleCanvas.width = width;
  timelineResampleCanvas.height = height;
  timelineResampleContext.clearRect(0, 0, width, height);
  timelineResampleContext.imageSmoothingEnabled = true;
  timelineResampleContext.imageSmoothingQuality = 'high';
  timelineResampleContext.drawImage(sourceForLuminance, 0, 0, width, height);
  const referencePixels = timelineResampleContext.getImageData(0, 0, width, height).data;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 1) continue;
    const hiddenStyled = applyHiddenStyleToPixel(pixels[index], pixels[index + 1], pixels[index + 2], state.revealBoost);
    pixels[index] = hiddenStyled.r;
    pixels[index + 1] = hiddenStyled.g;
    pixels[index + 2] = hiddenStyled.b;
    const luminance = getSourcePixelLuminanceAtIndex(referencePixels, index);
    pixels[index + 3] = clampByte(getAdaptiveHiddenAlphaFromLuminance(luminance, state.revealBoost, hiddenStyled) * alphaScale);
  }
  hiddenPreviewContext.putImageData(hiddenImageData, 0, 0);
  hiddenPreviewContext.globalCompositeOperation = 'destination-out';
  hiddenPreviewContext.drawImage(maskCanvas, 0, 0, width, height);
  hiddenPreviewContext.globalCompositeOperation = 'source-over';
  return hiddenPreviewCanvas;
}

function createNonDestructivePreview(mode = state.previewMode) {
  if (!state.imageLoaded) return null;
  const target = getXTimelineSize(state.imageWidth, state.imageHeight);
  const width = mode === 'timeline' ? target.width : state.imageWidth;
  const height = mode === 'timeline' ? target.height : state.imageHeight;

  cleanPreviewCanvas.width = width;
  cleanPreviewCanvas.height = height;
  cleanPreviewContext.clearRect(0, 0, width, height);
  cleanPreviewContext.imageSmoothingEnabled = true;
  cleanPreviewContext.imageSmoothingQuality = 'high';

  const isReveal = mode === 'reveal';
  cleanPreviewContext.fillStyle = isReveal
    ? CONFIG.preview.timelineApproximation.revealBackground
    : CONFIG.preview.timelineApproximation.whiteBackground;
  cleanPreviewContext.fillRect(0, 0, width, height);

  // 編集中も保存時に近い「淡色＋半透明」の隠しレイヤーを再計算します。
  // ただしPNG-8化は行わず、白背景では見えにくく、黒背景ではうっすら見える方向へ近似表示します。
  const hiddenOpacityScale = isReveal
    ? (CONFIG.preview.nonDestructive.revealHiddenAlphaScale ?? 1.00)
    : (CONFIG.preview.nonDestructive.timelineHiddenAlphaScale ?? 1.00);
  const hiddenLayer = createHiddenLayerAtSize(width, height, {
    alphaScale: hiddenOpacityScale,
    sourceForLuminance: sourceCanvas
  });

  cleanPreviewContext.drawImage(hiddenLayer, 0, 0);

  const visibleLayer = createVisibleLayerAtSize(width, height);
  cleanPreviewContext.save();
  if (isReveal && 'filter' in cleanPreviewContext) {
    cleanPreviewContext.filter = `brightness(${CONFIG.preview.nonDestructive.revealVisibleBrightness})`;
  }
  cleanPreviewContext.drawImage(visibleLayer, 0, 0);
  cleanPreviewContext.restore();
  cleanPreviewContext.filter = 'none';

  return cleanPreviewCanvas;
}

function getPreviewBackground() {
  return state.previewMode === 'reveal'
    ? CONFIG.preview.timelineApproximation.revealBackground
    : CONFIG.preview.timelineApproximation.whiteBackground;
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
    previewNote.textContent = '元画像と範囲マスクから、隠す範囲を高輝度・色相保持寄りの淡色＋可変半透明で再計算した非破壊プレビューです。白背景では白さを維持しつつ、クリック後に灰色ベタや黒反転っぽさが出にくい方向へ寄せています。';
  } else {
    previewNote.textContent = '黒背景へ元画像由来の高輝度カラー＋可変半透明レイヤーを重ねた近似表示です。暗部の輪郭や顔の判別性を少し残しつつ、全体が一様な灰色になりにくい方向へ寄せています。';
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

function buildRegionPalette(imageData, selectionMaskData, region, maxColors) {
  const binCount = 32 * 32 * 32;
  const counts = new Uint32Array(binCount);
  const rSums = new Uint32Array(binCount);
  const gSums = new Uint32Array(binCount);
  const bSums = new Uint32Array(binCount);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    const isVisible = !selectionMaskData || selectionMaskData[index + 3] > 32;
    if (region === 'visible' ? !isVisible : isVisible) continue;

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

async function encodeIndexedPng(imageData, selectionMaskData = null, hiddenAlpha = 48, onProgress = null, originalImageData = imageData) {
  const { width, height, data } = imageData;
  const visibleLimit = Math.max(1, Math.min(254, CONFIG.export.palette.visibleColors));
  const hiddenLimit = Math.max(1, Math.min(254 - visibleLimit + 1, CONFIG.export.palette.hiddenColors));

  onProgress?.(32, '見せる範囲の色を解析しています…');
  await yieldForPaint();
  const visible = buildRegionPalette(imageData, selectionMaskData, 'visible', visibleLimit);

  onProgress?.(52, '隠す範囲の色を解析しています…');
  await yieldForPaint();
  const remaining = Math.max(1, 255 - visible.palette.length);
  const hidden = buildRegionPalette(imageData, selectionMaskData, 'hidden', Math.min(hiddenLimit, remaining));

  const palette = [{ r: 0, g: 0, b: 0 }, ...visible.palette, ...hidden.palette];
  const visibleOffset = 1;
  const hiddenOffset = 1 + visible.palette.length;
  const paletteBytes = new Uint8Array(palette.length * 3);
  for (let index = 0; index < palette.length; index += 1) {
    paletteBytes[index * 3] = palette[index].r;
    paletteBytes[index * 3 + 1] = palette[index].g;
    paletteBytes[index * 3 + 2] = palette[index].b;
  }

  const alphaBytes = new Uint8Array(palette.length);
  alphaBytes[0] = 0;
  for (let index = 1; index < hiddenOffset; index += 1) alphaBytes[index] = 255;

  const hiddenLumaSums = new Float64Array(hidden.palette.length);
  const hiddenCounts = new Uint32Array(hidden.palette.length);
  const originalPixels = originalImageData.data;
  for (let sourceIndex = 0; sourceIndex < data.length; sourceIndex += 4) {
    if (data[sourceIndex + 3] < 128) continue;
    const isVisible = !selectionMaskData || selectionMaskData[sourceIndex + 3] > 32;
    if (isVisible) continue;
    const key = ((data[sourceIndex] >> 3) << 10)
      | ((data[sourceIndex + 1] >> 3) << 5)
      | (data[sourceIndex + 2] >> 3);
    const paletteIndex = hidden.binToPaletteIndex[key];
    hiddenLumaSums[paletteIndex] += getSourcePixelLuminanceAtIndex(originalPixels, sourceIndex);
    hiddenCounts[paletteIndex] += 1;
  }
  for (let index = 0; index < hidden.palette.length; index += 1) {
    const averageLuminance = hiddenCounts[index] > 0 ? (hiddenLumaSums[index] / hiddenCounts[index]) : 255;
    alphaBytes[hiddenOffset + index] = getAdaptiveHiddenAlphaFromLuminance(averageLuminance, state.revealBoost, hidden.palette[index]);
  }

  onProgress?.(68, '画素を専用パレットへ割り当てています…');
  await yieldForPaint();
  const scanlines = new Uint8Array((width + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width + 1);
    scanlines[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (y * width + x) * 4;
      if (data[sourceIndex + 3] < 128) {
        scanlines[rowOffset + x + 1] = 0;
        continue;
      }
      const key = ((data[sourceIndex] >> 3) << 10)
        | ((data[sourceIndex + 1] >> 3) << 5)
        | (data[sourceIndex + 2] >> 3);
      const isVisible = !selectionMaskData || selectionMaskData[sourceIndex + 3] > 32;
      scanlines[rowOffset + x + 1] = isVisible
        ? visibleOffset + visible.binToPaletteIndex[key]
        : hiddenOffset + hidden.binToPaletteIndex[key];
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

  onProgress?.(84, 'PNG-8を圧縮しています…');
  await yieldForPaint();
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const compressed = await compressZlib(scanlines);
  const pngBytes = concatenateUint8Arrays([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('PLTE', paletteBytes),
    makePngChunk('tRNS', alphaBytes),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', new Uint8Array(0))
  ]);
  onProgress?.(96, 'ダウンロードファイルを準備しています…');
  return new Blob([pngBytes], { type: 'image/png' });
}

async function saveOutput() {
  if (!state.imageLoaded) return;
  saveButton.disabled = true;
  saveButton.textContent = '保存画像を作成中…';
  setExportProgress(5, '元画像と範囲マスクを読み込んでいます…');
  try {
    await yieldForPaint();
    const selectionMaskData = getSelectionMaskData();
    setExportProgress(18, '確定した範囲へ半透明パレット用の補正を適用しています…');
    await yieldForPaint();

    const imageData = createExportImageData(selectionMaskData);
    const hiddenAlpha = getHiddenRegionAlpha(state.revealBoost);
    const blob = await encodeIndexedPng(imageData, selectionMaskData, hiddenAlpha, (value, message) => {
      setExportProgress(value, message);
    }, state.sourceImageData);

    const name = outputFileName();
    outputFileNameNode.textContent = name;
    outputFileSizeNode.textContent = formatBytes(blob.size);
    if (blob.size > 5 * 1024 * 1024) {
      exportWarning.hidden = false;
      exportWarning.textContent = `出力ファイルは${formatBytes(blob.size)}です。Xの静止画像上限を超える可能性があるため、投稿時にご確認ください。`;
    } else {
      exportWarning.hidden = true;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportProgress(100, '保存画像を作成しました。');
    showToast('元画像のRGBを残した半透明パレットPNG-8を作成して保存しました。');
  } catch (error) {
    console.error(error);
    setExportProgress(0, '保存処理に失敗しました。');
    showToast(error.message || 'PNG-8の保存に失敗しました。');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'PNG-8を保存';
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

saveButton.addEventListener('click', saveOutput);
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
