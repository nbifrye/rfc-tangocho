const STORAGE_KEY = 'rfc-tangocho-progress';

let storageAvailable = true;
let warned = false;

function warnOnce() {
  if (warned) {
    return;
  }
  warned = true;
  window.dispatchEvent(
    new CustomEvent('storage-unavailable', {
      detail: '学習進捗の保存は無効です（プライベートブラウジング等）',
    })
  );
}

function parseProgress(value) {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function checkStorage() {
  try {
    const key = '__rfc_tangocho_test__';
    localStorage.setItem(key, 'ok');
    localStorage.removeItem(key);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
    warnOnce();
  }
}

checkStorage();

export function getProgress() {
  if (!storageAvailable) {
    return {};
  }
  try {
    return parseProgress(localStorage.getItem(STORAGE_KEY));
  } catch {
    storageAvailable = false;
    warnOnce();
    return {};
  }
}

export function incrementProgress(rfcNumber, type) {
  if (!storageAvailable) {
    return;
  }
  const key = String(rfcNumber);
  const progress = getProgress();
  const current = progress[key] ?? { correct: 0, attempted: 0 };
  if (type === 'correct') {
    current.correct += 1;
  }
  if (type === 'attempted' || type === 'correct') {
    current.attempted += 1;
  }
  progress[key] = current;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    storageAvailable = false;
    warnOnce();
  }
}

export function isStorageAvailable() {
  return storageAvailable;
}
