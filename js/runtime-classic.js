
    /* deferred: React OriginalPage calls init after markup inject
    window.addEventListener('DOMContentLoaded', () => {
      initProgramArcEngine();
      initFunctionalDragHandleEngine();
    });
    */

    /* --- MORPHING NAV PILL: A SEAMLESS, CROSS-PAGE LOADER ---
       Spins for a genuine 3s on the current page first, then navigates.
       The loading state carries over to the destination page via
       sessionStorage so it keeps spinning there too, holding for another 3s
       once that page has actually fully loaded before collapsing. */
    let __pillRetry = null;
    let __networkPollTimer = null;
    let __onlineHandler = null;

    function stopNetworkWatch() {
      if (__networkPollTimer) {
        clearInterval(__networkPollTimer);
        __networkPollTimer = null;
      }
      if (__onlineHandler) {
        window.removeEventListener('online', __onlineHandler);
        __onlineHandler = null;
      }
    }

    function watchForNetworkRecovery(onBack) {
      stopNetworkWatch();
      __networkPollTimer = setInterval(() => {
        if (navigator.onLine) {
          stopNetworkWatch();
          onBack();
        }
      }, 2000);
      __onlineHandler = () => {
        stopNetworkWatch();
        onBack();
      };
      window.addEventListener('online', __onlineHandler, { once: true });
    }

    function closeMobileBottomSheetIfOpen() {
      const container = document.getElementById('mobileBottomSheet');
      if (!container) return;
      if (!container.classList.contains('pointer-events-none')) {
        toggleMobileBottomSheet();
      }
    }

    function hrefToSpaPath(href) {
      if (!href) return '/';
      let path = String(href).trim();
      if (path.startsWith('http://') || path.startsWith('https://')) {
        try { path = new URL(path).pathname; } catch (e) {}
      }
      if (path.endsWith('.html')) {
        path = path.replace(/\.html$/, '');
        const base = path.split('/').pop();
        if (base === 'index' || path === '' || path === '/index') return '/';
        if (!path.startsWith('/')) path = '/' + path;
        return path;
      }
      if (path === '' || path === 'index' || path === '/index') return '/';
      if (!path.startsWith('/')) path = '/' + path;
      return path;
    }

    function navigateWithPill(label, href) {
      const targetPath = hrefToSpaPath(href);
      const currentPath = (window.location.pathname || '/').replace(/\/$/, '') || '/';
      const normalizedCurrent = currentPath === '' ? '/' : currentPath;
      const isSamePage = normalizedCurrent === targetPath ||
        (targetPath === '/' && (normalizedCurrent === '/' || normalizedCurrent === ''));

      closeMobileBottomSheetIfOpen();

      const pillWrap = document.getElementById('morphingIndicatorPill');
      const labelText = document.getElementById('morphingIndicatorText');
      const sheetCloseDelay = 260;
      const preNavSpin = 600; // shorter in SPA; no full document load

      setTimeout(() => {
        if (pillWrap && labelText) {
          pillWrap.classList.remove('pill-error');
          labelText.innerText = label;
          pillWrap.classList.add('state-expanded');
        }

        if (isSamePage) {
          setTimeout(() => { if (pillWrap) pillWrap.classList.remove('state-expanded'); }, preNavSpin);
          return;
        }

        if (navigator && navigator.onLine === false) {
          setTimeout(() => {
            if (labelText) labelText.innerText = 'Check Your Network';
            if (pillWrap) pillWrap.classList.add('pill-error');
            __pillRetry = function () {
              stopNetworkWatch();
              if (pillWrap) pillWrap.classList.remove('pill-error');
              navigateWithPill(label, href);
            };
            watchForNetworkRecovery(__pillRetry);
          }, preNavSpin);
          return;
        }

        try {
          sessionStorage.setItem('pillNavLabel', label);
          sessionStorage.setItem('pillNavActive', '1');
        } catch (e) {}

        setTimeout(() => {
          // SPA navigation — do not full-reload .html files
          if (typeof window.__cgtiaNavigate === 'function') {
            window.__cgtiaNavigate(targetPath);
          } else {
            window.history.pushState({}, '', targetPath);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
          setTimeout(() => {
            if (pillWrap) pillWrap.classList.remove('state-expanded');
            try {
              sessionStorage.removeItem('pillNavActive');
              sessionStorage.removeItem('pillNavLabel');
            } catch (e) {}
          }, 400);
        }, preNavSpin);
      }, sheetCloseDelay);
    }

    function restoreArrivalPill() {
      let active = null, label = null;
      try {
        active = sessionStorage.getItem('pillNavActive');
        label = sessionStorage.getItem('pillNavLabel');
      } catch (e) {}
      if (!active) return;

      const pillWrap = document.getElementById('morphingIndicatorPill');
      const labelText = document.getElementById('morphingIndicatorText');
      if (!pillWrap || !labelText) return;

      const postNavHold = 3000;

      labelText.innerText = label || '';
      pillWrap.classList.remove('pill-error');
      pillWrap.classList.add('state-expanded');

      function settle() {
        setTimeout(() => {
          pillWrap.classList.remove('state-expanded');
          try {
            sessionStorage.removeItem('pillNavActive');
            sessionStorage.removeItem('pillNavLabel');
          } catch (e) {}
        }, postNavHold);
      }

      if (document.readyState === 'complete') {
        settle();
      } else {
        window.addEventListener('load', settle, { once: true });
      }
    }

    restoreArrivalPill();

    /* --- GLOBAL PILL LOADER ON EVERY INTERNAL LINK, SITE-WIDE --- */
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;
      if (link.target && link.target !== '' && link.target !== '_self') return;
      if (!href.endsWith('.html')) return;
      if (link.hasAttribute('data-no-pill')) return;

      e.preventDefault();
      const label = link.getAttribute('data-pill-label')
        || (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28)
        || 'Loading';
      navigateWithPill(label, href);
    });

    function retryPillNav() {
      if (__pillRetry) __pillRetry();
    }

    /* --- FORCE-RESET ALL OVERLAYS ON EVERY PAGE SHOW ---
       Fixes a stuck-open overlay (apply drawer, status/payment sheet, mobile
       sheet) reappearing with no way to close it when the page is restored
       from the browser's back/forward cache, since DOMContentLoaded doesn't
       fire again in that case but 'pageshow' does. */
    function resetAllOverlays() {
      const overlays = [
        { id: 'applyScreen', drawerId: 'applyDrawer' },
        { id: 'statusScreen', drawerId: 'statusDrawer' },
        { id: 'paymentScreen', drawerId: 'paymentDrawer' },
        { id: 'authScreen', drawerId: 'authDrawer' },
        { id: 'forgotPasswordScreen', drawerId: 'forgotPasswordDrawer' },
        { id: 'forcePasswordScreen', drawerId: 'forcePasswordDrawer' },
        { id: 'mobileBottomSheet', drawerId: 'bottomSheetDrawer' }
      ];
      overlays.forEach(({ id, drawerId }) => {
        const container = document.getElementById(id);
        if (!container) return;
        container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        const drawer = drawerId ? document.getElementById(drawerId) : null;
        if (drawer) {
          drawer.style.transform = '';
          drawer.style.opacity = '';
        }
      });
      document.body.style.overflow = '';
    }

    window.addEventListener('pageshow', resetAllOverlays);

    /* Force bottom sheet fully closed on load (no peek while scrolling) */
    function ensureMobileBottomSheetClosed() {
      var container = document.getElementById('mobileBottomSheet');
      var drawer = document.getElementById('bottomSheetDrawer');
      if (!container || !drawer) return;
      // Only force-close if it is already marked closed — never kill an open sheet
      if (!container.classList.contains('pointer-events-none')) return;
      container.style.background = 'transparent';
      container.style.backdropFilter = 'none';
      container.style.webkitBackdropFilter = 'none';
      container.style.visibility = 'hidden';
      drawer.style.transform = 'translateY(100vh)';
      drawer.style.pointerEvents = 'none';
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensureMobileBottomSheetClosed);
    } else {
      ensureMobileBottomSheetClosed();
    }

    /* --- BOTTOM SHEET & BACKGROUND OVERSCROLL LOCK MECHANICS --- */
    function toggleMobileBottomSheet() {
      const container = document.getElementById('mobileBottomSheet');
      const drawer = document.getElementById('bottomSheetDrawer');
      if (!container || !drawer) return;
      
      if (container.classList.contains('pointer-events-none')) {
        // OPEN
        container.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        container.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        container.style.background = '';
        container.style.backdropFilter = '';
        container.style.webkitBackdropFilter = '';
        container.style.visibility = 'visible';
        container.style.pointerEvents = 'auto';
        drawer.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        drawer.style.transform = 'translateY(0)';
        drawer.style.pointerEvents = 'auto';  // critical: clear any leftover none from close/nav
        document.body.style.overflow = 'hidden';
      } else {
        // CLOSE
        container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        container.style.background = 'transparent';
        container.style.backdropFilter = 'none';
        container.style.webkitBackdropFilter = 'none';
        container.style.visibility = 'hidden';
        container.style.pointerEvents = 'none';
        drawer.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        drawer.style.transform = 'translateY(100vh)';
        drawer.style.pointerEvents = 'none';
        document.body.style.overflow = '';
      }
    }

    window.toggleMobileBottomSheet = toggleMobileBottomSheet;
    window.ensureMobileBottomSheetClosed = ensureMobileBottomSheetClosed;

    /* --- GESTURE POINTER-EVENT ENGINE FOR DRAG HANDLE --- */
    function initFunctionalDragHandleEngine() {
      const handle = document.getElementById('dragHandleWrapper');
      const drawer = document.getElementById('bottomSheetDrawer');
      let isDragging = false;
      let startY = 0;
      let currentTranslationY = 0;

      handle.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startY = e.clientY;
        drawer.style.transition = 'none';
        handle.setPointerCapture(e.pointerId);
      });

      handle.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        if (deltaY > 0) {
          currentTranslationY = deltaY;
          drawer.style.transform = `translateY(${deltaY}px)`;
        }
      });

      handle.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        drawer.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        handle.releasePointerCapture(e.pointerId);

        if (currentTranslationY > 110) {
          toggleMobileBottomSheet();
          setTimeout(() => { drawer.style.transform = ''; }, 500);
        } else {
          drawer.style.transform = 'translateY(0)';
        }
        currentTranslationY = 0;
      });
    }

    /* --- 3D ARC CAROUSEL MECHANICAL ENGINE --- */
    let activeArcIndex = 1; 
    const totalArcCards = 4;

    function initProgramArcEngine() {
      if (!document.querySelector('.program-arc-track') && !document.querySelector('.program-card-node')) return;
      try {
        buildArcIndicators();
        updateArcLayout();
        setupArcInteraction();
      } catch (e) { console.warn('initProgramArcEngine', e); }
    }

    function buildArcIndicators() {
      if (!document.querySelector('.program-arc-track') && !document.querySelector('.program-card-node')) return;
      const dotsContainer = document.getElementById('arc-dots');
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalArcCards; i++) {
        const dot = document.createElement('div');
        dot.className = 'h-1.5 rounded-full transition-all duration-500 ' + (i === activeArcIndex ? 'w-6 bg-blue-950' : 'w-1.5 bg-slate-300');
        dot.setAttribute('data-dot-index', i);
        dotsContainer.appendChild(dot);
      }
    }

    function updateArcLayout() {
      const cards = document.querySelectorAll('.program-card-node');
      cards.forEach((card) => {
        const idx = parseInt(card.getAttribute('data-p-index'));
        card.className = 'program-card-node absolute w-[280px] sm:w-[360px] h-[240px] md:h-[280px] soft-component-card rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between cursor-pointer border border-white/60 shadow-xl';
        
        if (idx === activeArcIndex) card.classList.add('state-center');
        else if (idx === activeArcIndex - 1) card.classList.add('state-left-prev');
        else if (idx === activeArcIndex + 1) card.classList.add('state-right-next');
        else if (idx < activeArcIndex) card.classList.add('state-stowed-left');
        else if (idx > activeArcIndex) card.classList.add('state-stowed-right');
      });

      const dots = document.querySelectorAll('[data-dot-index]');
      dots.forEach((dot) => {
        dot.className = parseInt(dot.getAttribute('data-dot-index')) === activeArcIndex 
          ? 'h-1.5 w-6 bg-blue-950 rounded-full transition-all duration-500' 
          : 'h-1.5 w-1.5 bg-slate-300 rounded-full transition-all duration-500';
      });
    }

    function setupArcInteraction() {
      document.querySelectorAll('.program-card-node').forEach((card) => {
        card.addEventListener('click', () => {
          const targetIndex = parseInt(card.getAttribute('data-p-index'));
          if (targetIndex !== activeArcIndex) {
            activeArcIndex = targetIndex;
            updateArcLayout();
          }
        });
      });
    }

    function shiftArcLeft() { if (activeArcIndex > 0) { activeArcIndex--; updateArcLayout(); } }

    /* --- PEEL GALLERY: click/tap-driven (authoritative on all devices,
       since iOS Safari doesn't reliably trigger :hover on tap) --- */
    function setPeelActive(card) {
      const container = card.closest('.peel-gallery-container');
      if (!container) return;
      const wasActive = card.classList.contains('peel-active');
      container.querySelectorAll('.peel-card').forEach((c) => c.classList.remove('peel-active'));
      if (!wasActive) {
        card.classList.add('peel-active');
      }
    }

    /* --- TESTIMONIALS: prev/next tap controls for the swipe carousel --- */
    function shiftTestimonial(direction) {
      const container = document.getElementById('testimonialsScroll');
      if (!container) return;
      const card = container.querySelector('.snap-center');
      const cardWidth = card ? card.getBoundingClientRect().width + 32 : 400;
      container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
    }
    function shiftArcRight() { if (activeArcIndex < totalArcCards - 1) { activeArcIndex++; updateArcLayout(); } }

    /* --- APPLY SCREEN OVERLAY MECHANICS --- */
    function setSheetOpen(containerId, drawerId, open) {
      const container = document.getElementById(containerId);
      const drawer = drawerId ? document.getElementById(drawerId) : null;
      if (!container) return;
      if (open) {
        container.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        container.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        container.style.pointerEvents = 'auto';
        container.style.visibility = 'visible';
        if (drawer) {
          drawer.style.transform = 'translateY(0)';
          drawer.style.opacity = '1';
          drawer.style.pointerEvents = 'auto';
        }
        document.body.style.overflow = 'hidden';
      } else {
        container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        container.style.pointerEvents = 'none';
        if (drawer) {
          drawer.style.transform = '';
          drawer.style.opacity = '';
          drawer.style.pointerEvents = '';
        }
        document.body.style.overflow = '';
      }
    }

    function toggleApplyScreen() {
      const container = document.getElementById('applyScreen');
      if (!container) return;
      const isClosed = container.classList.contains('pointer-events-none') ||
        container.style.pointerEvents === 'none';
      setSheetOpen('applyScreen', 'applyDrawer', isClosed);
    }

    function closeApplyScreen() {
      setSheetOpen('applyScreen', 'applyDrawer', false);
    }

    /* Click dimmed backdrop (not the drawer) to close Apply on desktop */
    document.addEventListener('click', function (e) {
      const screen = document.getElementById('applyScreen');
      if (!screen || screen.classList.contains('pointer-events-none')) return;
      if (e.target === screen) {
        closeApplyScreen();
      }
    }, true);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeApplyScreen();
        if (typeof closePaymentScreen === 'function') try { closePaymentScreen(); } catch (err) {}
        if (typeof closeStatusScreen === 'function') try { closeStatusScreen(); } catch (err) {}
        if (typeof toggleAuthScreen === 'function') {
          const auth = document.getElementById('authScreen');
          if (auth && !auth.classList.contains('pointer-events-none')) {
            try { toggleAuthScreen(); } catch (err) {}
          }
        }
      }
    });


    /* --- SUBMISSION STATUS BOTTOM SHEET MECHANICS --- */
    function openStatusScreen() {
      const container = document.getElementById('statusScreen');
      const drawer = document.getElementById('statusDrawer');
      container.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      container.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      drawer.style.transform = 'translateY(0)';
      drawer.style.opacity = '1';
      document.body.style.overflow = 'hidden';
    }

    function closeStatusScreen() {
      const container = document.getElementById('statusScreen');
      const drawer = document.getElementById('statusDrawer');
      container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      drawer.style.transform = '';
      drawer.style.opacity = '';
      document.body.style.overflow = '';

      const form = document.getElementById('applyForm');
      if (form) {
        form.reset();
        Array.from(form.querySelectorAll('input, select, textarea, button')).forEach(el => el.disabled = false);
      }
    }

    function setStatusLoading() {
      document.getElementById('statusIconWrap').className = 'w-20 h-20 rounded-full flex items-center justify-center my-4 bg-blue-50';
      document.getElementById('statusIconWrap').innerHTML =
        '<svg class="status-spinner-ring w-8 h-8 text-blue-900" viewBox="0 0 24 24" fill="none">' +
        '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-opacity="0.15"/>' +
        '<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>';
      document.getElementById('statusTitle').innerText = 'Sending your application\u2026';
      document.getElementById('statusMessage').innerText = 'Please hold on while we submit your details to admissions.';
      document.getElementById('statusActionBtn').classList.add('hidden');
    }

    function setStatusSuccess(title, message) {
      const wrap = document.getElementById('statusIconWrap');
      wrap.className = 'status-icon-pop w-20 h-20 rounded-full flex items-center justify-center my-4 bg-emerald-50';
      wrap.innerHTML =
        '<svg class="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none">' +
        '<path class="status-check-path" d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
      document.getElementById('statusTitle').innerText = title || 'Application received';
      document.getElementById('statusMessage').innerText = message || 'Thank you \u2014 your application is in. Our admissions team will reach out to you shortly.';
      const btn = document.getElementById('statusActionBtn');
      btn.innerText = 'Done';
      btn.className = 'w-full py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition';
      btn.onclick = closeStatusScreen;
    }

    function setStatusError(title, message, onRetry) {
      const wrap = document.getElementById('statusIconWrap');
      wrap.className = 'status-icon-pop w-20 h-20 rounded-full flex items-center justify-center my-4 bg-red-50';
      wrap.innerHTML =
        '<svg class="w-9 h-9 text-red-600" viewBox="0 0 24 24" fill="none">' +
        '<path class="status-cross-path" d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
        '</svg>';
      document.getElementById('statusTitle').innerText = title || 'Submission Failed';
      document.getElementById('statusMessage').innerText = message || 'Something went wrong and your application didn\u2019t go through. Please try again.';
      const btn = document.getElementById('statusActionBtn');
      btn.innerText = 'Try Again';
      btn.className = 'w-full py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition';
      btn.onclick = onRetry || function () {
        closeStatusScreen();
        setTimeout(() => { toggleApplyScreen(); }, 450);
      };
    }

    /* --- PROGRAM DATA: fixed cohort start dates & pricing --- */
    const PROGRAM_INFO = {
      'certificate':     { name: 'CGTIA Certificate',     startDate: 'Monday, 4 August 2026',    amount: 300000 },
      'diploma':         { name: 'CGTIA Diploma',         startDate: 'Monday, 1 September 2026', amount: 350000 },
      'higher-diploma':  { name: 'CGTIA Higher Diploma',  startDate: 'Tuesday, 6 October 2026',   amount: 400000 },
      'licensing':       { name: 'Licensing',             startDate: null, amount: 150000 }
    };

    function handleProgramChange() {
      const sel = document.getElementById('programSelect');
      const display = document.getElementById('startDateDisplay');
      const val = sel.value;

      if (val === 'licensing') {
        ((typeof window.__cgtiaNavigate==='function')?window.__cgtiaNavigate('licensing.html'):(window.location.href='licensing.html'));
        return;
      }

      const info = PROGRAM_INFO[val];
      if (info && info.startDate) {
        display.innerText = info.startDate;
        display.classList.remove('text-slate-400');
        display.classList.add('text-blue-950', 'font-semibold');
      } else {
        display.innerText = 'Select a program to see its fixed start date';
        display.classList.add('text-slate-400');
        display.classList.remove('text-blue-950', 'font-semibold');
      }
    }

    /* Real handleApplySubmit (writing to Firestore) lives in the Firebase
       integration script included below. */

    /* --- PAYMENT SHEET MECHANICS (Paystack: transfer preferred, card available) --- */
    let __currentPaymentProgram = null;
    let __currentPaymentEmail = '';
    let __paymentPlan = 'full';
    let __installmentAmounts = [0, 0, 0];

    function formatNaira(n) {
      return '\u20a6' + Math.round(n).toLocaleString('en-NG');
    }

    // Bridge for the Firebase integration script (type="module", isolated
    // scope) to read the payment state chosen here.
    function getPaymentState() {
      return {
        plan: __paymentPlan,
        installmentAmounts: __installmentAmounts,
        program: __currentPaymentProgram,
        email: __currentPaymentEmail
      };
    }

    async function openPaymentScreen(programKey, applicantEmail) {
      try { if (window.ensurePaystack) window.ensurePaystack(); } catch (e) {}
      __currentPaymentProgram = Object.assign({}, PROGRAM_INFO[programKey] || { name: 'CGTIA Program', amount: 0 });
      __currentPaymentEmail = applicantEmail || '';

      // Live base price from Firebase programs (if available)
      try {
        if (window.__cgtiaGetProgramPricing) {
          var live = await window.__cgtiaGetProgramPricing(programKey);
          if (live && live.amount) {
            __currentPaymentProgram.amount = Number(live.amount) || __currentPaymentProgram.amount;
            if (live.name) __currentPaymentProgram.name = live.name;
          }
        }
      } catch (e) {}

      // Active promotion (e.g. 100k offer) overrides amount when program matches
      try {
        var codeEl = document.getElementById('promoCodeInput');
        var codeVal = codeEl ? codeEl.value : '';
        var promo = null;
        if (window.__cgtiaMatchPromo) {
          promo = window.__cgtiaMatchPromo(programKey, codeVal);
        } else if (window.__cgtiaGetActivePromotion) {
          promo = await window.__cgtiaGetActivePromotion(programKey);
        }
        if (promo && promo.promoAmount) {
          __currentPaymentProgram.amount = Number(promo.promoAmount);
          __currentPaymentProgram.promoTitle = promo.title || promo.badge || 'Special offer';
        }
      } catch (e) {}

      document.getElementById('transferProgramDisplay').innerText = __currentPaymentProgram.name + (__currentPaymentProgram.promoTitle ? ' · ' + __currentPaymentProgram.promoTitle : '');
      document.getElementById('cardProgramDisplay').innerText = __currentPaymentProgram.name + (__currentPaymentProgram.promoTitle ? ' · ' + __currentPaymentProgram.promoTitle : '');

      // Split evenly into 3, with any remainder absorbed by the 3rd
      // installment so the three amounts always add up exactly to the total.
      const total = __currentPaymentProgram.amount || 0;
      var maxInst = Number(__currentPaymentProgram.installmentsMax || 3);
      if (maxInst < 1) maxInst = 1;
      if (maxInst > 3) maxInst = 3;
      __currentPaymentProgram.installmentsMax = maxInst;
      var instBtn = document.getElementById('planInstallmentBtn');
      if (instBtn) {
        if (maxInst <= 1) {
          instBtn.style.display = 'none';
          if (typeof switchPaymentPlan === 'function') switchPaymentPlan('full');
        } else {
          instBtn.style.display = '';
          instBtn.textContent = maxInst + ' Installments';
        }
      }
      var n = maxInst;
      var parts = [];
      var base = Math.floor(total / n);
      var rem = total - base * n;
      for (var i = 0; i < n; i++) parts.push(base + (i === n - 1 ? rem : 0));
      while (parts.length < 3) parts.push(0);
      __installmentAmounts = parts;
      var el1 = document.getElementById('installment1Amount');
      var el2 = document.getElementById('installment2Amount');
      var el3 = document.getElementById('installment3Amount');
      if (el1) el1.innerText = formatNaira(parts[0] || 0);
      if (el2) {
        el2.innerText = formatNaira(parts[1] || 0);
        el2.parentElement.style.display = n >= 2 ? '' : 'none';
      }
      if (el3) {
        el3.innerText = formatNaira(parts[2] || 0);
        el3.parentElement.style.display = n >= 3 ? '' : 'none';
      }

      switchPaymentPlan('full');
      switchPaymentTab('transfer');

      const container = document.getElementById('paymentScreen');
      const drawer = document.getElementById('paymentDrawer');
      container.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      container.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      container.style.pointerEvents = 'auto';
      container.style.visibility = 'visible';
      drawer.style.transform = 'translateY(0)';
      drawer.style.opacity = '1';
      drawer.style.pointerEvents = 'auto';
      document.body.style.overflow = 'hidden';
    }

    function closePaymentScreen() {
      const container = document.getElementById('paymentScreen');
      const drawer = document.getElementById('paymentDrawer');
      container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      container.style.pointerEvents = 'none';
      drawer.style.transform = '';
      drawer.style.opacity = '';
      drawer.style.pointerEvents = '';
      document.body.style.overflow = '';
    }

    function switchPaymentPlan(plan) {
      __paymentPlan = plan;
      const fullBtn = document.getElementById('planFullBtn');
      const instBtn = document.getElementById('planInstallmentBtn');
      const breakdown = document.getElementById('installmentBreakdown');
      const note = document.getElementById('installmentNote');
      const activeClass = 'flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white text-blue-950 shadow-sm smooth-transition';
      const inactiveClass = 'flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-500 smooth-transition';

      fullBtn.className = plan === 'full' ? activeClass : inactiveClass;
      instBtn.className = plan === 'installment' ? activeClass : inactiveClass;
      breakdown.classList.toggle('hidden', plan !== 'installment');
      note.classList.toggle('hidden', plan !== 'installment');

      const amountDueNow = plan === 'installment'
        ? __installmentAmounts[0]
        : (__currentPaymentProgram ? __currentPaymentProgram.amount : 0);
      const formatted = formatNaira(amountDueNow);
      document.getElementById('transferAmountDisplay').innerText = formatted;
      document.getElementById('cardAmountDisplay').innerText = formatted;
    }

    function switchPaymentTab(tab) {
      const transferBtn = document.getElementById('tabTransferBtn');
      const cardBtn = document.getElementById('tabCardBtn');
      const transferPane = document.getElementById('transferPane');
      const cardPane = document.getElementById('cardPane');
      if (tab === 'card') {
        cardBtn.className = 'flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white text-blue-950 shadow-sm smooth-transition';
        transferBtn.className = 'flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-500 smooth-transition';
        cardPane.classList.remove('hidden');
        transferPane.classList.add('hidden');
      } else {
        transferBtn.className = 'flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white text-blue-950 shadow-sm smooth-transition';
        cardBtn.className = 'flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-500 smooth-transition';
        transferPane.classList.remove('hidden');
        cardPane.classList.add('hidden');
        if (typeof window.ensureVirtualAccount === 'function') {
          window.ensureVirtualAccount();
        }
      }
    }

    function copyFieldValue(fieldId, btnId) {
      const text = document.getElementById(fieldId).innerText;
      const btn = document.getElementById(btnId);
      const originalLabel = 'Copy';
      const finish = () => { btn.innerText = 'Copied'; setTimeout(() => { btn.innerText = originalLabel; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(finish).catch(finish);
      } else {
        finish();
      }
    }

    /* Real handleTransferConfirm and payWithPaystackCard (writing to
       Firestore, real Paystack reference wiring) live in the Firebase
       integration script included below. */


        /* --- SIGN IN OVERLAY MECHANICS --- */
    function toggleAuthScreen() {
      const container = document.getElementById('authScreen');
      const drawer = document.getElementById('authDrawer');
      const isClosed = container.classList.contains('pointer-events-none');

      if (isClosed) {
        container.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        container.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        drawer.style.transform = 'translateY(0)';
        drawer.style.opacity = '1';
        document.body.style.overflow = 'hidden';
        const errorEl = document.getElementById('authErrorMsg');
        if (errorEl) errorEl.classList.add('hidden');
      } else {
        container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        drawer.style.transform = '';
        drawer.style.opacity = '';
        document.body.style.overflow = '';
      }
    }

    /* Real handleAuthSubmit (Firebase Auth sign-in) lives in the Firebase
       integration script included below. */

  


/* Expose handlers for original onclick attributes + SPA navigation */
window.toggleApplyScreen = typeof toggleApplyScreen === "function" ? toggleApplyScreen : window.toggleApplyScreen;
window.toggleAuthScreen = typeof toggleAuthScreen === "function" ? toggleAuthScreen : function(){};
window.toggleMobileBottomSheet = typeof toggleMobileBottomSheet === "function" ? toggleMobileBottomSheet : function(){};
window.retryPillNav = typeof retryPillNav === "function" ? retryPillNav : function(){};
window.setPeelActive = typeof setPeelActive === "function" ? setPeelActive : function(){};
window.shiftArcLeft = function(){ if (typeof shiftArcLeft === "function") shiftArcLeft(); };
window.shiftArcRight = function(){ if (typeof shiftArcRight === "function") shiftArcRight(); };
window.shiftTestimonial = function(d){ if (typeof shiftTestimonial === "function") shiftTestimonial(d); };
window.initProgramArcEngine = typeof initProgramArcEngine === "function" ? initProgramArcEngine : function(){};
window.initFunctionalDragHandleEngine = typeof initFunctionalDragHandleEngine === "function" ? initFunctionalDragHandleEngine : function(){};
window.handleProgramChange = typeof handleProgramChange === "function" ? handleProgramChange : function(){};
window.openPaymentScreen = typeof openPaymentScreen === "function" ? openPaymentScreen : function(){};
window.closePaymentScreen = typeof closePaymentScreen === "function" ? closePaymentScreen : function(){};
window.closeStatusScreen = typeof closeStatusScreen === "function" ? closeStatusScreen : function(){};
window.openStatusScreen = typeof openStatusScreen === "function" ? openStatusScreen : function(){};
window.restoreArrivalPill = typeof restoreArrivalPill === "function" ? restoreArrivalPill : function(){};

function __cgtiaHrefToPath(href) {
  if (!href) return "/";
  var path = String(href).trim();
  if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) {
    try { path = new URL(path).pathname; } catch (e) {}
  }
  if (path.indexOf("#") === 0) return path;
  if (/\.html$/i.test(path)) {
    path = path.replace(/\.html$/i, "");
    var base = path.split("/").pop();
    if (base === "index" || path === "" || path === "/index") return "/";
    if (path.charAt(0) !== "/") path = "/" + path;
    return path;
  }
  if (path === "" || path === "index" || path === "/index") return "/";
  if (path.charAt(0) !== "/") path = "/" + path;
  return path;
}

/**
 * Morphing pill page transition (original behaviour) + SPA routing.
 * Called from bottom sheet, CTAs, and anywhere onclick="navigateWithPill(...)" is used.
 */
window.navigateWithPill = function(label, href) {
  try {
    var targetPath = __cgtiaHrefToPath(href);
    var currentPath = (window.location.pathname || "/").replace(/\/$/, "") || "/";
    if (currentPath === "") currentPath = "/";
    var isSame = (currentPath === targetPath) || (targetPath === "/" && (currentPath === "/" || currentPath === ""));

    // Close bottom sheet if open
    try {
      if (typeof closeMobileBottomSheetIfOpen === "function") closeMobileBottomSheetIfOpen();
      else if (typeof window.toggleMobileBottomSheet === "function") {
        var sheet = document.getElementById("mobileBottomSheet");
        if (sheet && !sheet.classList.contains("pointer-events-none")) {
          window.toggleMobileBottomSheet();
        }
      }
    } catch (e) {}

    var pillWrap = document.getElementById("morphingIndicatorPill");
    var labelText = document.getElementById("morphingIndicatorText");
    var sheetCloseDelay = 280;
    var preNavSpin = 1800; // original-style loading hold before route change

    setTimeout(function() {
      if (pillWrap && labelText) {
        pillWrap.classList.remove("pill-error");
        labelText.innerText = label || "Loading";
        pillWrap.classList.add("state-expanded");
      }

      if (isSame) {
        setTimeout(function() {
          if (pillWrap) pillWrap.classList.remove("state-expanded");
        }, preNavSpin);
        return;
      }

      if (navigator && navigator.onLine === false) {
        setTimeout(function() {
          if (labelText) labelText.innerText = "Check Your Network";
          if (pillWrap) pillWrap.classList.add("pill-error");
        }, preNavSpin);
        return;
      }

      try {
        sessionStorage.setItem("pillNavLabel", label || "");
        sessionStorage.setItem("pillNavActive", "1");
      } catch (e) {}

      setTimeout(function() {
        if (typeof window.__cgtiaNavigate === "function") {
          window.__cgtiaNavigate(targetPath);
        } else {
          window.history.pushState({}, "", targetPath);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }, preNavSpin);
    }, sheetCloseDelay);
  } catch (err) {
    console.error("navigateWithPill error", err);
    // Hard fallback
    var fallback = __cgtiaHrefToPath(href);
    if (typeof window.__cgtiaNavigate === "function") window.__cgtiaNavigate(fallback);
    else window.location.href = fallback;
  }
};

/**
 * Event delegation backup for bottom-sheet / pill navigation.
 * Works even if inline onclick is blocked by the WebView.
 */
(function bindPillNavDelegation() {
  if (window.__cgtiaPillDelegationBound) return;
  window.__cgtiaPillDelegationBound = true;

  document.addEventListener("click", function(e) {
    var el = e.target;
    if (!el) return;

    // Walk up for an element that looks like a sheet nav row or has navigateWithPill in onclick
    var node = el;
    for (var i = 0; i < 6 && node && node !== document; i++, node = node.parentElement) {
      if (!node.getAttribute) continue;
      var oc = node.getAttribute("onclick") || "";
      if (oc.indexOf("navigateWithPill") !== -1) {
        // Parse navigateWithPill('Label', 'path')
        var m = oc.match(/navigateWithPill\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
        if (m) {
          e.preventDefault();
          e.stopPropagation();
          window.navigateWithPill(m[1], m[2]);
          return;
        }
      }
      // data-pill-nav="About|/about" optional future
      var data = node.getAttribute("data-pill-nav");
      if (data && data.indexOf("|") !== -1) {
        var parts = data.split("|");
        e.preventDefault();
        e.stopPropagation();
        window.navigateWithPill(parts[0], parts[1]);
        return;
      }
    }
  }, true);
})();

/* ---- Paystack: load only when Apply / Payment needs it ---- */
window.ensurePaystack = function ensurePaystack() {
  return new Promise(function (resolve, reject) {
    if (window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }
    if (window.__paystackLoading) {
      window.__paystackLoading.then(resolve).catch(reject);
      return;
    }
    window.__paystackLoading = new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.async = true;
      s.onload = function () { res(window.PaystackPop); };
      s.onerror = function () { rej(new Error("Paystack failed to load")); };
      document.head.appendChild(s);
    });
    window.__paystackLoading.then(resolve).catch(reject);
  });
};

// Definitive window bindings (desktop + mobile)
window.setSheetOpen = typeof setSheetOpen === "function" ? setSheetOpen : window.setSheetOpen;
window.closeApplyScreen = typeof closeApplyScreen === "function" ? closeApplyScreen : function () {
  if (typeof setSheetOpen === "function") setSheetOpen("applyScreen", "applyDrawer", false);
};
window.toggleApplyScreen = function () {
  try {
    var container = document.getElementById("applyScreen");
    // Never leave the current page for Apply — only open the overlay form
    if (!container) {
      console.warn("[cgtia] applyScreen missing on this view");
      return;
    }
    var opening = container.classList.contains("pointer-events-none") || container.style.pointerEvents === "none";
    if (opening) {
      try { if (window.ensurePaystack) window.ensurePaystack(); } catch (e) {}
    }
    if (typeof setSheetOpen === "function") {
      setSheetOpen("applyScreen", "applyDrawer", opening);
      return;
    }
    // fallback
    if (container) {
      if (opening) {
        container.classList.remove("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
        container.classList.add("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
        container.style.pointerEvents = "auto";
        var drawer = document.getElementById("applyDrawer");
        if (drawer) { drawer.style.transform = "translateY(0)"; drawer.style.opacity = "1"; drawer.style.pointerEvents = "auto"; }
        document.body.style.overflow = "hidden";
      } else {
        container.classList.add("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
        container.classList.remove("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
        container.style.pointerEvents = "none";
        var drawer2 = document.getElementById("applyDrawer");
        if (drawer2) { drawer2.style.transform = ""; drawer2.style.opacity = ""; }
        document.body.style.overflow = "";
      }
    }
  } catch (err) {
    console.error("toggleApplyScreen", err);
  }
};





/* --- GALLERY: filter + lightbox --- */
function filterGallery(category) {
  const items = document.querySelectorAll(".masonry-item");
  let visibleCount = 0;
  items.forEach((item) => {
    const cat = item.getAttribute("data-category");
    const show = (category === "all" || cat === category);
    item.classList.toggle("gallery-filtered-out", !show);
    if (show) visibleCount++;
  });
  document.querySelectorAll(".gallery-filter-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-filter-btn") === category;
    btn.className = isActive
      ? "gallery-filter-btn shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-950 text-white"
      : "gallery-filter-btn shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-white text-slate-600 border border-slate-200";
  });
  const emptyState = document.getElementById("galleryEmptyState");
  if (emptyState) emptyState.classList.toggle("hidden", visibleCount > 0);
}

function openLightbox(type, src, caption) {
  const overlay = document.getElementById("lightboxOverlay");
  const wrap = document.getElementById("lightboxMediaWrap");
  const cap = document.getElementById("lightboxCaption");
  if (!overlay || !wrap) return;
  wrap.innerHTML = "";
  if (type === "video") {
    const v = document.createElement("video");
    v.src = src;
    v.controls = true;
    v.autoplay = true;
    v.loop = true;
    v.playsInline = true;
    v.className = "max-w-full max-h-[75vh]";
    wrap.appendChild(v);
  } else {
    const img = document.createElement("img");
    img.src = src;
    img.alt = caption || "";
    img.className = "max-w-full max-h-[75vh] object-contain";
    wrap.appendChild(img);
  }
  if (cap) cap.innerText = caption || "";
  overlay.classList.remove("lightbox-hidden");
  overlay.classList.add("lightbox-visible");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const overlay = document.getElementById("lightboxOverlay");
  if (!overlay) return;
  overlay.classList.remove("lightbox-visible");
  overlay.classList.add("lightbox-hidden");
  document.body.style.overflow = "";
  setTimeout(() => {
    const wrap = document.getElementById("lightboxMediaWrap");
    if (wrap) wrap.innerHTML = "";
  }, 350);
}

function closeLightboxOnBackdrop(event) {
  if (event && event.target && event.target.id === "lightboxOverlay") {
    closeLightbox();
  }
}

window.filterGallery = filterGallery;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.closeLightboxOnBackdrop = closeLightboxOnBackdrop;


/* =========================================================================
   APPLY → FIREBASE (if available) → WHATSAPP → PAYMENT
   Resume incomplete payments via localStorage (not IP)
   ========================================================================= */
window.CGTIA_WHATSAPP_NUMBER = window.CGTIA_WHATSAPP_NUMBER || "2349164712004";
window.CGTIA_PAYSTACK_PUBLIC_KEY = window.CGTIA_PAYSTACK_PUBLIC_KEY || "pk_test_d5e8813de6f1b2a281dd55d6aa71211acaa2e2b4";

var PENDING_PAYMENT_KEY = "cgtia_pending_payment";

function savePendingPayment(payload) {
  try {
    localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(Object.assign({ savedAt: Date.now() }, payload)));
  } catch (e) {}
}

function getPendingPayment() {
  try {
    var raw = localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;
    var data = JSON.parse(raw);
    // Expire after 14 days
    if (data.savedAt && Date.now() - data.savedAt > 14 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_PAYMENT_KEY);
      return null;
    }
    if (data.paymentStatus === "paid") return null;
    return data;
  } catch (e) {
    return null;
  }
}

function clearPendingPayment() {
  try { localStorage.removeItem(PENDING_PAYMENT_KEY); } catch (e) {}
}

function notifyWhatsAppApplication(app) {
  try {
    var num = String(window.CGTIA_WHATSAPP_NUMBER || "").replace(/\D/g, "");
    if (!num) return;
    var text =
      "New CGTIA Application%0A" +
      "Name: " + encodeURIComponent(app.fullName || "") + "%0A" +
      "Phone: " + encodeURIComponent(app.phone || "") + "%0A" +
      "Email: " + encodeURIComponent(app.email || "") + "%0A" +
      "Program: " + encodeURIComponent(app.program || "") + "%0A" +
      "Start: " + encodeURIComponent(app.startDate || "") + "%0A" +
      "Note: " + encodeURIComponent(app.message || "");
    // Open in a new tab so the applicant still sees payment UI
    window.open("https://wa.me/" + num + "?text=" + text, "_blank", "noopener");
  } catch (e) {
    console.warn("WhatsApp notify failed", e);
  }
}

async function persistApplicationToFirebase(app) {
  try {
    // Lazy-load Firebase same as module path
    var appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    var fsMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    var firebaseConfig = {
      apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
      authDomain: "verify-cgtia-cert.firebaseapp.com",
      projectId: "verify-cgtia-cert",
      storageBucket: "verify-cgtia-cert.firebasestorage.app",
      messagingSenderId: "766655761701",
      appId: "1:766655761701:web:45f559e0e38023439b5ecc"
    };
    var fbApp = appMod.getApps && appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
    var db = fsMod.getFirestore(fbApp);
    var id = String(app.email || "").trim().toLowerCase();
    if (!id) throw new Error("missing email");
    var payload = {
      fullName: app.fullName || "",
      phone: app.phone || "",
      email: id,
      program: app.program || "",
      startDate: app.startDate || "",
      message: app.message || "",
      status: "pending",
      paymentStatus: "unpaid",
      paymentPlan: (typeof __paymentPlan !== "undefined" ? __paymentPlan : "full"),
      installmentsTotal: (typeof __paymentPlan !== "undefined" && __paymentPlan === "installment")
        ? Math.min(3, Math.max(2, Number((__currentPaymentProgram && __currentPaymentProgram.installmentsMax) || 3)))
        : 1,
      installmentsPaid: 0,
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp()
    };
    if (app.resumeToken) payload.resumeToken = app.resumeToken;
    try {
      await fsMod.setDoc(fsMod.doc(db, "applications", id), payload);
    } catch (e1) {
      // Retry without resumeToken if rules reject extra field
      delete payload.resumeToken;
      await fsMod.setDoc(fsMod.doc(db, "applications", id), payload);
    }
    window.__cgtiaFirestore = db;
    console.log("[cgtia] Firestore application saved:", id);
    return true;
  } catch (e) {
    console.error("[cgtia] Firestore application save FAILED:", e);
    return false;
  }
}

window.handleApplySubmit = async function (event) {
  if (event && event.preventDefault) event.preventDefault();

  var form = document.getElementById("applyForm");
  var honeypot = document.getElementById("applyWebsiteField");
  if (honeypot && honeypot.value) {
    if (typeof closeApplyScreen === "function") closeApplyScreen();
    else if (typeof toggleApplyScreen === "function") toggleApplyScreen();
    return false;
  }

  var programEl = document.getElementById("programSelect");
  var programKey = programEl ? programEl.value : "";
  if (!programKey) {
    if (programEl) programEl.reportValidity();
    return false;
  }

  var fullName = (document.getElementById("fullNameInput") || {}).value || "";
  var phone = (document.getElementById("phoneInput") || {}).value || "";
  var cc = (document.getElementById("countryCodeSelect") || {}).value || "+234";
  phone = phone.trim();
  if (phone && !phone.startsWith("+")) {
    phone = phone.replace(/^0+/, "");
    phone = cc + phone;
  }
  var email = (document.getElementById("emailInput") || {}).value || "";
  fullName = fullName.trim();
  phone = phone.trim();
  email = email.trim().toLowerCase();
  if (!fullName || !phone || !email) {
    if (form && form.reportValidity) form.reportValidity();
    return false;
  }
  var ageBox = document.getElementById("ageConfirm18");
  if (ageBox && !ageBox.checked) {
    alert("Please confirm that you are 18 years of age or older to continue.");
    return false;
  }

  var startDateEl = document.getElementById("startDateDisplay");
  var startDate = startDateEl ? startDateEl.innerText.trim() : "";
  var messageEl = form ? form.querySelector("textarea") : null;
  var message = messageEl ? messageEl.value.trim() : "";

  var app = {
    fullName: fullName,
    phone: phone,
    email: email,
    program: programKey,
      studyMode: (document.querySelector('input[name="studyMode"]:checked') || {}).value || "",
    startDate: startDate,
    message: message,
    paymentStatus: "unpaid"
  };

  Array.from(form.querySelectorAll("input, select, textarea, button")).forEach(function (el) {
    el.disabled = true;
  });

  if (typeof closeApplyScreen === "function") closeApplyScreen();
  else if (typeof window.toggleApplyScreen === "function") window.toggleApplyScreen();

  setTimeout(async function () {
    if (typeof openStatusScreen === "function") openStatusScreen();
    if (typeof setStatusLoading === "function") setStatusLoading();

    try {
      // Prefer module apply-flow when installed (handles existing-email + no WhatsApp on fail)
      if (typeof window.__cgtiaHandleApplySubmit === "function" && window.handleApplySubmit === window.__cgtiaHandleApplySubmit) {
        // Already routed through apply-flow; should not reach here
      }

      var saved = await persistApplicationToFirebase(app);

      if (!saved) {
        if (typeof setStatusError === "function") {
          setStatusError(
            "We could not save your application",
            "Something went wrong while saving your application. Please try again. If it keeps happening, contact admissions and we will help you.",
            function () {
              if (typeof closeStatusScreen === "function") closeStatusScreen();
              Array.from(form.querySelectorAll("input, select, textarea, button")).forEach(function (el) { el.disabled = false; });
            }
          );
        }
        // Do NOT notify WhatsApp when save failed
        var btnFail = document.getElementById("statusActionBtn");
        if (btnFail) {
          btnFail.classList.remove("hidden");
          btnFail.innerText = "Try again";
          btnFail.onclick = function () {
            if (typeof closeStatusScreen === "function") closeStatusScreen();
            setTimeout(function () {
              if (typeof toggleApplyScreen === "function") toggleApplyScreen();
            }, 300);
          };
        }
        Array.from(form.querySelectorAll("input, select, textarea, button")).forEach(function (el) { el.disabled = false; });
        return;
      }

      savePendingPayment(app);
      notifyWhatsAppApplication(app);

      setTimeout(function () {
        if (typeof setStatusSuccess === "function") {
          setStatusSuccess(
            "Application received",
            "Thank you — your application is in. Please complete payment to secure your seat. After you pay, we will email your sign-in details for the student portal."
          );
        }
        var btn = document.getElementById("statusActionBtn");
        if (btn) {
          btn.classList.remove("hidden");
          btn.innerText = "Continue to Payment";
          btn.onclick = function () {
            if (typeof closeStatusScreen === "function") closeStatusScreen();
            setTimeout(function () {
              if (typeof openPaymentScreen === "function") {
                openPaymentScreen(programKey, email);
              }
            }, 400);
          };
        }
        Array.from(form.querySelectorAll("input, select, textarea, button")).forEach(function (el) {
          el.disabled = false;
        });
      }, 800);
    } catch (err) {
      console.error(err);
      if (typeof setStatusError === "function") {
        setStatusError("Submission Failed", "Something went wrong. Please try again.");
      } else {
        alert("Submission failed. Please try again.");
      }
      Array.from(form.querySelectorAll("input, select, textarea, button")).forEach(function (el) {
        el.disabled = false;
      });
    }
  }, 350);

  return false;
};

/** Paystack card checkout (uses test key until you switch to live) */
window.payWithPaystackCard = async function () {
  try {
    if (window.ensurePaystack) await window.ensurePaystack();
  } catch (e) {}
  if (typeof PaystackPop === "undefined") {
    alert("Payment is still loading. Please try again in a moment.");
    try { if (window.ensurePaystack) await window.ensurePaystack(); } catch (e2) {}
    if (typeof PaystackPop === "undefined") {
      alert("Online payment is not available right now. Please try again shortly, or contact admissions.");
      return;
    }
  }

  var pending = getPendingPayment() || {};
  var email = pending.email || (typeof __currentPaymentEmail !== "undefined" ? __currentPaymentEmail : "") || "";
  var programKey = pending.program || "certificate";
  if (typeof __currentPaymentProgram === "string") programKey = __currentPaymentProgram;
  // Prefer live payment program (includes promo amount set in openPaymentScreen)
  var info = (typeof __currentPaymentProgram === "object" && __currentPaymentProgram && __currentPaymentProgram.amount)
    ? __currentPaymentProgram
    : ((typeof PROGRAM_INFO !== "undefined" && PROGRAM_INFO[programKey]) || { amount: 300000, name: programKey });
  // Re-check active open promo so Paystack never charges full price by mistake
  try {
    if (window.__cgtiaMatchPromo) {
      var codeEl = document.getElementById("promoCodeInput");
      var codeVal = codeEl ? codeEl.value : "";
      var promo = window.__cgtiaMatchPromo(programKey, codeVal);
      if (promo && promo.promoAmount) {
        info = Object.assign({}, info, {
          amount: Number(promo.promoAmount),
          promoTitle: promo.title || promo.badge || "Promo"
        });
        if (typeof __currentPaymentProgram === "object") {
          __currentPaymentProgram.amount = Number(promo.promoAmount);
        }
      }
    }
  } catch (e) {}
  var amountNaira = Number(info.amount) || 0;
  if (typeof __paymentPlan !== "undefined" && __paymentPlan === "installment" && __installmentAmounts && __installmentAmounts[0]) {
    amountNaira = __installmentAmounts[0];
  }
  if (!amountNaira) amountNaira = 100000;
  var amountKobo = Math.round(amountNaira * 100);
  console.log("[cgtia] Paystack amount NGN", amountNaira, "plan", typeof __paymentPlan !== "undefined" ? __paymentPlan : "full");

  var handler = PaystackPop.setup({
    key: window.CGTIA_PAYSTACK_PUBLIC_KEY,
    email: email || "applicant@example.com",
    amount: amountKobo,
    currency: "NGN",
    // ref omitted — Paystack generates T… reference

    channels: ["bank_transfer", "bank", "ussd", "card"],
    metadata: {
      applicationId: email || "",
      custom_fields: [
        { display_name: "Program", variable_name: "program", value: programKey },
        { display_name: "Full Name", variable_name: "full_name", value: pending.fullName || "" },
        { display_name: "Application", variable_name: "applicationId", value: email || "" }
      ]
    },
    callback: function (response) {
      console.log("Paystack success", response);
      try {
        var em = email || (getPendingPayment() || {}).email || "";
        if (window.__cgtiaOnPaystackSuccess) window.__cgtiaOnPaystackSuccess(em, response.reference);
      } catch (e) {}
      clearPendingPayment();
      // Backup: tell Netlify to record payment + provision portal account (if webhook missed)
      try {
        fetch("/api/confirm-paystack-client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: email, reference: response.reference || "", source: "client-paystack-callback" })
        }).catch(function () {});
      } catch (e) {}
      if (typeof closePaymentScreen === "function") closePaymentScreen();
      if (typeof openStatusScreen === "function") openStatusScreen();
      if (typeof setStatusSuccess === "function") {
        setStatusSuccess(
          "Payment received",
          "Thank you — your payment was received. Reference: " + (response.reference || "") + ". Please check your email (and spam folder) for your student portal sign-in details. Open Portal, sign in, then choose your own password."
        );
      }
      var btn = document.getElementById("statusActionBtn");
      if (btn) {
        btn.classList.remove("hidden");
        btn.innerText = "Done";
        btn.onclick = function () {
          if (typeof closeStatusScreen === "function") closeStatusScreen();
        };
      }
    },
    onClose: function () {
      console.log("Paystack closed without completing");
    }
  });
  handler.openIframe();
};

