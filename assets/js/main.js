/* Tech Foundaz — site behaviour */

// Where quote requests are sent. Paste a form-service URL here (e.g. a
// Formspree endpoint like "https://formspree.io/f/xxxxxxx") to receive
// submissions by email. While empty, the form only shows the thank-you message.
const FORM_ENDPOINT = 'https://formspree.io/f/meaeddyl';

(() => {
  const I18N = window.TF_I18N;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const store = {
    get: key => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, val) => { try { localStorage.setItem(key, val); } catch { /* storage unavailable */ } },
  };

  // Mobile navigation --------------------------------------------------------
  const toggle = document.querySelector('.nav__toggle');
  const links = document.getElementById('nav-links');

  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 1081px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  // Language (English / Kiswahili) --------------------------------------------
  // English is read from the page itself; Kiswahili comes from i18n.js.
  const i18nEls = [...document.querySelectorAll('[data-i18n]')];
  const english = new Map(i18nEls.map(el => [el, el.textContent]));
  const langButtons = document.querySelectorAll('[data-lang]');
  const metaDescription = document.querySelector('meta[name="description"]');
  let lang = 'en';

  const textFor = el => (lang === 'en' ? english.get(el) : I18N.sw[el.dataset.i18n] ?? english.get(el));
  const msg = () => I18N.messages[lang];

  // Quote form elements (used by the language switch and the form below)
  const form = document.getElementById('quote-form');
  const select = document.getElementById('service-select');
  const success = document.getElementById('form-success');
  const successService = document.getElementById('success-service');
  const errorBox = document.getElementById('form-error');
  const submitBtn = form.querySelector('button[type="submit"]');
  let lastService = select.value;

  const showError = text => {
    errorBox.textContent = text;
    errorBox.hidden = !text;
  };

  const renderSuccessService = () => {
    const option = [...select.options].find(o => o.value === lastService);
    successService.textContent = option ? option.textContent : lastService;
  };

  const setLanguage = next => {
    lang = next === 'sw' ? 'sw' : 'en';
    i18nEls.forEach(el => { el.textContent = textFor(el); });
    document.documentElement.lang = lang;
    document.title = I18N.meta[lang].title;
    metaDescription.content = I18N.meta[lang].description;
    langButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    form.elements.namedItem('language').value = lang;
    renderSuccessService();
    showError('');
  };

  langButtons.forEach(b => b.addEventListener('click', () => {
    setLanguage(b.dataset.lang);
    store.set('tf-lang', lang);
    // keep a ?lang= link in the address bar in step with the choice
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
    }
  }));

  const urlLang = new URLSearchParams(location.search).get('lang');
  const browserLang = (navigator.languages || [navigator.language]).some(l => /^sw\b/i.test(l)) ? 'sw' : 'en';
  setLanguage(urlLang || store.get('tf-lang') || browserLang);

  // Quote form ---------------------------------------------------------------
  const showForm = () => {
    success.hidden = true;
    form.hidden = false;
  };

  // "Request quote" links pre-select the matching service
  document.querySelectorAll('[data-service]').forEach(link => {
    link.addEventListener('click', () => {
      select.value = link.dataset.service;
      showForm();
    });
  });

  form.addEventListener('input', e => {
    if (e.target.validity && e.target.validity.valid) e.target.removeAttribute('aria-invalid');
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    showError('');

    const invalid = [...form.elements].filter(el => el.willValidate && !el.checkValidity());
    invalid.forEach(el => el.setAttribute('aria-invalid', 'true'));
    if (invalid.length) {
      const m = msg();
      showError(m.pleaseEnter + invalid.map(el => m.fields[el.name]).join(m.and) + '.');
      invalid[0].focus();
      return;
    }

    if (FORM_ENDPOINT) {
      submitBtn.disabled = true;
      submitBtn.textContent = msg().sending;
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(res.statusText);
      } catch {
        showError(msg().sendFailed);
        return;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = textFor(submitBtn);
      }
    }

    lastService = select.value;
    renderSuccessService();
    form.reset();
    form.elements.namedItem('language').value = lang;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  document.getElementById('form-reset').addEventListener('click', () => {
    showForm();
    form.elements.namedItem('name').focus();
  });

  // Scroll reveal ------------------------------------------------------------
  // [data-reveal] elements and the children of [data-stagger] fade in as they
  // enter the viewport; children revealed together are staggered.
  const revealEls = document.querySelectorAll('[data-reveal], [data-stagger], [data-stagger] > *');

  if (!('IntersectionObserver' in window) || reducedMotion.matches) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealer = new IntersectionObserver(entries => {
      let order = 0;
      entries.filter(entry => entry.isIntersecting).forEach(({ target: el }) => {
        if (el.parentElement.hasAttribute('data-stagger')) {
          el.style.transitionDelay = Math.min(order++ * 90, 450) + 'ms';
          const clearDelay = ev => {
            if (ev.target !== el) return;
            el.style.transitionDelay = '';
            el.removeEventListener('transitionend', clearDelay);
          };
          el.addEventListener('transitionend', clearDelay);
        }
        el.classList.add('is-visible');
        revealer.unobserve(el);
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach(el => revealer.observe(el));
  }

  // Hero network animation ---------------------------------------------------
  const canvas = document.querySelector('.hero__canvas');
  const ctx = canvas && canvas.getContext && canvas.getContext('2d');

  if (ctx) {
    const hero = canvas.parentElement;
    const LINK = 130;          // max distance between linked nodes
    const POINTER_LINK = 180;  // max distance from the pointer to a node
    const pointer = { x: -1e4, y: -1e4 };
    let w = 0, h = 0, nodes = [], raf = 0, inView = true, ready = false;

    const makeNode = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.4 + 0.8,
    });

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(124, 136, 255, ${(1 - d / LINK) * 0.35})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const dp = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (dp < POINTER_LINK) {
          ctx.strokeStyle = `rgba(174, 182, 255, ${(1 - dp / POINTER_LINK) * 0.6})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(174, 182, 255, 0.85)';
      ctx.beginPath();
      for (const n of nodes) {
        ctx.moveTo(n.x + n.r, n.y);
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const loop = () => {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (ready && !raf && inView && !document.hidden && !reducedMotion.matches) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = () => {
      // a soft background doesn't need full retina resolution; this keeps phones fast
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(120, Math.max(30, (w * h) / 10000)));
      while (nodes.length < count) nodes.push(makeNode());
      nodes.length = count;
      for (const n of nodes) {
        n.x = Math.min(n.x, w);
        n.y = Math.min(n.y, h);
      }
      if (!raf) draw(); // keep a static frame when not animating
    };

    new ResizeObserver(resize).observe(hero);
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start(); else stop();
    }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    reducedMotion.addEventListener('change', () => { stop(); start(); draw(); });

    hero.addEventListener('pointermove', e => {
      const rect = hero.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    });
    hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1e4; });

    // Show a still frame first; start moving once the page has finished loading
    const begin = () => setTimeout(() => { ready = true; start(); }, 1000);
    if (document.readyState === 'complete') begin();
    else window.addEventListener('load', begin, { once: true });
  }

  // Footer year --------------------------------------------------------------
  document.getElementById('year').textContent = new Date().getFullYear();
})();
