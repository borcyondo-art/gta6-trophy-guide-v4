/* filters.js — the checklist's filters and the spoiler rule.
   Kinds: story, collectibles, activities, robberies, money, exploration
   (plus platinum and 100% completion, which are their own kinds).
   The spoiler rule hides a hidden story trophy's name and description
   until it is earned: the row shows "Hidden Trophy" instead. */

export const KINDS = [
  ['all', 'All kinds'],
  ['story', 'Story'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['robberies', 'Robberies'],
  ['money', 'Money'],
  ['exploration', 'Exploration'],
];

export const GRADES = [
  ['all', 'All grades'],
  ['platinum', 'Platinum'],
  ['gold', 'Gold'],
  ['silver', 'Silver'],
  ['bronze', 'Bronze'],
];

export const EARNED = [
  ['all', 'Earned and unearned'],
  ['unearned', 'Unearned only'],
  ['earned', 'Earned only'],
];

/** Whether a trophy's name and description are hidden by the spoiler setting. */
export function isSpoilerMasked(trophy, state) {
  return state.spoilers && trophy.hidden && !state.earned.has(trophy.id);
}

/** The name the checklist shows for a trophy under the spoiler rule. */
export function displayName(trophy, state) {
  return isSpoilerMasked(trophy, state) ? 'Hidden Trophy' : trophy.name;
}

/** The description the checklist shows for a trophy under the spoiler rule. */
export function displayDescription(trophy, state) {
  return isSpoilerMasked(trophy, state)
    ? 'A hidden story trophy — earn it to reveal its name.'
    : trophy.description;
}

export function applyFilters(trophies, state) {
  const q = state.search.trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.kind !== 'all' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.earnedFilter === 'earned' && !state.earned.has(t.id)) return false;
    if (state.earnedFilter === 'unearned' && state.earned.has(t.id)) return false;
    if (q !== '') {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