/** Resume incomplete payment prompt (localStorage — survives refresh) */
function showResumePaymentPrompt(pending) {
  if (document.getElementById("cgtiaResumePaymentBanner")) return;
  var bar = document.createElement("div");
  bar.id = "cgtiaResumePaymentBanner";
  bar.setAttribute("role", "dialog");
  bar.style.cssText = "position:fixed;bottom:1.25rem;left:50%;transform:translateX(-50%);z-index:100;width:min(92vw,420px);background:#0f172a;color:#fff;border-radius:1.25rem;padding:1rem 1.15rem;box-shadow:0 20px 50px rgba(15,23,42,0.35);font-family:Inter,system-ui,sans-serif;";
  bar.innerHTML =
    '<p style="margin:0 0 0.35rem;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.7;font-weight:700;">Incomplete application</p>' +
    '<p style="margin:0 0 0.85rem;font-size:14px;line-height:1.4;">You still need to complete payment for <strong>' +
    (pending.program || "your program") +
    "</strong>" +
    (pending.fullName ? " (" + pending.fullName + ")" : "") +
    ".</p>" +
    '<div style="display:flex;gap:0.5rem;">' +
    '<button type="button" id="cgtiaResumePayBtn" style="flex:1;padding:0.7rem;border:0;border-radius:999px;background:#fff;color:#0f172a;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;">Complete payment</button>' +
    '<button type="button" id="cgtiaResumeDismissBtn" style="padding:0.7rem 0.9rem;border:1px solid rgba(255,255,255,0.2);border-radius:999px;background:transparent;color:#fff;font-size:11px;font-weight:600;cursor:pointer;">Later</button>' +
    "</div>";
  document.body.appendChild(bar);
  document.getElementById("cgtiaResumePayBtn").onclick = function () {
    bar.remove();
    if (typeof openPaymentScreen === "function") {
      openPaymentScreen(pending.program, pending.email);
    }
  };
  document.getElementById("cgtiaResumeDismissBtn").onclick = function () {
    bar.remove();
  };
}

