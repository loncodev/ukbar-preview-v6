(() => {
  'use strict';
  const form = document.getElementById('booking-form');
  if (!form) return;
  const dateField = form.querySelector('#booking-date');
  const timeField = form.querySelector('#booking-time');
  const guestsField = form.querySelector('#booking-guests');
  const notesField = form.querySelector('#booking-notes');
  const feedback = form.querySelector('#booking-feedback');
  const english = document.documentElement.lang.startsWith('en');

  function venueDateString(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return byType.year + '-' + byType.month + '-' + byType.day;
  }
  const today = venueDateString();
  dateField.min = today;
  if (!dateField.value) dateField.value = today;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    feedback.textContent = '';
    if (!form.reportValidity()) return;
    const date = dateField.value;
    const time = timeField.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return;
    if (date < venueDateString()) {
      feedback.textContent = english ? 'Please choose today or a future date.' : 'Elige hoy o una fecha futura.';
      dateField.focus();
      return;
    }
    const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
    if (weekday === 0) {
      feedback.textContent = english
        ? 'UK Bar is closed on Sundays. Please choose another day. For late Saturday-night inquiries, contact the bar directly.'
        : 'UK Bar cierra los domingos. Elige otro día. Para consultas de la madrugada del sábado, escribe directamente al bar.';
      dateField.focus();
      return;
    }
    if (time < '17:00') {
      feedback.textContent = english
        ? 'The bar opens at 5 pm. For inquiries after midnight, please contact the bar directly.'
        : 'El bar abre a las 17:00. Para consultas después de medianoche, escribe directamente al bar.';
      timeField.focus();
      return;
    }
    const d = date.split('-');
    const friendlyDate = d[2] + '-' + d[1] + '-' + d[0];
    const people = guestsField.value === '13+' ? (english ? 'more than 12 people' : 'más de 12 personas')
      : english ? guestsField.value + (guestsField.value === '1' ? ' person' : ' people')
      : guestsField.value + (guestsField.value === '1' ? ' persona' : ' personas');
    const notes = notesField.value.trim().slice(0, 240);
    const message = english
      ? "Hello UK Bar! I'd like to ask about a reservation.\nDate: " + friendlyDate + "\nApproximate time: " + time + "\nParty: " + people + (notes ? '\nNotes: ' + notes : '') + '\nPlease confirm whether a table is available. Thank you!'
      : 'Hola UK Bar, quisiera consultar por una reserva.\nFecha: ' + friendlyDate + '\nHora aproximada: ' + time + '\nPersonas: ' + people + (notes ? '\nComentario: ' + notes : '') + '\n¿Podrían confirmarme si hay disponibilidad? Gracias.';
    const url = 'https://wa.me/56937264991?text=' + encodeURIComponent(message);
    feedback.textContent = english
      ? 'Your request is ready. WhatsApp will open so you can send it; the reservation is not yet confirmed.'
      : 'Consulta preparada. Se abrirá WhatsApp para enviarla; la reserva aún no está confirmada.';
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = english ? 'Open prepared message in WhatsApp' : 'Abrir mensaje preparado en WhatsApp';
    const messageHint = feedback.textContent;
    feedback.replaceChildren(document.createTextNode(messageHint + ' '), link);
    // An explicit click on the link inside the submit event keeps a repeatable fallback.
    link.click();
  });
})();