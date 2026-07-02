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
  const matchedGuessIdx = new Set();

  guessWords.forEach((gw, gi) => {
    for (let i = 0; i < targetWords.length; i++) {
      if (!usedTarget[i] && wordMatches(gw, targetWords[i])) {
        usedTarget[i] = true;
        matchedTargetIdx.add(i);
        matchedGuessIdx.add(gi);
        return;
      }
    }
  });

  // Correct = no wrong words, and enough of the name covered. Single-word names
  // require that one word; multi-word names require at least two words so a bare
  // generic word ("shark") isn't accepted on its own.
  const needed = Math.min(2, targetWords.length);
  const correct =
    guessWords.length > 0 &&
    matchedGuessIdx.size === guessWords.length &&
    matchedTargetIdx.size >= needed;

  return { correct, matchedTargetIdx, matchedGuessIdx };
}

// Evaluate a raw text guess against a species.
// Returns:
//   correct     – boolean
//   guessTokens – the player's own words: { word, matched } (matched = fuzzily
//                 hit a word in the name). We only ever echo back what the
//                 player typed, so wrong guesses never reveal the answer.
//   anyMatched  – true if at least one guess word was correct
export function evaluateGuess(raw, species) {
  const guessWords = toWords(raw);

  const commonWords = toWords(species.commonName);
  const scientificWords = toWords(species.scientificName);

  const commonMatch = matchAgainst(guessWords, commonWords);
  const correct = commonMatch.correct || matchAgainst(guessWords, scientificWords).correct;

  // Highlight against the common name (what a player is most likely typing).
  const guessTokens = guessWords.map((word, i) => ({
    word,
    matched: commonMatch.matchedGuessIdx.has(i),
  }));
  const anyMatched = guessTokens.some((t) => t.matched);

  return { correct, guessTokens, anyMatched };
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
