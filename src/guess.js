// Fuzzy answer matching for the text guesses (guesses 1 & 2).
//
// Rules (from context.md):
//  - Case / punctuation / spacing insensitive.
//  - Accept close spellings as correct ("Grat White Shark", "Great Wite").
//  - Accept dropping generic trailing words ("Great White" for Great White Shark).
//  - If some words are right but others wrong ("Great Whale") it's INCORRECT,
//    but the correct words are flagged so the UI can highlight them in green.

export function normalize(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function toWords(str) {
  const n = normalize(str);
  return n ? n.split(' ') : [];
}

// Classic Levenshtein edit distance.
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// How many typos we tolerate for a single word, scaled to the target length so
// short words stay strict ("whale" must NOT be accepted as "white").
function allowedDistance(targetWord) {
  if (targetWord.length <= 3) return 0;
  if (targetWord.length <= 7) return 1;
  return 2;
}

function wordMatches(guessWord, targetWord) {
  return levenshtein(guessWord, targetWord) <= allowedDistance(targetWord);
}

// Greedily match each guess word to an unused target word.
function matchAgainst(guessWords, targetWords) {
  const usedTarget = new Array(targetWords.length).fill(false);
  const matchedTargetIdx = new Set();
  let unmatchedGuessWords = 0;

  for (const gw of guessWords) {
    let found = -1;
    for (let i = 0; i < targetWords.length; i++) {
      if (!usedTarget[i] && wordMatches(gw, targetWords[i])) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      usedTarget[found] = true;
      matchedTargetIdx.add(found);
    } else {
      unmatchedGuessWords++;
    }
  }

  // Correct = no wrong words, and enough of the name covered. Single-word names
  // require that one word; multi-word names require at least two words so a bare
  // generic word ("shark") isn't accepted on its own.
  const needed = Math.min(2, targetWords.length);
  const correct =
    guessWords.length > 0 &&
    unmatchedGuessWords === 0 &&
    matchedTargetIdx.size >= needed;

  return { correct, matchedTargetIdx };
}

// Evaluate a raw text guess against a species.
// Returns:
//   correct     – boolean
//   commonWords – the common name split into display words
//   highlight    – boolean[] parallel to commonWords, true where a guess word matched
export function evaluateGuess(raw, species) {
  const guessWords = toWords(raw);

  const commonWords = toWords(species.commonName);
  const scientificWords = toWords(species.scientificName);

  const correct =
    matchAgainst(guessWords, commonWords).correct ||
    matchAgainst(guessWords, scientificWords).correct;

  // Highlight is always computed against the common name (what we display).
  const { matchedTargetIdx } = matchAgainst(guessWords, commonWords);
  const highlight = commonWords.map((_, i) => matchedTargetIdx.has(i));

  return { correct, commonWords, highlight };
}

// Build the shuffled multiple-choice options for guess 3 (correct + 2 decoys).
// Deterministic per species id so the order is stable across a refresh.
export function multipleChoiceOptions(species) {
  const options = [species.commonName, ...species.decoys];
  return shuffleDeterministic(options, species.id);
}

function shuffleDeterministic(arr, seedStr) {
  const a = arr.slice();
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rand = () => {
    // xorshift32
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >> 17;
    seed ^= seed << 5; seed >>>= 0;
    return seed / 0xffffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
