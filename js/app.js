import { loadData } from './data.js';
import { renderQuiz } from './quiz.js';
import { renderFlashcard } from './flashcard.js';
import { renderSearch } from './search.js';
import { getProgress, isStorageAvailable } from './storage.js';

const app = document.querySelector('#app');
const navButtons = [...document.querySelectorAll('.nav-btn')];

let dataStore;
const learningFocus = {
  quizCategory: 'all',
  flashcardCategory: 'all',
};

function setActiveView(view) {
  navButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === view);
  });
}

function renderHome() {
  const progress = isStorageAvailable() ? getProgress() : {};
  const totalAttempted = Object.values(progress).reduce((sum, entry) => sum + (entry.attempted ?? 0), 0);
  const totalCorrect = Object.values(progress).reduce((sum, entry) => sum + (entry.correct ?? 0), 0);
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  app.innerHTML = `
    <section class="card hero">
      <h2>今日のRFC学習をはじめよう</h2>
      <p class="hero-sub">RFC番号と名称の対応を、クイズ・フラッシュカードで反復学習</p>
      <div class="hero-stats">
        <div class="stat-chip">
          <strong>${totalCorrect}</strong>
          <span>正解数</span>
        </div>
        <div class="stat-chip">
          <strong>${totalAttempted}</strong>
          <span>挑戦数</span>
        </div>
        <div class="stat-chip">
          <strong>${accuracy}%</strong>
          <span>正解率</span>
        </div>
      </div>
    </section>

    <section class="card">
      <h3>学習モードを選択</h3>
      <div class="mode-grid">
        <button class="mode-card" data-go="quiz">
          <span class="mode-icon">[Q]</span>
          <span class="mode-label">クイズ</span>
          <span class="mode-desc">4択形式でRFC番号↔名称を学習</span>
        </button>
        <button class="mode-card" data-go="flashcard">
          <span class="mode-icon">[F]</span>
          <span class="mode-label">フラッシュカード</span>
          <span class="mode-desc">カードをめくって記憶を定着</span>
        </button>
      </div>
    </section>

    <section class="card">
      <h3>ジャンル特化</h3>
      <p style="font-size:0.84rem;color:var(--text-dim);margin:0 0 0.9rem;">デジタルアイデンティティ（OAuth・JWT・TLS など）に集中して学習</p>
      <div class="mode-grid">
        <button class="mode-card" data-go="quiz" data-category="digital-identity">
          <span class="mode-icon">[Q]</span>
          <span class="mode-label">ID クイズ</span>
          <span class="mode-desc">デジタルアイデンティティ特化</span>
        </button>
        <button class="mode-card" data-go="flashcard" data-category="digital-identity">
          <span class="mode-icon">[F]</span>
          <span class="mode-label">ID カード</span>
          <span class="mode-desc">デジタルアイデンティティ特化</span>
        </button>
      </div>
    </section>
  `;

  app.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.go, { category: button.dataset.category }));
  });
}

function navigate(view, options = {}) {
  setActiveView(view);

  if (options.category) {
    if (view === 'quiz') {
      learningFocus.quizCategory = options.category;
    }
    if (view === 'flashcard') {
      learningFocus.flashcardCategory = options.category;
    }
  }

  if (!dataStore || dataStore.rfcs.length === 0) {
    app.innerHTML = '<p class="notice">データが登録されていません。</p>';
    return;
  }
  switch (view) {
    case 'quiz':
      renderQuiz(app, dataStore, { initialCategory: learningFocus.quizCategory });
      break;
    case 'flashcard':
      renderFlashcard(app, dataStore, { initialCategory: learningFocus.flashcardCategory });
      break;
    case 'search':
      renderSearch(app, dataStore);
      break;
    default:
      renderHome();
      break;
  }
}

function renderError(error) {
  const template = document.querySelector('#error-template').content.cloneNode(true);
  template.querySelector('#error-message').textContent = error.message;
  const retryButton = template.querySelector('#retry-button');
  if (!error.retryable) {
    retryButton.remove();
  } else {
    retryButton.addEventListener('click', init);
  }
  app.innerHTML = '';
  app.appendChild(template);
}

async function init() {
  const loading = document.querySelector('#loading-template').content.cloneNode(true);
  app.innerHTML = '';
  app.appendChild(loading);
  try {
    dataStore = await loadData();
    navigate('home');
  } catch (error) {
    renderError(error);
  }
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => navigate(button.dataset.view));
});

window.addEventListener('storage-unavailable', (event) => {
  const notice = document.createElement('p');
  notice.className = 'notice';
  notice.textContent = event.detail;
  app.prepend(notice);
});

init();
