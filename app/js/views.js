/* views.js — every screen of the guide: the checklist with its detail
   pane, the roadmap, the missables page and the sources page.
   The views only read the state the caller hands them; main.js owns it. */

import { GRADE_LABEL, KIND_LABEL, STAGES } from './data.js';
import { applyFilters, displayDescription, displayName, isSpoilerMasked } from './filters.js';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function medal(t) {
  const letter = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[t.grade] || '?';
  return `<span class="medal ${esc(t.grade)}" title="${esc(GRADE_LABEL[t.grade])}">${letter}</span>`;
}

function chips(t) {
  const out = [`<span class="chip">${esc(KIND_LABEL[t.kind] || t.kind)}</span>`];
  if (t.count) out.push(`<span class="chip">${esc(String(t.count))} ${esc(t.countLabel || '')}</span>`);
  if (t.hidden) out.push('<span class="chip hidden-chip">Hidden</span>');
  if (t.missable) out.push('<span class="chip missable">Missable</span>');
  return out.join('');
}

/** The checklist: rows of trophies, each opening its detail pane. */
export function renderChecklist(root, trophies, state, onSelect, onToggle) {
  const shown = applyFilters(trophies, state);
  const earnedCount = state.earned.size;
  const lines = [];
  lines.push(`<p class="count-line">Showing ${shown.length} of ${trophies.length} trophies · ${earnedCount} earned · ${trophies.length - earnedCount} to go</p>`);
  if (shown.length === 0) {
    lines.push('<div class="empty-note">No trophies match these filters. Clear the search or pick another kind.</div>');
  } else {
    lines.push('<ul class="trophy-list">');
    for (const t of shown) {
      const earned = state.earned.has(t.id);
      const masked = isSpoilerMasked(t, state);
      lines.push(`<li class="trophy-row${earned ? ' earned' : ''}" data-id="${esc(t.id)}" tabindex="0" role="button" aria-label="${esc(displayName(t, state))}">
        ${medal(t)}
        <span>
          <span class="trophy-name">${esc(displayName(t, state))}${masked ? ' <span class="hidden-tag">(hidden until earned)</span>' : ''}</span>
          <span class="trophy-desc">${esc(displayDescription(t, state))}</span>
          <span class="trophy-meta">${chips(t)}</span>
        </span>
        <span class="trophy-check"><input type="checkbox" data-check="${esc(t.id)}"${earned ? ' checked' : ''} aria-label="Mark ${esc(displayName(t, state))} earned"></span>
      </li>`);
    }
    lines.push('</ul>');
  }
  root.innerHTML = lines.join('\n');
  root.querySelectorAll('.trophy-row').forEach((row) => {
    row.addEventListener('click', (ev) => {
      if (ev.target.matches('input[type="checkbox"]')) return;
      onSelect(row.dataset.id);
    });
    row.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        onSelect(row.dataset.id);
      }
    });
  });
  root.querySelectorAll('input[data-check]').forEach((box) => {
    box.addEventListener('change', () => onToggle(box.dataset.check, box.checked));
  });
}

/** The detail pane: one trophy's guide, its sources and its earn button. */
export function renderDetail(pane, trophy, state, onToggle) {
  if (!trophy) {
    pane.innerHTML = `<h2>Pick a trophy</h2>
      <p>Choose any row in the checklist to read its guide, its sources and what to watch out for.</p>
      <p>The guides are this entry's own words, built from the official descriptions. Where a step is not yet confirmed in the game, the guide says so.</p>`;
    return;
  }
  const earned = state.earned.has(trophy.id);
  const masked = isSpoilerMasked(trophy, state);
  const sources = trophy.sources.length > 0 ? trophy.sources.join(', ') : 'the official list';
  pane.innerHTML = `<h2>${esc(displayName(trophy, state))}</h2>
    <p class="grade-line">${esc(GRADE_LABEL[trophy.grade])} · ${esc(KIND_LABEL[trophy.kind] || trophy.kind)}${trophy.hidden ? ' · Hidden' : ''}${trophy.missable ? ' · Missable' : ''}</p>
    <p>${esc(masked ? 'A hidden story trophy — earn it to reveal its name and description.' : trophy.description)}</p>
    ${trophy.count ? `<p><strong>Target:</strong> ${esc(String(trophy.count))} ${esc(trophy.countLabel || '')}</p>` : ''}
    <h3>Guide</h3>
    <p>${esc(trophy.guide)}</p>
    <h3>Sources</h3>
    <p class="sources">${esc(sources)} — names, descriptions and grades as PlayStation publishes them; the guide itself is this entry's own words.</p>
    <button class="btn primary earn-btn" data-earn="${esc(trophy.id)}">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>`;
  pane.querySelector('[data-earn]').addEventListener('click', () => onToggle(trophy.id, !earned));
}

