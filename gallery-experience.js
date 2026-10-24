/* UK Bar V6: accessible photo viewer; enhanced photos remain visible without JS. */
(() => {
'use strict';
const dialog = document.getElementById('uk-gallery-dialog');
const gallery = document.querySelector('#galeria .uk-photo-grid');
if (!dialog || !gallery || !('showModal' in dialog)) return;
const buttons = Array.from(gallery.querySelectorAll('.gallery-open'));
const img = document.getElementById('uk-gallery-large');
const caption = document.getElementById('uk-gallery-caption');
const position = document.getElementById('uk-gallery-position');
const close = dialog.querySelector('.uk-gallery-close');
let index = 0;
let opener = null;
function show(nextIndex) {
  index = (nextIndex + buttons.length) % buttons.length;
  const thumb = buttons[index];
  const photo = thumb.querySelector('img');
  img.src = photo.currentSrc || photo.src;
  img.alt = photo.alt;
  caption.textContent = thumb.closest('figure').querySelector('figcaption').textContent;
  position.textContent = (index + 1) + ' / ' + buttons.length;
}
buttons.forEach((button,idx) => button.addEventListener('click', () => {
  opener = button;
  show(idx);
  dialog.showModal();
  close.focus();
}));
close.addEventListener('click', () => dialog.close());
dialog.querySelectorAll('[data-gallery-direction]').forEach(button => button.addEventListener('click', () => {
  show(index + Number(button.dataset.galleryDirection));
}));
dialog.addEventListener('click', event => {
  // Native dialog supports backdrop clicks without capturing button clicks.
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    if (event.target.matches('button')) return;
    event.preventDefault();
    show(index + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
dialog.addEventListener('close', () => {
  img.removeAttribute('src');
  if (opener?.isConnected) opener.focus();
});
})();