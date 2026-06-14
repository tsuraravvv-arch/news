const categoryNames = {
  FA: { ja: 'ファッション', en: 'Fashion' },
  CB: { ja: '構図・背景', en: 'Composition & Background' },
  EV: { ja: '季節・イベント', en: 'Seasonal Events' },
  AI: { ja: 'AI生成関連', en: 'AI Generation' }
};

const uiText = {
  ja: {
    lead: 'AI生成に使いやすいプロンプトと創作アイデアを、ファッション・構図背景・季節イベントに整理したサイトです。気になる記事から日本語版 / 英語版プロンプトをすぐにコピーできます。',
    communityTitle: '動画生成AI研究＆交流コミュニティ',
    communityDesc: 'AI生成の仲間が欲しい方におすすめ',
    tarotTitle: '氷洞つららの大アルカナ占い',
    tarotDesc: 'わたしが作成したタロットカード占いです',
    filterDefault: '新着＋おすすめ',
    filterAll: 'すべて',
    filterOriginal: 'オリジナル',
    filter100: '100職',
    filterFashion: 'ファッション',
    filterComposition: '構図・背景',
    filterSeason: '季節・イベント',
    filterGuide: '活用ガイド',
    guideTitle: '活用ガイド',
    guideDesc: 'プロンプトの使い方と楽しみ方',
    defaultNote: '初期表示：新着＋おすすめを表示しています',
    imageSearch: '画像から検索',
    searchPlaceholder: 'タイトル・本文・タグを検索',
    search: '検索',
    reset: 'リセット',
    promptListTitle: 'プロンプト',
    selectTitle: 'サムネイルや文章をクリックすると全文が表示されます',
    selectDesc: '一覧から気になるプロンプトを選んでください。',
    copied: 'コピーしました',
    promptCopy: 'プロンプトコピー',
    jpCopy: '日',
    enCopy: '英',
    detail: '詳細',
    noResults: '該当する記事がありません。',
    count: (n) => `全 ${n} 件`,
    imageSearchTitle: '画像から検索',
    imageSearchDesc: 'アップロード済みの記事画像を一覧表示します。画像をクリックすると、対応する記事を開きます。',
    imageSearchEmpty: '表示できる記事画像がまだありません。',
    guideModalTitle: '活用ガイド',
    guideModalDesc: '掲載されているメモやプロンプトは、完成品をそのまま出すためだけのものではありません。あなたの環境や発想に合わせて、自由に足して楽しむためのアイデア集です。',
    guideStep1Title: '記事を探す',
    guideStep1Desc: '新着・おすすめ・カテゴリ・検索から、使いたい方向性の記事を探します。',
    guideStep2Title: 'プロンプトをコピー',
    guideStep2Desc: '一覧の日本語コピー / English Copy から、すぐに生成用プロンプトをコピーできます。',
    guideStep3Title: '要素を足して調整',
    guideStep3Desc: 'キャラクター名、場所、時間帯、光、カメラ演出などを足すと使いやすくなります。',
    guideStep4Title: '環境ごとの変化を楽しむ',
    guideStep4Desc: '生成環境やモデルによって結果が変わります。違いも含めて創作の幅として楽しんでください。',
    trendElements: 'トレンド要素',
    useCases: '使いどころ',
    notes: 'メモ',
    promptJa: '日本語プロンプト',
    promptEn: 'English Prompt'
  },
  en: {
    lead: 'A bilingual prompt library that organizes creative ideas for AI generation into fashion, composition/background, and seasonal events. Copy Japanese or English prompts directly from each item.',
    communityTitle: 'AI Video Generation Community',
    communityDesc: 'Recommended for creators who want AI-generation friends',
    tarotTitle: 'Tsurara Major Arcana Tarot',
    tarotDesc: 'A tarot reading page created by Tsurara',
    filterDefault: 'New + Featured',
    filterAll: 'All',
    filterOriginal: 'Original',
    filter100: '100 Jobs',
    filterFashion: 'Fashion',
    filterComposition: 'Composition',
    filterSeason: 'Seasonal',
    filterGuide: 'Guide',
    guideTitle: 'Usage Guide',
    guideDesc: 'How to use and adapt prompts',
    defaultNote: 'Default view: showing new and featured prompts',
    imageSearch: 'Search by Image',
    searchPlaceholder: 'Search titles, text, or tags',
    search: 'Search',
    reset: 'Reset',
    promptListTitle: 'Prompts',
    selectTitle: 'Click a thumbnail or text to view the full details',
    selectDesc: 'Select a prompt from the list.',
    copied: 'Copied',
    promptCopy: 'Copy Prompt',
    jpCopy: 'JP',
    enCopy: 'EN',
    detail: 'Details',
    noResults: 'No matching articles.',
    count: (n) => `${n} items`,
    imageSearchTitle: 'Search by Image',
    imageSearchDesc: 'Browse uploaded article images. Click an image to open the related article.',
    imageSearchEmpty: 'No article images are available yet.',
    guideModalTitle: 'Usage Guide',
    guideModalDesc: 'The notes and prompts on this site are not only for producing finished outputs as-is. They are idea materials you can freely adapt to your tools and imagination.',
    guideStep1Title: 'Find an article',
    guideStep1Desc: 'Use new, featured, categories, or search to find the direction you want.',
    guideStep2Title: 'Copy a prompt',
    guideStep2Desc: 'Copy Japanese or English prompts directly from the list.',
    guideStep3Title: 'Add details',
    guideStep3Desc: 'Add character names, locations, time of day, lighting, and camera direction for better results.',
    guideStep4Title: 'Enjoy variations',
    guideStep4Desc: 'Results vary depending on the tool, model, and settings. Treat the differences as part of the creative process.',
    trendElements: 'Trend Elements',
    useCases: 'Use Cases',
    notes: 'Notes',
    promptJa: 'Japanese Prompt',
    promptEn: 'English Prompt'
  }
};

