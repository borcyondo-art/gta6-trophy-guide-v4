/* store.js — saved progress in the browser (localStorage), with export
   to a file and import back. Nothing leaves the machine: the file is
   the only way progress moves between browsers. */

export const STORAGE_KEY = 'leonida-legend-progress-v1';

/** The earned set, as a Set of trophy ids. */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x) => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort()));
  } catch {
    /* A full or blocked store keeps the page working; progress just is not saved. */
  }
}

/** The spoiler setting: hide story trophies until they are earned. */
export const SPOILER_KEY = 'leonida-legend-spoilers-v1';

export function loadSpoilers() {
  try {
    return localStorage.getItem(SPOILER_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveSpoilers(on) {
  try {
    localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
  } catch {
    /* Same as above: the page keeps working. */
  }
}

/** Download the earned set as a JSON file. */
export function exportProgress(earned) {
  const blob = new Blob(
    [JSON.stringify({ app: 'leonida-legend', version: 1, earned: [...earned].sort() }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-legend-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read an exported file back into an earned set; returns null when it is not one. */
export async function importProgress(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(list)) return null;
  return new Set(list.filter((x) => typeof x === 'string'));
}
