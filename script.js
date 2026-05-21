const categoryNames = {
  AI: 'AI生成関連',
  FA: 'ファッション',
  EV: '季節・イベント',
  TR: 'トレンド全般（予約）',
  TO: 'ツール情報（予約）'
};

const cardsGrid = document.getElementById('cardsGrid');
const detailPanel = document.getElementById('detailPanel');
const toast = document.getElementById('toast');
const guideButton = document.getElementById('guideButton');
const guideModal = document.getElementById('guideModal');
const guideModalClose = document.getElementById('guideModalClose');
const imageModal = document.getElementById('imageModal');
const imageModalImg = document.getElementById('imageModalImg');
const imageModalCaption = document.getElementById('imageModalCaption');
const imageModalClose = document.getElementById('imageModalClose');
const filterButtons = document.querySelectorAll('.filter-button');

let articles = [];
let activeFilter = 'ALL';
let searchQuery = '';
let selectedId = null;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatDate = (value = '') => value ? `${value} JST` : '';

async function init() {
  try {
    const response = await fetch('data/articles.json');
    articles = await response.json();
    renderCards();
  } catch (error) {
    cardsGrid.innerHTML = '<p class="card-body">記事データを読み込めませんでした。ローカルで確認する場合は、Live Serverなどの簡易サーバー経由で開いてください。</p>';
    console.error(error);
  }
}

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, '');
}

function articleSearchText(article) {
  const fields = [
    article.title,
    article.summary,
    article.categoryLabel,
    article.id,
    article.promptJa,
    article.promptEn,
    article.noteTitle,
    ...(article.trendElements || []),
    ...(article.useCases || []),
    ...(article.notes || [])
  ];
  return normalizeText(fields.filter(Boolean).join(' '));
}

function parseArticleDate(value = '') {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, y, m, d, hh = '00', mm = '00'] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
}

function isNewArticle(article) {
  const articleDate = parseArticleDate(article.datetime);
  if (!articleDate) return false;
  const diff = Date.now() - articleDate.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return diff >= 0 && diff <= sevenDays;
}

function renderCards() {
  const normalizedQuery = normalizeText(searchQuery);
  const filtered = articles.filter(article => {
    const matchesFilter = activeFilter === 'ALL'
      ? true
      : activeFilter === 'ORIGINAL'
        ? (article.trendElements || []).some(tag => normalizeText(tag) === 'オリジナル')
        : article.category === activeFilter;

    const matchesSearch = !normalizedQuery || articleSearchText(article).includes(normalizedQuery);
    return matchesFilter && matchesSearch;
  });

  if (!filtered.length) {
    cardsGrid.innerHTML = '<p class="no-results">該当する記事がありません。検索文字やタグを変更してください。</p>';
    return;
  }

  cardsGrid.innerHTML = filtered.map(article => {
    const tags = (article.trendElements || []).slice(0, 3).map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('');
    const isSelected = selectedId === article.id ? ' is-selected' : '';
    return `
      <button class="card${isSelected}" type="button" data-id="${escapeHtml(article.id)}">
        <div class="card-visual ${escapeHtml(article.category)}">
          <div class="card-topline">
            <span class="card-id">${escapeHtml(article.id)}</span>
            <span class="card-date">${escapeHtml(formatDate(article.datetime))}</span>
          </div>
          <h3>
            <span>${escapeHtml(article.title)}</span>
            ${isNewArticle(article) ? '<span class="new-badge">New</span>' : ''}
          </h3>
        </div>
        <div class="card-body">
          <div class="tags">${tags}</div>
          <p class="card-summary">${escapeHtml(article.summary)}</p>
        </div>
      </button>
    `;
  }).join('');

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => selectArticle(card.dataset.id));
  });
}

