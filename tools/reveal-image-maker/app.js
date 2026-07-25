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
const strengthInputs = [...document.querySelectorAll('input[name="strength"]')];
const disabledGroups = [
  document.getElementById('toolSelector'),
  document.getElementById('brushControls'),
  document.getElementById('maskActions'),
  document.getElementById('viewControls'),
  document.getElementById('strengthControls')
];

const sourceCanvas = document.createElement('canvas');
const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
const maskCanvas = document.createElement('canvas');
const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
const overlayCanvas = document.createElement('canvas');
const overlayContext = overlayCanvas.getContext('2d');
const outputCanvas = document.createElement('canvas');
const outputContext = outputCanvas.getContext('2d', { willReadFrequently: true });

const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21]
];
// 8x8（64画素）中の透明画素数。約40 / 45 / 50 / 55 / 60％。
const TRANSPARENT_COUNTS = { 1: 26, 2: 29, 3: 32, 4: 35, 5: 38 };

const state = {
  imageLoaded: false,
  sourceFile: null,
  sourceName: 'image',
  imageWidth: 0,
  imageHeight: 0,
  sourceImageData: null,
  tool: 'hide',
  brushSize: Number(brushSizeInput.value),
  showMask: true,
  strength: 3,
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
  renderedStrength: null,
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
  return `${state.sourceName}-reveal-s${state.strength}-png8.png`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function setControlsEnabled(enabled) {
  disabledGroups.forEach((group) => { group.disabled = !enabled; });
  saveButton.disabled = !enabled;
  expandPreviewButton.disabled = !enabled;
}

function updateHistoryButtons() {
  undoButton.disabled = !state.imageLoaded || state.operations.length === 0;
  redoButton.disabled = !state.imageLoaded || state.redoOperations.length === 0;
}

function markOutputDirty() {
  state.outputVersion += 1;
  outputFileSizeNode.textContent = '保存時に計測';
  exportWarning.hidden = true;
  if (state.previewMode !== 'original') renderPreview();
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
  if (state.renderedOutputVersion === state.outputVersion && state.renderedStrength === state.strength) return outputCanvas;

  outputCanvas.width = state.imageWidth;
  outputCanvas.height = state.imageHeight;
  const sourceData = state.sourceImageData;
  const outputData = new ImageData(new Uint8ClampedArray(sourceData.data), state.imageWidth, state.imageHeight);
  const maskData = maskContext.getImageData(0, 0, state.imageWidth, state.imageHeight).data;
  const transparentCount = TRANSPARENT_COUNTS[state.strength];
  const pixels = outputData.data;

  for (let y = 0; y < state.imageHeight; y += 1) {
    for (let x = 0; x < state.imageWidth; x += 1) {
      const index = (y * state.imageWidth + x) * 4;
      if (pixels[index + 3] < 16) continue;
      if (maskData[index + 3] > 32 && BAYER_8X8[y & 7][x & 7] < transparentCount) {
        pixels[index + 3] = 0;
      }
      // 残す画素のRGBは元画像の値を維持する。
      // 以前の残存率による逆数補正は、淡色が白飛びして黒背景で灰色化するため行わない。
    }
  }

  outputContext.clearRect(0, 0, state.imageWidth, state.imageHeight);
  outputContext.putImageData(outputData, 0, 0);
  state.renderedOutputVersion = state.outputVersion;
  state.renderedStrength = state.strength;
  return outputCanvas;
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
    previewNote.textContent = '加工前の元画像を白背景で表示します。';
  } else if (state.previewMode === 'timeline') {
    previewNote.textContent = '保存予定画像を白背景に合成した目安です。Xの実際の縮小・変換処理を完全には再現できません。';
  } else {
    previewNote.textContent = `強度${state.strength}の保存予定画像を、画像ビューアーを想定した黒背景に合成しています。`;
  }
}

function currentPreviewBackground() {
  return state.previewMode === 'reveal' ? '#000000' : '#ffffff';
}

function getPreviewSource() {
  return state.previewMode === 'original' ? sourceCanvas : createOutputImage();
}

function renderPreview() {
  const backgroundColor = currentPreviewBackground();
  previewStage.className = `preview-stage ${state.previewMode === 'reveal' ? 'background-black' : 'background-white'}`;
  if (!state.imageLoaded) {
    resizeDisplayCanvas(previewCanvas, previewContext, previewStage);
    previewContext.clearRect(0, 0, previewStage.clientWidth, previewStage.clientHeight);
    return;
  }
  previewStage.classList.add('has-image');
  renderCanvasFit(previewContext, previewCanvas, previewStage, getPreviewSource(), backgroundColor);
  updatePreviewNote();
}

function renderModalPreview() {
  if (!state.imageLoaded) return;
  renderCanvasFit(modalContext, modalCanvas, modalCanvasWrap, getPreviewSource(), currentPreviewBackground());
}

