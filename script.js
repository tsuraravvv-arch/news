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
const filterButtons = document.querySelectorAll('.filter-button');

let articles = [];
let activeFilter = 'ALL';
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

function renderCards() {
  const filtered = activeFilter === 'ALL'
    ? articles
    : articles.filter(article => article.category === activeFilter);

  if (!filtered.length) {
    cardsGrid.innerHTML = '<p>該当する記事がありません。</p>';
    return;
  }

  cardsGrid.innerHTML = filtered.map(article => {
    const tags = (article.trendElements || []).slice(0, 3).map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('');
    const isSelected = selectedId === article.id ? ' is-selected' : '';
    return `
      <button class="card${isSelected}" type="button" data-id="${escapeHtml(article.id)}">
        <div class="card-visual ${escapeHtml(article.category)}">
          <span class="card-id">${escapeHtml(article.id)}</span>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="badge">${escapeHtml(article.categoryLabel || categoryNames[article.category])}</span>
            <span class="date">${escapeHtml(formatDate(article.datetime))}</span>
          </div>
          <h3>${escapeHtml(article.title)}</h3>
          <p class="card-summary">${escapeHtml(article.summary)}</p>
          <div class="tags">${tags}</div>
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
  const source = article.sourceUrl
    ? `<section class="detail-section"><h3>出典URL</h3><a class="source-link" href="${escapeHtml(article.sourceUrl)}" target="_blank" rel="noopener">出典を開く</a></section>`
    : '';

  detailPanel.innerHTML = `
    <div class="detail-head">
      <p class="section-kicker">${escapeHtml(article.id)} / ${escapeHtml(article.categoryLabel || categoryNames[article.category])}</p>
      <h2>${escapeHtml(article.title)}</h2>
      <p class="date">${escapeHtml(formatDate(article.datetime))}</p>
      <p class="detail-summary">${escapeHtml(article.summary)}</p>
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

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle('is-active', item === button));
    renderCards();
  });
});

init();
