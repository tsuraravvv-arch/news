(function () {
  'use strict';

  // 現行のIDカテゴリと日英ラベル（script.js の categoryNames 相当。旧カテゴリ互換は新規記事では使わないため含めない）
  var CATEGORY_NAMES = {
    FAS: { ja: 'ファッション', en: 'Fashion' },
    JOB: { ja: '職業', en: 'Jobs' },
    PNF: { ja: 'ポーズ・表情', en: 'Pose & Expression' },
    VIS: { ja: 'ビジュアル演出', en: 'Visual Direction' },
    SSN: { ja: '季節', en: 'Seasonal' },
    ORI: { ja: 'オリジナル企画', en: 'Original Projects' },
    ITM: { ja: 'アイテム', en: 'Items' }
  };

  // --- DOM参照: 入力フォーム ---
  var loadStatus = document.getElementById('loadStatus');
  var inputForm = document.getElementById('inputForm');

  var fieldHandoffPaste = document.getElementById('fieldHandoffPaste');
  var parseHandoffButton = document.getElementById('parseHandoffButton');
  var parseHandoffStatus = document.getElementById('parseHandoffStatus');
  var handoffSourceInfo = document.getElementById('handoffSourceInfo');

  // --- DOM参照: CRI入力フォーム ---
  var criFieldsWrap = document.getElementById('criFieldsWrap');
  var criForm = document.getElementById('criForm');
  var fieldCriIdeaName = document.getElementById('fieldCriIdeaName');
  var fieldCriIdeaSummary = document.getElementById('fieldCriIdeaSummary');
  var fieldCriAttentionReason = document.getElementById('fieldCriAttentionReason');
  var fieldCriCreativeAppeal = document.getElementById('fieldCriCreativeAppeal');
  var fieldCriUseCasesRaw = document.getElementById('fieldCriUseCasesRaw');
  var fieldCriReproPoints = document.getElementById('fieldCriReproPoints');
  var fieldCriClassification = document.getElementById('fieldCriClassification');
  var fieldCriCoreExpression = document.getElementById('fieldCriCoreExpression');
  var fieldCriChangedElements = document.getElementById('fieldCriChangedElements');
  var fieldCriKeptElements = document.getElementById('fieldCriKeptElements');
  var fieldCriMustHavePoints = document.getElementById('fieldCriMustHavePoints');
  var fieldCriLabTrendHints = document.getElementById('fieldCriLabTrendHints');
  var fieldCriLabUseCaseHints = document.getElementById('fieldCriLabUseCaseHints');
  var fieldCriSampleTestPrompt = document.getElementById('fieldCriSampleTestPrompt');
  var fieldCriSourceUrl = document.getElementById('fieldCriSourceUrl');
  var generateCriButton = document.getElementById('generateCriButton');
  var generateCriStatus = document.getElementById('generateCriStatus');

  var fieldAiiId = document.getElementById('fieldAiiId');
  var fieldCategoryOverride = document.getElementById('fieldCategoryOverride');
  var fieldNewsTitle = document.getElementById('fieldNewsTitle');
  var fieldNewsSummary = document.getElementById('fieldNewsSummary');
  var fieldWhatsNew = document.getElementById('fieldWhatsNew');
  var fieldCreativeEffect = document.getElementById('fieldCreativeEffect');
  var fieldUseCasesRaw = document.getElementById('fieldUseCasesRaw');
  var fieldReproPoints = document.getElementById('fieldReproPoints');
  var fieldTargetType = document.getElementById('fieldTargetType');
  var fieldExpressionType = document.getElementById('fieldExpressionType');
  var fieldCoreEffect = document.getElementById('fieldCoreEffect');
  var fieldChangedElements = document.getElementById('fieldChangedElements');
  var fieldKeptElements = document.getElementById('fieldKeptElements');
  var fieldMustHavePoints = document.getElementById('fieldMustHavePoints');
  var fieldSampleTestPrompt = document.getElementById('fieldSampleTestPrompt');
  var fieldAdoptedSamplePrompt = document.getElementById('fieldAdoptedSamplePrompt');
  var fieldSourceUrl = document.getElementById('fieldSourceUrl');
  var fieldExtraComments = document.getElementById('fieldExtraComments');

  var generateButton = document.getElementById('generateButton');
  var generateStatus = document.getElementById('generateStatus');

  // --- DOM参照: 入力方式タブ（制作引き継ぎ／オリジナル） ---
  var inputModeTabs = document.getElementById('inputModeTabs');
  var handoffPanel = document.getElementById('handoffPanel');
  var originalPanel = document.getElementById('originalPanel');

  // --- DOM参照: オリジナル入力フォーム ---
  var originalForm = document.getElementById('originalForm');
  var fieldOriginalTheme = document.getElementById('fieldOriginalTheme');
  var fieldOriginalPromptJa = document.getElementById('fieldOriginalPromptJa');
  var fieldOriginalNotes = document.getElementById('fieldOriginalNotes');
  var generateOriginalButton = document.getElementById('generateOriginalButton');
  var generateOriginalStatus = document.getElementById('generateOriginalStatus');

  // --- DOM参照: サンプル画像 ---
  var sampleImageDropZone = document.getElementById('sampleImageDropZone');
  var sampleImageInput = document.getElementById('sampleImageInput');
  var sampleImagePreviewWrap = document.getElementById('sampleImagePreviewWrap');
  var sampleImagePreview = document.getElementById('sampleImagePreview');
  var sampleImageHint = document.getElementById('sampleImageHint');
  var clearSampleImageButton = document.getElementById('clearSampleImageButton');

  // --- DOM参照: 生成結果セクション ---
  var resultSection = document.getElementById('resultSection');

  var fieldId = document.getElementById('fieldId');
  var regenerateIdButton = document.getElementById('regenerateIdButton');
  var idHint = document.getElementById('idHint');
  var fieldCategory = document.getElementById('fieldCategory');
  var categoryReasonHint = document.getElementById('categoryReasonHint');

  var fieldDatetimeDate = document.getElementById('fieldDatetimeDate');
  var fieldDatetimeTime = document.getElementById('fieldDatetimeTime');
  var setNowDatetimeButton = document.getElementById('setNowDatetimeButton');
  var fieldPublishedAtDate = document.getElementById('fieldPublishedAtDate');
  var fieldPublishedAtTime = document.getElementById('fieldPublishedAtTime');
  var copyDatetimeButton = document.getElementById('copyDatetimeButton');

  var fieldTitle = document.getElementById('fieldTitle');
  var fieldTitleEn = document.getElementById('fieldTitleEn');
  var fieldSummary = document.getElementById('fieldSummary');
  var fieldSummaryEn = document.getElementById('fieldSummaryEn');
  var fieldTrendElements = document.getElementById('fieldTrendElements');
  var fieldTrendElementsEn = document.getElementById('fieldTrendElementsEn');
  var fieldUseCases = document.getElementById('fieldUseCases');
  var fieldUseCasesEn = document.getElementById('fieldUseCasesEn');
  var fieldPromptJa = document.getElementById('fieldPromptJa');
  var fieldPromptEn = document.getElementById('fieldPromptEn');
  var copyPromptJaButton = document.getElementById('copyPromptJaButton');
  var copyPromptEnButton = document.getElementById('copyPromptEnButton');
  var fieldNoteTitle = document.getElementById('fieldNoteTitle');
  var fieldNoteTitleEn = document.getElementById('fieldNoteTitleEn');
  var fieldNotes = document.getElementById('fieldNotes');
  var fieldNotesEn = document.getElementById('fieldNotesEn');
  var fieldSourceUrlFinal = document.getElementById('fieldSourceUrlFinal');

  var finalImageDropZone = document.getElementById('finalImageDropZone');
  var finalImageInput = document.getElementById('finalImageInput');
  var finalImagePreviewWrap = document.getElementById('finalImagePreviewWrap');
  var finalImagePreview = document.getElementById('finalImagePreview');
  var finalImageHint = document.getElementById('finalImageHint');
  var useSampleAsFinalButton = document.getElementById('useSampleAsFinalButton');
  var clearFinalImageButton = document.getElementById('clearFinalImageButton');

  var enSyncStatus = document.getElementById('enSyncStatus');

  var previewCard = document.getElementById('previewCard');
  var jsonOutput = document.getElementById('jsonOutput');
  var copyObjectButton = document.getElementById('copyObjectButton');
  var copyForAppendButton = document.getElementById('copyForAppendButton');

  var previewImageModal = document.getElementById('previewImageModal');
  var previewImageModalImg = document.getElementById('previewImageModalImg');
  var previewImageModalClose = document.getElementById('previewImageModalClose');

  // --- DOM参照: STEP2 ローカルへ登録 ---
  var registerSection = document.getElementById('registerSection');
  var registerButton = document.getElementById('registerButton');
  var registerStatus = document.getElementById('registerStatus');
  var registerReport = document.getElementById('registerReport');

  // --- DOM参照: STEP3 GitHubへPush ---
  var pushSection = document.getElementById('pushSection');
  var pushButton = document.getElementById('pushButton');
  var pushStatus = document.getElementById('pushStatus');
  var pushReport = document.getElementById('pushReport');

  // --- 状態 ---
  var inputMode = 'handoff'; // 'handoff' | 'original'（記事JSON生成後の処理はモードによらず共通）
  var currentCriManagementId = ''; // CRI検出時の管理ID（CRIxxxxx）。正式記事IDには使用しない
  var maxNumByPrefix = {};
  var existingIds = new Set();
  var dataLoadState = 'loading';
  var lastAutoId = '';
  var sampleImageDataUrl = '';
  var finalImageDataUrl = '';
  var lastGeneratedJson = '';
  var lastRegisteredArticle = null;
  // 日英同期の状態（キーはJA側フィールド名）。true = JAが変更され、対応するENの再同期が必要。
  var enPairDirty = {
    title: false, summary: false, trendElements: false, useCases: false,
    promptJa: false, noteTitle: false, notes: false
  };

  // --- ユーティリティ ---
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDateInput(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function formatTimeInput(date) {
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes());
  }

  function combineDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return '';
    return dateStr + ' ' + timeStr;
  }

  function linesToArray(text) {
    return String(text || '')
      .split('\n')
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line.length > 0; });
  }

  function arrayToLines(arr) {
    return Array.isArray(arr) ? arr.map(function (v) { return String(v); }).join('\n') : '';
  }

  // レスポンス本文が空、またはJSONとして解釈できない場合でも response.json() のように例外を投げず、
  // 常に { ok, ... } 形状のオブジェクトへ安全に変換する（サーバー側が異常終了した場合の保険）。
  function parseJsonResponseSafely(response) {
    return response.text().then(function (text) {
      if (!text) {
        return { ok: false, error: 'サーバーからの応答が空でした（HTTPステータス: ' + response.status + '）。' };
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        return { ok: false, error: 'サーバーからの応答をJSONとして解釈できませんでした（HTTPステータス: ' + response.status + '）。' };
      }
    });
  }

  function computeIdCandidate(category) {
    if (!category) return '';
    var max = maxNumByPrefix[category] || 0;
    var next = max + 1;
    return category + String(next).padStart(5, '0');
  }

  function flashButton(button, message) {
    var original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    button.textContent = message;
    window.clearTimeout(button._flashTimer);
    button._flashTimer = window.setTimeout(function () {
      button.textContent = original;
    }, 1400);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (e) { /* ブラウザ非対応時は何もしない */ }
    area.remove();
  }

  function copyText(text, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        flashButton(button, 'コピーしました');
      }, function () {
        fallbackCopy(text);
        flashButton(button, 'コピーしました');
      });
    } else {
      fallbackCopy(text);
      flashButton(button, 'コピーしました');
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  // 記事画像は images/articles/<ID>.png のPNG固定運用のため、登録前にPNGへ正規化する
  function convertToPngDataUrl(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = function () { reject(new Error('画像の読み込みに失敗しました。')); };
      img.src = dataUrl;
    });
  }

  // --- 既存データ読み込み（ID重複チェック・採番候補用。読み取り専用） ---
  function loadExistingData() {
    fetch('/data/articles.json')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTPステータス: ' + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error('データが配列形式ではありません');

        existingIds = new Set();
        maxNumByPrefix = {};
        data.forEach(function (article) {
          var id = typeof article.id === 'string' ? article.id.trim() : '';
          if (!id) return;
          existingIds.add(id.toUpperCase());
          var m = /^([A-Za-z]{3})(\d{5})$/.exec(id);
          if (m) {
            var prefix = m[1].toUpperCase();
            var num = parseInt(m[2], 10);
            if (!(prefix in maxNumByPrefix) || num > maxNumByPrefix[prefix]) {
              maxNumByPrefix[prefix] = num;
            }
          }
        });

        dataLoadState = 'ok';
        loadStatus.textContent = 'サーバー接続OK。既存データを読み込みました（' + data.length + '件）。ID重複チェックとID候補の自動算出に利用します。';
        loadStatus.className = 'load-status is-ok';
      })
      .catch(function (error) {
        dataLoadState = 'error';
        loadStatus.textContent = 'ローカルサーバーに接続できないか、既存データの読み込みに失敗しました。tools/article-publisher/server.ps1 を起動し、表示されたURLからこのページを開き直してください（詳細: ' + (error && error.message ? error.message : String(error)) + '）。';
        loadStatus.className = 'load-status is-error';
      });
  }

  // --- サンプル画像 / 最終画像のドロップゾーン共通処理 ---
  function wireImageDropZone(zone, input, previewWrap, previewImg, hint, clearButton, onChange) {
    function showPreview(dataUrl) {
      if (dataUrl) {
        previewImg.src = dataUrl;
        previewWrap.hidden = false;
        hint.hidden = true;
      } else {
        previewImg.src = '';
        previewWrap.hidden = true;
        hint.hidden = false;
      }
    }

    function handleFile(file) {
      if (!file) return;
      readFileAsDataUrl(file).then(function (dataUrl) {
        onChange(dataUrl);
        showPreview(dataUrl);
      });
    }

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      handleFile(file);
      input.value = '';
    });

    zone.addEventListener('dragover', function (event) {
      event.preventDefault();
      zone.classList.add('is-dragover');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('is-dragover');
    });
    zone.addEventListener('drop', function (event) {
      event.preventDefault();
      zone.classList.remove('is-dragover');
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    clearButton.addEventListener('click', function () {
      onChange('');
      showPreview('');
    });

    return { showPreview: showPreview };
  }

  var sampleImageZoneApi = wireImageDropZone(
    sampleImageDropZone, sampleImageInput, sampleImagePreviewWrap, sampleImagePreview, sampleImageHint, clearSampleImageButton,
    function (dataUrl) { sampleImageDataUrl = dataUrl; }
  );

  var finalImageZoneApi = wireImageDropZone(
    finalImageDropZone, finalImageInput, finalImagePreviewWrap, finalImagePreview, finalImageHint, clearFinalImageButton,
    function (dataUrl) {
      if (!dataUrl) {
        finalImageDataUrl = '';
        renderAll();
        return;
      }
      convertToPngDataUrl(dataUrl).then(function (pngDataUrl) {
        finalImageDataUrl = pngDataUrl;
        renderAll();
      }).catch(function () {
        finalImageDataUrl = '';
        finalImageZoneApi.showPreview('');
        window.alert('画像をPNGへ変換できませんでした。別の画像を試してください。');
      });
    }
  );

  useSampleAsFinalButton.addEventListener('click', function () {
    if (!sampleImageDataUrl) return;
    convertToPngDataUrl(sampleImageDataUrl).then(function (pngDataUrl) {
      finalImageDataUrl = pngDataUrl;
      finalImageZoneApi.showPreview(sampleImageDataUrl);
      renderAll();
    }).catch(function () {
      window.alert('画像をPNGへ変換できませんでした。');
    });
  });

  // --- 入力方式タブの切り替え（表示の出し分けのみ。各パネルの入力内容はDOM上に残るため保持される） ---
  function setInputMode(mode) {
    inputMode = mode === 'original' ? 'original' : 'handoff';
    handoffPanel.hidden = inputMode !== 'handoff';
    originalPanel.hidden = inputMode !== 'original';
    Array.prototype.forEach.call(inputModeTabs.querySelectorAll('.input-mode-tab'), function (tab) {
      var isActive = tab.getAttribute('data-mode') === inputMode;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  inputModeTabs.addEventListener('click', function (event) {
    var tab = event.target.closest ? event.target.closest('.input-mode-tab') : null;
    if (!tab) return;
    setInputMode(tab.getAttribute('data-mode'));
  });

  // --- 制作引き継ぎ全文の貼り付け解析 ---
  // 【制作引き継ぎ AIIxxxxx】の各ラベル行を検出し、次のラベル行が現れるまでを値として取り込む。
  // 未対応の書式（ラベル文言の変更・欠落など）があっても、見つかった項目だけを反映し例外にはしない。
  var HANDOFF_FIELD_LABELS = [
    ['newsTitle', 'ニュースタイトル'],
    ['newsSummary', 'ニュース概要'],
    ['whatsNew', '何が新しいか'],
    ['creativeEffect', '創作での効果'],
    ['useCasesRaw', '使いどころ'],
    ['reproPoints', '再現のポイント'],
    ['targetType', '対象'],
    ['expressionType', '表現タイプ'],
    ['coreEffect', '中心となる効果'],
    ['changedElements', '変更する要素'],
    ['keptElements', '維持する要素'],
    ['mustHavePoints', '再現上の必須ポイント'],
    ['sampleTestPrompt', 'サンプル制作向け日本語プロンプト'],
    ['sourceUrl', '情報源URL']
  ];

  // --- CRI（クリエイティブトレンド）全文の貼り付け解析 ---
  // 【制作引き継ぎ CRIxxxxx】の各ラベル行を検出し、次のラベル行が現れるまでを値として取り込む。
  // AIIのparseHandoffTextとは独立した関数・ラベル一覧とし、AII側の解析結果に影響しない。
  // 収集段階の生データだけでなく、「記事化・調整」チャットで内容を補正した調整済み引き継ぎも入力され得るため、
  // 特定の文面・値には依存せず、ラベル行の検出だけを基準に解析する。
  var CRI_FIELD_LABELS = [
    ['ideaName', 'アイデア名'],
    ['ideaSummary', 'アイデア概要'],
    ['attentionReason', '注目理由'],
    ['creativeAppeal', '創作での魅力'],
    ['useCasesRaw', '使いどころ'],
    ['reproPoints', '再現のポイント'],
    ['classification', '分類'],
    ['coreExpression', '中心となる表現'],
    ['changedElements', '変更する要素'],
    ['keptElements', '維持する要素'],
    ['mustHavePoints', '再現上の必須ポイント'],
    ['labTrendHints', 'Lab記事向けトレンド要素'],
    ['labUseCaseHints', 'Lab記事向け使いどころ'],
    ['sampleTestPrompt', 'サンプル制作向け日本語プロンプト'],
    ['sourceUrl', '情報源URL']
  ];

  function parseCriHandoffText(rawText) {
    var text = String(rawText || '');
    var result = {};

    var criMatch = text.match(/CRI\d+/);
    if (criMatch) result.criId = criMatch[0];

    var labelRegexes = CRI_FIELD_LABELS.map(function (pair) {
      return { field: pair[0], re: new RegExp('^\\s*' + pair[1] + '\\s*[:：]\\s*(.*)$') };
    });

    var currentField = null;
    var buffer = [];

    function flush() {
      if (currentField) {
        var value = buffer.join('\n').trim();
        if (value) result[currentField] = value;
      }
      buffer = [];
    }

    text.split('\n').forEach(function (line) {
      var matched = null;
      for (var i = 0; i < labelRegexes.length; i++) {
        var m = line.match(labelRegexes[i].re);
        if (m) { matched = { field: labelRegexes[i].field, inline: m[1] }; break; }
      }
      if (matched) {
        flush();
        currentField = matched.field;
        buffer = matched.inline ? [matched.inline] : [];
      } else if (currentField) {
        buffer.push(line);
      }
    });
    flush();

    return result;
  }

  function applyCriParsedFields(parsed, criId) {
    currentCriManagementId = criId || parsed.criId || '';
    criFieldsWrap.hidden = false;

    if (parsed.ideaName) fieldCriIdeaName.value = parsed.ideaName;
    if (parsed.ideaSummary) fieldCriIdeaSummary.value = parsed.ideaSummary;
    if (parsed.attentionReason) fieldCriAttentionReason.value = parsed.attentionReason;
    if (parsed.creativeAppeal) fieldCriCreativeAppeal.value = parsed.creativeAppeal;
    if (parsed.useCasesRaw) fieldCriUseCasesRaw.value = parsed.useCasesRaw;
    if (parsed.reproPoints) fieldCriReproPoints.value = parsed.reproPoints;
    if (parsed.classification) fieldCriClassification.value = parsed.classification;
    if (parsed.coreExpression) fieldCriCoreExpression.value = parsed.coreExpression;
    if (parsed.changedElements) fieldCriChangedElements.value = parsed.changedElements;
    if (parsed.keptElements) fieldCriKeptElements.value = parsed.keptElements;
    if (parsed.mustHavePoints) fieldCriMustHavePoints.value = parsed.mustHavePoints;
    if (parsed.labTrendHints) fieldCriLabTrendHints.value = parsed.labTrendHints;
    if (parsed.labUseCaseHints) fieldCriLabUseCaseHints.value = parsed.labUseCaseHints;
    if (parsed.sampleTestPrompt) fieldCriSampleTestPrompt.value = parsed.sampleTestPrompt;
    if (parsed.sourceUrl) fieldCriSourceUrl.value = parsed.sourceUrl;

    var resolvedCount = Object.keys(parsed).filter(function (key) { return key !== 'criId'; }).length;
    var missingLabels = CRI_FIELD_LABELS
      .filter(function (pair) { return !parsed[pair[0]]; })
      .map(function (pair) { return pair[1]; });

    handoffSourceInfo.hidden = false;
    handoffSourceInfo.textContent = '入力元：CRI｜管理ID：' + (currentCriManagementId || '（未検出）');

    if (resolvedCount === 0) {
      parseHandoffStatus.textContent = 'CRIの項目を認識できませんでした。ラベル文言（例：「アイデア名：」）が含まれているか確認してください。';
      parseHandoffStatus.className = 'generate-status is-error';
    } else {
      var message = resolvedCount + '項目を「CRIトレンド入力」欄へ反映しました。内容を確認してください。';
      if (missingLabels.length) message += '（見つからなかった項目: ' + missingLabels.join('、') + '）';
      parseHandoffStatus.textContent = message;
      parseHandoffStatus.className = 'generate-status is-ok';
    }

    criFieldsWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function parseHandoffText(rawText) {
    var text = String(rawText || '');
    var result = {};

    var aiiMatch = text.match(/AII\d+/);
    if (aiiMatch) result.aiiId = aiiMatch[0];

    var labelToField = {};
    HANDOFF_FIELD_LABELS.forEach(function (pair) { labelToField[pair[1]] = pair[0]; });
    var labelRegexes = HANDOFF_FIELD_LABELS.map(function (pair) {
      return { field: pair[0], re: new RegExp('^\\s*' + pair[1] + '\\s*[:：]\\s*(.*)$') };
    });

    var currentField = null;
    var buffer = [];

    function flush() {
      if (currentField) {
        var value = buffer.join('\n').trim();
        if (value) result[currentField] = value;
      }
      buffer = [];
    }

    text.split('\n').forEach(function (line) {
      var matched = null;
      for (var i = 0; i < labelRegexes.length; i++) {
        var m = line.match(labelRegexes[i].re);
        if (m) { matched = { field: labelRegexes[i].field, inline: m[1] }; break; }
      }
      if (matched) {
        flush();
        currentField = matched.field;
        buffer = matched.inline ? [matched.inline] : [];
      } else if (currentField) {
        buffer.push(line);
      }
    });
    flush();

    if (result.targetType) {
      if (result.targetType.indexOf('動画') !== -1) result.targetType = '動画生成';
      else if (result.targetType.indexOf('画像') !== -1) result.targetType = '画像生成';
    }

    return result;
  }

  parseHandoffButton.addEventListener('click', function () {
    var rawHandoffText = fieldHandoffPaste.value;
    var criIdMatch = String(rawHandoffText || '').match(/CRI\d+/);

    if (criIdMatch) {
      applyCriParsedFields(parseCriHandoffText(rawHandoffText), criIdMatch[0]);
      return;
    }

    criFieldsWrap.hidden = true;
    handoffSourceInfo.hidden = true;

    var parsed = parseHandoffText(fieldHandoffPaste.value);

    if (parsed.aiiId) fieldAiiId.value = parsed.aiiId;
    if (parsed.newsTitle) fieldNewsTitle.value = parsed.newsTitle;
    if (parsed.newsSummary) fieldNewsSummary.value = parsed.newsSummary;
    if (parsed.whatsNew) fieldWhatsNew.value = parsed.whatsNew;
    if (parsed.creativeEffect) fieldCreativeEffect.value = parsed.creativeEffect;
    if (parsed.useCasesRaw) fieldUseCasesRaw.value = parsed.useCasesRaw;
    if (parsed.reproPoints) fieldReproPoints.value = parsed.reproPoints;
    if (parsed.targetType) fieldTargetType.value = parsed.targetType;
    if (parsed.expressionType) fieldExpressionType.value = parsed.expressionType;
    if (parsed.coreEffect) fieldCoreEffect.value = parsed.coreEffect;
    if (parsed.changedElements) fieldChangedElements.value = parsed.changedElements;
    if (parsed.keptElements) fieldKeptElements.value = parsed.keptElements;
    if (parsed.mustHavePoints) fieldMustHavePoints.value = parsed.mustHavePoints;
    if (parsed.sampleTestPrompt) fieldSampleTestPrompt.value = parsed.sampleTestPrompt;
    if (parsed.sourceUrl) fieldSourceUrl.value = parsed.sourceUrl;

    var resolvedCount = Object.keys(parsed).length;
    var missingLabels = HANDOFF_FIELD_LABELS
      .filter(function (pair) { return !parsed[pair[0]]; })
      .map(function (pair) { return pair[1]; });

    if (resolvedCount === 0) {
      parseHandoffStatus.textContent = '項目を認識できませんでした。ラベル文言（例：「ニュースタイトル：」）が含まれているか確認してください。';
      parseHandoffStatus.className = 'generate-status is-error';
    } else {
      var message = resolvedCount + '項目を反映しました。内容を確認してください。';
      if (missingLabels.length) message += '（見つからなかった項目: ' + missingLabels.join('、') + '）';
      parseHandoffStatus.textContent = message;
      parseHandoffStatus.className = 'generate-status is-ok';
    }
  });

  // --- 「Claudeで記事を作成」 ---
  function collectInputFields() {
    return {
      mode: 'handoff',
      aiiId: fieldAiiId.value.trim(),
      categoryOverride: fieldCategoryOverride.value,
      newsTitle: fieldNewsTitle.value.trim(),
      newsSummary: fieldNewsSummary.value.trim(),
      whatsNew: fieldWhatsNew.value.trim(),
      creativeEffect: fieldCreativeEffect.value.trim(),
      useCasesRaw: fieldUseCasesRaw.value.trim(),
      reproPoints: fieldReproPoints.value.trim(),
      targetType: fieldTargetType.value,
      expressionType: fieldExpressionType.value.trim(),
      coreEffect: fieldCoreEffect.value.trim(),
      changedElements: fieldChangedElements.value.trim(),
      keptElements: fieldKeptElements.value.trim(),
      mustHavePoints: fieldMustHavePoints.value.trim(),
      sampleTestPrompt: fieldSampleTestPrompt.value.trim(),
      adoptedSamplePrompt: fieldAdoptedSamplePrompt.value.trim(),
      sourceUrl: fieldSourceUrl.value.trim(),
      extraComments: fieldExtraComments.value.trim()
    };
  }

  function collectOriginalFields() {
    return {
      mode: 'original',
      theme: fieldOriginalTheme.value.trim(),
      promptJa: fieldOriginalPromptJa.value.trim(),
      supplementalNotes: fieldOriginalNotes.value.trim()
    };
  }

  function collectCriFields() {
    return {
      mode: 'cri',
      criId: currentCriManagementId,
      categoryOverride: fieldCategoryOverride.value,
      ideaName: fieldCriIdeaName.value.trim(),
      ideaSummary: fieldCriIdeaSummary.value.trim(),
      attentionReason: fieldCriAttentionReason.value.trim(),
      creativeAppeal: fieldCriCreativeAppeal.value.trim(),
      useCasesRaw: fieldCriUseCasesRaw.value.trim(),
      reproPoints: fieldCriReproPoints.value.trim(),
      classification: fieldCriClassification.value.trim(),
      coreExpression: fieldCriCoreExpression.value.trim(),
      changedElements: fieldCriChangedElements.value.trim(),
      keptElements: fieldCriKeptElements.value.trim(),
      mustHavePoints: fieldCriMustHavePoints.value.trim(),
      labTrendHints: fieldCriLabTrendHints.value.trim(),
      labUseCaseHints: fieldCriLabUseCaseHints.value.trim(),
      sampleTestPrompt: fieldCriSampleTestPrompt.value.trim(),
      sourceUrl: fieldCriSourceUrl.value.trim()
    };
  }

  // sourceUrlOverride省略時は制作引き継ぎ側のsourceUrl欄を使用する（従来どおりの挙動）。
  // オリジナル側には情報源URL欄が無いため、呼び出し側から空文字を明示的に渡す。
  function applyGeneratedArticle(payload, sourceUrlOverride) {
    var article = payload.article || {};
    var category = article.category && CATEGORY_NAMES[article.category] ? article.category : '';

    fieldCategory.value = category || 'VIS';
    categoryReasonHint.textContent = article.categoryReason
      ? '判定理由: ' + article.categoryReason
      : '';

    var candidateId = computeIdCandidate(fieldCategory.value);
    fieldId.value = candidateId;
    lastAutoId = candidateId;

    var now = new Date();
    fieldDatetimeDate.value = formatDateInput(now);
    fieldDatetimeTime.value = formatTimeInput(now);
    fieldPublishedAtDate.value = formatDateInput(now);
    fieldPublishedAtTime.value = formatTimeInput(now);

    fieldTitle.value = article.title || '';
    fieldTitleEn.value = article.titleEn || '';
    fieldSummary.value = article.summary || '';
    fieldSummaryEn.value = article.summaryEn || '';
    fieldTrendElements.value = arrayToLines(article.trendElements);
    fieldTrendElementsEn.value = arrayToLines(article.trendElementsEn);
    fieldUseCases.value = arrayToLines(article.useCases);
    fieldUseCasesEn.value = arrayToLines(article.useCasesEn);
    fieldPromptJa.value = article.promptJa || '';
    fieldPromptEn.value = article.promptEn || '';
    fieldNoteTitle.value = article.noteTitle || '';
    fieldNoteTitleEn.value = article.noteTitleEn || '';
    fieldNotes.value = arrayToLines(article.notes);
    fieldNotesEn.value = arrayToLines(article.notesEn);
    fieldSourceUrlFinal.value = sourceUrlOverride === undefined ? fieldSourceUrl.value.trim() : sourceUrlOverride;

    // 採用判断用サンプル画像と最終公開画像は明確に分離するため、ここでは自動コピーしない。
    // 最終公開画像は、この後ユーザーが明示的にアップロードするか「サンプル画像を使う」ボタンで反映する。

    // 生成直後はJA/ENが対で揃っているため、日英同期の未同期状態をリセットする。
    Object.keys(enPairDirty).forEach(function (key) { enPairDirty[key] = false; });
    updateEnSyncStatusDisplay();

    resultSection.hidden = false;
    registerSection.hidden = false;
    registerReport.innerHTML = '';
    registerStatus.textContent = '';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderAll();
  }

  generateButton.addEventListener('click', function () {
    if (!inputForm.reportValidity()) return;
    if (dataLoadState !== 'ok') {
      generateStatus.textContent = 'サーバーに接続できていないため生成できません。上部の接続状況を確認してください。';
      generateStatus.className = 'generate-status is-error';
      return;
    }

    generateButton.disabled = true;
    generateStatus.textContent = 'Claudeが記事を作成しています…（数十秒かかる場合があります）';
    generateStatus.className = 'generate-status is-loading';

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectInputFields())
    })
      .then(function (response) {
        return parseJsonResponseSafely(response).then(function (payload) {
          if (!response.ok || !payload.ok) {
            throw new Error(payload && payload.error ? payload.error : ('HTTPステータス: ' + response.status));
          }
          return payload;
        });
      })
      .then(function (payload) {
        applyGeneratedArticle(payload);
        generateStatus.textContent = '生成が完了しました。内容を確認してください。';
        generateStatus.className = 'generate-status is-ok';
      })
      .catch(function (error) {
        generateStatus.textContent = '生成に失敗しました: ' + (error && error.message ? error.message : String(error));
        generateStatus.className = 'generate-status is-error';
      })
      .finally(function () {
        generateButton.disabled = false;
      });
  });

  generateOriginalButton.addEventListener('click', function () {
    if (!originalForm.reportValidity()) return;
    if (dataLoadState !== 'ok') {
      generateOriginalStatus.textContent = 'サーバーに接続できていないため生成できません。上部の接続状況を確認してください。';
      generateOriginalStatus.className = 'generate-status is-error';
      return;
    }

    generateOriginalButton.disabled = true;
    generateOriginalStatus.textContent = 'Claudeが記事を作成しています…（数十秒かかる場合があります）';
    generateOriginalStatus.className = 'generate-status is-loading';

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectOriginalFields())
    })
      .then(function (response) {
        return parseJsonResponseSafely(response).then(function (payload) {
          if (!response.ok || !payload.ok) {
            throw new Error(payload && payload.error ? payload.error : ('HTTPステータス: ' + response.status));
          }
          return payload;
        });
      })
      .then(function (payload) {
        applyGeneratedArticle(payload, '');
        generateOriginalStatus.textContent = '生成が完了しました。内容を確認してください。';
        generateOriginalStatus.className = 'generate-status is-ok';
      })
      .catch(function (error) {
        generateOriginalStatus.textContent = '生成に失敗しました: ' + (error && error.message ? error.message : String(error));
        generateOriginalStatus.className = 'generate-status is-error';
      })
      .finally(function () {
        generateOriginalButton.disabled = false;
      });
  });

  generateCriButton.addEventListener('click', function () {
    if (!criForm.reportValidity()) return;
    if (dataLoadState !== 'ok') {
      generateCriStatus.textContent = 'サーバーに接続できていないため生成できません。上部の接続状況を確認してください。';
      generateCriStatus.className = 'generate-status is-error';
      return;
    }

    generateCriButton.disabled = true;
    generateCriStatus.textContent = 'Claudeが記事を作成しています…（数十秒かかる場合があります）';
    generateCriStatus.className = 'generate-status is-loading';

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectCriFields())
    })
      .then(function (response) {
        return parseJsonResponseSafely(response).then(function (payload) {
          if (!response.ok || !payload.ok) {
            throw new Error(payload && payload.error ? payload.error : ('HTTPステータス: ' + response.status));
          }
          return payload;
        });
      })
      .then(function (payload) {
        applyGeneratedArticle(payload, fieldCriSourceUrl.value.trim());
        generateCriStatus.textContent = '生成が完了しました。内容を確認してください。';
        generateCriStatus.className = 'generate-status is-ok';
      })
      .catch(function (error) {
        generateCriStatus.textContent = '生成に失敗しました: ' + (error && error.message ? error.message : String(error));
        generateCriStatus.className = 'generate-status is-error';
      })
      .finally(function () {
        generateCriButton.disabled = false;
      });
  });

  // --- 生成結果セクションの操作 ---
  fieldCategory.addEventListener('change', function () {
    var candidateId = computeIdCandidate(fieldCategory.value);
    var currentId = fieldId.value.trim();
    if (!currentId || currentId === lastAutoId) {
      fieldId.value = candidateId;
      lastAutoId = candidateId;
    }
    renderAll();
  });

  regenerateIdButton.addEventListener('click', function () {
    var candidateId = computeIdCandidate(fieldCategory.value);
    fieldId.value = candidateId;
    lastAutoId = candidateId;
    idHint.textContent = 'data/articles.json の既存IDを確認して、次に使える候補を自動入力します。';
    renderAll();
  });

  setNowDatetimeButton.addEventListener('click', function () {
    var now = new Date();
    fieldDatetimeDate.value = formatDateInput(now);
    fieldDatetimeTime.value = formatTimeInput(now);
    renderAll();
  });

  copyDatetimeButton.addEventListener('click', function () {
    fieldPublishedAtDate.value = fieldDatetimeDate.value;
    fieldPublishedAtTime.value = fieldDatetimeTime.value;
    renderAll();
  });

  copyPromptJaButton.addEventListener('click', function () {
    copyText(fieldPromptJa.value, copyPromptJaButton);
  });
  copyPromptEnButton.addEventListener('click', function () {
    copyText(fieldPromptEn.value, copyPromptEnButton);
  });

  [
    fieldId, fieldCategory, fieldDatetimeDate, fieldDatetimeTime, fieldPublishedAtDate, fieldPublishedAtTime,
    fieldTitle, fieldTitleEn, fieldSummary, fieldSummaryEn,
    fieldTrendElements, fieldTrendElementsEn, fieldUseCases, fieldUseCasesEn,
    fieldPromptJa, fieldPromptEn, fieldNoteTitle, fieldNoteTitleEn, fieldNotes, fieldNotesEn,
    fieldSourceUrlFinal
  ].forEach(function (el) {
    el.addEventListener('input', renderAll);
    el.addEventListener('change', renderAll);
  });

  // --- 記事オブジェクトの組み立て ---
  function buildArticle() {
    var article = {};
    var category = fieldCategory.value;
    var names = CATEGORY_NAMES[category] || { ja: '', en: '' };

    article.datetime = combineDateTime(fieldDatetimeDate.value, fieldDatetimeTime.value);
    var publishedAt = combineDateTime(fieldPublishedAtDate.value, fieldPublishedAtTime.value);
    if (publishedAt) article.publishedAt = publishedAt;

    article.category = category;
    article.categoryLabel = names.ja;
    article.categoryLabelEn = names.en;
    article.id = fieldId.value.trim();
    article.title = fieldTitle.value.trim();
    article.titleEn = fieldTitleEn.value.trim();
    article.summary = fieldSummary.value.trim();
    article.summaryEn = fieldSummaryEn.value.trim();
    article.trendElements = linesToArray(fieldTrendElements.value);
    article.trendElementsEn = linesToArray(fieldTrendElementsEn.value);
    article.useCases = linesToArray(fieldUseCases.value);
    article.useCasesEn = linesToArray(fieldUseCasesEn.value);
    article.promptJa = fieldPromptJa.value.trim();
    article.promptEn = fieldPromptEn.value.trim();
    article.noteTitle = fieldNoteTitle.value.trim();
    article.noteTitleEn = fieldNoteTitleEn.value.trim();
    article.notes = linesToArray(fieldNotes.value);
    article.notesEn = linesToArray(fieldNotesEn.value);
    article.sourceUrl = fieldSourceUrlFinal.value.trim();

    return article;
  }

  // サイト本体（script.js の isNewArticle 相当）：公開から24時間以内なら「NEW」表示
  function isNewArticlePreview(article) {
    var value = article.publishedAt || article.datetime || '';
    if (!value) return false;
    var normalized = String(value).replace(' ', 'T').replace(/\//g, '-');
    var date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return false;
    var diff = Date.now() - date.getTime();
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  }

  // サイト本体（script.js の badgeHtml 相当。このツールが扱わない featured/labels は対象外）
  function previewBadgeHtml(article) {
    var pieces = [];
    if (isNewArticlePreview(article)) pieces.push('<span class="preview-new-badge">NEW</span>');
    if (article.category) {
      var categoryClass = 'category-' + article.category.toLowerCase();
      pieces.push('<span class="preview-badge ' + categoryClass + '">' + escapeHtml(article.categoryLabel || article.category) + '</span>');
    }
    return pieces.join('');
  }

  // サイト本体の記事詳細表示（script.js の renderDetail 相当）に近づけた簡易プレビュー。
  // sourceUrl はサイト本体でも表示されないフィールドのため、ここでも表示しない。
  function renderPreview(article) {
    if (!article.title && !article.id) {
      previewCard.innerHTML = '<p class="preview-empty">「Claudeで記事を作成」を実行するとここにプレビューが表示されます。</p>';
      return;
    }

    var imageHtml = finalImageDataUrl
      ? '<img class="preview-hero-image" data-preview-zoom src="' + finalImageDataUrl + '" alt="' + escapeHtml(article.title || '') + '">'
      : '<div class="preview-hero-image preview-hero-image-empty">最終公開画像 未設定</div>';

    var trendTagsHtml = (article.trendElements || []).map(function (tag) {
      return '<span class="preview-tag">#' + escapeHtml(tag) + '</span>';
    }).join('') || '<span class="preview-empty-inline">（なし）</span>';

    var useCasesHtml = (article.useCases || []).map(function (uc) {
      return '<span class="preview-tag">' + escapeHtml(uc) + '</span>';
    }).join('') || '<span class="preview-empty-inline">（なし）</span>';

    var notesHtml = (article.notes || []).map(function (note) {
      return '<li>' + escapeHtml(note) + '</li>';
    }).join('') || '<li class="preview-empty-inline">（なし）</li>';

    previewCard.innerHTML =
      '<div class="preview-card">' +
      '<div class="preview-hero">' +
      imageHtml +
      '<div class="preview-copy">' +
      '<div class="preview-meta-line">' + previewBadgeHtml(article) + '<span>' + escapeHtml(article.id || '(ID未採番)') + '</span><span>' + escapeHtml(article.datetime || '') + '</span></div>' +
      '<h3 class="preview-title">' + escapeHtml(article.title || '(タイトル未入力)') + '</h3>' +
      '<p class="preview-summary">' + escapeHtml(article.summary || '') + '</p>' +
      '<div class="preview-copy-row">' +
      '<button type="button" class="preview-copy-button is-primary" data-preview-copy="ja">日本語プロンプトをコピー</button>' +
      '<button type="button" class="preview-copy-button" data-preview-copy="en">英語プロンプトをコピー</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="preview-section"><h3>トレンド要素</h3><div class="preview-tag-row">' + trendTagsHtml + '</div></div>' +
      '<div class="preview-section"><h3>使いどころ</h3><div class="preview-tag-row">' + useCasesHtml + '</div></div>' +
      '<div class="preview-section"><h3>日本語プロンプト</h3><div class="preview-prompt-box">' + escapeHtml(article.promptJa || '') + '</div></div>' +
      '<div class="preview-section"><h3>English Prompt</h3><div class="preview-prompt-box">' + escapeHtml(article.promptEn || '') + '</div></div>' +
      '<div class="preview-section"><h3>' + escapeHtml(article.noteTitle || 'メモ') + '</h3><ul class="preview-notes-list">' + notesHtml + '</ul></div>' +
      '</div>';
  }

  previewCard.addEventListener('click', function (event) {
    var copyButton = event.target.closest ? event.target.closest('[data-preview-copy]') : null;
    if (copyButton) {
      var lang = copyButton.getAttribute('data-preview-copy');
      copyText(lang === 'en' ? fieldPromptEn.value : fieldPromptJa.value, copyButton);
      return;
    }
    var zoomImg = event.target.closest ? event.target.closest('[data-preview-zoom]') : null;
    if (zoomImg) openPreviewImageModal(zoomImg.src, zoomImg.alt);
  });

  function openPreviewImageModal(src, alt) {
    if (!src) return;
    previewImageModalImg.src = src;
    previewImageModalImg.alt = alt || '';
    previewImageModal.hidden = false;
  }

  function closePreviewImageModal() {
    previewImageModal.hidden = true;
    previewImageModalImg.src = '';
  }

  previewImageModalClose.addEventListener('click', closePreviewImageModal);
  previewImageModal.addEventListener('click', function (event) {
    if (event.target === previewImageModal) closePreviewImageModal();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !previewImageModal.hidden) closePreviewImageModal();
  });

  function buildAppendSnippet(json) {
    var indented = json.split('\n').map(function (line) { return '  ' + line; }).join('\n');
    return ',\n' + indented;
  }

  function renderJsonOutput(article) {
    var json = JSON.stringify(article, null, 2);
    jsonOutput.textContent = json;
    lastGeneratedJson = json;

    var hasId = !!article.id;
    copyObjectButton.disabled = !hasId;
    copyForAppendButton.disabled = !hasId;
  }

  function renderAll() {
    var article = buildArticle();
    renderPreview(article);
    renderJsonOutput(article);
  }

  copyObjectButton.addEventListener('click', function () {
    if (copyObjectButton.disabled) return;
    copyText(lastGeneratedJson, copyObjectButton);
  });

  copyForAppendButton.addEventListener('click', function () {
    if (copyForAppendButton.disabled) return;
    copyText(buildAppendSnippet(lastGeneratedJson), copyForAppendButton);
  });

  // --- 日英同期（日本語を正本とし、変更のあった日英ペアだけを登録前に再同期する） ---
  // キーはJA側フィールド名。AII/CRI/オリジナルいずれの生成結果にも共通で適用される。
  var EN_SYNC_PAIRS = {
    title: { jaEl: fieldTitle, enEl: fieldTitleEn, enKey: 'titleEn', isArray: false },
    summary: { jaEl: fieldSummary, enEl: fieldSummaryEn, enKey: 'summaryEn', isArray: false },
    trendElements: { jaEl: fieldTrendElements, enEl: fieldTrendElementsEn, enKey: 'trendElementsEn', isArray: true },
    useCases: { jaEl: fieldUseCases, enEl: fieldUseCasesEn, enKey: 'useCasesEn', isArray: true },
    promptJa: { jaEl: fieldPromptJa, enEl: fieldPromptEn, enKey: 'promptEn', isArray: false },
    noteTitle: { jaEl: fieldNoteTitle, enEl: fieldNoteTitleEn, enKey: 'noteTitleEn', isArray: false },
    notes: { jaEl: fieldNotes, enEl: fieldNotesEn, enKey: 'notesEn', isArray: true }
  };

  Object.keys(EN_SYNC_PAIRS).forEach(function (key) {
    EN_SYNC_PAIRS[key].jaEl.addEventListener('input', function () {
      if (!enPairDirty[key]) {
        enPairDirty[key] = true;
        updateEnSyncStatusDisplay();
      }
    });
  });

  function collectDirtyPairs() {
    return Object.keys(EN_SYNC_PAIRS).filter(function (key) { return enPairDirty[key]; });
  }

  function updateEnSyncStatusDisplay() {
    if (!enSyncStatus) return;
    var dirtyCount = collectDirtyPairs().length;
    if (dirtyCount === 0) {
      enSyncStatus.textContent = '英語版は日本語最新版と同期済みです。';
    } else {
      enSyncStatus.textContent = '日本語が変更されています（' + dirtyCount + '項目）。英語版は登録時に自動更新されます。';
    }
  }

  function collectJaSyncPayload() {
    return {
      title: fieldTitle.value.trim(),
      summary: fieldSummary.value.trim(),
      trendElements: linesToArray(fieldTrendElements.value),
      useCases: linesToArray(fieldUseCases.value),
      promptJa: fieldPromptJa.value.trim(),
      noteTitle: fieldNoteTitle.value.trim(),
      notes: linesToArray(fieldNotes.value)
    };
  }

  // 同期に成功したペアだけEN側フィールドへ反映し、dirty状態を解除する。
  // レスポンスに含まれないペアには触れないため、同期対象外のENフィールド（手動編集分を含む）はそのまま保持される。
  function applyEnSyncResult(enPayload) {
    var payload = enPayload || {};
    Object.keys(EN_SYNC_PAIRS).forEach(function (key) {
      var pair = EN_SYNC_PAIRS[key];
      if (!enPairDirty[key]) return;
      if (!Object.prototype.hasOwnProperty.call(payload, pair.enKey)) return;
      pair.enEl.value = pair.isArray ? arrayToLines(payload[pair.enKey]) : String(payload[pair.enKey] || '');
      enPairDirty[key] = false;
    });
    updateEnSyncStatusDisplay();
    renderAll();
  }

  // --- STEP2: ローカルへ登録 ---
  function checkListItem(label, passed) {
    if (passed === null || passed === undefined) {
      return '<li class="check-pending">・ ' + escapeHtml(label) + ': 未実施</li>';
    }
    var mark = passed ? '✓' : '✗';
    var cls = passed ? 'check-pass' : 'check-fail';
    return '<li class="' + cls + '">' + mark + ' ' + escapeHtml(label) + '</li>';
  }

  function imageResultLabel(result) {
    if (result === 'saved') return '保存しました（images/articles/配下にPNGで保存）';
    if (result === 'skipped') return 'スキップ（最終画像が未指定のため）';
    if (result === 'not_attempted') return '未実施（検証失敗のため書き込みを行いませんでした）';
    return String(result || '');
  }

  function renderRegisterReport(payload) {
    var v = payload.validations || {};

    var html = '';
    html += '<div class="register-stats">';
    html += '<span class="stat-pill">登録前: ' + escapeHtml(payload.before) + '件</span>';
    html += '<span class="stat-pill">登録後: ' + escapeHtml(payload.after) + '件</span>';
    html += '<span class="stat-pill">追加: ' + escapeHtml(payload.added) + '件</span>';
    html += '</div>';

    if (payload.id || payload.title) {
      html += '<p class="register-article-line"><strong>' + escapeHtml(payload.id || '(ID未確定)') + '</strong>「' +
        escapeHtml(payload.title || '') + '」（' + escapeHtml(payload.category || '') + '）</p>';
    }

    html += '<ul class="check-list">';
    html += checkListItem('JSON構文（登録前のdata/articles.json）', v.jsonSyntaxBefore);
    html += checkListItem('必須項目（id/category/datetime/title/summary）', v.requiredFields);
    html += checkListItem('ID形式（英字3文字＋数字5桁）', v.idFormat);
    html += checkListItem('カテゴリ（現行7種類）', v.categoryValid);
    html += checkListItem('ID重複なし', v.idDuplicate);
    html += checkListItem('JSON構文（追記後）', v.jsonSyntaxAfter);
    html += '</ul>';

    if (payload.missingFields && payload.missingFields.length) {
      html += '<p class="issue-empty">不足している必須項目: ' + payload.missingFields.map(escapeHtml).join(', ') + '</p>';
    }

    html += '<p>画像保存: ' + escapeHtml(imageResultLabel(payload.imageResult)) + '</p>';

    if (payload.changedFiles && payload.changedFiles.length) {
      html += '<p>変更ファイル:</p><ul class="changed-file-list">' +
        payload.changedFiles.map(function (f) { return '<li><code>' + escapeHtml(f) + '</code></li>'; }).join('') +
        '</ul>';
    }

    if (payload.gitDiffSummary) {
      html += '<p>Git差分概要（<code>git status --porcelain</code>）:</p><pre class="json-output">' + escapeHtml(payload.gitDiffSummary) + '</pre>';
    }

    if (payload.error) {
      html += '<p class="register-error">' + escapeHtml(payload.error) + '</p>';
    }

    registerReport.innerHTML = html;
  }

  function performRegister() {
    registerButton.disabled = true;
    registerStatus.textContent = '登録処理を実行しています…';
    registerStatus.className = 'generate-status is-loading';

    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleJson: lastGeneratedJson, imageDataUrl: finalImageDataUrl || null })
    })
      .then(function (response) {
        return parseJsonResponseSafely(response).then(function (payload) {
          return { httpOk: response.ok, payload: payload };
        });
      })
      .then(function (result) {
        renderRegisterReport(result.payload);
        if (result.httpOk && result.payload.ok) {
          registerStatus.textContent = '登録が完了しました。';
          registerStatus.className = 'generate-status is-ok';
          loadExistingData();

          lastRegisteredArticle = {
            id: result.payload.id,
            title: result.payload.title,
            category: result.payload.category,
            hasImage: result.payload.imageResult === 'saved'
          };
          pushReport.innerHTML = '';
          pushStatus.textContent = '';
          pushSection.hidden = false;
          pushSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          registerStatus.textContent = '登録できませんでした。検証結果を確認してください。';
          registerStatus.className = 'generate-status is-error';
        }
      })
      .catch(function (error) {
        registerStatus.textContent = '登録処理に失敗しました: ' + (error && error.message ? error.message : String(error));
        registerStatus.className = 'generate-status is-error';
      })
      .finally(function () {
        registerButton.disabled = false;
      });
  }

  registerButton.addEventListener('click', function () {
    if (!lastGeneratedJson) {
      registerStatus.textContent = '登録する記事がありません。先に記事を作成してください。';
      registerStatus.className = 'generate-status is-error';
      return;
    }
    var article = buildArticle();
    if (!article.id || !article.title || !article.category) {
      registerStatus.textContent = 'ID・タイトル・カテゴリのいずれかが空です。内容を確認してください。';
      registerStatus.className = 'generate-status is-error';
      return;
    }

    var confirmMessage = '「' + article.id + ' ' + article.title + '」を data/articles.json へ登録します。';
    confirmMessage += finalImageDataUrl ? '\n最終画像も images/articles/' + article.id + '.png として保存されます。' : '\n最終画像は指定されていないため、画像は保存されません。';
    if (!window.confirm(confirmMessage + '\n\nよろしいですか？')) return;

    var dirtyPairs = collectDirtyPairs();
    if (dirtyPairs.length === 0) {
      performRegister();
      return;
    }

    registerButton.disabled = true;
    registerStatus.textContent = '英語版を日本語最新版と同期しています…（数十秒かかる場合があります）';
    registerStatus.className = 'generate-status is-loading';

    fetch('/api/sync-en', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ja: collectJaSyncPayload(), dirtyPairs: dirtyPairs })
    })
      .then(function (response) {
        return parseJsonResponseSafely(response).then(function (payload) {
          if (!response.ok || !payload.ok) {
            throw new Error(payload && payload.error ? payload.error : ('HTTPステータス: ' + response.status));
          }
          return payload;
        });
      })
      .then(function (payload) {
        applyEnSyncResult(payload.en);
        performRegister();
      })
      .catch(function (error) {
        registerButton.disabled = false;
        registerStatus.textContent = '英語版の自動同期に失敗したため、登録していません: ' + (error && error.message ? error.message : String(error));
        registerStatus.className = 'generate-status is-error';
      });
  });

  // --- STEP3: GitHubへPush ---
  function renderPushReport(payload) {
    var html = '';

    if (payload.unexpectedChanges && payload.unexpectedChanges.length) {
      html += '<p class="issue-empty">この記事登録（data/articles.json・該当画像）以外の変更が見つかったため、中止しました:</p><pre class="json-output">' +
        escapeHtml(payload.unexpectedChanges.join('\n')) + '</pre>';
    }

    if (payload.commits && payload.commits.length) {
      html += '<p class="register-article-line"><strong>作成したコミット:</strong></p><ul class="changed-file-list">' +
        payload.commits.map(function (c) { return '<li><code>' + escapeHtml(c) + '</code></li>'; }).join('') +
        '</ul>';
    }

    html += '<ul class="check-list">' +
      checkListItem('コミット', payload.committed) +
      checkListItem('push', payload.pushed) +
      '</ul>';

    if (payload.pushOutput) {
      html += '<p>git push の出力:</p><pre class="json-output">' + escapeHtml(payload.pushOutput) + '</pre>';
    }

    if (payload.error) {
      html += '<p class="register-error">' + escapeHtml(payload.error) + '</p>';
    }

    pushReport.innerHTML = html;
  }

  pushButton.addEventListener('click', function () {
    if (!lastRegisteredArticle || !lastRegisteredArticle.id) {
      pushStatus.textContent = 'Push対象の記事情報がありません。先にローカルへ登録してください。';
      pushStatus.className = 'generate-status is-error';
      return;
    }

    var steps = ['1. data/articles.json をコミット（Update articles.json）'];
    if (lastRegisteredArticle.hasImage) {
      steps.push('2. images/articles/' + lastRegisteredArticle.id + '.png をコミット');
    }
    steps.push((steps.length + 1) + '. origin/main へ push（GitHub Pagesへ即時反映されます）');

    var confirmMessage = '「' + lastRegisteredArticle.id + ' ' + lastRegisteredArticle.title + '」をGitHubへPushします。\n\n' +
      '実行内容:\n' + steps.join('\n') + '\n\n' +
      'この記事登録に関係のない変更が作業ツリーにある場合は自動的に中止されます。\n\nよろしいですか？';
    if (!window.confirm(confirmMessage)) return;

    pushButton.disabled = true;
    pushStatus.textContent = 'GitHubへPushしています…';
    pushStatus.className = 'generate-status is-loading';

    fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lastRegisteredArticle.id })
    })
      .then(function (response) {
        return parseJsonResponseSafely(response).then(function (payload) {
          return { httpOk: response.ok, payload: payload };
        });
      })
      .then(function (result) {
        renderPushReport(result.payload);
        if (result.httpOk && result.payload.ok) {
          pushStatus.textContent = 'GitHubへのPushが完了しました。';
          pushStatus.className = 'generate-status is-ok';
        } else {
          pushStatus.textContent = 'Pushできませんでした。レポートを確認してください。';
          pushStatus.className = 'generate-status is-error';
        }
      })
      .catch(function (error) {
        pushStatus.textContent = 'Push処理に失敗しました: ' + (error && error.message ? error.message : String(error));
        pushStatus.className = 'generate-status is-error';
      })
      .finally(function () {
        pushButton.disabled = false;
      });
  });

  loadExistingData();
  renderAll();
}());