const cardsGrid = document.getElementById('cardsGrid');
const detailPanel = document.getElementById('detailPanel');
const detailBackdrop = document.getElementById('detailBackdrop');
const resultCount = document.getElementById('resultCount');
const toast = document.getElementById('toast');
const guideButton = document.getElementById('guideButton');
const guideModal = document.getElementById('guideModal');
const guideModalClose = document.getElementById('guideModalClose');
const imageModal = document.getElementById('imageModal');
const imageModalImg = document.getElementById('imageModalImg');
const imageModalCaption = document.getElementById('imageModalCaption');
const imageModalClose = document.getElementById('imageModalClose');
const languageSwitchButtons = document.querySelectorAll('.language-switch-button');
const searchBox = document.getElementById('searchBox');
const searchInput = document.getElementById('searchInput');
const resetSearch = document.getElementById('resetSearch');
const imageSearchButton = document.getElementById('imageSearchButton');
const imageSearchModal = document.getElementById('imageSearchModal');
const imageSearchGrid = document.getElementById('imageSearchGrid');
const imageSearchEmpty = document.getElementById('imageSearchEmpty');
const imageSearchClose = document.getElementById('imageSearchClose');
const filterButtons = document.querySelectorAll('.library-tile[data-filter]');

let articles = [];
let filteredArticles = [];
let selectedArticle = null;
let currentFilter = 'DEFAULT';
let currentQuery = '';
let currentLang = localStorage.getItem('tsuraraLang') || 'ja';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function text(key) {
  return uiText[currentLang][key] ?? uiText.ja[key] ?? key;
}

function applyLanguage() {
  document.documentElement.lang = currentLang === 'en' ? 'en' : 'ja';
  languageSwitchButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.lang === currentLang);
  });
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    const value = text(key);
    if (typeof value === 'string') node.textContent = value;
  });
  searchInput.placeholder = text('searchPlaceholder');
  toast.textContent = text('copied');
  render();
  if (selectedArticle) renderDetail(selectedArticle);
}

function articleImage(article) {
  return `images/articles/${article.id}.png`;
}

function localDateValue(article) {
  return article.publishedAt || article.uploadedAt || article.createdAt || article.datetime || '';
}

