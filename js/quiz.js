import { getProgress, incrementProgress, isStorageAvailable } from './storage.js';

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getQuestionText(mode, rfc) {
  return mode === 'number-to-name'
    ? `RFC ${rfc.number} の正式名称は？`
    : `${rfc.name} のRFC番号は？`;
}

function getChoiceLabel(mode, rfc) {
  return mode === 'number-to-name' ? rfc.name : `RFC ${rfc.number}`;
}

function buildOptions(pool, answer) {
  const sameCategory = pool.filter((item) => item.category === answer.category && item.number !== answer.number);
  const otherCategory = pool.filter((item) => item.category !== answer.category && item.number !== answer.number);
  const wrongs = shuffle(sameCategory).slice(0, 3);
  if (wrongs.length < 3) {
    wrongs.push(...shuffle(otherCategory).slice(0, 3 - wrongs.length));
  }
  return shuffle([answer, ...wrongs]);
}

function filterQuizPool(rfcs, settings) {
  let pool = settings.includeObsoleted ? [...rfcs] : rfcs.filter((item) => item.obsoletedBy === null);
  if (settings.category !== 'all') {
    pool = pool.filter((item) => item.category === settings.category);
  }
  if (settings.weakOnly && isStorageAvailable()) {
    const progress = getProgress();
    pool = pool.filter((item) => {
      const entry = progress[String(item.number)];
      return entry && entry.attempted > 0 && entry.correct / entry.attempted < 0.6;
    });
  }
  return shuffle(pool);
}

export function renderQuiz(container, data) {
  container.innerHTML = `
    <section class="card">
      <h2>クイズ設定</h2>
      <form id="quiz-form" class="grid two">
        <label>出題形式
          <select name="mode">
            <option value="number-to-name">番号 → 名称</option>
            <option value="name-to-number">名称 → 番号</option>
          </select>
        </label>
        <label>出題数
          <select name="count">
            <option value="10">10問</option>
            <option value="20">20問</option>
            <option value="all">全問</option>
          </select>
        </label>
        <label>カテゴリ
          <select name="category">
            <option value="all">全カテゴリ</option>
            ${data.categories.map((category) => `<option value="${category.id}">${category.label}</option>`).join('')}
          </select>
        </label>
        <label><input type="checkbox" name="includeObsoleted" /> 廃止済みRFCを含める</label>
        <label><input type="checkbox" name="weakOnly" ${isStorageAvailable() ? '' : 'disabled'} /> 苦手問題のみ出題</label>
      </form>
      <button class="btn" id="start-quiz">開始</button>
    </section>
    <section id="quiz-stage"></section>
  `;

  const stage = container.querySelector('#quiz-stage');
  const form = container.querySelector('#quiz-form');

  container.querySelector('#start-quiz').addEventListener('click', () => {
    const formData = new FormData(form);
    const settings = {
      mode: formData.get('mode'),
      category: formData.get('category'),
      includeObsoleted: formData.get('includeObsoleted') === 'on',
      weakOnly: formData.get('weakOnly') === 'on',
      count: formData.get('count'),
    };

    const pool = filterQuizPool(data.rfcs, settings);
    const questionCount = settings.count === 'all' ? pool.length : Number(settings.count);
    const questions = pool.slice(0, questionCount);

    if (questions.length === 0) {
      stage.innerHTML = '<p class="notice">出題可能なデータがありません。</p>';
      return;
    }

    runQuiz(stage, questions, settings.mode, data.rfcs);
  });
}

function runQuiz(stage, questions, mode, allRfcs) {
  let index = 0;
  let score = 0;
  let locked = false;

  function renderQuestion() {
    const current = questions[index];
    const options = buildOptions(allRfcs, current);
    stage.innerHTML = `
      <article class="card">
        <p>問 ${index + 1} / ${questions.length}</p>
        <h3>${getQuestionText(mode, current)}</h3>
        <div class="choice-list">
          ${options
            .map(
              (choice, optionIndex) =>
                `<button data-number="${choice.number}" class="choice-btn">${optionIndex + 1}. ${getChoiceLabel(mode, choice)}</button>`
            )
            .join('')}
        </div>
        <p id="feedback"></p>
        <button class="btn" id="next-button" hidden>次の問題へ</button>
      </article>
    `;

    const feedback = stage.querySelector('#feedback');
    const nextButton = stage.querySelector('#next-button');
    const buttons = [...stage.querySelectorAll('.choice-btn')];

    function onAnswer(selectedNumber) {
      if (locked) {
        return;
      }
      locked = true;
      const selected = Number(selectedNumber);
      const correct = selected === current.number;
      incrementProgress(current.number, correct ? 'correct' : 'attempted');
      if (correct) {
        score += 1;
      }

      buttons.forEach((button) => {
        const number = Number(button.dataset.number);
        button.disabled = true;
        if (number === current.number) {
          button.classList.add('correct');
        }
        if (number === selected && !correct) {
          button.classList.add('incorrect');
        }
      });

      feedback.textContent = correct ? '正解です！' : `不正解です。正解は RFC ${current.number} です。`;
      if (current.note) {
        feedback.textContent += ` 補足: ${current.note}`;
      }
      nextButton.hidden = false;
      nextButton.focus();
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => onAnswer(button.dataset.number));
    });

    function handleKeydown(event) {
      if (!locked) {
        const numeric = Number(event.key);
        if (numeric >= 1 && numeric <= buttons.length) {
          event.preventDefault();
          onAnswer(buttons[numeric - 1].dataset.number);
        }
      } else if ((event.key === 'Enter' || event.key === ' ') && !nextButton.hidden) {
        event.preventDefault();
        nextButton.click();
      }
    }

    stage.onkeydown = handleKeydown;
    nextButton.addEventListener('click', () => {
      locked = false;
      index += 1;
      if (index >= questions.length) {
        renderResult();
      } else {
        renderQuestion();
      }
    });
  }

  function renderResult() {
    const rate = Math.round((score / questions.length) * 100);
    stage.innerHTML = `
      <article class="card">
        <h3>クイズ結果</h3>
        <p class="result">${score} / ${questions.length} 問正解（正解率 ${rate}%）</p>
        <button class="btn" id="retry-quiz">もう一度挑戦</button>
      </article>
    `;
    stage.querySelector('#retry-quiz').addEventListener('click', () => runQuiz(stage, questions, mode, allRfcs));
  }

  renderQuestion();
}
