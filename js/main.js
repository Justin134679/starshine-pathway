// pinned top bar — toggle background after scrolling past hero edge
  (function() {
    const topBar = document.getElementById('topBar');
    if (!topBar) return;
    const onScroll = () => {
      if (window.scrollY > 40) topBar.classList.add('is-scrolled');
      else topBar.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  // scroll-driven accordion (Section 02 — pain points)
  (function() {
    const items = document.querySelectorAll('#painAcc .acc-item');
    if (!items.length) return;
    let lastActive = items[0];
    const setActive = (el) => {
      if (el === lastActive) return;
      items.forEach(i => i.classList.remove('is-active'));
      el.classList.add('is-active');
      lastActive = el;
    };
    const tick = () => {
      const triggerY = window.innerHeight * 0.56;
      let best = null;
      let bestDist = Infinity;
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        // only consider items at least partially in viewport
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - triggerY);
        if (dist < bestDist) { bestDist = dist; best = el; }
      });
      if (best) setActive(best);
    };
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = null; tick(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // click to expand on tap (mobile users that don't scroll)
    items.forEach(el => el.addEventListener('click', () => setActive(el)));
    tick();
  })();

  // reveal-on-scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // chip multi-select
  document.querySelectorAll('#chipGroup .chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });

  // Chapter 06 mobile story expand/collapse
  document.querySelectorAll('.ch06-story-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const story = btn.closest('.ch06-story');
      if (!story) return;
      const isOpen = story.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // form submit
  const form = document.getElementById('leadForm');
  if (form) {
    const submitBtn = form.querySelector('.ch07-submit');
    const copyPhoneBtn = form.querySelector('[data-copy-phone-to-line]');
    const submitLabel = submitBtn ? submitBtn.innerHTML : '';
    let error = form.querySelector('#formError');

    const showError = (message) => {
      if (!error) {
        error = document.createElement('p');
        error.id = 'formError';
        error.style.cssText = 'color:#c0392b;font-size:13px;margin-top:8px;text-align:center';
        if (submitBtn) submitBtn.insertAdjacentElement('afterend', error);
        else form.appendChild(error);
      }
      error.textContent = message || '送出失敗，請稍後再試。';
    };

    const showSuccess = () => {
      document.getElementById('formFields').classList.add('hidden');
      document.getElementById('formSuccess').classList.remove('hidden');
    };

    const fieldValue = (name) => {
      const field = form.elements.namedItem(name);
      return field && typeof field.value === 'string' ? field.value.trim() : '';
    };

    if (copyPhoneBtn) {
      copyPhoneBtn.addEventListener('click', () => {
        const phone = form.elements.namedItem('phone');
        const line = form.elements.namedItem('line');
        if (!phone || !line || typeof phone.value !== 'string') return;
        line.value = phone.value.trim();
        line.focus();
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const cfg = window.STARSHINE_CONFIG || {};
      const endpoint = cfg.formEndpoint || '';
      const payload = {
        name: fieldValue('name'),
        phone: fieldValue('phone'),
        lineId: fieldValue('line'),
        interest: fieldValue('interest'),
        source: cfg.formSource || 'starshine-pathway-cta',
        submittedAt: new Date().toISOString(),
        website: fieldValue('website'),
        userAgent: navigator.userAgent,
      };

      if (!endpoint) {
        if (window.location.protocol === 'file:') {
          showSuccess();
          return;
        }
        alert('表單尚未設定，請聯繫管理員。');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '送出中...';
      }
      if (error) error.textContent = '';

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok !== true) {
          throw new Error(result.message || '送出失敗，請稍後再試。');
        }

        showSuccess();
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitLabel;
        }
        showError(err.message || '送出失敗，請確認網路連線後再試一次。');
      }
    });
  }

  // bottom CTA visibility: hide while inside Hero or while #cta form section in view,
  // show in everything between. Simple scroll-driven check, no IO precedence bugs.
  const bottomCta = document.getElementById('bottomCta');
  const heroEl = document.getElementById('top');
  const ctaEl = document.getElementById('cta');
  // interactive selector rows the floating CTA must not cover (ch02 accordion, ch03 tabs, ch04 chips)
  const tapRows = document.querySelectorAll('#painAcc, .sb-tickets, .dhm-grid');

  function updateBottomCta() {
    if (!bottomCta || !heroEl || !ctaEl) return;
    const heroBottom = heroEl.getBoundingClientRect().bottom;
    const ctaRect = ctaEl.getBoundingClientRect();
    const vh = window.innerHeight;
    // hide while hero still occupies most of the screen
    const inHero = heroBottom > vh * 0.4;
    // hide while the form CTA section is showing
    const inFormCta = ctaRect.top < vh * 0.85 && ctaRect.bottom > vh * 0.15;
    // hide while an interactive selector row sits in the pill's bottom zone
    let inTapRow = false;
    for (let i = 0; i < tapRows.length; i++) {
      const r = tapRows[i].getBoundingClientRect();
      if (r.bottom > vh * 0.72 && r.top < vh) { inTapRow = true; break; }
    }
    bottomCta.classList.toggle('hide', inHero || inFormCta || inTapRow);
  }
  updateBottomCta();
  window.addEventListener('scroll', updateBottomCta, { passive: true });
  window.addEventListener('resize', updateBottomCta);