function isNewArticle(article) {
  const value = localDateValue(article);
  if (!value) return false;
  const normalized = value.replace(' ', 'T').replace(/\//g, '-');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return false;
  const diff = Date.now() - date.getTime();
  return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

function getField(article, base) {
  if (currentLang === 'en') {
    const enKey = `${base}En`;
    if (article[enKey] && !(Array.isArray(article[enKey]) && article[enKey].length === 0)) return article[enKey];
  }
  return article[base];
}

function getCategoryLabel(article) {
  return currentLang === 'en'
    ? article.categoryLabelEn || categoryNames[article.category]?.en || article.categoryLabel
    : article.categoryLabel || categoryNames[article.category]?.ja || article.category;
}

function getLabels(article) {
  const labels = currentLang === 'en' ? article.labelsEn : article.labels;
  return Array.isArray(labels) ? labels : [];
}

function hasOriginal(article) {
  return article.type === 'OR' || article.typeLabel === 'オリジナル' || (article.labels || []).includes('オリジナル') || (article.labelsEn || []).includes('Original');
}

function matchesFilter(article) {
  if (currentFilter === 'DEFAULT') return isNewArticle(article) || article.featured;
  if (currentFilter === 'ALL') return true;
  if (currentFilter === 'ORIGINAL') return hasOriginal(article);
  if (currentFilter === 'LABEL_100') return (article.labels || []).includes('100職') || (article.labelsEn || []).includes('100 Jobs');
  return article.category === currentFilter;
}

function matchesQuery(article) {
  if (!currentQuery) return true;
  const haystack = [
    article.id, article.title, article.titleEn, article.summary, article.summaryEn,
    article.categoryLabel, article.categoryLabelEn,
    ...(article.trendElements || []), ...(article.trendElementsEn || []),
    ...(article.useCases || []), ...(article.useCasesEn || []),
    ...(article.labels || []), ...(article.labelsEn || []),
    article.promptJa, article.promptEn
  ].join(' ').toLowerCase();
  return haystack.includes(currentQuery.toLowerCase());
}

function badgeHtml(article) {
  const pieces = [];
  if (isNewArticle(article)) pieces.push('<span class="new-badge">NEW</span>');
  pieces.push(`<span class="badge category-${String(article.category || '').toLowerCase()}">${escapeHtml(getCategoryLabel(article))}</span>`);
  if (article.featured) pieces.push(`<span class="badge featured">${escapeHtml(currentLang === 'en' ? (article.featuredLabelEn || 'Featured') : (article.featuredLabel || 'おすすめ'))}</span>`);
  getLabels(article).forEach((label) => {
    const cls = label === 'オリジナル' || label === 'Original' ? 'original' : (label === '100職' || label === '100 Jobs' ? 'series' : '');
    pieces.push(`<span class="badge ${cls}">${escapeHtml(label)}</span>`);
  });
  return pieces.join('');
}

function tagHtml(article) {
  const tags = getField(article, 'trendElements') || [];
  return tags.slice(0, 5).map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join('');
}

function renderCard(article) {
  const title = getField(article, 'title') || article.title || article.id;
  const summary = getField(article, 'summary') || article.summary || '';
  return `
    <article class="prompt-card" data-id="${escapeHtml(article.id)}">
      <img class="prompt-thumb optional-image" src="${escapeHtml(articleImage(article))}" alt="${escapeHtml(title)}" loading="lazy" data-open-image="${escapeHtml(article.id)}">
      <div class="prompt-main" data-open-detail="${escapeHtml(article.id)}">
        <div class="meta-line">
          ${badgeHtml(article)}
          <span>${escapeHtml(article.id)}</span>
          <span>${escapeHtml(article.datetime || '')}</span>
        </div>
        <h3 class="prompt-title">${escapeHtml(title)}</h3>
        <div class="tag-row">${tagHtml(article)}</div>
      </div>
      <div class="prompt-desc" data-open-detail="${escapeHtml(article.id)}">
        <p>${escapeHtml(summary)}</p>
      </div>
      <div class="prompt-actions">
        <div class="copy-group">
          <div class="copy-group-label">${escapeHtml(text('promptCopy'))}</div>
          <div class="copy-lang-row">
            <button class="copy-action primary" data-copy="ja" data-id="${escapeHtml(article.id)}">${escapeHtml(text('jpCopy'))}</button>
            <button class="copy-action" data-copy="en" data-id="${escapeHtml(article.id)}">${escapeHtml(text('enCopy'))}</button>
          </div>
        </div>
        <button class="detail-action" data-open-detail="${escapeHtml(article.id)}">${escapeHtml(text('detail'))}</button>
      </div>
    </article>
  `;
}

function render() {
  filteredArticles = articles.filter((article) => matchesFilter(article) && matchesQuery(article));
  resultCount.textContent = typeof text('count') === 'function' ? text('count')(filteredArticles.length) : `${filteredArticles.length}`;
  if (!filteredArticles.length) {
    cardsGrid.innerHTML = `<div class="empty-state"><h2>${escapeHtml(text('noResults'))}</h2></div>`;
    return;
  }
  cardsGrid.innerHTML = filteredArticles.map(renderCard).join('');
}

function renderDetail(article) {
  selectedArticle = article;
  const title = getField(article, 'title') || article.title || article.id;
  const summary = getField(article, 'summary') || article.summary || '';
  const trendElements = getField(article, 'trendElements') || [];
  const useCases = getField(article, 'useCases') || [];
  const notes = getField(article, 'notes') || [];
  const noteTitle = getField(article, 'noteTitle') || text('notes');
  detailPanel.innerHTML = `
    <button class="detail-close" id="detailClose" type="button" aria-label="閉じる">×</button>
    <div class="detail-hero">
      <img class="optional-image" src="${escapeHtml(articleImage(article))}" alt="${escapeHtml(title)}" data-open-image="${escapeHtml(article.id)}">
      <div class="detail-copy">
        <div class="meta-line">${badgeHtml(article)}<span>${escapeHtml(article.id)}</span><span>${escapeHtml(article.datetime || '')}</span></div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(summary)}</p>
        <div class="panel-copy-row">
          <button class="panel-copy-button primary" data-copy="ja" data-id="${escapeHtml(article.id)}">${escapeHtml(text('jpCopy'))}</button>
          <button class="panel-copy-button" data-copy="en" data-id="${escapeHtml(article.id)}">${escapeHtml(text('enCopy'))}</button>
        </div>
      </div>
    </div>

    <section class="detail-section">
      <h3>${escapeHtml(text('trendElements'))}</h3>
      <div class="tag-row">${trendElements.map((x) => `<span class="tag">#${escapeHtml(x)}</span>`).join('')}</div>
    </section>

    <section class="detail-section">
      <h3>${escapeHtml(text('useCases'))}</h3>
      <div class="tag-row">${useCases.map((x) => `<span class="tag">${escapeHtml(x)}</span>`).join('')}</div>
    </section>

    <section class="detail-section">
      <h3>${escapeHtml(text('promptJa'))}</h3>
      <div class="prompt-box">${escapeHtml(article.promptJa || '')}</div>
    </section>

    <section class="detail-section">
      <h3>${escapeHtml(text('promptEn'))}</h3>
      <div class="prompt-box">${escapeHtml(article.promptEn || '')}</div>
    </section>

    <section class="detail-section">
      <h3>${escapeHtml(noteTitle)}</h3>
      <ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
    </section>
  `;
  detailPanel.classList.add('is-open');
  detailBackdrop.classList.add('is-open');
  detailPanel.setAttribute('aria-hidden', 'false');
  detailBackdrop.setAttribute('aria-hidden', 'false');
}

function closeDetail() {
  detailPanel.classList.remove('is-open');
  detailBackdrop.classList.remove('is-open');
  detailPanel.setAttribute('aria-hidden', 'true');
  detailBackdrop.setAttribute('aria-hidden', 'true');
}

function showToast(message = text('copied')) {
  toast.textContent = message;
  toast.classList.add('is-show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-show'), 1700);
}

async function copyPrompt(article, lang) {
  const prompt = lang === 'en' ? article.promptEn : article.promptJa;
  try {
    await navigator.clipboard.writeText(prompt || '');
    showToast();
  } catch (e) {
    const area = document.createElement('textarea');
    area.value = prompt || '';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    showToast();
  }
}

function openImageModal(article) {
  const title = getField(article, 'title') || article.title || article.id;
  imageModalImg.src = articleImage(article);
  imageModalImg.alt = title;
  imageModalCaption.textContent = `${article.id}｜${title}`;
  imageModal.classList.add('is-open');
  imageModal.setAttribute('aria-hidden', 'false');
}

function closeImageModal() {
  imageModal.classList.remove('is-open');
  imageModal.setAttribute('aria-hidden', 'true');
  imageModalImg.src = '';
}

function openGuide() {
  guideModal.classList.add('is-open');
  guideModal.setAttribute('aria-hidden', 'false');
}

function closeGuide() {
  guideModal.classList.remove('is-open');
  guideModal.setAttribute('aria-hidden', 'true');
}

function openImageSearch() {
  imageSearchGrid.innerHTML = articles.map((article) => {
    const title = getField(article, 'title') || article.title || article.id;
    return `
      <button class="image-search-item" type="button" data-open-detail="${escapeHtml(article.id)}">
        <img src="${escapeHtml(articleImage(article))}" alt="${escapeHtml(title)}" loading="lazy">
        <strong>${escapeHtml(article.id)}</strong>
      </button>
    `;
  }).join('');
  imageSearchEmpty.style.display = articles.length ? 'none' : 'block';
  imageSearchModal.classList.add('is-open');
  imageSearchModal.setAttribute('aria-hidden', 'false');
}

function closeImageSearch() {
  imageSearchModal.classList.remove('is-open');
  imageSearchModal.setAttribute('aria-hidden', 'true');
}

document.addEventListener('click', (event) => {
  const copyButton = event.target.closest('[data-copy]');
  if (copyButton) {
    const article = articles.find((item) => item.id === copyButton.dataset.id);
    if (article) copyPrompt(article, copyButton.dataset.copy);
    return;
  }

  const imageButton = event.target.closest('[data-open-image]');
  if (imageButton) {
    const article = articles.find((item) => item.id === imageButton.dataset.openImage);
    if (article) openImageModal(article);
    return;
  }

  const detailButton = event.target.closest('[data-open-detail]');
  if (detailButton) {
    const article = articles.find((item) => item.id === detailButton.dataset.openDetail);
    if (article) {
      closeImageSearch();
      renderDetail(article);
    }
    return;
  }

  if (event.target.closest('#detailClose')) {
    closeDetail();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle('is-active', b === button));
    render();
  });
});

languageSwitchButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentLang = button.dataset.lang;
    localStorage.setItem('tsuraraLang', currentLang);
    applyLanguage();
  });
});

searchBox.addEventListener('submit', (event) => {
  event.preventDefault();
  currentQuery = searchInput.value.trim();
  render();
});

resetSearch.addEventListener('click', () => {
  currentQuery = '';
  searchInput.value = '';
  render();
});

guideButton.addEventListener('click', openGuide);
guideModalClose.addEventListener('click', closeGuide);
guideModal.querySelector('.guide-modal-backdrop').addEventListener('click', closeGuide);

imageModalClose.addEventListener('click', closeImageModal);
imageModal.querySelector('.image-modal-backdrop').addEventListener('click', closeImageModal);

imageSearchButton.addEventListener('click', openImageSearch);
imageSearchClose.addEventListener('click', closeImageSearch);
imageSearchModal.querySelector('.image-search-backdrop').addEventListener('click', closeImageSearch);
detailBackdrop.addEventListener('click', closeDetail);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeImageModal();
    closeGuide();
    closeImageSearch();
    closeDetail();
  }
});

fetch('data/articles.json')
  .then((response) => response.json())
  .then((data) => {
    articles = Array.isArray(data) ? data : [];
    applyLanguage();
  })
  .catch((error) => {
    console.error(error);
    cardsGrid.innerHTML = '<div class="empty-state"><h2>articles.json を読み込めませんでした</h2></div>';
  });
