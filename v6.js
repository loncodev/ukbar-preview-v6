(() => {
  'use strict';
  const root = document.getElementById('tapwall');
  if (!root) return;
  const filters = [...root.querySelectorAll('[data-beer-filter]')];
  const sizes = [...root.querySelectorAll('[data-beer-size]')];
  const cards = [...root.querySelectorAll('.v6-tap')];
  const announcer = root.querySelector('#v6-beer-status');
  const currency = new Intl.NumberFormat('es-CL', {maximumFractionDigits: 0});
  let profile = 'all';
  let serving = '300';

  function update() {
    let count = 0;
    cards.forEach(card => {
      const flavors = card.dataset.profile.split(' ');
      const visible = profile === 'all' || flavors.includes(profile);
      card.hidden = !visible;
      if (visible) count++;
      const raw = Number(card.getAttribute(serving === '300' ? 'data-price-300' : 'data-price-pint'));
      card.querySelector('.v6-tap-amount').textContent = '$' + currency.format(raw);
      card.querySelector('.v6-tap-volume').textContent = serving === '300' ? '300 CC' : 'PINTA';
    });
    filters.forEach(button => {
      const active = button.dataset.beerFilter === profile;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    sizes.forEach(button => {
      const active = button.dataset.beerSize === serving;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    announcer.textContent = count + (count === 1 ? ' cerveza' : ' cervezas') +
      ' para explorar · precios de ' + (serving === '300' ? '300 cc' : 'pinta') +
      ' · consulta disponibilidad actual';
  }
  filters.forEach(button => button.addEventListener('click', () => {
    profile = button.dataset.beerFilter;
    update();
  }));
  sizes.forEach(button => button.addEventListener('click', () => {
    serving = button.dataset.beerSize;
    update();
  }));
  update();
})();