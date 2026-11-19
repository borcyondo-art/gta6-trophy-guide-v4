/* main.js — boots the guide: loads the data, owns the state, routes the
   four screens and wires the toolbar. Everything runs offline from the
   app's own files; the only fetch is data/trophies.json beside this app. */

import { GRADE_ORDER, loadTrophies, listSummary } from './data.js';
import { loadProgress, saveProgress, loadSpoilers, saveSpoilers, exportProgress, importProgress } from './store.js';
import { KINDS, GRADES, EARNED } from './filters.js';
import { renderChecklist, renderDetail, renderRoadmap, renderMissables, renderSources } from './views.js';

const state = {
  trophies: [],
  earned: loadProgress(),
  spoilers: loadSpoilers(),
  kind: 'all',
  grade: 'all',
  earnedFilter: 'all',
  search: '',
  view: 'checklist',
  selected: null,
};

const $ = (sel) => document.querySelector(sel);

function sortTrophies(list) {
  return [...list].sort((a, b) => {
    const g = GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade];
    if (g !== 0) return g;
    return a.name.localeCompare(b.name);
  });
}

function renderProgress() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);
  $('#progressBar').style.width = `${pct}%`;
  $('#progressCount').innerHTML = `${earned}<small> / ${total} earned · ${pct}%</small>`;
  const summary = listSummary(state.trophies);
  $('#gradePills').innerHTML = [
    `${summary.byGrade.platinum || 0} Platinum`,
    `${summary.byGrade.gold || 0} Gold`,
    `${summary.byGrade.silver || 0} Silver`,
    `${summary.byGrade.bronze || 0} Bronze`,
    `${summary.hidden} hidden`,
  ].map((x) => `<span class="grade-pill">${x}</span>`).join('');
}

function render() {
  renderProgress();
  const main = $('#view');
  document.querySelectorAll('nav.tabs button').forEach((b) => {
    b.setAttribute('aria-current', b.dataset.view === state.view ? 'page' : 'false');
  });
  $('#toolbar').style.display = state.view === 'checklist' ? '' : 'none';
  if (state.view === 'checklist') {
    main.innerHTML = '<div class="layout"><div id="list"></div><aside class="detail" id="detail" aria-live="polite"></aside></div>';
    renderChecklist($('#list'), sortTrophies(state.trophies), state, selectTrophy, toggleEarned);
    const selected = state.selected ? state.trophies.find((t) => t.id === state.selected) : null;
    renderDetail($('#detail'), selected, state, toggleEarned);
  } else if (state.view === 'roadmap') {
    renderRoadmap(main, state.trophies, state);
  } else if (state.view === 'missables') {
    renderMissables(main, state.trophies, state);
  } else if (state.view === 'sources') {
    renderSources(main);
  }
}

function selectTrophy(id) {
  state.selected = id;
  render();
}

function toggleEarned(id, on) {
  if (on) state.earned.add(id);
  else state.earned.delete(id);
  saveProgress(state.earned);
  render();
}

function setView(view) {
  state.view = view;
  if (window.location.hash !== `#/${view}`) window.location.hash = `#/${view}`;
  render();
}

function readHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return ['checklist', 'roadmap', 'missables', 'sources'].includes(hash) ? hash : 'checklist';
}

function optionList(list, current) {
  return list.map(([v, label]) => `<option value="${v}"${v === current ? ' selected' : ''}>${label}</option>`).join('');
}

function buildToolbar() {
  $('#toolbar').innerHTML = `
    <input type="search" id="search" placeholder="Search trophies, guides…" value="" aria-label="Search trophies">
    <select id="kindFilter" aria-label="Filter by kind">${optionList(KINDS, state.kind)}</select>
    <select id="gradeFilter" aria-label="Filter by grade">${optionList(GRADES, state.grade)}</select>
    <select id="earnedFilter" aria-label="Filter by earned">${optionList(EARNED, state.earnedFilter)}</select>
    <label class="toggle"><input type="checkbox" id="spoilerToggle"${state.spoilers ? ' checked' : ''}> Hide story spoilers</label>
    <span class="spacer"></span>
    <button class="btn" id="exportBtn">Export progress</button>
    <button class="btn" id="importBtn">Import progress</button>
    <input type="file" id="importFile" accept="application/json,.json" hidden>`;
  $('#search').addEventListener('input', (ev) => { state.search = ev.target.value; render(); });
  $('#kindFilter').addEventListener('change', (ev) => { state.kind = ev.target.value; render(); });
  $('#gradeFilter').addEventListener('change', (ev) => { state.grade = ev.target.value; render(); });
  $('#earnedFilter').addEventListener('change', (ev) => { state.earnedFilter = ev.target.value; render(); });
  $('#spoilerToggle').addEventListener('change', (ev) => {
    state.spoilers = ev.target.checked;
    saveSpoilers(state.spoilers);
    render();
  });
  $('#exportBtn').addEventListener('click', () => exportProgress(state.earned));
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const imported = await importProgress(file);
      if (!imported) {
        alert('That file is not a Leonida Legend progress export.');
        return;
      }
      state.earned = imported;
      saveProgress(state.earned);
      render();
    } catch {
      alert('Could not read that file as a progress export.');
    }
    ev.target.value = '';
  });
}

async function boot() {
  state.view = readHash();
  buildToolbar();
  document.querySelectorAll('nav.tabs button').forEach((b) => {
    b.addEventListener('click', () => setView(b.dataset.view));
  });
  window.addEventListener('hashchange', () => {
    state.view = readHash();
    render();
  });
  try {
    state.trophies = await loadTrophies();
  } catch (err) {
    $('#view').innerHTML = `<div class="empty-note">Could not load the trophy data (${err.message}). Serve app/ with a static server and reload.</div>`;
    return;
  }
  render();
}

boot();
