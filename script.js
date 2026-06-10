const categoryNames = {
  AI: 'AI生成関連',
  FA: 'ファッション',
  EV: '季節・イベント',
  TR: 'トレンド全般（予約）',
  TO: 'ツール情報（予約）'
};

const featuredGrid = document.getElementById('featuredGrid');
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

const languageToggle = document.getElementById('languageToggle');
const languageSwitch = document.getElementById('languageSwitch');
const languageSwitchButtons = document.querySelectorAll('.language-switch-button');
const searchBox = document.getElementById('searchBox');
const searchInput = document.getElementById('searchInput');
const resetSearch = document.getElementById('resetSearch');
const imageSearchButton = document.getElementById('imageSearchButton');
const imageSearchModal = document.getElementById('imageSearchModal');
const imageSearchGrid = document.getElementById('imageSearchGrid');
const imageSearchEmpty = document.getElementById('imageSearchEmpty');
const imageSearchClose = document.getElementById('imageSearchClose');

let currentLang = localStorage.getItem('tsuraraLang') || 'ja';

const uiText = {
  ja: {
    toggle: 'EN',
    lead: 'AI生成・ファッション・季節イベントの情報をAIで自動収集し、創作に使いやすいアイデアとして整理したサイトです。\nSNSの情報を直接転載することはありませんが、類似の情報が載っている可能性があります。',
    communityTitle: '動画生成AI研究＆交流コミュニティ（DISCODE）',
    communityDesc: 'わたしが参加するコミュニティ、AI生成の仲間が欲しい方におすすめ',
    tarotTitle: '氷洞つららの大アルカナ占い',
    tarotDesc: 'わたしが作成したタロットカード占いです',
    guideTitle: '活用ガイド',
    guideDesc: 'プロンプトの使い方と楽しみ方',
    featuredTitle: 'おすすめプロンプト',
    featuredDesc: '評判が良かったもの、長く使いやすいものをここに固定表示します。',
    filters: { ALL: 'すべて', ORIGINAL: 'オリジナル', FEATURED: 'おすすめ', AI: 'AI生成関連', FA: 'ファッション', EV: '季節・イベント' },
    imageSearch: '画像から検索',
    searchPlaceholder: 'タイトル・本文を検索',
    search: '検索',
    reset: 'リセット',
    selectKicker: 'Select Article',
    selectTitle: '記事カードを選択してください',
    selectDesc: '左側または上部の記事カードをクリックすると、ここに詳細とコピー用プロンプトが表示されます。',
    imageSearchTitle: '画像から検索',
    imageSearchDesc: 'アップロード済みの記事画像を一覧表示します。画像をクリックすると、対応する記事を開きます。',
    imageSearchEmpty: '表示できる記事画像がまだありません。',
    guideModalTitle: '活用ガイド',
    guideModalDesc: '掲載されているメモやプロンプトは、完成品をそのまま出すためだけのものではありません。あなたの環境や発想に合わせて、自由に足して楽しむためのアイデア集です。',
    guideSteps: [
      ['記事カードを選ぶ', '気になるカテゴリや検索から記事を探し、カードをクリックすると右側に詳細が表示されます。タイトル・概要・使いどころを見て、使いたい方向性を選びます。'],
      ['プロンプトをコピーする', '日本語プロンプトや英語プロンプトをコピーして、ChatGPT Images、Gemini、Midjourneyなどの画像生成サービスに貼り付けて使います。'],
      ['キーワードを追加して調整する', '用意されたプロンプトは、SNSで見かけるような「すぐ完成品になる文章」だけではありません。+αの演出や効果を与える素材として使えるものもあります。'],
      ['環境ごとの変化を楽しむ', '出力結果は、使用する生成環境、モデル、設定、メモリ、添付する立ち絵や三面図によって変わります。違いも含めて創作の幅として楽しんでください。']
    ],
    tipsTitle: 'このサイトの使い方のコツ',
    tips: [
      'サイト内のサンプルは、立ち絵や三面図にプロンプトを組み合わせて作成されています。',
      'プロンプトはそのまま使うだけでなく、キャラクター名、衣装、場所、時間帯、光、カメラ演出などを足すと使いやすくなります。',
      '「構図」「色」「効果」「動画化メモ」など、欲しい要素だけを抜き出して別のプロンプトへ混ぜる使い方もおすすめです。',
      '同じ文章でも環境によって違う結果になるため、出力の揺れもアイデア探しとして楽しんでください。'
    ],
    policyKicker: 'Publishing Policy',
    policyTitle: '著作物に関わるプロンプトの公開ポリシー',
    policyDesc: 'このサイトでは、既存作品や既存キャラクターを直接再現するプロンプトは掲載しません。自分のキャラクターやオリジナル要素を中心に、参考・雰囲気・ポーズ・衣装アレンジとして活用できる内容を掲載します。',
    policyCaption: 'サイト掲載用の公開ポリシー目安'
  },
  en: {
    toggle: 'JP',
    lead: 'This site collects information about AI generation, fashion, and seasonal events with AI, then organizes it as creative idea notes.\nIt does not directly repost social media content, but similar information may appear.',
    communityTitle: 'AI Video Generation Research & Exchange Community (Discord)',
    communityDesc: 'A community I take part in. Recommended for people looking for AI generation friends.',
    tarotTitle: "Tsurara Hyodo's Major Arcana Reading",
    tarotDesc: 'A tarot-card reading site I created.',
    guideTitle: 'Guide',
    guideDesc: 'How to use and enjoy the prompts',
    featuredTitle: 'Featured Prompts',
    featuredDesc: 'Popular and long-lasting prompts are pinned here.',
    filters: { ALL: 'All', ORIGINAL: 'Original', FEATURED: 'Featured', AI: 'AI Generation', FA: 'Fashion', EV: 'Seasonal Events' },
    imageSearch: 'Search by Image',
    searchPlaceholder: 'Search titles and text',
    search: 'Search',
    reset: 'Reset',
    selectKicker: 'Select Article',
    selectTitle: 'Select an article card',
    selectDesc: 'Click an article card on the left or above to view details and copy-ready prompts here.',
    imageSearchTitle: 'Search by Image',
    imageSearchDesc: 'Browse uploaded article images. Click an image to open the matching article.',
    imageSearchEmpty: 'No article images are available yet.',
    guideModalTitle: 'Guide',
    guideModalDesc: 'The notes and prompts on this site are not only for producing a finished image instantly. They are idea materials you can freely expand, combine, and adapt to your own tools and imagination.',
    guideSteps: [
      ['Choose an article card', 'Use categories or search to find an article. Click a card to show the details on the right. Check the title, summary, and use cases to choose a direction.'],
      ['Copy a prompt', 'Copy the Japanese or English prompt and paste it into image-generation tools such as ChatGPT Images, Gemini, Midjourney, or similar services.'],
      ['Add keywords and adjust', 'The prompts are not always complete one-shot recipes. Some are designed as extra effects, moods, compositions, or ideas that can be added to your own prompts.'],
      ['Enjoy differences between environments', 'Results vary depending on the generation tool, model, settings, memory, and the character reference or design sheet you attach. Treat those differences as part of the creative process.']
    ],
    tipsTitle: 'Tips for using this site',
    tips: [
      'The sample images on this site are created by combining character references such as standing poses or model sheets with prompts.',
      'Prompts become easier to use when you add character names, outfits, locations, time of day, lighting, camera direction, and other details.',
      'You can also extract only the parts you need, such as composition, color, effects, or video notes, and mix them into another prompt.',
      'Even with the same text, each environment can produce different results. Enjoy those variations as a source of ideas.'
    ],
    policyKicker: 'Publishing Policy',
    policyTitle: 'Prompt publishing policy for copyrighted works',
    policyDesc: 'This site does not publish prompts that directly recreate existing works or existing characters. It focuses on prompts that help you use your own characters and original elements, or adapt references, moods, poses, and outfit ideas creatively.',
    policyCaption: 'Publishing policy guideline for this site'
  }
};