/** The roadmap: six stages, each with its trophies and its progress. */
export function renderRoadmap(root, trophies, state) {
  const lines = [];
  lines.push(`<div class="callout"><h2>How the platinum works</h2>
    <p>There are 55 trophies: 1 platinum, 2 gold, 6 silver and 46 bronze. The story takes around 50 to 60 hours and the whole platinum around 200 — it is long, not hard. There are no online trophies and no difficulty trophies.</p>
    <p>Work the stages in order. The only trophy that can be missed is Positive Mental Attitude, and the game has no mission replay, so keep a manual save at the start of every chapter and one before the final mission.</p></div>`);
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.stage === stage.n);
    const done = members.filter((t) => state.earned.has(t.id)).length;
    lines.push(`<section class="stage"><h2><span class="stage-n">Stage ${stage.n}</span> — ${esc(stage.title)}</h2>
      <p>${esc(stage.blurb)}</p>
      <p><strong>${done} of ${members.length} earned in this stage.</strong></p>
      <ul>${members.map((t) => `<li><span class="${state.earned.has(t.id) ? 'done' : ''}">${state.earned.has(t.id) ? '✓ ' : '○ '}${esc(displayName(t, state))}</span> <span class="chip">${esc(GRADE_LABEL[t.grade])}</span>${t.missable ? ' <span class="chip missable">Missable</span>' : ''}</li>`).join('')}</ul>
    </section>`);
  }
  root.innerHTML = lines.join('\n');
}

/** The missables page: the one missable trophy, plus the save discipline. */
export function renderMissables(root, trophies, state) {
  const missable = trophies.filter((t) => t.missable);
  const lines = [];
  lines.push(`<div class="callout warn"><h2>Only one trophy can be missed</h2>
    <p>As far as anyone can tell this soon after launch, Positive Mental Attitude is the only missable trophy. Everything else can be cleaned up after the story — but the game has no mission replay and no New Game Plus, so the save discipline below still matters.</p></div>`);
  for (const t of missable) {
    const earned = state.earned.has(t.id);
    lines.push(`<section class="stage"><h2>${esc(t.name)} <span class="chip missable">Missable</span></h2>
      <p>${esc(t.description)}</p>
      <p>${esc(t.guide)}</p>
      <p><strong>Status:</strong> ${earned ? 'Earned ✓' : 'Not earned yet'}</p>
    </section>`);
  }
  lines.push(`<section class="stage"><h2>Save discipline</h2>
    <ul>
      <li>Keep a manual save at the start of every chapter, and one more before the final mission.</li>
      <li>Meditate at Lucia's balcony in Chapter 1 before that chapter ends.</li>
      <li>Do not turn on cheats: they disable trophies (and saving), per PowerPyx — and cheats only unlock after the story anyway.</li>
      <li>Story choices are permanent in a playthrough, so save before the big ones.</li>
    </ul></section>`);
  root.innerHTML = lines.join('\n');
}

/** The sources page: where every fact comes from. */
export function renderSources(root) {
  root.innerHTML = `<div class="sources-list"><h2>Sources</h2>
    <p>Every trophy's name, description, grade and hidden flag comes from the official PlayStation list as Exophase and PSNProfiles publish it, cross-checked against TrueAchievements. The guides are this entry's own words, built from those descriptions — a source is cited, never copied.</p>
    <ul>
      <li><strong>Exophase</strong> — the official list: names, descriptions, grades and hidden flags (exophase.com/game/grand-theft-auto-vi-psn/trophies/).</li>
      <li><strong>PSNProfiles</strong> — the same list with PSN's progress counts, such as the 42 Shooting Range challenges (psnprofiles.com/trophies/43531-grand-theft-auto-vi).</li>
      <li><strong>TrueAchievements</strong> — cross-check of the names and the 1,000 Gamerscore total on Xbox.</li>
      <li><strong>PowerPyx</strong> — cheats disable trophies; the missable warning for Positive Mental Attitude.</li>
      <li><strong>Push Square</strong> — the 397 stunts in Leonida; the story's length.</li>
      <li><strong>GTABase</strong> — the nine activity types; the 100% checklist layout.</li>
      <li><strong>Output Lag</strong> — Lucia's balcony meditation disappearing after Chapter 1.</li>
    </ul>
    <p>Where a guide's step is not yet confirmed in the game, the guide says so in its own words. No Rockstar logo, artwork or game screenshot appears anywhere in this guide — the look is its own.</p></div>`;
}
