// The aquarium view: a display tank (up to 5 species you choose) and a "back
// aquarium" holding every other species you've caught.

import {
  getCaught,
  getDisplayIds,
  isOnDisplay,
  toggleDisplay,
  MAX_DISPLAY,
} from './storage.js';

const el = (tag, cls, html) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
};

// Cute ocean-themed one-liners for the chat bubble.
const GREETINGS = [
  'Blub blub! 🫧',
  'Just keep swimming! 🐠',
  'Have a fin-tastic day! 🐟',
  'You’re o-fish-ally awesome! ⭐',
  'Water you up to? 💧',
  'Sea you later! 🐚',
  'Feeling bubbly today! 🫧',
  'Waves of hello! 🌊',
  'Glad you sea-d hi! 😄',
  'Let’s make some waves! 🌊',
];

// Chat-bubble timing: show for 1 minute, then 4 minutes quiet (5-min cycle).
const CHAT_SHOW_MS = 60_000;
const CHAT_GAP_MS = 240_000;
const CHAT_FIRST_MS = 5_000; // first greeting shortly after opening the tank

// Timers live at module scope so a re-render (tab switch, catch) can cancel the
// previous schedule instead of stacking bubbles.
let chatTimers = [];
function clearChatTimers() {
  chatTimers.forEach(clearTimeout);
  chatTimers = [];
}

export function initAquarium(container, ctx) {
  const { speciesById, onChange } = ctx;
  render();

  function render() {
    clearChatTimers();
    container.innerHTML = '';
    const caught = getCaught();

    if (caught.length === 0) {
      container.append(
        el(
          'div',
          'empty-state',
          '🐠 Your aquarium is empty. Head to <strong>Today</strong> and catch your first species!'
        )
      );
      return;
    }

    const displayIds = getDisplayIds();
    const backIds = caught.map((c) => c.id).filter((id) => !displayIds.includes(id));

    container.append(renderTank(displayIds));
    container.append(
      el(
        'p',
        'aquarium-count',
        `${caught.length} caught · ${displayIds.length}/${MAX_DISPLAY} on display`
      )
    );
    container.append(renderCollection('On display', displayIds, true));
    if (backIds.length > 0) {
      container.append(renderCollection('Back aquarium', backIds, false));
    }
  }

  // A cute glass tank: swimming fish, rising bubbles, light rays and a planted
  // sandy seabed. One fish pipes up with a greeting every few minutes.
  function renderTank(displayIds) {
    const frame = el('div', 'aquarium-tank');
    const tank = el('div', 'tank');
    frame.append(tank);

    // Water ambience.
    tank.append(el('div', 'water-rays'));
    tank.append(buildBubbles(16));

    if (displayIds.length === 0) {
      tank.append(el('p', 'tank-empty', 'No species on display — pick some below.'));
      tank.append(buildSeabed());
      return frame;
    }

    const chatFish = [];
    displayIds.forEach((id, i) => {
      const sp = speciesById[id];
      if (!sp) return;

      const fish = el('div', 'fish');
      fish.style.top = `${8 + ((i * 37) % 58)}%`;
      fish.style.animationDelay = `${i * -3.5}s`;
      fish.style.animationDuration = `${13 + (i % 3) * 4}s`;

      const inner = el('div', 'fish-inner');
      inner.style.animationDelay = `${i * -1.3}s`;

      const bubble = el('div', 'chat-bubble');
      const img = el('img', 'tank-fish-img');
      img.src = sp.image;
      img.alt = sp.commonName;
      img.title = sp.commonName;
      img.style.animationDelay = fish.style.animationDelay;
      img.style.animationDuration = fish.style.animationDuration;

      inner.append(bubble, img);
      fish.append(inner);
      tank.append(fish);
      chatFish.push(bubble);
    });

    tank.append(buildSeabed());
    scheduleChat(chatFish);
    return frame;
  }

  function buildBubbles(count) {
    const wrap = el('div', 'bubbles');
    for (let i = 0; i < count; i++) {
      const b = el('span', 'bubble');
      const size = 6 + Math.random() * 16;
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      b.style.left = `${Math.random() * 100}%`;
      b.style.animationDuration = `${6 + Math.random() * 8}s`;
      b.style.animationDelay = `${-Math.random() * 12}s`;
      wrap.append(b);
    }
    return wrap;
  }

  function buildSeabed() {
    const bed = el('div', 'seabed');
    // A few swaying plants at varied positions.
    [8, 22, 62, 82, 93].forEach((left, i) => {
      const plant = el('div', `plant plant-${(i % 3) + 1}`);
      plant.style.left = `${left}%`;
      plant.style.animationDelay = `${i * -0.9}s`;
      bed.append(plant);
    });
    bed.append(el('div', 'sand'));
    return bed;
  }

  // Rotate through the displayed fish, popping a greeting bubble on each.
  function scheduleChat(bubbles) {
    if (bubbles.length === 0) return;
    let idx = 0;
    const speak = () => {
      const bubble = bubbles[idx % bubbles.length];
      idx += 1;
      bubble.textContent = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      bubble.classList.add('show');
      chatTimers.push(
        setTimeout(() => {
          bubble.classList.remove('show');
          chatTimers.push(setTimeout(speak, CHAT_GAP_MS));
        }, CHAT_SHOW_MS)
      );
    };
    chatTimers.push(setTimeout(speak, CHAT_FIRST_MS));
  }

  function renderCollection(title, ids, onDisplay) {
    const section = el('section', 'collection');
    section.append(el('h3', 'collection-title', title));
    const grid = el('div', 'species-grid');
    ids.forEach((id) => grid.append(renderCard(speciesById[id], onDisplay)));
    section.append(grid);
    return section;
  }

  function renderCard(sp, onDisplay) {
    if (!sp) return el('div');
    const card = el('article', 'species-card');
    const fig = el('figure', 'card-figure');
    const img = el('img', 'card-img');
    img.src = sp.image;
    img.alt = sp.commonName;
    fig.append(img);
    card.append(fig);
    card.append(el('h4', 'card-name', sp.commonName));
    card.append(el('p', 'card-sci', sp.scientificName));
    card.append(el('p', 'card-fact', sp.funFact));

    const btn = el('button', 'btn btn-small');
    const currentlyDisplayed = isOnDisplay(sp.id);
    btn.textContent = currentlyDisplayed ? 'Remove from display' : 'Add to display';
    if (!currentlyDisplayed && getDisplayIds().length >= MAX_DISPLAY) {
      btn.disabled = true;
      btn.title = `Display is full (${MAX_DISPLAY}). Remove one first.`;
    }
    btn.addEventListener('click', () => {
      const res = toggleDisplay(sp.id);
      if (!res.ok && res.reason === 'full') {
        flash(section(card), `Display aquarium is full (max ${MAX_DISPLAY}).`);
        return;
      }
      onChange && onChange();
      render();
    });
    card.append(btn);
    void onDisplay;
    return card;
  }

  function section(node) {
    return node.closest('.collection') || container;
  }

  function flash(target, message) {
    const existing = target.querySelector('.flash');
    if (existing) existing.remove();
    const msg = el('p', 'flash', message);
    target.prepend(msg);
    setTimeout(() => msg.remove(), 2500);
  }
}