function checkPendingPaymentOnLoad() {
  var pending = getPendingPayment();
  if (!pending) return;
  // Slight delay so page UI is ready
  setTimeout(function () {
    showResumePaymentPrompt(pending);
  }, 1200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkPendingPaymentOnLoad);
} else {
  checkPendingPaymentOnLoad();
}
window.checkPendingPaymentOnLoad = checkPendingPaymentOnLoad;
window.getPendingPayment = getPendingPayment;
window.clearPendingPayment = clearPendingPayment;

window.setStatusSuccess = typeof setStatusSuccess === "function" ? setStatusSuccess : function(){};
window.setStatusLoading = typeof setStatusLoading === "function" ? setStatusLoading : function(){};
window.setStatusError = typeof setStatusError === "function" ? setStatusError : function(){};
window.openStatusScreen = typeof openStatusScreen === "function" ? openStatusScreen : function(){};
window.closeStatusScreen = typeof closeStatusScreen === "function" ? closeStatusScreen : function(){};
window.closePaymentScreen = typeof closePaymentScreen === "function" ? closePaymentScreen : function(){};
window.switchPaymentPlan = typeof switchPaymentPlan === "function" ? switchPaymentPlan : function(){};
window.switchPaymentTab = typeof switchPaymentTab === "function" ? switchPaymentTab : function(){};
window.copyFieldValue = typeof copyFieldValue === "function" ? copyFieldValue : function(){};