function t(key) {
  return uiText[currentLang]?.[key] ?? uiText.ja[key] ?? key;
}


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


function localizeStaticText() {
  document.documentElement.lang = currentLang;
  if (languageToggle) languageToggle.textContent = t('toggle');
  languageSwitchButtons.forEach(button => button.classList.toggle('is-active', button.dataset.lang === currentLang));

  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };
  const setHTML = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = escapeHtml(value).replaceAll('\n', '<br>');
  };

  setHTML('.lead', t('lead'));
  setText('#community .banner-copy strong', t('communityTitle'));
  setText('#community .banner-copy span:last-child', t('communityDesc'));
  setText('.banner-secondary .banner-copy strong', t('tarotTitle'));
  setText('.banner-secondary .banner-copy span:last-child', t('tarotDesc'));
  setText('.banner-guide .banner-copy strong', t('guideTitle'));
  setText('.banner-guide .banner-copy span:last-child', t('guideDesc'));

  setText('.featured-head h2', t('featuredTitle'));
  setText('.featured-head p:last-child', t('featuredDesc'));

  filterButtons.forEach(button => {
    const label = t('filters')[button.dataset.filter];
    if (label) button.textContent = label;
  });

  if (imageSearchButton) imageSearchButton.textContent = t('imageSearch');
  if (searchInput) searchInput.placeholder = t('searchPlaceholder');
  document.querySelector('.search-button')?.replaceChildren(document.createTextNode(t('search')));
  if (resetSearch) resetSearch.textContent = t('reset');

  setText('.empty-state .section-kicker', t('selectKicker'));
  setText('.empty-state h2', t('selectTitle'));
  setText('.empty-state p:last-child', t('selectDesc'));

  setText('.image-search-head h2', t('imageSearchTitle'));
  setText('.image-search-head p:last-child', t('imageSearchDesc'));
  if (imageSearchEmpty) imageSearchEmpty.textContent = t('imageSearchEmpty');

  setText('.guide-head h2', t('guideModalTitle'));
  setText('.guide-head p:last-child', t('guideModalDesc'));
  document.querySelectorAll('.guide-card').forEach((card, index) => {
    const step = t('guideSteps')[index];
    if (!step) return;
    const title = card.querySelector('h3');
    const desc = card.querySelector('p');
    if (title) title.textContent = step[0];
    if (desc) desc.textContent = step[1];
  });

  setText('.guide-tips h3', t('tipsTitle'));
  const tipItems = document.querySelectorAll('.guide-tips li');
  t('tips').forEach((tip, index) => {
    if (tipItems[index]) tipItems[index].textContent = tip;
  });

  setText('.guide-policy-copy .section-kicker', t('policyKicker'));
  setText('.guide-policy-copy h3', t('policyTitle'));
  setText('.guide-policy-copy p:last-child', t('policyDesc'));
  setText('.guide-policy-image-wrap figcaption', t('policyCaption'));
}

function setLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'ja';
  localStorage.setItem('tsuraraLang', currentLang);
  localizeStaticText();
  renderFeaturedCards();
  renderCards();
  if (selectedId) {
    const article = articles.find(item => item.id === selectedId);
    if (article) renderDetail(article);
  }
}

function localizeArticle(article, key) {
  if (currentLang === 'en') {
    return article[`${key}En`] || article[key] || '';
  }
  return article[key] || '';
}

function localizeArray(article, key) {
  if (currentLang === 'en') {
    return article[`${key}En`] || article[key] || [];
  }
  return article[key] || [];
}

function localizeCategoryName(category) {
  if (currentLang === 'en') {
    return { AI: 'AI Generation', FA: 'Fashion', EV: 'Seasonal Events', TR: 'General Trends', TO: 'Tool Info', OR: 'Original' }[category] || category;
  }
  return categoryNames[category] || category;
}


async function init() {
  localizeStaticText();
  try {
    const response = await fetch('data/articles.json');
    articles = await response.json();
    renderFeaturedCards();
    renderCards();
  } catch (error) {
    cardsGrid.innerHTML = `<p class="card-body">${currentLang === 'en' ? 'Could not load article data. If you are checking locally, open the site through a simple server such as Live Server.' : '記事データを読み込めませんでした。ローカルで確認する場合は、Live Serverなどの簡易サーバー経由で開いてください。'}</p>`;
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


function isFeaturedArticle(article) {
  return article.featured === true || article.pickup === 'featured' || article.pickup === 'hallOfFame';
}

function isNewArticle(article) {
  const basis = article.publishedAt || article.uploadedAt || article.createdAt || article.datetime;
  const articleDate = parseArticleDate(basis);
  if (!articleDate) return false;
  const diff = Date.now() - articleDate.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  return diff >= 0 && diff <= oneDay;
}

function isOriginalArticle(article) {
  return article.type === 'OR' || (article.trendElements || []).some(tag => normalizeText(tag) === 'オリジナル');
}


function getFeaturedIconPath(article) {
  return article.featuredIcon || 'images/featured/featured.png';
}

function getVisualCategory(article) {
  return isOriginalArticle(article) ? 'OR' : article.category;
}

function getDetailLabel(article) {
  const category = currentLang === 'en' ? localizeCategoryName(article.category) : (article.categoryLabel || categoryNames[article.category] || article.category || '');
  return isOriginalArticle(article) ? `${category} / ${currentLang === 'en' ? 'Original' : (article.typeLabel || 'オリジナル')}` : category;
}


function renderFeaturedCards() {
  if (!featuredGrid) return;

  const featured = articles.filter(isFeaturedArticle).slice(0, 6);

  if (!featured.length) {
    featuredGrid.innerHTML = `<p class="featured-empty">${currentLang === 'en' ? 'No featured prompts have been registered yet.' : 'おすすめプロンプトはまだ登録されていません。'}</p>`;
    return;
  }

  featuredGrid.innerHTML = featured.map(article => {
    const label = currentLang === 'en' ? (article.featuredLabelEn || 'Featured') : (article.featuredLabel || 'おすすめ');
    const reason = currentLang === 'en' ? (article.featuredReasonEn || article.summaryEn || article.featuredReason || article.summary || '') : (article.featuredReason || article.summary || '');
    const visual = escapeHtml(getVisualCategory(article));
    const iconPath = getFeaturedIconPath(article);
    return `
      <button class="featured-card" type="button" data-id="${escapeHtml(article.id)}">
        <div class="featured-visual ${visual}">
          <img
            class="featured-icon"
            src="${escapeHtml(iconPath)}"
            alt="${escapeHtml(localizeArticle(article, 'title'))} ${currentLang === 'en' ? 'featured icon' : 'のおすすめアイコン'}"
            loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';"
          >
          <div class="featured-fallback">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(article.id)}</strong>
          </div>
        </div>
        <div class="featured-copy">
          <h3>${escapeHtml(localizeArticle(article, 'title'))}</h3>
          <p>${escapeHtml(reason)}</p>
        </div>
      </button>
    `;
  }).join('');

  document.querySelectorAll('.featured-card').forEach(card => {
    card.addEventListener('click', () => selectArticle(card.dataset.id));
  });
}

function renderCards() {
  const normalizedQuery = normalizeText(searchQuery);
  const filtered = articles.filter(article => {
    const matchesFilter = activeFilter === 'ALL'
      ? true
      : activeFilter === 'ORIGINAL'
        ? isOriginalArticle(article)
        : activeFilter === 'FEATURED'
          ? isFeaturedArticle(article)
          : article.category === activeFilter;

    const matchesSearch = !normalizedQuery || articleSearchText(article).includes(normalizedQuery);
    return matchesFilter && matchesSearch;
  });

  if (!filtered.length) {
    cardsGrid.innerHTML = `<p class="no-results">${currentLang === 'en' ? 'No articles found. Try changing the search text or filter.' : '該当する記事がありません。検索文字やタグを変更してください。'}</p>`;
    return;
  }

  cardsGrid.innerHTML = filtered.map(article => {
    const tags = localizeArray(article, 'trendElements').slice(0, 3).map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('');
    const isSelected = selectedId === article.id ? ' is-selected' : '';
    return `
      <button class="card${isSelected}" type="button" data-id="${escapeHtml(article.id)}">
        <div class="card-visual ${escapeHtml(getVisualCategory(article))}">
          <div class="card-topline">
            <span class="card-id">${escapeHtml(article.id)}</span>
            <span class="card-date">${escapeHtml(formatDate(article.datetime))}</span>
          </div>
          <h3>
            <span>${escapeHtml(localizeArticle(article, 'title'))}</span>
            ${isNewArticle(article) ? '<span class="new-badge">New</span>' : ''}
          </h3>
        </div>
        <div class="card-body">
          <div class="tags">${tags}</div>
          <p class="card-summary">${escapeHtml(localizeArticle(article, 'summary'))}</p>
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
  renderFeaturedCards();
  renderCards();
  renderDetail(article);
  if (window.innerWidth < 980) {
    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderDetail(article) {
  const trendElements = listMarkup(localizeArray(article, 'trendElements'));
  const useCases = listMarkup(localizeArray(article, 'useCases'));
  const notes = listMarkup(localizeArray(article, 'notes'));
  const promptJa = promptMarkup(currentLang === 'en' ? 'Japanese Prompt' : '日本語プロンプト', article.promptJa, `${article.id}-ja`);
  const promptEn = article.promptEn ? promptMarkup('English Prompt', article.promptEn, `${article.id}-en`) : '';
  const articleImagePath = article.image || `images/articles/${article.id}.png`;
  const articleImage = `
    <figure class="article-image-wrap">
      <a class="article-image-link" href="${escapeHtml(articleImagePath)}" data-modal-image="${escapeHtml(articleImagePath)}" data-modal-title="${escapeHtml(localizeArticle(article, 'title'))}" aria-label="生成画像を拡大表示">
        <img class="article-image" src="${escapeHtml(articleImagePath)}" alt="${escapeHtml(localizeArticle(article, 'title'))} ${currentLang === 'en' ? 'generated example' : '生成例'}" loading="lazy">
      </a>
      <figcaption>${currentLang === 'en' ? 'Example image generated with this prompt. Click to enlarge on this page.' : 'このプロンプトで生成した画像例。クリックするとページ内で拡大表示します。'}</figcaption>
    </figure>
  `;
  const source = article.sourceUrl
    ? `<section class="detail-section"><h3>${currentLang === 'en' ? 'Source URL' : '出典URL'}</h3><a class="source-link" href="${escapeHtml(article.sourceUrl)}" target="_blank" rel="noopener">${currentLang === 'en' ? 'Open source' : '出典を開く'}</a></section>`
    : '';

  detailPanel.innerHTML = `
    <div class="detail-head">
      <p class="section-kicker">${escapeHtml(article.id)} / ${escapeHtml(getDetailLabel(article))}</p>
      <h2>${escapeHtml(localizeArticle(article, 'title'))}</h2>
      <p class="date">${escapeHtml(formatDate(article.datetime))}</p>
      <p class="detail-summary">${escapeHtml(localizeArticle(article, 'summary'))}</p>
      ${articleImage}
    </div>

    <section class="detail-section">
      <h3>${currentLang === 'en' ? 'Trend Elements' : 'トレンド要素'}</h3>
      ${trendElements}
    </section>

    <section class="detail-section">
      <h3>${currentLang === 'en' ? 'Use Cases' : '使いどころ'}</h3>
      ${useCases}
    </section>

    <section class="detail-section">
      <h3>${currentLang === 'en' ? 'Generation Prompt' : '生成用プロンプト'}</h3>
      ${promptJa}
      ${promptEn}
    </section>

    <section class="detail-section">
      <h3>${escapeHtml(currentLang === 'en' ? (article.noteTitleEn || 'Notes') : (article.noteTitle || 'メモ'))}</h3>
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
      openImageModal(link.dataset.modalImage, link.dataset.modalTitle || localizeArticle(article, 'title'));
    });
  });
}

