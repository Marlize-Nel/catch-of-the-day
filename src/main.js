// App bootstrap + tab router. Loads species data, wires the Today (quiz) and
// Aquarium views, and keeps the header catch-count in sync.

import { dateKey, speciesForDate, speciesForTomorrow } from './daily.js';
import { getCaught } from './storage.js';
import { initQuiz } from './quiz.js';
import { initAquarium } from './aquarium.js';

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
  const now = new Date();
  const todayKey = dateKey(now);
  const today = speciesForDate(species, now);
  const tomorrow = speciesForTomorrow(species, now);

  dateLabel.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const refreshHeader = () => {
    const n = getCaught().length;
    countLabel.textContent = `${n} caught`;
  };

  const onChange = () => {
    refreshHeader();
    initAquarium(views.aquarium, { speciesById, onChange });
  };

  initQuiz(views.today, { today, tomorrow, todayKey, onChange });
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

main();
