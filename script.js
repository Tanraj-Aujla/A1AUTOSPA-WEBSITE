/* ============================================================
   A1 AUTO SPA — script.js
   ============================================================ */

/* ===========================
   STICKY HEADER
=========================== */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();


/* ===========================
   MOBILE NAV
=========================== */
(function initMobileNav() {
  const hamburger  = document.querySelector('.hamburger');
  const mobileNav  = document.getElementById('mobileNav');
  const navOverlay = document.getElementById('navOverlay');
  if (!hamburger || !mobileNav || !navOverlay) return;

  function toggleNav(open) {
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileNav.classList.toggle('open', open);
    navOverlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('open');
    toggleNav(!isOpen);
  });

  navOverlay.addEventListener('click', () => toggleNav(false));

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => toggleNav(false));
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
      toggleNav(false);
    }
  });
})();


/* ===========================
   SMOOTH SCROLL (offset for sticky header)
=========================== */
(function initSmoothScroll() {
  const header = document.getElementById('header');

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const headerH  = header ? header.offsetHeight : 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerH - 8;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
})();


/* ===========================
   HERO BACKGROUND — subtle Ken Burns
=========================== */
(function initHeroBg() {
  window.addEventListener('load', () => {
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) heroBg.classList.add('loaded');
  });
})();


/* ===========================
   BEFORE / AFTER COMPARISON SLIDER
=========================== */
(function initComparisonSliders() {
  document.querySelectorAll('.comparison-slider').forEach(slider => {
    const beforeWrap = slider.querySelector('.before-wrap');
    const divider    = slider.querySelector('.slider-divider');
    if (!beforeWrap || !divider) return;

    let isDragging = false;

    function setPosition(clientX) {
      const rect    = slider.getBoundingClientRect();
      let   percent = ((clientX - rect.left) / rect.width) * 100;
      percent = Math.max(2, Math.min(98, percent));

      // Clip the before image from the right so only [percent]% shows
      beforeWrap.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
      divider.style.left        = `${percent}%`;
    }

    // ---- Mouse events ----
    slider.addEventListener('mousedown', e => {
      isDragging = true;
      setPosition(e.clientX);
      e.preventDefault(); // prevent text selection while dragging
    });

    document.addEventListener('mousemove', e => {
      if (isDragging) setPosition(e.clientX);
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // ---- Touch events ----
    slider.addEventListener('touchstart', e => {
      isDragging = true;
      setPosition(e.touches[0].clientX);
    }, { passive: true });

    document.addEventListener('touchmove', e => {
      if (isDragging) setPosition(e.touches[0].clientX);
    }, { passive: true });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });

    // ---- Keyboard accessibility (arrow keys when handle is focused) ----
    const handle = slider.querySelector('.slider-handle');
    if (handle) {
      handle.setAttribute('tabindex', '0');
      handle.addEventListener('keydown', e => {
        const style   = getComputedStyle(beforeWrap);
        const clip    = style.clipPath; // e.g. "inset(0 45% 0 0)"
        const match   = clip.match(/inset\(0 ([\d.]+)%/);
        let   current = match ? 100 - parseFloat(match[1]) : 50;

        if (e.key === 'ArrowLeft')  current = Math.max(2,  current - 2);
        if (e.key === 'ArrowRight') current = Math.min(98, current + 2);

        beforeWrap.style.clipPath = `inset(0 ${100 - current}% 0 0)`;
        divider.style.left        = `${current}%`;
      });
    }
  });
})();


/* ===========================
   SCROLL FADE-IN ANIMATIONS
=========================== */
(function initScrollAnimations() {
  const targets = [
    '.section-header',
    '.service-card',
    '.comparison-slider',
    '.contact-info',
    '.form-wrap',
  ];

  const elements = document.querySelectorAll(targets.join(', '));

  // Add delay classes to service cards for staggered entrance
  document.querySelectorAll('.service-card').forEach((card, i) => {
    if (i < 4) card.classList.add(`delay-${i + 1}`);
  });

  elements.forEach(el => el.classList.add('fade-up'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -48px 0px',
  });

  elements.forEach(el => observer.observe(el));
})();


/* ===========================
   CALENDAR DATE + TIME PICKER
   Hours: 8:00 AM – 8:30 PM, every day
=========================== */
(function initCalendar() {
  const calGrid          = document.getElementById('calGrid');
  const calMonthLabel    = document.getElementById('calMonthLabel');
  const calPrev          = document.getElementById('calPrev');
  const calNext          = document.getElementById('calNext');
  const calTimes         = document.getElementById('calTimes');
  const dateInput        = document.getElementById('date');
  const timeInput        = document.getElementById('preferred_time');
  const calSelectedLabel = document.getElementById('calSelectedLabel');
  if (!calGrid) return;

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // Build 30-min slots: 8:00 to 20:30
  const SLOTS_24 = [];
  for (let h = 8; h <= 20; h++) {
    SLOTS_24.push(`${h}:00`);
    if (h < 20) SLOTS_24.push(`${h}:30`);
  }
  SLOTS_24.push('20:30'); // last slot

  function fmt12(t24) {
    const [h, m] = t24.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  let year     = new Date().getFullYear();
  let month    = new Date().getMonth();
  let selDate  = null; // 'YYYY-MM-DD'
  let selTime  = null; // '14:00'

  function renderCal() {
    const today    = new Date(); today.setHours(0,0,0,0);
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay  = new Date(year, month + 1, 0).getDate();

    calMonthLabel.textContent = `${MONTHS[month]} ${year}`;
    calGrid.innerHTML = '';

    // Empty leading cells
    for (let i = 0; i < firstDay; i++) {
      const e = document.createElement('button');
      e.type = 'button'; e.className = 'cal-day cal-day--empty'; e.disabled = true;
      calGrid.appendChild(e);
    }

    for (let d = 1; d <= lastDay; d++) {
      const date    = new Date(year, month, d);
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const btn     = document.createElement('button');
      btn.type = 'button';
      btn.textContent = d;

      let cls = 'cal-day';
      if (date < today)         cls += ' cal-day--disabled';
      if (date.getTime() === today.getTime()) cls += ' cal-day--today';
      if (selDate === dateStr)  cls += ' cal-day--selected';
      btn.className = cls;

      if (date >= today) {
        btn.addEventListener('click', () => {
          selDate = dateStr; selTime = null;
          if (dateInput)  dateInput.value = dateStr;
          if (timeInput)  timeInput.value = '';
          updateLabel();
          renderCal();
          renderSlots(date);
        });
      } else {
        btn.disabled = true;
      }
      calGrid.appendChild(btn);
    }
  }

  function renderSlots(dateObj) {
    calTimes.innerHTML = '';
    calTimes.classList.add('visible');

    const lbl = document.createElement('p');
    lbl.className   = 'cal-times-label';
    lbl.textContent = `${DAYS[dateObj.getDay()]}, ${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}`;
    calTimes.appendChild(lbl);

    const grid = document.createElement('div');
    grid.className = 'cal-slots';

    SLOTS_24.forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = fmt12(t);
      btn.className   = 'cal-slot' + (selTime === t ? ' cal-slot--selected' : '');
      btn.addEventListener('click', () => {
        selTime = t;
        if (timeInput) timeInput.value = t; // store as 24h for backend
        updateLabel();
        renderSlots(dateObj); // refresh selected state
      });
      grid.appendChild(btn);
    });

    calTimes.appendChild(grid);
  }

  function updateLabel() {
    if (!calSelectedLabel) return;
    if (selDate && selTime) {
      const d = new Date(selDate + 'T00:00:00');
      calSelectedLabel.textContent =
        `✓ ${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} at ${fmt12(selTime)}`;
    } else if (selDate) {
      calSelectedLabel.textContent = 'Now pick a time above';
    } else {
      calSelectedLabel.textContent = '';
    }
  }

  calPrev.addEventListener('click', () => {
    month--; if (month < 0) { month = 11; year--; } renderCal();
  });
  calNext.addEventListener('click', () => {
    month++; if (month > 11) { month = 0; year++; } renderCal();
  });

  renderCal();
})();