function makeHistogramEntries(imageData) {
  const counts = new Uint32Array(32768);
  const sumsR = new Uint32Array(32768);
  const sumsG = new Uint32Array(32768);
  const sumsB = new Uint32Array(32768);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    const key = ((pixels[index] >> 3) << 10) | ((pixels[index + 1] >> 3) << 5) | (pixels[index + 2] >> 3);
    counts[key] += 1;
    sumsR[key] += pixels[index];
    sumsG[key] += pixels[index + 1];
    sumsB[key] += pixels[index + 2];
  }

  const entries = [];
  for (let key = 0; key < 32768; key += 1) {
    if (!counts[key]) continue;
    entries.push({
      key,
      r5: (key >> 10) & 31,
      g5: (key >> 5) & 31,
      b5: key & 31,
      count: counts[key],
      sumR: sumsR[key],
      sumG: sumsG[key],
      sumB: sumsB[key]
    });
  }
  return entries;
}

function describeColorBox(items) {
  let count = 0;
  let minR = 31, minG = 31, minB = 31;
  let maxR = 0, maxG = 0, maxB = 0;
  for (const item of items) {
    count += item.count;
    minR = Math.min(minR, item.r5); maxR = Math.max(maxR, item.r5);
    minG = Math.min(minG, item.g5); maxG = Math.max(maxG, item.g5);
    minB = Math.min(minB, item.b5); maxB = Math.max(maxB, item.b5);
  }
  return { items, count, minR, maxR, minG, maxG, minB, maxB };
}

function splitColorBox(box) {
  if (box.items.length < 2) return null;
  const ranges = [box.maxR - box.minR, box.maxG - box.minG, box.maxB - box.minB];
  const channel = ranges.indexOf(Math.max(...ranges));
  const channelName = channel === 0 ? 'r5' : channel === 1 ? 'g5' : 'b5';
  const sorted = [...box.items].sort((a, b) => a[channelName] - b[channelName]);
  const midpoint = box.count / 2;
  let cumulative = 0;
  let splitIndex = 1;
  for (let index = 0; index < sorted.length - 1; index += 1) {
    cumulative += sorted[index].count;
    if (cumulative >= midpoint) {
      splitIndex = index + 1;
      break;
    }
  }
  return [describeColorBox(sorted.slice(0, splitIndex)), describeColorBox(sorted.slice(splitIndex))];
}

function buildAdaptivePalette(entries, maximumColors = 255) {
  if (!entries.length) return [[0, 0, 0]];
  let boxes = [describeColorBox(entries)];
  while (boxes.length < maximumColors) {
    let selectedIndex = -1;
    let selectedScore = -1;
    boxes.forEach((box, index) => {
      if (box.items.length < 2) return;
      const range = Math.max(box.maxR - box.minR, box.maxG - box.minG, box.maxB - box.minB);
      const score = range * Math.log2(box.count + 1);
      if (score > selectedScore) {
        selectedScore = score;
        selectedIndex = index;
      }
    });
    if (selectedIndex < 0) break;
    const split = splitColorBox(boxes[selectedIndex]);
    if (!split) break;
    boxes.splice(selectedIndex, 1, ...split);
  }

  return boxes.map((box) => {
    let count = 0, sumR = 0, sumG = 0, sumB = 0;
    for (const item of box.items) {
      count += item.count;
      sumR += item.sumR;
      sumG += item.sumG;
      sumB += item.sumB;
    }
    return [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)];
  });
}

function createPaletteLookup(entries, palette) {
  const lookup = new Int16Array(32768);
  lookup.fill(-1);
  for (const entry of entries) {
    const r = entry.sumR / entry.count;
    const g = entry.sumG / entry.count;
    const b = entry.sumB / entry.count;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < palette.length; index += 1) {
      const color = palette[index];
      const dr = r - color[0];
      const dg = g - color[1];
      const db = b - color[2];
      const distance = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    lookup[entry.key] = bestIndex;
  }
  return lookup;
}