function selectArticle(id) {
  const article = articles.find(item => item.id === id);
  if (!article) return;
  selectedId = id;
  renderCards();
  renderDetail(article);
  if (window.innerWidth < 980) {
    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderDetail(article) {
  const trendElements = listMarkup(article.trendElements);
  const useCases = listMarkup(article.useCases);
  const notes = listMarkup(article.notes);
  const promptJa = promptMarkup('日本語プロンプト', article.promptJa, `${article.id}-ja`);
  const promptEn = article.promptEn ? promptMarkup('English Prompt', article.promptEn, `${article.id}-en`) : '';
  const articleImagePath = article.image || `images/articles/${article.id}.png`;
  const articleImage = `
    <figure class="article-image-wrap">
      <a class="article-image-link" href="${escapeHtml(articleImagePath)}" data-modal-image="${escapeHtml(articleImagePath)}" data-modal-title="${escapeHtml(article.title)}" aria-label="生成画像を拡大表示">
        <img class="article-image" src="${escapeHtml(articleImagePath)}" alt="${escapeHtml(article.title)} 生成例" loading="lazy">
      </a>
      <figcaption>このプロンプトで生成した画像例。クリックするとページ内で拡大表示します。</figcaption>
    </figure>
  `;
  const source = article.sourceUrl
    ? `<section class="detail-section"><h3>出典URL</h3><a class="source-link" href="${escapeHtml(article.sourceUrl)}" target="_blank" rel="noopener">出典を開く</a></section>`
    : '';

  detailPanel.innerHTML = `
    <div class="detail-head">
      <p class="section-kicker">${escapeHtml(article.id)} / ${escapeHtml(article.categoryLabel || categoryNames[article.category])}</p>
      <h2>${escapeHtml(article.title)}</h2>
      <p class="date">${escapeHtml(formatDate(article.datetime))}</p>
      <p class="detail-summary">${escapeHtml(article.summary)}</p>
      ${articleImage}
    </div>

    <section class="detail-section">
      <h3>トレンド要素</h3>
      ${trendElements}
    </section>

    <section class="detail-section">
      <h3>使いどころ</h3>
      ${useCases}
    </section>

    <section class="detail-section">
      <h3>生成用プロンプト</h3>
      ${promptJa}
      ${promptEn}
    </section>

    <section class="detail-section">
      <h3>${escapeHtml(article.noteTitle || 'メモ')}</h3>
      ${notes}
    </section>

    ${source}
  `;

  detailPanel.querySelectorAll('.copy-button').forEach(button => {
    button.addEventListener('click', () => copyText(button.dataset.copy));
  });

  detailPanel.querySelectorAll('.article-image').forEach(image => {
    image.addEventListener('error', () => {
      const wrap = image.closest('.article-image-wrap');
      if (wrap) wrap.remove();
    });
  });

  detailPanel.querySelectorAll('[data-modal-image]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      openImageModal(link.dataset.modalImage, link.dataset.modalTitle || article.title);
    });
  });
}

