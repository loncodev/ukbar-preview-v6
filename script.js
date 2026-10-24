(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMenu = () => {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
  };
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
    mobileMenu.hidden = !expanded;
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Cerrar menú' : 'Abrir menú');
  });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!mobileMenu.hidden && !mobileMenu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  const tabs = [...document.querySelectorAll('.category-tab')];
  const items = [...document.querySelectorAll('.menu-item')];
  const panel = document.getElementById('panel-menu');
  const selectCategory = (next, focus = false) => {
    tabs.forEach(tab => {
      const active = tab.dataset.category === next;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
      if (active) panel.setAttribute('aria-labelledby', tab.id);
    });
    items.forEach(item => { item.hidden = item.dataset.category !== next; });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectCategory(tab.dataset.category));
    tab.addEventListener('keydown', event => {
      let index;
      if (event.key === 'ArrowRight') index = (i + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (i + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault();
      selectCategory(tabs[index].dataset.category, true);
    });
  });
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();