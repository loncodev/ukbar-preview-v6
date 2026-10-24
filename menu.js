(() => {
  'use strict';
  const root = document.querySelector('.full-menu-results');
  if (!root) return;
  const cards = Array.from(root.querySelectorAll('.full-menu-product'));
  const chips = Array.from(document.querySelectorAll('.full-menu-cat'));
  const query = document.querySelector('#full-menu-query');
  const diets = Array.from(document.querySelectorAll('input[name=diet]'));
  const count = document.querySelector('#full-menu-count');
  const empty = document.querySelector('#full-menu-noresults');
  const isEnglish = document.documentElement.lang.startsWith('en');

  function normalize(text) {
    return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  }
  const validCategories = new Set(chips.map(b => b.dataset.category));
  const initial = new URLSearchParams(window.location.search).get('categoria');
  let category = validCategories.has(initial) ? initial : 'todos';
  const cache = cards.map(card => ({
    element: card,
    text: normalize(card.dataset.menuSearch + ' ' + card.querySelector('h3').textContent),
    category: card.dataset.menuCategory,
    special: card.dataset.menuSpecial
  }));
  function render() {
    const term = normalize(query.value);
    const diet = diets.find(r => r.checked)?.value || 'all';
    let visible = 0;
    cache.forEach(entry => {
      const categoryPass = category === 'todos' || entry.category === category;
      const dietPass = diet === 'all' || entry.special === diet ||
        (diet === 'vegetariano' && entry.special === 'vegano');
      const searchPass = !term || entry.text.includes(term);
      const shown = categoryPass && dietPass && searchPass;
      entry.element.hidden = !shown;
      if (shown) visible++;
    });
    chips.forEach(chip => {
      const selected = chip.dataset.category === category;
      chip.classList.toggle('active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    });
    count.textContent = isEnglish ? visible + (visible === 1 ? ' item' : ' items') + ' found'
      : visible + (visible === 1 ? ' producto' : ' productos') + ' encontrados';
    empty.hidden = visible !== 0;
  }
  chips.forEach(chip => chip.addEventListener('click', () => {
    category = chip.dataset.category;
    render();
  }));
  query.addEventListener('input', render);
  diets.forEach(item => item.addEventListener('change', render));
  render();
})();