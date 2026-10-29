(() => {
  'use strict';
  const form = document.getElementById('uk-feedback-form');
  if (!form) return;
  const textarea = form.querySelector('textarea[name="suggestion"]');
  const status = document.getElementById('uk-feedback-status');
  const counter = document.getElementById('uk-feedback-count');
  const button = form.querySelector('button[type="submit"]');
  const isEnglish = document.documentElement.lang.toLowerCase().startsWith('en');
  const preview = form.dataset.preview === 'true' ||
    !['ukbar.cl', 'www.ukbar.cl'].includes(location.hostname);

  function show(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind;
  }
  function count() {
    counter.textContent = Array.from(textarea.value).length + ' / 1000';
  }
  textarea.addEventListener('input', count);
  count();

  if (preview) {
    show(isEnglish
      ? 'Preview only: messages are not sent or saved here.'
      : 'Vista previa: aquí no se envían ni guardan comentarios.', 'preview');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (preview) {
      show(isEnglish
        ? 'This is a preview. Please use the official UK Bar website to send your suggestion.'
        : 'Esta es una vista previa. Para enviar tu sugerencia, usa el sitio oficial de UK Bar.', 'preview');
      return;
    }
    const comment = textarea.value.trim();
    const size = Array.from(comment).length;
    if (size < 5 || size > 1000) {
      show(isEnglish ? 'Write between 5 and 1,000 characters.'
        : 'Escribe entre 5 y 1.000 caracteres.', 'error');
      textarea.focus();
      return;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    show(isEnglish ? 'Sending privately…' : 'Enviando de forma privada…', 'pending');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        redirect: 'error'
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || (isEnglish
          ? 'We could not receive your suggestion. Please try again.'
          : 'No pudimos recibir tu sugerencia. Intenta nuevamente.'));
      }
      textarea.value = '';
      count();
      show(isEnglish
        ? 'Thank you! Your suggestion was received privately by UK Bar.'
        : '¡Gracias! UK Bar recibió tu sugerencia de forma privada.', 'success');
    } catch (error) {
      show(error.message || (isEnglish
        ? 'We could not send your suggestion. Please try again later.'
        : 'No pudimos enviar tu sugerencia. Intenta nuevamente más tarde.'), 'error');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
})();
