// localStorage persistence: the permanent aquarium, the up-to-5 "on display"
// selection, and today's play result (enforces "no second chances").

const KEY = 'cotd:v1';
export const MAX_DISPLAY = 5;

function defaultState() {
  return {
    version: 1,
    caught: [],      // [{ id, date }]  — permanent, in catch order
    displayIds: [],  // up to MAX_DISPLAY ids shown in the display aquarium
    plays: {},       // { 'YYYY-MM-DD': { speciesId, result, guessesUsed } }
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); game still runs in-memory.
  }
}

// Wipe all progress (used by demo mode's reset button).
export function resetAll() {
  state = defaultState();
  save();
}

// ---- Play state (per day) -------------------------------------------------

export function getPlay(dateKey) {
  return state.plays[dateKey] || null;
}

export function recordPlay(dateKey, { speciesId, result, guessesUsed }) {
  state.plays[dateKey] = { speciesId, result, guessesUsed };
  save();
}

// ---- Aquarium -------------------------------------------------------------

export function getCaught() {
  return state.caught.slice();
}

export function isCaught(speciesId) {
  return state.caught.some((c) => c.id === speciesId);
}

// Add a species to the permanent aquarium. New catches auto-fill the display
// aquarium until it holds MAX_DISPLAY; extras land in the "back" aquarium.
export function addCatch(speciesId, dateKey) {
  if (isCaught(speciesId)) return;
  state.caught.push({ id: speciesId, date: dateKey });
  if (state.displayIds.length < MAX_DISPLAY) {
    state.displayIds.push(speciesId);
  }
  save();
}

export function getDisplayIds() {
  // Only ids that are still caught, capped at MAX_DISPLAY.
  return state.displayIds.filter((id) => isCaught(id)).slice(0, MAX_DISPLAY);
}

export function isOnDisplay(speciesId) {
  return getDisplayIds().includes(speciesId);
}

// Toggle a species between the display and back aquariums.
// Returns { ok, reason } — ok:false when trying to exceed MAX_DISPLAY.
export function toggleDisplay(speciesId) {
  if (!isCaught(speciesId)) return { ok: false, reason: 'not-caught' };
  const display = getDisplayIds();
  if (display.includes(speciesId)) {
    state.displayIds = display.filter((id) => id !== speciesId);
    save();
    return { ok: true };
  }
  if (display.length >= MAX_DISPLAY) {
    return { ok: false, reason: 'full' };
  }
  state.displayIds = [...display, speciesId];
  save();
  return { ok: true };
}
