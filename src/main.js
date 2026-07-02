// App bootstrap + tab router. Loads species data, wires the Today (quiz) and
// Aquarium views, and keeps the header catch-count in sync.

import { dateKey, speciesForDate, speciesForTomorrow } from './daily.js';
import { getCaught, resetAll } from './storage.js';
import { initQuiz } from './quiz.js';
import { initAquarium } from './aquarium.js';

// DEMO MODE: lets you jump between days in one sitting to fill the aquarium and
// see it fill up. Flip to `false` to ship the real one-day-at-a-time game.
const DEMO = true;

const views = {
  today: document.getElementById('view-today'),
  aquarium: document.getElementById('view-aquarium'),
};
const tabs = document.querySelectorAll('.tab');
const dateLabel = document.getElementById('date-label');
const countLabel = document.getElementById('catch-count');

async function main() {
  let species;
  try {
    const res = await fetch('data/species.json');
    species = await res.json();
  } catch (err) {
    views.today.innerHTML =
      '<p class="error">Could not load species data. Serve the site over http (see README) rather than opening the file directly.</p>';
    return;
  }

  const speciesById = Object.fromEntries(species.map((s) => [s.id, s]));
  const baseDate = new Date();
  let dayOffset = 0; // demo-only: days added to today

  const refreshHeader = () => {
    countLabel.textContent = `${getCaught().length} caught`;
  };

  const onChange = () => {
    refreshHeader();
    initAquarium(views.aquarium, { speciesById, onChange });
  };

  // (Re)mount the Today view for the current (possibly demo-shifted) date.
  const renderToday = () => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + dayOffset);

    dateLabel.textContent = date.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    initQuiz(views.today, {
      today: speciesForDate(species, date),
      tomorrow: speciesForTomorrow(species, date),
      todayKey: dateKey(date),
      onChange,
    });
  };

  if (DEMO) setupDemoBar({
    onShift: (delta) => { dayOffset += delta; renderToday(); },
    onReset: () => { resetAll(); dayOffset = 0; renderToday(); onChange(); },
  });

  renderToday();
  initAquarium(views.aquarium, { speciesById, onChange });
  refreshHeader();
  setupTabs();
}

function setupTabs() {
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.view;
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      Object.entries(views).forEach(([name, node]) => {
        node.classList.toggle('view-active', name === target);
      });
    });
  });
}

// Demo-only control bar for hopping between days and resetting progress.
function setupDemoBar({ onShift, onReset }) {
  const bar = document.createElement('div');
  bar.className = 'demo-bar';
  bar.innerHTML = `
    <span class="demo-tag">🧪 Demo mode</span>
    <button class="demo-btn" data-act="prev">◀ Prev day</button>
    <button class="demo-btn demo-next" data-act="next">Next day ▶</button>
    <button class="demo-btn demo-reset" data-act="reset">Reset progress</button>
    <span class="demo-hint">Play different days to fill your aquarium.</span>
  `;
  document.body.insertBefore(bar, document.querySelector('.app-main'));

  bar.addEventListener('click', (e) => {
    const act = e.target.dataset.act;
    if (act === 'next') onShift(1);
    else if (act === 'prev') onShift(-1);
    else if (act === 'reset' && confirm('Reset all demo progress and empty the aquarium?')) onReset();
  });
}

main();
