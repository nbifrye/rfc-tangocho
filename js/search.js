import { getProgress, isStorageAvailable } from './storage.js';

function sortItems(items, mode) {
  if (mode === 'category') {
    return [...items].sort((a, b) => a.category.localeCompare(b.category) || a.number - b.number);
  }
  return [...items].sort((a, b) => a.number - b.number);
}

export function renderSearch(container, data) {
  container.innerHTML = `
    <section class="card">
      <h2>一覧・検索</h2>
      <div class="grid two">
        <label>キーワード
          <input id="search-input" placeholder="RFC番号または名称" />
        </label>
        <label>並び順
          <select id="sort-mode">
            <option value="number">RFC番号順</option>
            <option value="category">カテゴリ順</option>
          </select>
        </label>
      </div>
      <fieldset>
        <legend>カテゴリフィルタ（複数選択可）</legend>
        <div class="grid two">
          ${data.categories
            .map(
              (category) =>
                `<label class="check-option"><input type="checkbox" class="category-filter" value="${category.id}" checked /><span>${category.label}</span></label>`
            )
            .join('')}
        </div>
      </fieldset>
      <label class="check-option"><input id="show-obsoleted" type="checkbox" checked /><span>廃止済みRFCも表示</span></label>
    </section>
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>RFC</th><th>名称</th><th>カテゴリ</th><th>状態</th><th>進捗</th></tr>
          </thead>
          <tbody id="search-results"></tbody>
        </table>
      </div>
    </section>
  `;

  const input = container.querySelector('#search-input');
  const sortMode = container.querySelector('#sort-mode');
  const obsoletedToggle = container.querySelector('#show-obsoleted');
  const categoryChecks = [...container.querySelectorAll('.category-filter')];
  const resultBody = container.querySelector('#search-results');

  const rerender = () => {
    const keyword = input.value.trim().toLowerCase();
    const selectedCategories = new Set(categoryChecks.filter((check) => check.checked).map((check) => check.value));
    const progress = isStorageAvailable() ? getProgress() : {};

    const rows = sortItems(data.rfcs, sortMode.value)
      .filter((item) => selectedCategories.has(item.category))
      .filter((item) => (obsoletedToggle.checked ? true : item.obsoletedBy === null))
      .filter(
        (item) =>
          keyword.length === 0 ||
          String(item.number).includes(keyword) ||
          item.name.toLowerCase().includes(keyword) ||
          (item.shortName ?? '').toLowerCase().includes(keyword)
      )
      .map((item) => {
        const stat = progress[String(item.number)];
        const status = item.obsoletedBy === null ? '' : '<span class="badge">廃止済</span>';
        const progressText = stat ? `${stat.correct}/${stat.attempted}` : '';
        const categoryLabel = data.categoryMap.get(item.category)?.label ?? 'その他';
        return `<tr>
          <td>${item.number}</td>
          <td>${item.name}${item.shortName ? `<br/><small>${item.shortName}</small>` : ''}</td>
          <td>${categoryLabel}</td>
          <td>${status}</td>
          <td>${progressText}</td>
        </tr>`;
      });

    resultBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5">該当するRFCがありません。</td></tr>';
  };

  [input, sortMode, obsoletedToggle, ...categoryChecks].forEach((element) => {
    element.addEventListener('input', rerender);
    element.addEventListener('change', rerender);
  });

  rerender();
}
