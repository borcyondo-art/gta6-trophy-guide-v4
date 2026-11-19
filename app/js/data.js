/* data.js — loads app/data/trophies.json and shapes it for the app.
   The file holds the official list (names, descriptions, grades, hidden
   flags) as Exophase and PSNProfiles publish it, plus this guide's own
   words, kinds, roadmap stages and sources per trophy. */

export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export const GRADE_LABEL = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const KIND_LABEL = {
  platinum: 'Platinum',
  completion: '100% completion',
  story: 'Story',
  collectibles: 'Collectibles',
  activities: 'Activities',
  robberies: 'Robberies',
  money: 'Money',
  exploration: 'Exploration',
};

export const STAGES = [
  { n: 1, title: 'Play the story', blurb: 'Chapters 1 to 4, the story missions and the final mission. Keep a manual save at the start of every chapter — the game has no mission replay.' },
  { n: 2, title: 'Strangers and side characters', blurb: 'The eight stranger mission strands and the five side characters with their own final-mission trophies.' },
  { n: 3, title: 'Collectibles and exploration', blurb: 'Meditation spots, cards, WAiNK locations, vehicles and the whole map. Do the missable meditation spot in Chapter 1 before it closes.' },
  { n: 4, title: 'Activities and challenges', blurb: 'Stunts, races, the shooting range, fishing, the arcade and the one-off moments — the longest grind of the platinum.' },
  { n: 5, title: 'Robberies and money', blurb: 'Bank vaults, shops, trucks, jewelry stores and gang operations, then laundering, spending and garages.' },
  { n: 6, title: '100% and the platinum', blurb: 'The 100% checklist, then Vice Got a Price! for everything above.' },
];

export async function loadTrophies() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`could not load data/trophies.json: ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.trophies;
  return list.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    grade: t.grade,
    hidden: Boolean(t.hidden),
    kind: t.kind || 'activities',
    stage: Number(t.stage) || 1,
    missable: Boolean(t.missable),
    count: t.count ?? null,
    countLabel: t.countLabel || null,
    sources: Array.isArray(t.sources) ? t.sources : [],
    guide: t.guide || '',
  }));
}

/** The official list's make-up, for the header and the sources page. */
export function listSummary(trophies) {
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hidden = 0;
  for (const t of trophies) {
    byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
    if (t.hidden) hidden++;
  }
  return { total: trophies.length, byGrade, hidden };
}