function listMarkup(items = []) {
  if (!items.length) return `<p class="detail-summary">${currentLang === 'en' ? 'Not registered' : '登録なし'}</p>`;
  return `<ul class="detail-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function promptMarkup(label, text, key) {
  return `
    <div class="prompt-box">
      <div class="prompt-header">
        <span>${escapeHtml(label)}</span>
        <button class="copy-button" type="button" data-copy="${escapeHtml(text)}">${currentLang === 'en' ? 'Copy' : 'コピー'}</button>
      </div>
      <pre id="${escapeHtml(key)}">${escapeHtml(text)}</pre>
    </div>
  `;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(currentLang === 'en' ? 'Copied' : 'コピーしました');
  } catch (error) {
    showToast(currentLang === 'en' ? 'Copy failed' : 'コピーに失敗しました');
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
    image.alt = `${localizeArticle(article, 'title')} ${currentLang === 'en' ? 'generated image' : '生成画像'}`;
    image.loading = 'lazy';

    const caption = document.createElement('span');
    caption.textContent = localizeArticle(article, 'title');

    const meta = document.createElement('small');
    meta.textContent = `${article.id} / ${getDetailLabel(article)}`;

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
  imageModalImg.alt = title ? `${title} ${currentLang === 'en' ? 'generated example' : '生成例'}` : (currentLang === 'en' ? 'Generated image' : '生成画像');
  if (imageModalCaption) imageModalCaption.textContent = title || (currentLang === 'en' ? 'Generated image' : '生成画像');
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
    button.classList.remove('filter-ai', 'filter-fa', 'filter-ev', 'filter-original', 'filter-featured', 'filter-all');
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

if (languageToggle) {
  languageToggle.addEventListener('click', () => setLanguage(currentLang === 'ja' ? 'en' : 'ja'));
}

languageSwitchButtons.forEach(button => {
  button.addEventListener('click', () => setLanguage(button.dataset.lang));
});

updateFilterButtonClasses();
init();

document.querySelectorAll('.optional-image').forEach(image => {
  image.addEventListener('error', () => {
    image.style.display = 'none';
    const banner = image.closest('.banner');
    if (banner) banner.classList.add('no-image');
  });
});
