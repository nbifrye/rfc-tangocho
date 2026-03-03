const RFC_PATH = 'data/rfcs.json';
const CATEGORY_PATH = 'data/categories.json';

let cache;

async function fetchJson(path) {
  let response;
  try {
    response = await fetch(path);
  } catch {
    const error = new Error('データの読み込みに失敗しました。ネットワーク接続を確認してください。');
    error.retryable = true;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(`データファイルが見つかりません（エラーコード: ${response.status}）。`);
    error.retryable = true;
    throw error;
  }

  try {
    return await response.json();
  } catch {
    const error = new Error('データファイルの形式が正しくありません。');
    error.retryable = false;
    throw error;
  }
}

export async function loadData() {
  if (cache) {
    return cache;
  }

  const [rfcs, categories] = await Promise.all([fetchJson(RFC_PATH), fetchJson(CATEGORY_PATH)]);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const safeRfcs = rfcs.map((rfc) => {
    if (!categoryMap.has(rfc.category)) {
      console.warn(`未知のカテゴリIDを検出: ${rfc.category}. otherにフォールバックします。`);
      return { ...rfc, category: 'other' };
    }
    return rfc;
  });

  cache = { rfcs: safeRfcs, categories, categoryMap };
  return cache;
}