function listMarkup(items = []) {
  if (!items.length) return '<p class="detail-summary">登録なし</p>';
  return `<ul class="detail-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function promptMarkup(label, text, key) {
  return `
    <div class="prompt-box">
      <div class="prompt-header">
        <span>${escapeHtml(label)}</span>
        <button class="copy-button" type="button" data-copy="${escapeHtml(text)}">コピー</button>
      </div>
      <pre id="${escapeHtml(key)}">${escapeHtml(text)}</pre>
    </div>
  `;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('コピーしました');
  } catch (error) {
    showToast('コピーに失敗しました');
    console.error(error);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 1600);
}

function getArticleImagePath(article) {
  return article.image || `images/articles/${article.id}.png`;
}

function renderImageSearchGrid() {
  if (!imageSearchGrid || !imageSearchEmpty) return;

  imageSearchGrid.innerHTML = '';
  imageSearchEmpty.style.display = 'none';

  let loadedCount = 0;

  articles.forEach(article => {
    const item = document.createElement('button');
    item.className = 'image-search-item';
    item.type = 'button';
    item.dataset.id = article.id;

    const image = document.createElement('img');
    image.src = getArticleImagePath(article);
    image.alt = `${article.title} 生成画像`;
    image.loading = 'lazy';

    const caption = document.createElement('span');
    caption.textContent = article.title;

    const meta = document.createElement('small');
    meta.textContent = `${article.id} / ${article.categoryLabel || categoryNames[article.category] || ''}`;

    item.appendChild(image);
    item.appendChild(caption);
    item.appendChild(meta);

    image.addEventListener('load', () => {
      loadedCount += 1;
      imageSearchEmpty.style.display = loadedCount ? 'none' : 'block';
    });

    image.addEventListener('error', () => {
      item.remove();
      imageSearchEmpty.style.display = loadedCount ? 'none' : 'block';
    });

    item.addEventListener('click', () => {
      closeImageSearchModal();
      selectArticle(article.id);
    });

    imageSearchGrid.appendChild(item);
  });

  window.setTimeout(() => {
    imageSearchEmpty.style.display = imageSearchGrid.children.length ? 'none' : 'block';
  }, 500);
}

function openImageSearchModal() {
  if (!imageSearchModal) return;
  renderImageSearchGrid();
  imageSearchModal.classList.add('is-open');
  imageSearchModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeImageSearchModal() {
  if (!imageSearchModal) return;
  imageSearchModal.classList.remove('is-open');
  imageSearchModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

if (imageSearchButton) {
  imageSearchButton.addEventListener('click', openImageSearchModal);
}

if (imageSearchModal) {
  imageSearchModal.addEventListener('click', event => {
    if (event.target === imageSearchModal || event.target.classList.contains('image-search-backdrop')) {
      closeImageSearchModal();
    }
  });
}

if (imageSearchClose) {
  imageSearchClose.addEventListener('click', closeImageSearchModal);
}

function openGuideModal() {
  if (!guideModal) return;
  guideModal.classList.add('is-open');
  guideModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeGuideModal() {
  if (!guideModal) return;
  guideModal.classList.remove('is-open');
  guideModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

if (guideButton) {
  guideButton.addEventListener('click', openGuideModal);
}

if (guideModal) {
  guideModal.addEventListener('click', event => {
    if (event.target === guideModal || event.target.classList.contains('guide-modal-backdrop')) {
      closeGuideModal();
    }
  });
}

if (guideModalClose) {
  guideModalClose.addEventListener('click', closeGuideModal);
}

function openImageModal(src, title = '') {
  if (!imageModal || !imageModalImg) return;
  imageModalImg.src = src;
  imageModalImg.alt = title ? `${title} 生成例` : '生成画像';
  if (imageModalCaption) imageModalCaption.textContent = title || '生成画像';
  imageModal.classList.add('is-open');
  imageModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeImageModal() {
  if (!imageModal || !imageModalImg) return;
  imageModal.classList.remove('is-open');
  imageModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  imageModalImg.src = '';
}

if (imageModal) {
  imageModal.addEventListener('click', event => {
    if (event.target === imageModal || event.target.classList.contains('image-modal-backdrop')) {
      closeImageModal();
    }
  });
}

if (imageModalClose) {
  imageModalClose.addEventListener('click', closeImageModal);
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  if (imageModal?.classList.contains('is-open')) {
    closeImageModal();
  }

  if (guideModal?.classList.contains('is-open')) {
    closeGuideModal();
  }

  if (imageSearchModal?.classList.contains('is-open')) {
    closeImageSearchModal();
  }
});

function updateFilterButtonClasses() {
  filterButtons.forEach(button => {
    button.classList.remove('filter-ai', 'filter-fa', 'filter-ev', 'filter-original', 'filter-all');
    button.classList.add(`filter-${button.dataset.filter.toLowerCase()}`);
  });
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle('is-active', item === button));
    renderCards();
  });
});

if (searchBox && searchInput) {
  searchBox.addEventListener('submit', event => {
    event.preventDefault();
    searchQuery = searchInput.value.trim();
    renderCards();
  });

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    renderCards();
  });
}

if (resetSearch) {
  resetSearch.addEventListener('click', () => {
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    activeFilter = 'ALL';
    filterButtons.forEach(item => item.classList.toggle('is-active', item.dataset.filter === 'ALL'));
    renderCards();
  });
}

updateFilterButtonClasses();
init();

document.querySelectorAll('.optional-image').forEach(image => {
  image.addEventListener('error', () => {
    image.style.display = 'none';
    const banner = image.closest('.banner');
    if (banner) banner.classList.add('no-image');
  });
});
