// Today's quiz screen: the 3-guess flow, plus the post-game "come back
// tomorrow" state with a silhouette of tomorrow's species.

import { evaluateGuess, multipleChoiceOptions } from './guess.js';
import { getPlay, recordPlay, addCatch, MAX_DISPLAY, getCaught } from './storage.js';

const el = (tag, cls, html) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
};

export function initQuiz(container, ctx) {
  const { today, tomorrow, todayKey, onChange } = ctx;

  // Local within-day guess counter; the persisted result is the source of truth
  // for whether the day is already finished.
  let stage = 1; // 1, 2, or 3
  let lastFeedback = null;

  render();

  function render() {
    container.innerHTML = '';
    const existing = getPlay(todayKey);
    if (existing) {
      container.append(renderPostGame(existing));
    } else {
      container.append(renderGuessStage());
    }
  }

  // ---- Guess stages -------------------------------------------------------

  function renderGuessStage() {
    const wrap = el('section', 'quiz-card');
    wrap.append(el('p', 'quiz-eyebrow', `Guess ${stage} of 3`));
    wrap.append(el('h2', 'quiz-title', "What's today's catch?"));

    const figure = el('figure', 'species-figure');
    const img = el('img', 'species-img');
    img.src = today.image;
    img.alt = 'Mystery marine species';
    figure.append(img);
    wrap.append(figure);

    if (stage >= 2) {
      wrap.append(el('p', 'quiz-hint', `💡 ${today.hint}`));
    }

    if (lastFeedback) {
      wrap.append(renderFeedback(lastFeedback));
    }

    if (stage < 3) {
      wrap.append(renderTextGuess());
    } else {
      wrap.append(renderMultipleChoice());
    }
    return wrap;
  }

  // Feedback echoes back only what the PLAYER typed, greening the parts that are
  // on the right track (a whole word, or just a fragment like "sea" in "sea
  // lion"). It never reveals unguessed words.
  function renderFeedback({ guessTokens, anyMatched }) {
    const note = el('p', 'guess-feedback');
    if (anyMatched) {
      note.append(document.createTextNode('Not quite — you typed '));
      guessTokens.forEach((t, i) => {
        note.append(renderToken(t));
        if (i < guessTokens.length - 1) note.append(document.createTextNode(' '));
      });
      note.append(document.createTextNode(' — the green letters belong in the name. Try again!'));
    } else {
      note.append(document.createTextNode('Not quite — that’s not it. Try again!'));
    }
    return note;
  }

  // One guess word with its correct [start,end) slice highlighted green.
  function renderToken({ word, start, end }) {
    const span = el('span', 'guess-token');
    if (end <= start) {
      span.append(el('span', 'word-plain', word));
      return span;
    }
    if (start > 0) span.append(el('span', 'word-plain', word.slice(0, start)));
    span.append(el('span', 'word-correct', word.slice(start, end)));
    if (end < word.length) span.append(el('span', 'word-plain', word.slice(end)));
    return span;
  }

  function renderTextGuess() {
    const form = el('form', 'guess-form');
    const input = el('input', 'guess-input');
    input.type = 'text';
    input.placeholder = 'Common or scientific name…';
    input.autocomplete = 'off';
    input.autofocus = true;

    const submit = el('button', 'btn btn-primary');
    submit.type = 'submit';
    submit.textContent = 'Guess';

    const noIdea = el('button', 'btn btn-ghost');
    noIdea.type = 'button';
    noIdea.textContent = 'I have no idea';

    form.append(input, submit, noIdea);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      const result = evaluateGuess(value, today);
      if (result.correct) {
        win();
      } else {
        lastFeedback = { guessTokens: result.guessTokens, anyMatched: result.anyMatched };
        advance();
      }
    });

    noIdea.addEventListener('click', () => {
      lastFeedback = null;
      advance();
    });

    return form;
  }

  function renderMultipleChoice() {
    const wrap = el('div', 'choice-wrap');
    wrap.append(el('p', 'choice-lead', 'Last chance — pick one:'));
    const options = multipleChoiceOptions(today);
    options.forEach((name) => {
      const btn = el('button', 'btn btn-choice');
      btn.type = 'button';
      btn.textContent = name;
      btn.addEventListener('click', () => {
        const correct = evaluateGuess(name, today).correct;
        if (correct) win();
        else lose();
      });
      wrap.append(btn);
    });
    return wrap;
  }

  function advance() {
    if (stage >= 3) {
      lose();
      return;
    }
    stage += 1;
    render();
  }

  // ---- Outcomes -----------------------------------------------------------

  function win() {
    addCatch(today.id, todayKey);
    recordPlay(todayKey, { speciesId: today.id, result: 'caught', guessesUsed: stage });
    onChange && onChange();
    render();
  }

  function lose() {
    recordPlay(todayKey, { speciesId: today.id, result: 'released', guessesUsed: 3 });
    onChange && onChange();
    render();
  }

  // ---- Post-game ----------------------------------------------------------

  function renderPostGame(play) {
    const wrap = el('section', 'quiz-card');
    const caught = play.result === 'caught';

    const banner = el('div', caught ? 'result-banner result-win' : 'result-banner result-lose');
    banner.append(el('span', 'result-emoji', caught ? '🎉' : '🌊'));
    banner.append(
      el(
        'div',
        null,
        caught
          ? `<strong>Caught!</strong> You added it in ${play.guessesUsed} guess${play.guessesUsed > 1 ? 'es' : ''}.`
          : '<strong>Released.</strong> It got away — back to the ocean, no second chances.'
      )
    );
    wrap.append(banner);

    // Reveal the answer (educational either way).
    const reveal = el('figure', 'species-figure');
    const img = el('img', 'species-img');
    img.src = today.image;
    img.alt = today.commonName;
    reveal.append(img);
    const cap = el('figcaption', 'species-caption');
    cap.innerHTML = `<strong>${today.commonName}</strong><br><em>${today.scientificName}</em>`;
    reveal.append(cap);
    wrap.append(reveal);

    wrap.append(el('p', 'fun-fact', `🐟 ${today.funFact}`));

    if (caught) {
      const total = getCaught().length;
      if (total > MAX_DISPLAY) {
        wrap.append(
          el(
            'p',
            'aquarium-note',
            `Your display aquarium is full (${MAX_DISPLAY}). New catches wait in the back aquarium — pick your favourites to display from the Aquarium tab.`
          )
        );
      }
    }

    wrap.append(renderTomorrow());
    return wrap;
  }

  function renderTomorrow() {
    const box = el('div', 'tomorrow-box');
    box.append(el('h3', 'tomorrow-title', "Come back tomorrow…"));
    box.append(el('p', 'tomorrow-sub', 'A new mystery species is waiting:'));
    const fig = el('figure', 'silhouette-figure');
    const img = el('img', 'silhouette-img');
    img.src = tomorrow.image;
    img.alt = "Tomorrow's mystery species";
    fig.append(img);
    box.append(fig);
    box.append(el('p', 'tomorrow-hint', "Who's that species?"));
    return box;
  }
}