function makeIndexedImage(imageData, width, height) {
  const entries = makeHistogramEntries(imageData);
  const palette = buildAdaptivePalette(entries, 255);
  const lookup = createPaletteLookup(entries, palette);
  const transparentIndex = palette.length;
  const indices = new Uint8Array(width * height);
  const pixels = imageData.data;

  for (let pixelIndex = 0, dataIndex = 0; pixelIndex < indices.length; pixelIndex += 1, dataIndex += 4) {
    if (pixels[dataIndex + 3] < 128) {
      indices[pixelIndex] = transparentIndex;
    } else {
      const key = ((pixels[dataIndex] >> 3) << 10) | ((pixels[dataIndex + 1] >> 3) << 5) | (pixels[dataIndex + 2] >> 3);
      const mapped = lookup[key];
      indices[pixelIndex] = mapped >= 0 ? mapped : 0;
    }
  }
  return { palette, transparentIndex, indices };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let number = 0; number < 256; number += 1) {
    let value = number;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    table[number] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(bytes) {
  let a = 1, b = 0;
  const modulus = 65521;
  for (let index = 0; index < bytes.length; index += 1) {
    a = (a + bytes[index]) % modulus;
    b = (b + a) % modulus;
  }
  return ((b << 16) | a) >>> 0;
}

function zlibStore(bytes) {
  const blockCount = Math.ceil(bytes.length / 65535);
  const output = new Uint8Array(2 + bytes.length + blockCount * 5 + 4);
  let offset = 0;
  output[offset++] = 0x78;
  output[offset++] = 0x01;
  let sourceOffset = 0;
  while (sourceOffset < bytes.length) {
    const length = Math.min(65535, bytes.length - sourceOffset);
    const final = sourceOffset + length >= bytes.length;
    output[offset++] = final ? 1 : 0;
    output[offset++] = length & 0xff;
    output[offset++] = (length >>> 8) & 0xff;
    const inverse = (~length) & 0xffff;
    output[offset++] = inverse & 0xff;
    output[offset++] = (inverse >>> 8) & 0xff;
    output.set(bytes.subarray(sourceOffset, sourceOffset + length), offset);
    offset += length;
    sourceOffset += length;
  }
  const checksum = adler32(bytes);
  output[offset++] = (checksum >>> 24) & 0xff;
  output[offset++] = (checksum >>> 16) & 0xff;
  output[offset++] = (checksum >>> 8) & 0xff;
  output[offset++] = checksum & 0xff;
  return output;
}

function pngChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length, false);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  view.setUint32(8 + data.length, crc32(crcInput), false);
  return chunk;
}

function concatenateBytes(parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function encodePng8(imageData, width, height) {
  const { palette, transparentIndex, indices } = makeIndexedImage(imageData, width, height);
  const completePalette = [...palette, [0, 0, 0]];
  const paletteBytes = new Uint8Array(completePalette.length * 3);
  completePalette.forEach((color, index) => {
    paletteBytes[index * 3] = color[0];
    paletteBytes[index * 3 + 1] = color[1];
    paletteBytes[index * 3 + 2] = color[2];
  });
  const transparency = new Uint8Array(completePalette.length);
  transparency.fill(255);
  transparency[transparentIndex] = 0;

  const scanlines = new Uint8Array((width + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width + 1);
    scanlines[rowOffset] = 0;
    scanlines.set(indices.subarray(y * width, (y + 1) * width), rowOffset + 1);
  }

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdr[8] = 8;
  ihdr[9] = 3;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  return concatenateBytes([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('PLTE', paletteBytes),
    pngChunk('tRNS', transparency),
    pngChunk('IDAT', zlibStore(scanlines)),
    pngChunk('IEND', new Uint8Array(0))
  ]);
}

function createPng8Blob() {
  const output = createOutputImage();
  const imageData = outputContext.getImageData(0, 0, output.width, output.height);
  const bytes = encodePng8(imageData, output.width, output.height);
  return new Blob([bytes], { type: 'image/png' });
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
  const points = state.currentStroke.operation.points;
  const previous = points[points.length - 1];
  const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
  const minDistance = Math.max(0.7, state.currentStroke.operation.radius * .12);
  if (distance < minDistance) return;
  points.push(point);
  drawMaskStroke(maskContext, {
    ...state.currentStroke.operation,
    points: [previous, point]
  });
  renderEditor();
}

function cancelCurrentStroke() {
  if (!state.currentStroke) return;
  state.currentStroke = null;
  maskContext.clearRect(0, 0, state.imageWidth, state.imageHeight);
  state.operations.forEach(applyOperation);
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
    startX: event.clientX,
    startY: event.clientY,
    offsetX: state.offsetX,
    offsetY: state.offsetY
  };
  editorViewport.classList.add('is-panning');
}

function updatePan(event) {
  if (!state.panSession || state.panSession.pointerId !== event.pointerId) return;
  state.offsetX = state.panSession.offsetX + (event.clientX - state.panSession.startX);
  state.offsetY = state.panSession.offsetY + (event.clientY - state.panSession.startY);
  renderEditor();
}

function finishPan(event) {
  if (!state.panSession || state.panSession.pointerId !== event.pointerId) return;
  state.panSession = null;
  editorViewport.classList.remove('is-panning');
}

function pointerCenter(points) {
  const values = [...points.values()];
  return {
    x: (values[0].clientX + values[1].clientX) / 2,
    y: (values[0].clientY + values[1].clientY) / 2
  };
}

function pointerDistance(points) {
  const values = [...points.values()];
  return Math.hypot(values[1].clientX - values[0].clientX, values[1].clientY - values[0].clientY);
}

function beginGesture() {
  if (state.pointers.size < 2) return;
  cancelCurrentStroke();
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
    state.renderedStrength = null;

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

async function saveOutput() {
  if (!state.imageLoaded) return;
  saveButton.disabled = true;
  saveButton.textContent = 'PNG-8を作成中…';
  try {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const blob = createPng8Blob();
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

strengthInputs.forEach((input) => input.addEventListener('change', () => {
  if (!input.checked) return;
  state.strength = Number(input.value);
  outputFileNameNode.textContent = outputFileName();
  markOutputDirty();
}));
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

setTool('hide');
setControlsEnabled(false);
renderEditor();
renderPreview();
