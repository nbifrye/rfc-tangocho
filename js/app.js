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
      <p>モバイルでも快適に、短時間でRFC番号と名称の対応を定着させる学習設計です。</p>
      <div class="hero-stats">
        <div class="stat-chip"><strong>${totalCorrect}</strong>累計正解数</div>
        <div class="stat-chip"><strong>${totalAttempted}</strong>累計挑戦数</div>
        <div class="stat-chip"><strong>${accuracy}%</strong>正解率</div>
      </div>
    </section>
    <section class="card">
      <h3>モードを選んで学習開始</h3>
      <div class="grid two">
        <button class="btn" data-go="quiz">クイズを始める</button>
        <button class="btn" data-go="flashcard">フラッシュカードを始める</button>
      </div>
    </section>
    <section class="card">
      <h3>ジャンル特化で学ぶ</h3>
      <p>まずはデジタルアイデンティティ関連のRFCに集中して学習できます。</p>
      <div class="grid two">
        <button class="btn" data-go="quiz" data-category="digital-identity">デジタルアイデンティティクイズ</button>
        <button class="btn" data-go="flashcard" data-category="digital-identity">デジタルアイデンティティカード</button>
      </div>
    </section>
    <section class="card">
      <h3>進捗サマリー</h3>
      <p>累計正解 / 累計挑戦: <strong>${totalCorrect}</strong> / <strong>${totalAttempted}</strong></p>
      <p><small>「一覧・検索」タブでは、RFCごとの学習状況を詳細に確認できます。</small></p>
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
