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

export function initAquarium(container, ctx) {
  const { speciesById, onChange } = ctx;
  render();

  function render() {
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

  // The visual "widget" tank showing the chosen species swimming.
  function renderTank(displayIds) {
    const tank = el('div', 'tank');
    if (displayIds.length === 0) {
      tank.append(el('p', 'tank-empty', 'No species on display — pick some below.'));
      return tank;
    }
    displayIds.forEach((id, i) => {
      const sp = speciesById[id];
      if (!sp) return;
      const img = el('img', 'tank-fish');
      img.src = sp.image;
      img.alt = sp.commonName;
      img.title = sp.commonName;
      // Spread the fish across depth/animation lanes.
      img.style.top = `${10 + (i * 37) % 62}%`;
      img.style.animationDelay = `${i * -3.5}s`;
      img.style.animationDuration = `${11 + (i % 3) * 3}s`;
      tank.append(img);
    });
    return tank;
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