/* ===========================
   BOOKING FORM — fetch → Railway backend
=========================== */
(function initBookingForm() {
  const form      = document.querySelector('.booking-form');
  const submitBtn = form ? form.querySelector('[type="submit"]') : null;

  // TODO: Replace this with your Railway backend URL once deployed.
  // Example: 'https://a1-auto-spa-backend.up.railway.app'
  const BACKEND_URL = 'TODO_REPLACE_WITH_RAILWAY_URL';

  if (!form || !submitBtn) return;

  form.addEventListener('submit', async e => {
    e.preventDefault(); // we handle submission via fetch

    // Guard: warn if backend URL hasn't been set yet
    if (BACKEND_URL.startsWith('TODO')) {
      showFormMessage(
        'Backend not connected yet — set BACKEND_URL in script.js after deploying to Railway.',
        'error'
      );
      return;
    }

    // Validate date + time were selected via the calendar
    if (!form.preferred_date.value) {
      showFormMessage('Please select a date from the calendar.', 'error');
      return;
    }
    if (!form.preferred_time.value) {
      showFormMessage('Please select a time slot.', 'error');
      return;
    }

    // Collect form values
    const body = {
      name:    form.name.value.trim(),
      email:   form.email.value.trim(),
      phone:   form.phone.value.trim(),
      service: form.service.value,
      date:    form.preferred_date.value,
      time:    form.preferred_time.value, // 24h format, e.g. "14:00"
      message: form.message.value.trim(),
    };

    // Loading state
    const originalLabel   = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled    = true;

    try {
      const response = await fetch(`${BACKEND_URL}/api/book`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success — show confirmation and reset form
        showFormMessage(
          '✓ Booking request sent! We\'ll confirm your appointment within 24 hours.',
          'success'
        );
        form.reset();
      } else {
        showFormMessage(data.error || 'Something went wrong. Please call us directly.', 'error');
      }
    } catch (err) {
      // Network error (server down, CORS issue, etc.)
      showFormMessage(
        'Could not reach the server. Please call us at (249) 594-1313.',
        'error'
      );
    } finally {
      submitBtn.textContent = originalLabel;
      submitBtn.disabled    = false;
    }
  });

  function showFormMessage(text, type) {
    let msg = form.querySelector('.form-message');
    if (!msg) {
      msg = document.createElement('p');
      msg.className = 'form-message';
      msg.style.cssText = 'text-align:center;font-size:0.875rem;padding:12px 16px;border-radius:6px;margin-top:-4px;';
      form.appendChild(msg);
    }
    const isSuccess        = type === 'success';
    msg.textContent        = text;
    msg.style.color        = isSuccess ? '#6fcf6f' : '#e05c5c';
    msg.style.background   = isSuccess ? 'rgba(111,207,111,0.08)' : 'rgba(224,92,92,0.08)';
    msg.style.border       = `1px solid ${isSuccess ? 'rgba(111,207,111,0.25)' : 'rgba(224,92,92,0.25)'}`;
  }
})();
