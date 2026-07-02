// Deterministic "species of the day" selection — same species for everyone on
// a given calendar day, no backend. Wordle-style: derived purely from the date.

// Days since the Unix epoch for the *local* calendar day (DST-safe: we rebuild
// the date from local Y/M/D at UTC midnight so clock changes never shift it).
export function dayNumber(date = new Date()) {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(utcMidnight / 86_400_000);
}

// "YYYY-MM-DD" for the local calendar day — used as the localStorage play key.
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// The species for a given date. Cycles through the list in order; with N
// species the sequence repeats every N days, which is fine for the MVP.
export function speciesForDate(species, date = new Date()) {
  const index = ((dayNumber(date) % species.length) + species.length) % species.length;
  return species[index];
}

// Tomorrow's species — used for the "come back tomorrow" silhouette teaser.
export function speciesForTomorrow(species, date = new Date()) {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return speciesForDate(species, tomorrow);
}
