/* UK Bar | Google Analytics 4 | consentimiento básico
 * Para activar: sustituir GA4_MEASUREMENT_ID por el ID real del flujo web (G-...).
 * En la vista previa de GitHub Pages no se recopilan datos.
 */
(() => {
  'use strict';

  const GA4_MEASUREMENT_ID = ''; // PENDIENTE: ID del flujo web de UK Bar (G-...)
  const RESERVATION_FORM_ID = '1FAIpQLSf3SAMyted1qxLxRD5GVT5lrSHHYBTZ5Grac81x-aX2-lOyBA';
  const CONSENT_KEY = 'ukbar-analytics-consent-v1';
  const allowedHosts = new Set(['ukbar.cl', 'www.ukbar.cl']);
  const english = document.documentElement.lang.toLowerCase().startsWith('en');

  // Nunca medir la vista previa, el editor, los archivos privados ni otros dominios.
  if (!allowedHosts.has(window.location.hostname)) return;
  if (!/^G-[A-Z0-9]{6,20}$/.test(GA4_MEASUREMENT_ID)) return;

  const strings = english ? {
    label: 'Optional visit statistics',
    description: 'May we use Google Analytics to count visits, page views, and clicks on bookings and the menu? Analytics is only activated if you accept.',
    allow: 'Allow analytics',
    deny: 'No thanks',
    settings: 'Analytics privacy choices'
  } : {
    label: 'Estadísticas opcionales',
    description: '¿Nos permites usar Google Analytics para contar visitas, páginas vistas y clics en reservas y carta? Solo se activa si aceptas.',
    allow: 'Permitir estadísticas',
    deny: 'No, gracias',
    settings: 'Privacidad y estadísticas'
  };

  let preference = null;
  let analyticsLoaded = false;
  let banner = null;

  try {
    preference = window.localStorage.getItem(CONSENT_KEY);
  } catch (_) {
    // Si el navegador bloquea el almacenamiento, volvemos a solicitar consentimiento.
  }

  function savePreference(value) {
    preference = value;
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (_) {}
  }

  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map(v => v.trim().split('=')[0]);
    for (const name of names) {
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', 'ukbar.cl', '.ukbar.cl']) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
      }
    }
  }

  function startAnalytics() {
    if (analyticsLoaded || preference !== 'accepted') return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Modo básico: la etiqueta no se carga ni transmite nada antes de aceptar.
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function trackLink(event) {
    if (preference !== 'accepted' || !analyticsLoaded || typeof window.gtag !== 'function') return;
    const node = event.target;
    const anchor = node && node.closest && node.closest('a[href]');
    if (!anchor) return;

    let url;
    try { url = new URL(anchor.href, window.location.href); } catch (_) { return; }

    const isReservation = url.hostname === 'docs.google.com' &&
      url.pathname.startsWith('/forms/d/e/' + RESERVATION_FORM_ID + '/');
    const isMenu = url.origin === window.location.origin &&
      ['/carta/', '/en/menu/', '/carta/index.html', '/en/menu/index.html'].includes(url.pathname);

    if (isReservation) {
      window.gtag('event', 'click_reserva', { destino: 'google_forms' });
    } else if (isMenu) {
      window.gtag('event', 'click_carta', {
        destino: url.pathname.startsWith('/en/') ? 'carta_en' : 'carta_es'
      });
    }
  }

  function renderBanner() {
    if (banner) return;
    banner = document.createElement('section');
    banner.className = 'ukbar-analytics-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', strings.label);
    const title = document.createElement('strong');
    title.textContent = strings.label;
    const description = document.createElement('p');
    description.textContent = strings.description;
    const actions = document.createElement('div');
    const allow = document.createElement('button');
    allow.type = 'button';
    allow.textContent = strings.allow;
    allow.className = 'ukbar-analytics-accept';
    const deny = document.createElement('button');
    deny.type = 'button';
    deny.textContent = strings.deny;
    deny.className = 'ukbar-analytics-deny';
    actions.append(allow, deny);
    banner.append(title, description, actions);
    document.body.appendChild(banner);

    function choose(value) {
      savePreference(value);
      banner.remove();
      banner = null;
      if (value === 'accepted') {
        startAnalytics();
      } else {
        clearAnalyticsCookies();
        if (analyticsLoaded) window.location.reload();
      }
    }
    allow.addEventListener('click', () => choose('accepted'));
    deny.addEventListener('click', () => choose('rejected'));
  }

  function installSettingsLink() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ukbar-analytics-settings';
    button.textContent = strings.settings;
    button.addEventListener('click', renderBanner);
    footer.appendChild(button);
  }

  const css = document.createElement('style');
  css.textContent = `
    .ukbar-analytics-consent{position:fixed;bottom:14px;left:14px;right:14px;z-index:2147483000;max-width:490px;box-sizing:border-box;padding:18px 20px;border-radius:12px;background:#21191b;color:#fff;border:1px solid #bd9482;box-shadow:0 8px 40px #0009;font:14px/1.5 system-ui,sans-serif}
    .ukbar-analytics-consent strong{font:700 16px/1.3 system-ui,sans-serif}
    .ukbar-analytics-consent p{margin:8px 0 14px;color:#f4e7df}
    .ukbar-analytics-consent div{display:flex;flex-wrap:wrap;gap:10px}
    .ukbar-analytics-consent button{padding:9px 14px;border-radius:7px;border:1px solid #e7c8b7;font:600 13px system-ui,sans-serif;cursor:pointer}
    .ukbar-analytics-consent .ukbar-analytics-accept{background:#fff;color:#201518}
    .ukbar-analytics-consent .ukbar-analytics-deny{background:transparent;color:#fff}
    .ukbar-analytics-consent button:focus-visible,.ukbar-analytics-settings:focus-visible{outline:3px solid #f7d07d;outline-offset:3px}
    .ukbar-analytics-settings{display:block;margin:12px auto 18px;padding:5px;background:none;border:0;color:#f3d8c9;text-decoration:underline;text-underline-offset:3px;font:12px/1.4 system-ui,sans-serif;cursor:pointer}
  `;
  document.head.appendChild(css);
  document.addEventListener('click', trackLink, true);
  installSettingsLink();
  if (preference === 'accepted') startAnalytics();
  else if (preference !== 'rejected') renderBanner();
})();
