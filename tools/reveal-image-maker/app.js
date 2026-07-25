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
const undoButton = document.getElementById('undoButton');
const redoButton = document.getElementById('redoButton');
const zoomOutButton = document.getElementById('zoomOutButton');
const zoomInButton = document.getElementById('zoomInButton');
const fitButton = document.getElementById('fitButton');
const saveButton = document.getElementById('saveButton');
const toast = document.getElementById('toast');

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
const timelineContext = timelineCanvas.getContext('2d', { willReadFrequently: true });
const revealCanvas = document.createElement('canvas');
const revealContext = revealCanvas.getContext('2d', { willReadFrequently: true });

const state = {
  imageLoaded: false,
  sourceFile: null,
  sourceName: 'image',
  imageWidth: 0,
  imageHeight: 0,
  sourceImageData: null,
  tool: 'hide',
  brushSize: Number(brushSizeInput.value),
  revealBoost: Number(revealBoostInput.value) / 100,
  showMask: true,
  previewMode: 'original',
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
  return `${state.sourceName}-reveal-checker50-png8-boost.png`;
}


function formatBoostLabel(value) {
  return `x${value.toFixed(2)}`;
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

function mixChannel(value, target, amount) {
  return clampByte(value * (1 - amount) + target * amount);
}

function applyRevealBoostToPixel(r, g, b, boost) {
  if (boost <= 1) return { r, g, b };

  const boostAmount = boost - 1;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const gamma = Math.max(0.62, 0.90 - boostAmount * 0.42);

  let rr = clampByte(255 * Math.pow(r / 255, gamma));
  let gg = clampByte(255 * Math.pow(g / 255, gamma));
  let bb = clampByte(255 * Math.pow(b / 255, gamma));

  const darkFactor = clamp01((0.62 - luminance) / 0.62);
  const baseWhiteMix = 0.06 + boostAmount * 0.16;
  const extraWhiteMix = darkFactor * (0.18 + boostAmount * 0.34);
  const whiteMix = Math.min(0.78, baseWhiteMix + extraWhiteMix);

  rr = mixChannel(rr, 255, whiteMix);
  gg = mixChannel(gg, 255, whiteMix);
  bb = mixChannel(bb, 255, whiteMix);

  const mean = (rr + gg + bb) / 3;
  const neutralize = Math.min(0.38, darkFactor * (0.10 + boostAmount * 0.22));
  rr = mixChannel(rr, mean, neutralize);
  gg = mixChannel(gg, mean, neutralize);
  bb = mixChannel(bb, mean, neutralize);

  const floorLift = clampByte(140 + boostAmount * 90);
  if (luminance < 0.24) {
    const floorMix = Math.min(0.48, (0.24 - luminance) * 1.2 + boostAmount * 0.12);
    rr = mixChannel(rr, floorLift, floorMix);
    gg = mixChannel(gg, floorLift, floorMix);
    bb = mixChannel(bb, floorLift, floorMix);
  }

  return { r: rr, g: gg, b: bb };
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
  invalidateEncodedPreview();
  outputFileSizeNode.textContent = '保存時に計測';
  exportWarning.hidden = true;
  renderPreview();
  requestEncodedPreviewRefresh();
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

function createOutputImage() {
  if (!state.imageLoaded) return null;
  if (state.renderedOutputVersion === state.outputVersion) return outputCanvas;

  outputCanvas.width = state.imageWidth;
  outputCanvas.height = state.imageHeight;
  const sourceData = state.sourceImageData;
  const outputData = new ImageData(new Uint8ClampedArray(sourceData.data), state.imageWidth, state.imageHeight);
  const maskData = getSelectionMaskData();
  const pixels = outputData.data;
  const boost = state.revealBoost;

  for (let y = 0; y < state.imageHeight; y += 1) {
    for (let x = 0; x < state.imageWidth; x += 1) {
      const index = (y * state.imageWidth + x) * 4;
      if (maskData[index + 3] <= 32) continue;
      if (((x + y) & 1) === 1) {
        pixels[index + 3] = 0;
        continue;
      }
      const boosted = applyRevealBoostToPixel(
        pixels[index],
        pixels[index + 1],
        pixels[index + 2],
        boost
      );
      pixels[index] = boosted.r;
      pixels[index + 1] = boosted.g;
      pixels[index + 2] = boosted.b;
    }
  }

  outputContext.clearRect(0, 0, state.imageWidth, state.imageHeight);
  outputContext.putImageData(outputData, 0, 0);
  state.renderedOutputVersion = state.outputVersion;
  return outputCanvas;
}

function createTimelineApproximation(imageSource = null) {
  const output = imageSource || createOutputImage();
  if (!output) return null;
  const maxLongEdge = 720;
  const ratio = Math.min(1, maxLongEdge / Math.max(output.width, output.height));
  timelineCanvas.width = Math.max(1, Math.round(output.width * ratio));
  timelineCanvas.height = Math.max(1, Math.round(output.height * ratio));
  timelineContext.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);
  timelineContext.fillStyle = '#ffffff';
  timelineContext.fillRect(0, 0, timelineCanvas.width, timelineCanvas.height);
  timelineContext.imageSmoothingEnabled = true;
  timelineContext.imageSmoothingQuality = 'high';
  timelineContext.drawImage(output, 0, 0, timelineCanvas.width, timelineCanvas.height);
  return timelineCanvas;
}

function createRevealPreview(imageSource = null) {
  const output = imageSource || createOutputImage();
  if (!output) return null;
  revealCanvas.width = output.width;
  revealCanvas.height = output.height;
  revealContext.clearRect(0, 0, revealCanvas.width, revealCanvas.height);
  revealContext.fillStyle = '#000000';
  revealContext.fillRect(0, 0, revealCanvas.width, revealCanvas.height);
  revealContext.drawImage(output, 0, 0);
  return revealCanvas;
}

function getFallbackPreviewSource() {
  if (state.previewMode === 'original') return sourceCanvas;
  if (state.previewMode === 'timeline') return createTimelineApproximation();
  return createRevealPreview();
}

function getDisplaySourceForMode(baseSource) {
  if (state.previewMode === 'original') return sourceCanvas;
  if (state.previewMode === 'timeline') return createTimelineApproximation(baseSource);
  return createRevealPreview(baseSource);
}


async function ensureEncodedPreviewImage() {
  if (!state.imageLoaded || state.previewMode === 'original') return null;
  if (state.encodedPreviewImage && state.encodedPreviewVersion === state.outputVersion) return state.encodedPreviewImage;
  if (state.encodedPreviewPromise) return state.encodedPreviewPromise;

  const version = state.outputVersion;
  state.encodedPreviewPromise = (async () => {
    createOutputImage();
    const imageData = outputContext.getImageData(0, 0, state.imageWidth, state.imageHeight);
    const blob = await encodeIndexedPng(imageData, getSelectionMaskData());
    const renderable = await createRenderableImageFromBlob(blob);
    if (version !== state.outputVersion) {
      closeRenderableImage(renderable);
      return null;
    }
    closeRenderableImage(state.encodedPreviewImage);
    state.encodedPreviewImage = renderable;
    state.encodedPreviewVersion = version;
    return renderable;
  })();

  try {
    return await state.encodedPreviewPromise;
  } finally {
    if (version === state.outputVersion) state.encodedPreviewPromise = null;
  }
}

function requestEncodedPreviewRefresh() {
  if (!state.imageLoaded || state.previewMode === 'original') return;
  if (state.encodedPreviewVersion === state.outputVersion || state.encodedPreviewPromise) return;
  const token = ++state.previewRefreshToken;
  ensureEncodedPreviewImage().then((result) => {
    if (!result || token !== state.previewRefreshToken) return;
    renderPreview();
    if (previewModal.classList.contains('is-open')) renderModalPreview();
  }).catch((error) => {
    console.warn('Encoded preview refresh failed.', error);
  });
}

function getPreviewBackground() {
  return state.previewMode === 'reveal' ? '#000000' : '#ffffff';
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
  if (state.previewMode === 'original') {
    previewNote.textContent = '加工前の元画像を表示します。';
  } else if (state.previewMode === 'timeline') {
    previewNote.textContent = state.encodedPreviewVersion === state.outputVersion
      ? '保存予定PNG-8を白背景へ合成し、縮小して見せる目安です。X実機との差を減らすため、保存形式を優先して表示しています。'
      : '保存予定PNG-8を生成中です。生成前は近似プレビューを表示します。';
  } else {
    previewNote.textContent = state.encodedPreviewVersion === state.outputVersion
      ? '保存予定PNG-8を黒背景へ合成した目安です。隠し範囲は1ピクセル市松50%＋明度補正で表示します。'
      : '保存予定PNG-8を生成中です。生成前は近似プレビューを表示します。';
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
  const baseSource = state.previewMode === 'original'
    ? sourceCanvas
    : ((state.encodedPreviewVersion === state.outputVersion && state.encodedPreviewImage) ? state.encodedPreviewImage : createOutputImage());
  const source = getDisplaySourceForMode(baseSource) || getFallbackPreviewSource();
  renderCanvasFit(previewContext, previewCanvas, previewStage, source, getPreviewBackground());
  updatePreviewNote();
  if (state.previewMode !== 'original' && state.encodedPreviewVersion !== state.outputVersion) requestEncodedPreviewRefresh();
}

function renderModalPreview() {
  if (!state.imageLoaded) return;
  const baseSource = state.previewMode === 'original'
    ? sourceCanvas
    : ((state.encodedPreviewVersion === state.outputVersion && state.encodedPreviewImage) ? state.encodedPreviewImage : createOutputImage());
  const source = getDisplaySourceForMode(baseSource) || getFallbackPreviewSource();
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
    invalidateEncodedPreview();

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

function buildAdaptivePalette(imageData, selectionMaskData = null, maxOpaqueColors = 255) {
  const binCount = 32 * 32 * 32;
  const counts = new Uint32Array(binCount);
  const rSums = new Uint32Array(binCount);
  const gSums = new Uint32Array(binCount);
  const bSums = new Uint32Array(binCount);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const weight = selectionMaskData && selectionMaskData[index + 3] > 32 ? 6 : 1;
    counts[key] += weight;
    rSums[key] += r * weight;
    gSums[key] += g * weight;
    bSums[key] += b * weight;
  }

  const points = [];
  for (let key = 0; key < binCount; key += 1) {
    if (!counts[key]) continue;
    points.push(createColorPoint(key, counts[key], rSums[key], gSums[key], bSums[key]));
  }

  if (!points.length) {
    return {
      palette: [{ r: 0, g: 0, b: 0 }],
      binToPaletteIndex: new Uint16Array(binCount)
    };
  }

  let boxes = [getColorBoxStats(points.map((_, index) => index), points)];
  while (boxes.length < maxOpaqueColors) {
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

  const palette = [{ r: 0, g: 0, b: 0 }];
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

async function encodeIndexedPng(imageData, selectionMaskData = null) {
  const { width, height, data } = imageData;
  const { palette, binToPaletteIndex } = buildAdaptivePalette(imageData, selectionMaskData, 255);
  const paletteBytes = new Uint8Array(palette.length * 3);
  for (let index = 0; index < palette.length; index += 1) {
    paletteBytes[index * 3] = palette[index].r;
    paletteBytes[index * 3 + 1] = palette[index].g;
    paletteBytes[index * 3 + 2] = palette[index].b;
  }

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
      scanlines[rowOffset + x + 1] = binToPaletteIndex[key];
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

  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const compressed = await compressZlib(scanlines);
  const pngBytes = concatenateUint8Arrays([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('PLTE', paletteBytes),
    makePngChunk('tRNS', Uint8Array.of(0)),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', new Uint8Array(0))
  ]);
  return new Blob([pngBytes], { type: 'image/png' });
}

async function saveOutput() {
  if (!state.imageLoaded) return;
  saveButton.disabled = true;
  saveButton.textContent = 'PNG-8を作成中…';
  try {
    createOutputImage();
    const imageData = outputContext.getImageData(0, 0, state.imageWidth, state.imageHeight);
    const blob = await encodeIndexedPng(imageData, getSelectionMaskData());
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
    showToast('PNG-8を保存しました。');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'PNG-8の保存に失敗しました。');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'PNG-8を保存';
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
  state.revealBoost = Number(revealBoostInput.value) / 100;
  revealBoostValue.textContent = formatBoostLabel(state.revealBoost);
  markOutputDirty();
});
showMaskToggle.addEventListener('change', () => {
  state.showMask = showMaskToggle.checked;
  renderEditor();
});
maskAllButton.addEventListener('click', () => applyWholeMask('fill'));
clearMaskButton.addEventListener('click', () => applyWholeMask('clear'));
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
setTool('hide');
setControlsEnabled(false);
renderEditor();
renderPreview();
