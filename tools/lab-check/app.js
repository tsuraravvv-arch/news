(function () {
  'use strict';

  // 現行のIDカテゴリ（README.md「IDカテゴリ体系 v99」に対応）
  var CURRENT_CATEGORIES = ['FAS', 'JOB', 'PNF', 'VIS', 'SSN', 'ORI', 'ITM'];

  // ID形式：英字3文字＋数字5桁（例：FAS00001）
  var ID_PATTERN = /^[A-Za-z]{3}\d{5}$/;

  // datetime / publishedAt の想定形式：YYYY-MM-DD HH:mm
  var DATE_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

  // 欠落・空文字だと記事として成立しない必須項目（エラー扱い）
  var ERROR_REQUIRED_KEYS = ['id', 'category', 'datetime', 'title', 'summary'];

  // 配列（リスト）で保存されるべき項目
  var ARRAY_FIELDS = ['trendElements', 'trendElementsEn', 'useCases', 'useCasesEn', 'notes', 'notesEn'];

  // プロンプト本体（空でも記事は表示できるため警告扱い）
  var PROMPT_FIELDS = ['promptJa', 'promptEn'];

  // 日本語版・英語版のペアになっている項目
  var BILINGUAL_PAIRS = [
    ['title', 'titleEn'],
    ['summary', 'summaryEn'],
    ['categoryLabel', 'categoryLabelEn'],
    ['trendElements', 'trendElementsEn'],
    ['useCases', 'useCasesEn'],
    ['notes', 'notesEn'],
    ['noteTitle', 'noteTitleEn']
  ];

  // 現行データで全記事に共通して存在するキー（実データ調査に基づく）
  var COMMON_KEYS = [
    'id', 'category', 'categoryLabel', 'categoryLabelEn', 'datetime',
    'title', 'titleEn', 'summary', 'summaryEn',
    'trendElements', 'trendElementsEn', 'useCases', 'useCasesEn',
    'promptJa', 'promptEn', 'noteTitle', 'noteTitleEn', 'notes', 'notesEn',
    'sourceUrl'
  ];

  // 上記COMMON_KEYSのうち、個別の専用チェック（必須項目／プロンプト／日英ペア／sourceUrl）で
  // 既に扱っているキー。ここに含まれないキーだけが「共通項目の欠落」警告の対象になる
  var EXPLAINED_KEYS = (function () {
    var set = {};
    ERROR_REQUIRED_KEYS.forEach(function (k) { set[k] = true; });
    PROMPT_FIELDS.forEach(function (k) { set[k] = true; });
    BILINGUAL_PAIRS.forEach(function (pair) {
      set[pair[0]] = true;
      set[pair[1]] = true;
    });
    set.sourceUrl = true;
    return set;
  }());

  var appEl = document.getElementById('app');

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function hasStringContent(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function hasArrayContent(value) {
    return Array.isArray(value) && value.length > 0;
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDateTime(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function isValidDateString(value) {
    if (typeof value !== 'string') return false;
    var trimmed = value.trim();
    if (!DATE_PATTERN.test(trimmed)) return false;
    var parsed = new Date(trimmed.replace(' ', 'T'));
    return !Number.isNaN(parsed.getTime());
  }

  // ID重複チェック（記事横断・グローバル）
  function findDuplicateIds(articles) {
    var seen = {};
    articles.forEach(function (article) {
      var id = typeof article.id === 'string' ? article.id.trim() : '';
      if (!id) return; // 空のIDは必須項目エラー側で扱う
      seen[id] = (seen[id] || 0) + 1;
    });
    var duplicates = [];
    Object.keys(seen).forEach(function (id) {
      if (seen[id] > 1) duplicates.push({ id: id, count: seen[id] });
    });
    return duplicates;
  }

  // 記事1件分の診断
  function diagnoseArticle(article, index) {
    var errors = [];
    var warnings = [];
    var flagged = {}; // このフィールドは既にエラー報告済み、を記録して重複表示を防ぐ

    var rawId = article.id;
    var id = (typeof rawId === 'string' && rawId.trim())
      ? rawId.trim()
      : '(ID未設定・' + (index + 1) + '件目のデータ)';

    // 1) 必須項目の欠落・型不正・空文字（エラー）
    ERROR_REQUIRED_KEYS.forEach(function (key) {
      var has = Object.prototype.hasOwnProperty.call(article, key);
      var value = article[key];
      if (!has || value === null || value === undefined) {
        errors.push({ id: id, message: '必須項目「' + key + '」が存在しません。記事データにこの項目を追加してください。' });
        flagged[key] = true;
        return;
      }
      if (typeof value !== 'string') {
        errors.push({ id: id, message: '必須項目「' + key + '」の形式が文字列ではありません（型が不正です）。' });
        flagged[key] = true;
        return;
      }
      if (value.trim() === '') {
        errors.push({ id: id, message: '必須項目「' + key + '」が空です。内容を入力してください。' });
        flagged[key] = true;
      }
    });

    // 2) 配列であるべき項目が配列以外（型不正・エラー）
    ARRAY_FIELDS.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(article, key)) return;
      var value = article[key];
      if (value !== undefined && value !== null && !Array.isArray(value)) {
        errors.push({ id: id, message: '「' + key + '」はリスト形式（配列）で保存される項目ですが、別の形式になっています。' });
        flagged[key] = true;
      }
    });

    // 3) ID形式チェック（英字3文字＋数字5桁）※idが必須項目エラーで既に報告済みの場合は行わない
    var idFormatOk = false;
    if (!flagged.id && typeof rawId === 'string') {
      var trimmedId = rawId.trim();
      if (ID_PATTERN.test(trimmedId)) {
        idFormatOk = true;
      } else {
        errors.push({ id: id, message: 'ID「' + trimmedId + '」の形式が「英字3文字＋数字5桁」（例：FAS00001）になっていません。' });
      }
    }

    // 4) ID先頭3文字が現行カテゴリに含まれない（警告）※ID形式自体が不正な場合は対象外
    if (idFormatOk) {
      var prefix = rawId.trim().slice(0, 3).toUpperCase();
      if (CURRENT_CATEGORIES.indexOf(prefix) === -1) {
        warnings.push({
          id: id,
          message: 'IDの先頭「' + prefix + '」は現行カテゴリ（FAS/JOB/PNF/VIS/SSN/ORI/ITM）に含まれていません。旧形式のIDのまま残っている可能性があります。'
        });
      }
    }

    // 5) プロンプトが空（警告）
    PROMPT_FIELDS.forEach(function (key) {
      var label = key === 'promptJa' ? '日本語プロンプト' : '英語プロンプト';
      if (!hasStringContent(article[key])) {
        warnings.push({ id: id, message: label + '（' + key + '）が空です。生成用の文章が用意されていません。' });
      }
    });

    // 6) 日英ペアの片方だけが欠落・空（警告）※型不正で既に報告済みの項目は対象外
    BILINGUAL_PAIRS.forEach(function (pair) {
      var jaKey = pair[0];
      var enKey = pair[1];
      if (flagged[jaKey] || flagged[enKey]) return;
      var jaValue = article[jaKey];
      var enValue = article[enKey];
      var jaHas = Array.isArray(jaValue) ? hasArrayContent(jaValue) : hasStringContent(jaValue);
      var enHas = Array.isArray(enValue) ? hasArrayContent(enValue) : hasStringContent(enValue);
      if (jaHas !== enHas) {
        var missingKey = jaHas ? enKey : jaKey;
        warnings.push({
          id: id,
          message: '「' + jaKey + '」と「' + enKey + '」が対になっておらず、「' + missingKey + '」側の内容が空になっています。'
        });
      }
    });

    // 7) datetime / publishedAt が想定形式として解釈できない（警告）
    ['datetime', 'publishedAt'].forEach(function (key) {
      if (flagged[key]) return; // 必須項目エラーで既に報告済み
      var value = article[key];
      if (value === undefined || value === null || value === '') return; // 未設定は別扱い（情報欄で集計）
      if (!isValidDateString(value)) {
        warnings.push({
          id: id,
          message: '「' + key + '」の日時が想定の形式（例：2026-08-01 09:00）と異なります。実際の値：' + JSON.stringify(value)
        });
      }
    });

    // 8) 上記1〜7（sourceUrlを除く）で扱っていない共通項目の欠落（警告・将来の項目追加に備えた安全網）
    // ※ sourceUrl は情報欄で件数集計するため、ここでは対象外のまま維持する（EXPLAINED_KEYSで除外）
    COMMON_KEYS.forEach(function (key) {
      if (EXPLAINED_KEYS[key]) return;
      if (!Object.prototype.hasOwnProperty.call(article, key)) {
        warnings.push({ id: id, message: '共通項目「' + key + '」がこの記事にありません。' });
      }
    });

    return { errors: errors, warnings: warnings };
  }

  function buildReport(articles) {
    var errors = [];
    var warnings = [];

    findDuplicateIds(articles).forEach(function (dup) {
      errors.push({ id: dup.id, message: 'ID「' + dup.id + '」が' + dup.count + '件のデータで重複しています。' });
    });

    articles.forEach(function (article, index) {
      var result = diagnoseArticle(article, index);
      errors = errors.concat(result.errors);
      warnings = warnings.concat(result.warnings);
    });

    var categoryCounts = {};
    CURRENT_CATEGORIES.forEach(function (cat) { categoryCounts[cat] = 0; });
    var otherCategoryCounts = {};

    articles.forEach(function (article) {
      var cat = (typeof article.category === 'string' && article.category.trim()) ? article.category.trim() : '(未設定)';
      if (Object.prototype.hasOwnProperty.call(categoryCounts, cat)) {
        categoryCounts[cat] += 1;
      } else {
        otherCategoryCounts[cat] = (otherCategoryCounts[cat] || 0) + 1;
      }
    });

    var zeroCategories = CURRENT_CATEGORIES.filter(function (cat) { return categoryCounts[cat] === 0; });

    var publishedAtMissingCount = articles.filter(function (a) { return !hasStringContent(a.publishedAt); }).length;
    var oldIdCount = articles.filter(function (a) { return hasStringContent(a.oldId); }).length;
    var sourceUrlMissingCount = articles.filter(function (a) { return !hasStringContent(a.sourceUrl); }).length;

    var validPublishedAtValues = articles
      .map(function (a) { return a.publishedAt; })
      .filter(function (v) { return typeof v === 'string' && DATE_PATTERN.test(v.trim()); })
      .map(function (v) { return v.trim(); })
      .sort();
    var latestPublishedAt = validPublishedAtValues.length ? validPublishedAtValues[validPublishedAtValues.length - 1] : null;

    return {
      totalCount: articles.length,
      errors: errors,
      warnings: warnings,
      categoryCounts: categoryCounts,
      otherCategoryCounts: otherCategoryCounts,
      zeroCategories: zeroCategories,
      publishedAtMissingCount: publishedAtMissingCount,
      oldIdCount: oldIdCount,
      sourceUrlMissingCount: sourceUrlMissingCount,
      latestPublishedAt: latestPublishedAt
    };
  }

  function renderIssueTable(items, emptyMessage) {
    if (!items.length) {
      return '<p class="issue-empty">' + escapeHtml(emptyMessage) + '</p>';
    }
    var sorted = items.slice().sort(function (a, b) {
      return String(a.id).localeCompare(String(b.id));
    });
    var rows = sorted.map(function (item) {
      return '<tr><td class="issue-id">' + escapeHtml(item.id) + '</td><td>' + escapeHtml(item.message) + '</td></tr>';
    }).join('');
    return (
      '<div class="table-scroll">' +
      '<table class="issue-table">' +
      '<thead><tr><th>記事ID</th><th>内容</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>' +
      '</div>'
    );
  }

  function renderCategoryTable(report) {
    var rows = CURRENT_CATEGORIES.map(function (cat) {
      return '<tr><td>' + escapeHtml(cat) + '</td><td>' + report.categoryCounts[cat] + ' 件</td></tr>';
    }).join('');
    var otherRows = Object.keys(report.otherCategoryCounts).map(function (cat) {
      return '<tr><td>' + escapeHtml(cat) + '（現行カテゴリ以外）</td><td>' + report.otherCategoryCounts[cat] + ' 件</td></tr>';
    }).join('');
    return (
      '<div class="table-scroll">' +
      '<table class="issue-table">' +
      '<thead><tr><th>カテゴリ</th><th>記事数</th></tr></thead>' +
      '<tbody>' + rows + otherRows + '</tbody>' +
      '</table>' +
      '</div>'
    );
  }

  function renderReport(report, runAt) {
    var infoItems = [
      { label: '総記事数', value: report.totalCount + ' 件' },
      { label: '診断実行日時', value: formatDateTime(runAt) },
      { label: '最新の公開日時（publishedAt）', value: report.latestPublishedAt || '該当データなし' },
      { label: 'publishedAt未設定の記事数', value: report.publishedAtMissingCount + ' 件（未設定でもdatetimeの値で表示は継続されます）' },
      { label: '旧ID（oldId）を持つ記事数', value: report.oldIdCount + ' 件' },
      { label: 'sourceUrl未設定の記事数', value: report.sourceUrlMissingCount + ' 件（出典URLが無い記事です。ORI企画やJOBなど出典を伴わない記事では想定内です）' },
      { label: '現在0件の現行カテゴリ', value: report.zeroCategories.length ? escapeHtml(report.zeroCategories.join('、')) : 'なし（全カテゴリに記事があります）' }
    ];

    var infoListHtml = infoItems.map(function (item) {
      return '<li><span class="info-label">' + escapeHtml(item.label) + '</span><span class="info-value">' + (item.value.indexOf('<') === -1 ? escapeHtml(item.value) : item.value) + '</span></li>';
    }).join('');

    var errorBanner = report.errors.length === 0
      ? '<p class="ok-banner">公開を妨げる問題は見つかりませんでした。</p>'
      : '';

    appEl.innerHTML =
      '<section class="summary-bar" aria-label="診断結果サマリー">' +
      '<div class="stat-tile stat-error"><span class="stat-number">' + report.errors.length + '</span><span class="stat-label">エラー</span></div>' +
      '<div class="stat-tile stat-warning"><span class="stat-number">' + report.warnings.length + '</span><span class="stat-label">警告</span></div>' +
      '<div class="stat-tile stat-info"><span class="stat-number">' + infoItems.length + '</span><span class="stat-label">情報</span></div>' +
      '</section>' +

      '<section class="check-section">' +
      '<h2>エラー <span class="count-badge">' + report.errors.length + '</span></h2>' +
      '<p class="section-desc">記事の表示や運用に支障が出る可能性が高い問題です。公開前に修正してください。</p>' +
      errorBanner +
      renderIssueTable(report.errors, 'エラーはありません。') +
      '</section>' +

      '<section class="check-section">' +
      '<h2>警告 <span class="count-badge">' + report.warnings.length + '</span></h2>' +
      '<p class="section-desc">すぐに表示が壊れるものではありませんが、内容の抜けや不整合の可能性があるため、確認をおすすめします。</p>' +
      renderIssueTable(report.warnings, '警告はありません。') +
      '</section>' +

      '<section class="check-section">' +
      '<h2>情報</h2>' +
      '<p class="section-desc">記事データ全体の状況です。異常ではありませんが、参考としてご確認ください。</p>' +
      '<ul class="info-list">' + infoListHtml + '</ul>' +
      '<h3 class="sub-heading">カテゴリ別記事数</h3>' +
      renderCategoryTable(report) +
      '</section>';
  }

  function renderLoadError(message, detail) {
    appEl.innerHTML =
      '<section class="check-section">' +
      '<div class="load-error-banner">' +
      '<h2>読み込みエラー</h2>' +
      '<p>' + escapeHtml(message) + '</p>' +
      (detail ? '<p class="load-error-detail">詳細：' + escapeHtml(detail.message || String(detail)) + '</p>' : '') +
      '</div>' +
      '</section>';
  }

  function main() {
    var runAt = new Date();

    fetch('../../data/articles.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTPステータス: ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          renderLoadError('data/articles.json の中身が、記事の配列（リスト）形式になっていません。');
          return;
        }
        var report = buildReport(data);
        renderReport(report, runAt);
      })
      .catch(function (error) {
        renderLoadError('data/articles.json の読み込みに失敗しました。ファイルが存在するか、JSONの構文が正しいかご確認ください。', error);
      });
  }

  document.addEventListener('DOMContentLoaded', main);
}());