/* ===== HARD GLOBAL BINDINGS (onclick-safe) ===== */
window.shiftTestimonial = function (direction) {
  var container = document.getElementById("testimonialsScroll");
  if (!container) return;
  var card = container.querySelector(".snap-center");
  var cardWidth = card ? card.getBoundingClientRect().width + 32 : 400;
  container.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
};

window.shiftArcLeft = function () {
  if (typeof activeArcIndex === "undefined") return;
  if (activeArcIndex > 0) {
    activeArcIndex--;
    if (typeof updateArcLayout === "function") updateArcLayout();
  }
};

window.shiftArcRight = function () {
  if (typeof activeArcIndex === "undefined") return;
  var max = typeof totalArcCards !== "undefined" ? totalArcCards - 1 : 3;
  if (activeArcIndex < max) {
    activeArcIndex++;
    if (typeof updateArcLayout === "function") updateArcLayout();
  }
};



/* --- FAQ ACCORDION + ASK-US SHEET --- */
function toggleFaq(btn) {
  try {
    if (!btn) return;
    var item = btn.closest ? btn.closest(".faq-item") : null;
    if (!item) return;
    var answer = item.querySelector(".faq-answer");
    var isOpen = item.classList.contains("faq-open");

    // Close other open items (accordion style)
    document.querySelectorAll(".faq-item.faq-open").forEach(function (other) {
      if (other === item) return;
      other.classList.remove("faq-open");
      var a = other.querySelector(".faq-answer");
      if (a) {
        a.style.maxHeight = "0px";
      }
    });

    if (isOpen) {
      item.classList.remove("faq-open");
      if (answer) answer.style.maxHeight = "0px";
    } else {
      item.classList.add("faq-open");
      if (answer) {
        answer.style.maxHeight = answer.scrollHeight + 48 + "px";
      }
    }
  } catch (e) {
    console.warn("toggleFaq", e);
  }
}

