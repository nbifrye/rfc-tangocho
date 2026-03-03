import { incrementProgress } from './storage.js';

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function renderFlashcard(container, data, options = {}) {
  const initialCategory = data.categories.some((category) => category.id === options.initialCategory)
    ? options.initialCategory
    : 'all';
  container.innerHTML = `
    <section class="card">
      <h2>フラッシュカード設定</h2>
      <div class="form-grid grid two">
        <label>カテゴリ
          <select id="flashcard-category">
            <option value="all" ${initialCategory === 'all' ? 'selected' : ''}>全カテゴリ</option>
            ${data.categories
              .map(
                (category) =>
                  `<option value="${category.id}" ${initialCategory === category.id ? 'selected' : ''}>${category.label}</option>`
              )
              .join('')}
          </select>
        </label>
        <div style="display:flex;align-items:flex-end">
          <label class="check-option" style="width:100%"><input id="flashcard-obsoleted" type="checkbox" /><span>廃止済みRFCを含める</span></label>
        </div>
      </div>
      <button class="btn btn-wide" id="start-flashcard">開始</button>
    </section>
    <section id="flashcard-stage"></section>
  `;

  const stage = container.querySelector('#flashcard-stage');

  container.querySelector('#start-flashcard').addEventListener('click', () => {
    const category = container.querySelector('#flashcard-category').value;
    const includeObsoleted = container.querySelector('#flashcard-obsoleted').checked;

    let deck = includeObsoleted ? [...data.rfcs] : data.rfcs.filter((item) => item.obsoletedBy === null);
    if (category !== 'all') {
      deck = deck.filter((item) => item.category === category);
    }

    if (deck.length === 0) {
      stage.innerHTML = '<p class="notice">カードデータがありません。</p>';
      return;
    }

    runDeck(stage, shuffle(deck), data.categoryMap);
  });
}

function runDeck(stage, initialDeck, categoryMap) {
  let deck = [...initialDeck];
  let showingBack = false;

  function buildFrontFace(card, categoryLabel) {
    return `
      <p class="flashcard-hint">RFC NUMBER</p>
      <p class="flashcard-rfc">RFC ${card.number}</p>
      <p class="flashcard-category">${categoryLabel}</p>
    `;
  }

  function buildBackFace(card, categoryLabel) {
    return `
      <p class="flashcard-hint">FULL NAME</p>
      <p class="flashcard-title">${card.name}</p>
      <p class="flashcard-note">${card.note ?? '概要情報なし'}</p>
      <p class="flashcard-category">${card.shortName ? `略称: ${card.shortName} · ` : ''}${categoryLabel}</p>
    `;
  }

  function renderCard() {
    if (deck.length === 0) {
      stage.innerHTML = `
        <article class="card">
          <p class="result-score" style="font-size:2rem">完了</p>
          <p class="result-label">すべてのカードを学習しました</p>
          <button class="btn btn-wide" id="restart-deck">最初からやり直す</button>
        </article>
      `;
      stage.querySelector('#restart-deck').addEventListener('click', () => runDeck(stage, initialDeck, categoryMap));
      return;
    }

    const card = deck[0];
    const categoryLabel = categoryMap.get(card.category)?.label ?? 'その他';

    stage.innerHTML = `
      <article class="card">
        <p class="flashcard-counter">${initialDeck.length - deck.length + 1} / ${initialDeck.length}</p>
        <div class="flashcard" role="button" tabindex="0" id="flip-card" aria-label="カードをめくる">
          <div class="flashcard-face">
            ${showingBack ? buildBackFace(card, categoryLabel) : buildFrontFace(card, categoryLabel)}
          </div>
        </div>
        <p class="flashcard-hint-label">クリックまたは Enter / Space でめくる</p>
        <div class="flashcard-actions">
          <button class="btn btn-known" id="known-btn">覚えた ✓</button>
          <button class="btn btn-again" id="again-btn">もう一度</button>
        </div>
      </article>
    `;

    const flip = () => {
      showingBack = !showingBack;
      renderCard();
    };

    const flipCard = stage.querySelector('#flip-card');
    flipCard.addEventListener('click', flip);
    flipCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        flip();
      }
    });

    stage.querySelector('#known-btn').addEventListener('click', () => {
      incrementProgress(card.number, 'correct');
      deck = deck.slice(1);
      showingBack = false;
      renderCard();
    });

    stage.querySelector('#again-btn').addEventListener('click', () => {
      const [head, ...rest] = deck;
      deck = [...rest, head];
      showingBack = false;
      renderCard();
    });
  }

  renderCard();
}
