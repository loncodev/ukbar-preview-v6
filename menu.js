(() => {
  'use strict';
  const root = document.querySelector('.full-menu-results');
  if (!root) return;

  const PAGE_SIZE = 12;
  const cards = Array.from(root.querySelectorAll('.full-menu-product'));
  const chips = Array.from(document.querySelectorAll('.full-menu-cat'));
  const query = document.querySelector('#full-menu-query');
  const diets = Array.from(document.querySelectorAll('input[name=diet]'));
  const count = document.querySelector('#full-menu-count');
  const empty = document.querySelector('#full-menu-noresults');
  const pager = document.querySelector('#full-menu-pager');
  const more = document.querySelector('#full-menu-more');
  const progress = document.querySelector('#full-menu-progress');
  const isEnglish = document.documentElement.lang.startsWith('en');
  if (!query || !count || !empty || !pager || !more || !progress) return;

  function normalize(text) {
    return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }
  const validCategories = new Set(chips.map(chip => chip.dataset.category));
  const initial = new URLSearchParams(window.location.search).get('categoria');
  let category = validCategories.has(initial) ? initial : 'todos';
  let displayLimit = PAGE_SIZE;
  const entries = cards.map(card => ({
    element: card,
    text: normalize(card.dataset.menuSearch + ' ' + card.querySelector('h3').textContent),
    category: card.dataset.menuCategory,
    special: card.dataset.menuSpecial
  }));

  // These counts show the complete catalog totals, irrespective of current search.
  const categoryTotals = new Map([['todos', entries.length]]);
  entries.forEach(entry => {
    categoryTotals.set(entry.category, (categoryTotals.get(entry.category) || 0) + 1);
  });
  chips.forEach(chip => {
    const badge = document.createElement('span');
    badge.className = 'full-menu-cat-count';
    badge.textContent = String(categoryTotals.get(chip.dataset.category) || 0);
    chip.append(badge);
  });

  function render() {
    const term = normalize(query.value);
    const diet = diets.find(input => input.checked)?.value || 'all';
    const matches = entries.filter(entry => {
      const categoryPass = category === 'todos' || entry.category === category;
      const dietPass = diet === 'all' || entry.special === diet ||
        (diet === 'vegetariano' && entry.special === 'vegano');
      const searchPass = !term || entry.text.includes(term);
      return categoryPass && dietPass && searchPass;
    });
    const total = matches.length;
    const shown = Math.min(displayLimit, total);
    const selected = new Set(matches.slice(0, shown));
    entries.forEach(entry => { entry.element.hidden = !selected.has(entry); });
    chips.forEach(chip => {
      const active = chip.dataset.category === category;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    count.textContent = isEnglish
      ? 'Showing ' + shown + ' of ' + total + (total === 1 ? ' item' : ' items')
      : 'Mostrando ' + shown + ' de ' + total + (total === 1 ? ' producto' : ' productos');
    empty.hidden = total !== 0;
    pager.hidden = total <= displayLimit;
    progress.style.width = (total ? shown / total * 100 : 0).toFixed(2) + '%';
    more.textContent = isEnglish ? 'SHOW 12 MORE ↓' : 'MOSTRAR 12 MÁS ↓';
  }

  chips.forEach(chip => chip.addEventListener('click', () => {
    category = chip.dataset.category;
    displayLimit = PAGE_SIZE;
    render();
  }));
  query.addEventListener('input', () => {
    displayLimit = PAGE_SIZE;
    render();
  });
  diets.forEach(item => item.addEventListener('change', () => {
    displayLimit = PAGE_SIZE;
    render();
  }));
  more.addEventListener('click', () => {
    displayLimit += PAGE_SIZE;
    render();
  });
  render();
})();