function openFaqQuestionBox(topic) {
  try {
    var screen = document.getElementById("faqQuestionScreen");
    var drawer = document.getElementById("faqQuestionDrawer");
    var ctx = document.getElementById("faqTopicContext");
    if (!screen || !drawer) return;
    if (ctx) {
      ctx.textContent = topic ? ("About: " + topic) : "";
    }
    screen.classList.remove("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
    screen.classList.add("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
    screen.style.pointerEvents = "auto";
    drawer.style.transform = "translateY(0)";
    drawer.style.opacity = "1";
    document.body.style.overflow = "hidden";
  } catch (e) {
    console.warn("openFaqQuestionBox", e);
  }
}

function closeFaqQuestionBox() {
  try {
    var screen = document.getElementById("faqQuestionScreen");
    var drawer = document.getElementById("faqQuestionDrawer");
    if (!screen || !drawer) return;
    screen.classList.add("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
    screen.classList.remove("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
    screen.style.pointerEvents = "none";
    drawer.style.transform = "";
    drawer.style.opacity = "";
    document.body.style.overflow = "";
  } catch (e) {
    console.warn("closeFaqQuestionBox", e);
  }
}

function handleFaqQuestionSubmit(event) {
  try {
    if (event && event.preventDefault) event.preventDefault();
    var form = event && event.target ? event.target : document.getElementById("faqQuestionForm");
    if (!form) return false;
    // Honeypot
    var hp = document.getElementById("faqWebsiteField");
    if (hp && hp.value) return false;

    var textarea = form.querySelector("textarea");
    var question = textarea ? (textarea.value || "").trim() : "";
    var methodEl = form.querySelector('input[name="faqContactMethod"]:checked');
    var method = methodEl ? methodEl.value : "email";
    var contactInput = form.querySelector('input[type="text"]:not(#faqWebsiteField)');
    var contact = contactInput ? (contactInput.value || "").trim() : "";
    var topicEl = document.getElementById("faqTopicContext");
    var topic = topicEl ? (topicEl.textContent || "").replace(/^About:\s*/, "") : "";

    var waNum = String(window.CGTIA_WHATSAPP_NUMBER || "2349164712004").replace(/\D/g, "");
    var msg =
      "Hello CGTIA, I have a question" +
      (topic ? (" about: " + topic) : "") +
      "\n\n" +
      question +
      "\n\nReply via: " +
      method +
      "\nContact: " +
      contact;

    if (method === "whatsapp") {
      window.open("https://wa.me/" + waNum + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    } else {
      // Prefer WhatsApp for reliability on mobile; include email preference in text
      window.open("https://wa.me/" + waNum + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    }
    closeFaqQuestionBox();
    if (textarea) textarea.value = "";
    return false;
  } catch (e) {
    console.warn("handleFaqQuestionSubmit", e);
    return false;
  }
}

window.toggleFaq = toggleFaq;
window.openFaqQuestionBox = openFaqQuestionBox;
window.closeFaqQuestionBox = closeFaqQuestionBox;
window.handleFaqQuestionSubmit = handleFaqQuestionSubmit;


window.toggleMobileBottomSheet = function () {
  var container = document.getElementById("mobileBottomSheet");
  var drawer = document.getElementById("bottomSheetDrawer");
  if (!container || !drawer) return;
  var isClosed = container.classList.contains("pointer-events-none") || container.style.pointerEvents === "none";
  if (isClosed) {
    // OPEN — must re-enable clicks on the drawer (close path sets pointer-events: none)
    container.classList.remove("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
    container.classList.add("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
    container.style.pointerEvents = "auto";
    container.style.visibility = "visible";
    drawer.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
    drawer.style.transform = "translateY(0)";
    drawer.style.pointerEvents = "auto";
    document.body.style.overflow = "hidden";
  } else {
    // CLOSE — fully off-screen, no accidental taps
    container.classList.add("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
    container.classList.remove("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
    container.style.pointerEvents = "none";
    container.style.visibility = "hidden";
    container.style.background = "transparent";
    drawer.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
    drawer.style.transform = "translateY(100vh)";
    drawer.style.pointerEvents = "none";
    document.body.style.overflow = "";
  }
};

// Ensure Apply toggle always works
(function () {
  var prev = window.toggleApplyScreen;
  window.toggleApplyScreen = function () {
    try {
      if (typeof setSheetOpen === "function") {
        var container = document.getElementById("applyScreen");
        var opening = !container || container.classList.contains("pointer-events-none") || container.style.pointerEvents === "none";
        if (opening && window.ensurePaystack) { try { window.ensurePaystack(); } catch (e) {} }
        setSheetOpen("applyScreen", "applyDrawer", opening);
        return;
      }
    } catch (e) {}
    if (typeof prev === "function") return prev.apply(this, arguments);
  };
})();

window.setPeelActive = function (el) {
  if (!el) return;
  document.querySelectorAll(".peel-card").forEach(function (card) {
    card.classList.remove("peel-active");
  });
  el.classList.add("peel-active");
};

console.log("[cgtia] runtime globals bound");

/* REASSERT_MODULE_APPLY */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof window.__cgtiaHandleApplySubmit === "function") {
    window.handleApplySubmit = window.__cgtiaHandleApplySubmit;
  }
});

/** Open the same Apply sheet as the header, with a programme pre-selected */
window.openApplyForProgram = function (programId) {
  try {
    if (typeof window.toggleApplyScreen === "function") {
      window.toggleApplyScreen();
    }
    setTimeout(function () {
      var sel = document.getElementById("programSelect");
      if (sel && programId) {
        // Match option by value (id) or by containing the id
        var found = false;
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value === programId || sel.options[i].value.indexOf(programId) === 0) {
            sel.value = sel.options[i].value;
            found = true;
            break;
          }
        }
        if (!found) {
          // Try setting value directly in case options were loaded dynamically
          sel.value = programId;
        }
        if (typeof window.handleProgramChange === "function") {
          try { window.handleProgramChange(); } catch (e) {}
        }
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, 120);
  } catch (e) {
    console.warn("openApplyForProgram", e);
    if (typeof window.toggleApplyScreen === "function") window.toggleApplyScreen();
  }
};

/* Admin-driven programme start dates */
(function () {
  var prev = window.handleProgramChange;
  window.handleProgramChange = function () {
    if (typeof prev === "function") {
      try { prev.apply(this, arguments); } catch (e) {}
    }
    var sel = document.getElementById("programSelect");
    var display = document.getElementById("startDateDisplay");
    if (!sel || !display) return;
    var key = sel.value;
    var date = (window.__cgtiaGetProgramStartDate && window.__cgtiaGetProgramStartDate(key)) || "To be announced";
    display.innerText = date;
    display.classList.remove("text-slate-400");
    display.classList.add("text-slate-800");
    var mod = window.__cgtiaGetProgramModality && window.__cgtiaGetProgramModality(key);
    var modEl = document.getElementById("programModalityDisplay");
    if (modEl) modEl.innerText = mod || "";
  };
})();

/* Study mode (online / in person) when programme selected */
(function () {
  var prev = window.handleProgramChange;
  window.handleProgramChange = function () {
    if (typeof prev === "function") {
      try { prev.apply(this, arguments); } catch (e) {}
    }
    var sel = document.getElementById("programSelect");
    var wrap = document.getElementById("studyModeWrap");
    if (!sel || !wrap) return;
    var key = sel.value;
    if (!key) {
      wrap.classList.add("hidden");
      return;
    }
    var opts = (window.__cgtiaGetProgramStudyOptions && window.__cgtiaGetProgramStudyOptions(key)) || {
      allowOnline: true,
      allowInPerson: true
    };
    wrap.classList.remove("hidden");
    var onlineLab = document.getElementById("studyModeOnline");
    var personLab = document.getElementById("studyModeInPerson");
    if (onlineLab) {
      onlineLab.disabled = opts.allowOnline === false;
      onlineLab.parentElement.style.opacity = opts.allowOnline === false ? "0.4" : "1";
    }
    if (personLab) {
      personLab.disabled = opts.allowInPerson === false;
      personLab.parentElement.style.opacity = opts.allowInPerson === false ? "0.4" : "1";
    }
    // default first available
    if (onlineLab && opts.allowOnline !== false) onlineLab.checked = true;
    else if (personLab && opts.allowInPerson !== false) personLab.checked = true;
    var mod = document.getElementById("programModalityDisplay");
    if (mod) mod.textContent = opts.modality || "Online and in person";
  };
})();

/* Minimized promo: stripe left of the ⋮ ellipse, fades left, two lines */
(function () {
  function ensurePromoStripe(){ return; }
  function ensurePromoStripe_disabled() {
    var minimized = window.__cgtiaPromoMinimized || sessionStorage.getItem("cgtiaPromoBannerClosed") === "1";
    var promos = window.__cgtiaActivePromos || [];
    var existing = document.getElementById("cgtiaPromoStripe");
    if (!minimized || !promos.length) {
      if (existing) existing.remove();
      return;
    }
    var fabRow = document.querySelector(".fixed.bottom-6.right-6");
    if (!fabRow) return;
    var p = promos[0];
    var line1 = p.title || p.badge || "Special offer";
    var line2 = p.type === "announcement"
      ? (p.description || "Tap to learn more")
      : ((p.promoAmount ? ("₦" + Math.round(Number(p.promoAmount) / 1000) + "k") : "") +
          (p.description ? " · " + p.description : " · Tap for tuition"));
    if (line2.length > 72) line2 = line2.slice(0, 70) + "…";
    if (!existing) {
      existing = document.createElement("button");
      existing.id = "cgtiaPromoStripe";
      existing.type = "button";
      existing.className = "pointer-events-auto";
      existing.setAttribute(
        "style",
        "max-width:min(62vw,280px);min-height:3.5rem;padding:0.55rem 1rem 0.55rem 1.1rem;" +
        "border-radius:999px 0 0 999px;border:1px solid rgba(255,255,255,0.12);" +
        "background:linear-gradient(90deg,rgba(15,23,42,0) 0%,rgba(15,23,42,0.75) 28%,#0f172a 100%);" +
        "color:#e2e8f0;text-align:left;box-shadow:0 12px 30px rgba(15,23,42,0.25);" +
        "display:flex;flex-direction:column;justify-content:center;gap:2px;" +
        "animation:cgtiaStripeIn 0.45s cubic-bezier(0.16,1,0.3,1) both;"
      );
      existing.onclick = function () {
        if (window.__cgtiaNavigate) window.__cgtiaNavigate("/tuition");
        else if (window.navigateWithPill) window.navigateWithPill("Tuition", "tuition.html");
        else window.location.href = "/tuition";
      };
      // Insert just before the ellipse (last child is usually the ⋮ button)
      fabRow.insertBefore(existing, fabRow.lastElementChild);
    }
    existing.innerHTML =
      '<span style="font-size:11px;font-weight:700;letter-spacing:0.04em;line-height:1.25;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      line1 +
      '</span><span style="font-size:10px;font-weight:400;opacity:0.85;line-height:1.3;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      line2 +
      "</span>";
  }

  window.__cgtiaShowPromoStripe = ensurePromoStripe;
  // When banner is closed, show stripe
  var origCloseHook = setInterval(function () {
    if (sessionStorage.getItem("cgtiaPromoBannerClosed") === "1") {
      window.__cgtiaPromoMinimized = true;
      ensurePromoStripe();
    }
  }, 800);
  setTimeout(function () { clearInterval(origCloseHook); }, 60000);
  document.addEventListener("click", function (e) {
    if (e.target && e.target.closest && e.target.closest("[data-promo-close]")) {
      setTimeout(ensurePromoStripe, 550);
    }
  });
  var style = document.createElement("style");
  style.textContent =
    "@keyframes cgtiaStripeIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}" +
    "@media (min-width:768px){#cgtiaPromoStripe{display:none!important}}";
  document.head.appendChild(style);
  // Also after promos load
  setTimeout(ensurePromoStripe, 1200);
})();

(function(){
  function killStripe(){
    var s = document.getElementById("cgtiaPromoStripe");
    if (s) s.remove();
  }
  killStripe();
  setInterval(killStripe, 1000);
})();


    window.switchCustomType = function switchCustomType(type) {
      var types = ["individual", "school", "organization"];
      types.forEach(function (t) {
        var fields = document.getElementById(t + "Fields");
        if (fields) fields.classList.toggle("hidden", t !== type);
      });
      var map = {
        individual: "typeIndividualBtn",
        school: "typeSchoolBtn",
        organization: "typeOrgBtn"
      };
      types.forEach(function (t) {
        var btn = document.getElementById(map[t]);
        if (!btn) return;
        if (t === type) {
          btn.classList.add("bg-white", "text-blue-950", "shadow-sm");
          btn.classList.remove("text-slate-500");
        } else {
          btn.classList.remove("bg-white", "text-blue-950", "shadow-sm");
          btn.classList.add("text-slate-500");
        }
      });
      try {
        var hidden = document.getElementById("customApplicantType");
        if (hidden) hidden.value = type;
      } catch (e) {}
    };


/* ========================================================================
   FEE PAYMENT PAGE (/pay-fee?token=...)
   Branded CGTIA UI · clear Pay CTA · success/pending/failure · resume
   ======================================================================== */
(function () {
  var BRAND = {
    navy: "#0a1128",
    navyMid: "#111b3a",
    blue: "#1d4ed8",
    blueHover: "#1e40af",
    gold: "#c9a227",
    success: "#15803d",
    danger: "#b91c1c",
    muted: "#64748b",
    cardBg: "#ffffff",
    pageBg: "linear-gradient(165deg, #0a1128 0%, #152238 45%, #0f172a 100%)"
  };

  function isPayFeePath() {
    var path = (window.location.pathname || "").replace(/\/$/, "") || "/";
    return path === "/pay-fee" || path.endsWith("/pay-fee");
  }

  function getTokenFromUrl() {
    try {
      return (new URLSearchParams(window.location.search || "").get("token") || "").trim();
    } catch (e) {
      return "";
    }
  }

  function formatNaira(n) {
    return "₦" + Number(n || 0).toLocaleString("en-NG");
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "className") node.className = attrs[k];
        else if (k === "style" && typeof attrs[k] === "object") {
          Object.keys(attrs[k]).forEach(function (sk) { node.style[sk] = attrs[k][sk]; });
        } else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  }

  function renderShell(contentNode) {
    var root = document.getElementById("root");
    if (root) {
      root.innerHTML = "";
      root.appendChild(contentNode);
    } else {
      document.body.innerHTML = "";
      document.body.appendChild(contentNode);
    }
  }

  function storageKey(token) {
    return "cgtia_fee_pay_" + (token || "").slice(0, 16);
  }

  function savePending(token, payload) {
    try { sessionStorage.setItem(storageKey(token), JSON.stringify(payload)); } catch (e) {}
  }

  function loadPending(token) {
    try {
      var raw = sessionStorage.getItem(storageKey(token));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearPending(token) {
    try { sessionStorage.removeItem(storageKey(token)); } catch (e) {}
  }

  async function validateToken(token) {
    var url = (window.location.origin || "") + "/api/validate-fee-link?token=" + encodeURIComponent(token);
    var res = await fetch(url, { method: "GET" });
    return res.json();
  }

  async function confirmFeePayment(reference, fee, email, fullName, reg) {
    var res = await fetch("/api/confirm-paystack-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: reference,
        source: "fee-link",
        feeId: fee.feeId || "",
        feeName: fee.feeName || "",
        feeType: fee.feeType || "custom",
        feeLinkToken: fee.token || "",
        email: email,
        fullName: fullName || "",
        regNumber: reg || "",
        installmentsTotal: fee.installmentsMax || 1,
        installmentNumber: 1
      })
    });
    var json = {};
    try { json = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, data: json };
  }

  function pageShell(inner) {
    return el("div", {
      style: {
        minHeight: "100vh",
        background: BRAND.pageBg,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        color: "#0f172a",
        padding: "0 0 3rem"
      }
    }, [
      el("header", {
        style: {
          background: BRAND.navy,
          borderBottom: "1px solid rgba(201,162,39,0.25)",
          padding: "0.85rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }
      }, [
        el("a", {
          href: "/",
          style: {
            color: "#e2e8f0",
            textDecoration: "none",
            fontWeight: "700",
            letterSpacing: "0.04em",
            fontSize: "0.95rem"
          }
        }, ["CGTIA"]),
        el("span", {
          style: { color: BRAND.gold, fontSize: "0.7rem", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }
        }, ["Secure payment"])
      ]),
      el("div", { style: { maxWidth: "440px", margin: "1.75rem auto 0", padding: "0 1rem" } }, [inner])
    ]);
  }

  function showError(msg) {
    var card = el("div", {
      style: {
        background: BRAND.cardBg,
        borderRadius: "16px",
        padding: "1.75rem",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        border: "1px solid rgba(185,28,28,0.2)"
      }
    }, [
      el("p", { style: { color: BRAND.danger, fontWeight: "700", fontSize: "1.05rem", margin: "0 0 0.5rem" } }, ["Payment link unavailable"]),
      el("p", { style: { color: BRAND.muted, fontSize: "0.9rem", margin: "0 0 1.25rem", lineHeight: "1.5" } }, [msg || "This link is invalid or has expired."]),
      el("a", {
        href: "/",
        style: {
          display: "inline-block",
          background: BRAND.navy,
          color: "#fff",
          textDecoration: "none",
          padding: "0.65rem 1.1rem",
          borderRadius: "10px",
          fontSize: "0.875rem",
          fontWeight: "600"
        }
      }, ["Return to homepage"])
    ]);
    renderShell(pageShell(card));
  }

  function fieldLabel(text) {
    return el("label", {
      style: { display: "block", fontSize: "0.75rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }
    }, [text]);
  }

  function fieldInput(opts) {
    return el("input", {
      type: opts.type || "text",
      placeholder: opts.placeholder || "",
      value: opts.value || "",
      required: opts.required ? "required" : undefined,
      style: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        padding: "0.7rem 0.85rem",
        fontSize: "0.95rem",
        outline: "none",
        background: "#f8fafc",
        color: "#0f172a"
      }
    });
  }

  function showForm(fee) {
    var token = fee.token || getTokenFromUrl();
    var pending = loadPending(token);

    var statusBox = el("div", {
      style: {
        display: "none",
        marginTop: "1rem",
        padding: "0.85rem 1rem",
        borderRadius: "10px",
        fontSize: "0.875rem",
        lineHeight: "1.45",
        fontWeight: "500"
      }
    });

    function setStatus(kind, message) {
      statusBox.style.display = "block";
      if (kind === "success") {
        statusBox.style.background = "#ecfdf5";
        statusBox.style.color = BRAND.success;
        statusBox.style.border = "1px solid #bbf7d0";
      } else if (kind === "error") {
        statusBox.style.background = "#fef2f2";
        statusBox.style.color = BRAND.danger;
        statusBox.style.border = "1px solid #fecaca";
      } else if (kind === "pending") {
        statusBox.style.background = "#fffbeb";
        statusBox.style.color = "#b45309";
        statusBox.style.border = "1px solid #fde68a";
      } else {
        statusBox.style.background = "#f1f5f9";
        statusBox.style.color = BRAND.muted;
        statusBox.style.border = "1px solid #e2e8f0";
      }
      statusBox.textContent = message;
    }

    var nameInput = fieldInput({ placeholder: "Your full name", value: (pending && pending.fullName) || "" });
    var emailInput = fieldInput({ type: "email", placeholder: "the email you gave the school", value: (pending && pending.email) || "" });
    var regInput = fieldInput({ placeholder: "optional — if you remember it", value: (pending && pending.regNumber) || "" });

    var payBtn = el("button", {
      type: "button",
      style: {
        width: "100%",
        marginTop: "1.25rem",
        background: BRAND.blue,
        color: "#ffffff",
        border: "none",
        borderRadius: "12px",
        padding: "0.95rem 1rem",
        fontSize: "1rem",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(29,78,216,0.35)",
        letterSpacing: "0.01em"
      }
    }, ["Pay " + formatNaira(fee.amount)]);

    var resumeBtn = el("button", {
      type: "button",
      style: {
        width: "100%",
        marginTop: "0.6rem",
        background: "transparent",
        color: BRAND.navy,
        border: "1px solid #cbd5e1",
        borderRadius: "12px",
        padding: "0.7rem 1rem",
        fontSize: "0.875rem",
        fontWeight: "600",
        cursor: "pointer",
        display: pending && pending.reference ? "block" : "none"
      }
    }, ["Verify / complete previous payment"]);

    function setBusy(busy, label) {
      payBtn.disabled = !!busy;
      payBtn.style.opacity = busy ? "0.75" : "1";
      payBtn.style.cursor = busy ? "wait" : "pointer";
      if (label) payBtn.textContent = label;
    }

    function markPaid(reference) {
      setBusy(true, "Paid — thank you");
      payBtn.style.background = BRAND.success;
      payBtn.style.boxShadow = "none";
      resumeBtn.style.display = "none";
      clearPending(token);

      var email = (emailInput.value || "").trim().toLowerCase();
      var reg = (regInput.value || "").trim();
      var fullName = (nameInput.value || "").trim();
      var ref = reference || "";

      // Build success panel: reference + copy + WhatsApp
      statusBox.style.display = "block";
      statusBox.style.background = "#ecfdf5";
      statusBox.style.color = BRAND.success;
      statusBox.style.border = "1px solid #bbf7d0";
      statusBox.innerHTML = "";

      statusBox.appendChild(el("p", {
        style: { margin: "0 0 0.5rem", fontWeight: "700", fontSize: "0.95rem", color: BRAND.success }
      }, ["Payment successful"]));

      statusBox.appendChild(el("p", {
        style: { margin: "0 0 0.35rem", fontSize: "0.8rem", color: "#166534", fontWeight: "600" }
      }, ["Your payment reference"]));

      var refRow = el("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.85rem"
        }
      });
      var refCode = el("code", {
        style: {
          flex: "1",
          minWidth: "140px",
          background: "#fff",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          padding: "0.55rem 0.7rem",
          fontSize: "0.8rem",
          color: BRAND.navy,
          wordBreak: "break-all",
          fontWeight: "600"
        }
      }, [ref]);
      var copyBtn = el("button", {
        type: "button",
        style: {
          background: BRAND.navy,
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0.55rem 0.85rem",
          fontSize: "0.8rem",
          fontWeight: "600",
          cursor: "pointer",
          whiteSpace: "nowrap"
        }
      }, ["Copy"]);
      copyBtn.addEventListener("click", function () {
        function done() {
          copyBtn.textContent = "Copied";
          setTimeout(function () { copyBtn.textContent = "Copy"; }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ref).then(done).catch(function () {
            try {
              var ta = document.createElement("textarea");
              ta.value = ref;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
              done();
            } catch (e) {}
          });
        } else {
          try {
            var ta2 = document.createElement("textarea");
            ta2.value = ref;
            document.body.appendChild(ta2);
            ta2.select();
            document.execCommand("copy");
            document.body.removeChild(ta2);
            done();
          } catch (e) {}
        }
      });
      refRow.appendChild(refCode);
      refRow.appendChild(copyBtn);
      statusBox.appendChild(refRow);

      var waMsg =
        "Hello CGTIA, I have paid for: " + (fee.feeName || "Fee") + "\n" +
        "Name: " + (fullName || "—") + "\n" +
        "Email: " + (email || "—") + "\n" +
        (reg ? ("Reg number: " + reg + "\n") : "") +
        "Amount: " + formatNaira(fee.amount) + "\n" +
        "Paystack reference: " + ref + "\n" +
        "(If I paid by bank transfer I can also attach my bank receipt.)";

      var waNum = String(window.CGTIA_WHATSAPP_NUMBER || "2349164712004").replace(/\D/g, "");
      var waUrl = "https://wa.me/" + waNum + "?text=" + encodeURIComponent(waMsg);

      var waBtn = el("a", {
        href: waUrl,
        target: "_blank",
        rel: "noopener",
        style: {
          display: "block",
          textAlign: "center",
          textDecoration: "none",
          background: "#25D366",
          color: "#fff",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          fontSize: "0.9rem",
          fontWeight: "700",
          marginBottom: "0.65rem"
        }
      }, ["Send details on WhatsApp"]);
      statusBox.appendChild(waBtn);

      statusBox.appendChild(el("p", {
        style: { margin: "0", fontSize: "0.75rem", color: "#166534", lineHeight: "1.45" }
      }, ["Screenshot this page or copy the reference. If you paid by bank transfer, you can also attach your bank receipt in WhatsApp."]));
    }

    async function verifyAndRecord(reference, email, fullName, reg) {
      setStatus("pending", "Confirming payment with the bank… Please wait.");
      setBusy(true, "Confirming…");
      try {
        var result = await confirmFeePayment(reference, fee, email, fullName, reg);
        if (result.ok && result.data && (result.data.success || result.data.recorded)) {
          markPaid(reference);
          return true;
        }
        // Still show success to user if Paystack said paid; admin may lag
        if (result.data && result.data.error === "Payment not verified") {
          setStatus("error", "Payment could not be verified yet. Keep this page open and tap “Verify / complete previous payment”, or contact the academy with reference " + reference + ".");
          savePending(token, { reference: reference, email: email, fullName: fullName, regNumber: reg, feeId: fee.feeId });
          resumeBtn.style.display = "block";
          setBusy(false, "Pay " + formatNaira(fee.amount));
          return false;
        }
        setStatus("pending", "Payment received (ref: " + reference + "). Recording may take a moment — you can tap Verify below if needed.");
        savePending(token, { reference: reference, email: email, fullName: fullName, regNumber: reg, feeId: fee.feeId });
        resumeBtn.style.display = "block";
        setBusy(false, "Pay " + formatNaira(fee.amount));
        return false;
      } catch (err) {
        setStatus("pending", "Network issue while confirming. Your payment may still have gone through. Tap “Verify / complete previous payment” when online. Ref: " + reference);
        savePending(token, { reference: reference, email: email, fullName: fullName, regNumber: reg, feeId: fee.feeId });
        resumeBtn.style.display = "block";
        setBusy(false, "Pay " + formatNaira(fee.amount));
        return false;
      }
    }

    function startPaystack() {
      var email = (emailInput.value || "").trim().toLowerCase();
      var reg = (regInput.value || "").trim();
      var fullName = (nameInput.value || "").trim();
      if (!email || email.indexOf("@") < 1) {
        setStatus("error", "Please enter a valid email address (the one the school has on file).");
        return;
      }
      if (!fullName) {
        setStatus("error", "Please enter your full name.");
        return;
      }

      setStatus("info", "Opening secure Paystack window…");
      setBusy(true, "Opening Paystack…");

      function openPopup() {
        fetch("/api/validate-fee-link?token=" + encodeURIComponent(token) + "&email=" + encodeURIComponent(email))
          .then(function (r) { return r.json(); })
          .then(function (pre) {
            if (pre && pre.payerError) {
              setStatus("error", pre.payerError);
              setBusy(false, "Pay " + formatNaira(fee.amount));
              return;
            }
            openPaystackNow();
          })
          .catch(function () { openPaystackNow(); });
      }
      function openPaystackNow() {
        if (typeof PaystackPop === "undefined") {
          setStatus("error", "Payment library still loading. Try again in a moment.");
          setBusy(false, "Pay " + formatNaira(fee.amount));
          return;
        }
        var ref = "fee_" + (token || "").slice(0, 8) + "_" + Date.now().toString(36);
        var handler = PaystackPop.setup({
          key: window.CGTIA_PAYSTACK_PUBLIC_KEY,
          email: email,
          amount: Math.round(Number(fee.amount) * 100),
          currency: "NGN",
          ref: ref,
          metadata: {
            custom_fields: [
              { display_name: "Fee", variable_name: "fee_name", value: fee.feeName || "" },
              { display_name: "Student email", variable_name: "student_email", value: email },
              { display_name: "Full name", variable_name: "full_name", value: fullName }
            ],
            source: "fee-link",
            feeId: fee.feeId || "",
            feeName: fee.feeName || "",
            feeType: fee.feeType || "custom",
            feeLinkToken: token || "",
            studentEmail: email,
            regNumber: reg || "",
            fullName: fullName || "",
            installmentsTotal: fee.installmentsMax || 1,
            installmentNumber: 1
          },
          callback: function (response) {
            var reference = (response && response.reference) || ref;
            savePending(token, { reference: reference, email: email, fullName: fullName, regNumber: reg, feeId: fee.feeId });
            verifyAndRecord(reference, email, fullName, reg);
          },
          onClose: function () {
            if (payBtn.textContent.indexOf("Paid") === -1 && payBtn.textContent.indexOf("Confirming") === -1) {
              setStatus("info", "Payment window closed. Tap Pay when you are ready to continue.");
              setBusy(false, "Pay " + formatNaira(fee.amount));
            }
          }
        });
        handler.openIframe();
      }

      if (window.ensurePaystack) {
        try { window.ensurePaystack(); } catch (e) {}
      }
      if (typeof PaystackPop !== "undefined") openPopup();
      else {
        var s = document.createElement("script");
        s.src = "https://js.paystack.co/v1/inline.js";
        s.onload = openPopup;
        s.onerror = function () {
          setStatus("error", "Could not load Paystack. Check your connection and try again.");
          setBusy(false, "Pay " + formatNaira(fee.amount));
        };
        document.head.appendChild(s);
      }
    }

    payBtn.addEventListener("click", startPaystack);
    payBtn.addEventListener("mouseenter", function () {
      if (!payBtn.disabled) payBtn.style.background = BRAND.blueHover;
    });
    payBtn.addEventListener("mouseleave", function () {
      if (!payBtn.disabled && payBtn.textContent.indexOf("Paid") === -1) payBtn.style.background = BRAND.blue;
    });

    resumeBtn.addEventListener("click", function () {
      var p = loadPending(token);
      if (!p || !p.reference) {
        setStatus("error", "No previous payment found on this device.");
        return;
      }
      var email = (emailInput.value || p.email || "").trim().toLowerCase();
      var fullName = (nameInput.value || p.fullName || "").trim();
      var reg = (regInput.value || p.regNumber || "").trim();
      verifyAndRecord(p.reference, email, fullName, reg);
    });

    if (pending && pending.reference) {
      setStatus("pending", "A previous payment attempt was found (ref: " + pending.reference + "). Tap “Verify / complete previous payment” if you already paid.");
    }

    var card = el("div", {
      style: {
        background: BRAND.cardBg,
        borderRadius: "16px",
        padding: "1.5rem 1.35rem 1.6rem",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        border: "1px solid rgba(201,162,39,0.2)"
      }
    }, [
      el("p", {
        style: {
          margin: "0 0 0.35rem",
          color: BRAND.blue,
          fontSize: "0.7rem",
          fontWeight: "700",
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }
      }, ["CGTIA payment"]),
      el("h1", {
        style: { margin: "0 0 0.4rem", fontSize: "1.35rem", fontWeight: "800", color: BRAND.navy, lineHeight: "1.25" }
      }, [fee.feeName || "Fee payment"]),
      fee.description
        ? el("p", { style: { margin: "0 0 1rem", color: BRAND.muted, fontSize: "0.9rem", lineHeight: "1.45" } }, [fee.description])
        : null,
      el("p", {
        style: {
          margin: "0 0 1.35rem",
          fontSize: "1.85rem",
          fontWeight: "800",
          color: BRAND.navy,
          letterSpacing: "-0.02em"
        }
      }, [formatNaira(fee.amount)]),
      fieldLabel("Full name"),
      nameInput,
      el("div", { style: { height: "0.85rem" } }, []),
      fieldLabel("Email (required — use the email the school has)"),
      emailInput,
      el("div", { style: { height: "0.85rem" } }, []),
      fieldLabel("Registration number (optional)"),
      regInput,
      payBtn,
      resumeBtn,
      statusBox,
      el("p", {
        style: { margin: "1.25rem 0 0", fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.45" }
      }, [
        fee.mode === "single" ? "This is a single-use link. " : "This link can be used by multiple people until it expires. ",
        fee.expiresAt ? ("Expires " + new Date(fee.expiresAt).toLocaleString() + ".") : ""
      ])
    ]);

    renderShell(pageShell(card));
  }

  function boot() {
    if (!isPayFeePath()) return;
    var token = getTokenFromUrl();
    if (!token) {
      showError("No payment token found in the link. Please use the full link sent by the academy.");
      return;
    }
    var loading = pageShell(el("div", {
      style: {
        background: BRAND.cardBg,
        borderRadius: "16px",
        padding: "2rem",
        textAlign: "center",
        color: BRAND.muted,
        fontSize: "0.9rem",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)"
      }
    }, ["Checking payment link…"]));
    renderShell(loading);

    validateToken(token).then(function (data) {
      if (!data || !data.valid) {
        showError((data && data.error) || "This payment link is not valid.");
        return;
      }
      data.token = token;
      showForm(data);
    }).catch(function () {
      showError("Could not verify the payment link. Please try again later.");
    });
  }

  // Expose for SPA router (app.js) so React does not overwrite with 404
  window.__cgtiaBootPayFee = boot;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();


/* --- Contact page: load editable content from siteContent/contactPage --- */
window.__cgtiaApplyContactPage = async function () {
  try {
    var phonesEl = document.getElementById("contact-phones");
    var waEl = document.getElementById("contact-whatsapps");
    var emailEl = document.getElementById("contact-emails");
    var mapEl = document.getElementById("contact-map-iframe");
    var banner = document.getElementById("contact-wa-banner");
    if (!phonesEl && !waEl && !banner) return;

    var data = null;
    try {
      if (window.__cgtiaGetContactPage) {
        data = await window.__cgtiaGetContactPage();
      }
    } catch (e) {}
    if (!data && window.firebase && window.firebase.firestore) {
      // legacy
    }
    // Prefer firebase service on window if exposed
    try {
      if (!data && window.__cgtiaFirebaseGetDoc) {
        data = await window.__cgtiaFirebaseGetDoc("siteContent", "contactPage");
      }
    } catch (e2) {}

    // Dynamic import path used by site modules
    try {
      if (!data) {
        var mod = await import("/src/services/firebase.service.js").catch(function () { return null; });
        if (mod && mod.getDb) {
          var api = await mod.getDb();
          var snap = await api.getDoc(api.doc(api.db, "siteContent", "contactPage"));
          if (snap && snap.exists()) data = snap.data();
          else if (snap && snap.exists === true) data = snap.data();
          else if (snap && typeof snap.data === "function") {
            var d = snap.data();
            if (d) data = d;
          }
        }
      }
    } catch (e3) {}

    if (!data) return;

    function digits(n) { return String(n || "").replace(/\D/g, ""); }
    function fmtPhone(n) {
      var d = digits(n);
      if (d.indexOf("234") === 0 && d.length >= 13) {
        return "+" + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6, 9) + " " + d.slice(9);
      }
      return n;
    }

    var phones = Array.isArray(data.phones) ? data.phones.filter(Boolean) : [];
    var whatsapps = Array.isArray(data.whatsapps) ? data.whatsapps.filter(Boolean) : [];
    var emails = Array.isArray(data.emails) ? data.emails.filter(Boolean) : [];
    if (!phones.length && data.phone) phones = [data.phone];
    if (!whatsapps.length && data.whatsapp) whatsapps = [data.whatsapp];
    if (!emails.length && data.email) emails = [data.email];

    if (phonesEl && phones.length) {
      phonesEl.innerHTML = phones.map(function (ph) {
        var d = digits(ph);
        var href = "tel:+" + d;
        return '<a href="' + href + '" class="block text-slate-500 font-light text-sm hover:text-blue-950 smooth-transition">' + fmtPhone(ph) + "</a>";
      }).join("");
    }
    if (waEl && whatsapps.length) {
      waEl.innerHTML = whatsapps.map(function (wa, i) {
        var d = digits(wa);
        return '<a href="https://wa.me/' + d + '" target="_blank" rel="noopener" class="block text-slate-500 font-light text-sm hover:text-blue-950 smooth-transition">' + (i === 0 ? "Message the Academy" : fmtPhone(wa)) + "</a>";
      }).join("");
    }
    if (banner && whatsapps.length) {
      banner.setAttribute("href", "https://wa.me/" + digits(whatsapps[0]));
    }
    if (whatsapps.length) {
      window.CGTIA_WHATSAPP_NUMBER = digits(whatsapps[0]);
    }
    if (emailEl && emails.length) {
      emailEl.innerHTML = emails.map(function (em) {
        return '<a href="mailto:' + em + '" class="block text-slate-500 font-light text-sm hover:text-blue-950 smooth-transition">' + em + "</a>";
      }).join("");
    }
    if (mapEl && data.mapLat != null && data.mapLng != null) {
      var lat = String(data.mapLat).trim();
      var lng = String(data.mapLng).trim();
      if (lat && lng) {
        mapEl.src = "https://maps.google.com/maps?q=" + encodeURIComponent(lat + "," + lng) + "&z=15&output=embed";
      }
    }

    // Office hours (editable in admin)
    var hoursList = document.getElementById("contact-hours-list");
    if (hoursList && Array.isArray(data.officeHours) && data.officeHours.length) {
      hoursList.innerHTML = data.officeHours.map(function (h) {
        var l = String(h.label || "").replace(/</g, "&lt;");
        var t = String(h.time || "").replace(/</g, "&lt;");
        return '<div class="flex justify-between border-b border-slate-200/50 pb-3"><span>' + l + '</span><span class="text-blue-950 font-medium">' + t + "</span></div>";
      }).join("");
    }

    // Contact form wording (editable in admin)
    var ftEl = document.querySelector("[data-contact-form-title]");
    if (ftEl && data.formTitle) ftEl.textContent = data.formTitle;
    var fiEl = document.querySelector("[data-contact-form-intro]");
    if (fiEl && data.formIntro) fiEl.textContent = data.formIntro;

    // FAQs
    var faqs = Array.isArray(data.faqs) ? data.faqs : [];
    var list = document.getElementById("contact-faq-list");
    if (list && faqs.length) {
      list.innerHTML = faqs.map(function (f) {
        var q = (f.q || f.question || "").replace(/</g, "&lt;");
        var a = (f.a || f.answer || "").replace(/</g, "&lt;");
        return (
          '<div class="faq-item">' +
          '<button type="button" onclick="toggleFaq(this)" class="w-full flex justify-between items-center py-6 text-left gap-4">' +
          '<span class="font-editorial text-lg md:text-xl font-bold text-blue-950">' + q + "</span>" +
          '<svg class="faq-chevron w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>' +
          "</button>" +
          '<div class="faq-answer"><p class="text-slate-500 font-light text-sm leading-relaxed pb-2">' + a + "</p></div>" +
          "</div>"
        );
      }).join("");
    }
  } catch (err) {
    console.warn("applyContactPage", err);
  }
};

// Run on load and after SPA navigation
(function () {
  function run() {
    if (typeof window.__cgtiaApplyContactPage === "function") {
      window.__cgtiaApplyContactPage();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  document.addEventListener("cgtia:page", run);
  setTimeout(run, 400);
  setTimeout(run, 1200);
})();

