
    window.addEventListener('DOMContentLoaded', () => {
      initProgramArcEngine();
      initFunctionalDragHandleEngine();
    });

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

    function navigateWithPill(label, href) {
      const currentFile = window.location.pathname.split('/').pop() || 'index.html';
      const isSamePage = currentFile === href || (href === 'index.html' && currentFile === '');

      closeMobileBottomSheetIfOpen();

      const pillWrap = document.getElementById('morphingIndicatorPill');
      const labelText = document.getElementById('morphingIndicatorText');
      const sheetCloseDelay = 260;
      const preNavSpin = 3000;

      setTimeout(() => {
        pillWrap.classList.remove('pill-error');
        labelText.innerText = label;
        pillWrap.classList.add('state-expanded');

        if (isSamePage) {
          setTimeout(() => { pillWrap.classList.remove('state-expanded'); }, preNavSpin);
          return;
        }

        if (navigator && navigator.onLine === false) {
          setTimeout(() => {
            labelText.innerText = 'Check Your Network';
            pillWrap.classList.add('pill-error');
            __pillRetry = function () {
              stopNetworkWatch();
              pillWrap.classList.remove('pill-error');
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

        setTimeout(() => { window.location.href = href; }, preNavSpin);
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

    /* --- BOTTOM SHEET & BACKGROUND OVERSCROLL LOCK MECHANICS --- */
    function toggleMobileBottomSheet() {
      const container = document.getElementById('mobileBottomSheet');
      const drawer = document.getElementById('bottomSheetDrawer');
      
      if (container.classList.contains('pointer-events-none')) {
        container.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        container.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        drawer.style.transform = 'translateY(0)';
        
        // Strict background scrolling freeze execution
        document.body.style.overflow = 'hidden';
      } else {
        container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        drawer.style.transform = 'translateY(100%)';
        
        // Restore standard layout scrolling states
        document.body.style.overflow = '';
      }
    }

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
      buildArcIndicators();
      updateArcLayout();
      setupArcInteraction();
    }

    function buildArcIndicators() {
      const dotsContainer = document.getElementById('arc-dots');
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalArcCards; i++) {
        const dot = document.createElement('div');
        dot.className = `h-1.5 rounded-full transition-all duration-500 ${i === activeArcIndex ? 'w-6 bg-blue-950' : 'w-1.5 bg-slate-300'}`;
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
    function toggleApplyScreen() {
      const container = document.getElementById('applyScreen');
      const drawer = document.getElementById('applyDrawer');
      const isClosed = container.classList.contains('pointer-events-none');

      if (isClosed) {
        container.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        container.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        drawer.style.transform = 'translateY(0)';
        drawer.style.opacity = '1';
        document.body.style.overflow = 'hidden';
      } else {
        container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        drawer.style.transform = '';
        drawer.style.opacity = '';
        document.body.style.overflow = '';
      }
    }

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
      document.getElementById('statusTitle').innerText = title || 'Application Received';
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
        window.location.href = 'licensing.html';
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

    function openPaymentScreen(programKey, applicantEmail) {
      __currentPaymentProgram = PROGRAM_INFO[programKey] || { name: 'CGTIA Program', amount: 0 };
      __currentPaymentEmail = applicantEmail || '';

      document.getElementById('transferProgramDisplay').innerText = __currentPaymentProgram.name;
      document.getElementById('cardProgramDisplay').innerText = __currentPaymentProgram.name;

      // Split evenly into 3, with any remainder absorbed by the 3rd
      // installment so the three amounts always add up exactly to the total.
      const total = __currentPaymentProgram.amount || 0;
      const i1 = Math.round(total / 3);
      const i2 = Math.round(total / 3);
      const i3 = total - i1 - i2;
      __installmentAmounts = [i1, i2, i3];
      document.getElementById('installment1Amount').innerText = formatNaira(i1);
      document.getElementById('installment2Amount').innerText = formatNaira(i2);
      document.getElementById('installment3Amount').innerText = formatNaira(i3);

      switchPaymentPlan('full');
      switchPaymentTab('transfer');

      const container = document.getElementById('paymentScreen');
      const drawer = document.getElementById('paymentDrawer');
      container.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      container.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      drawer.style.transform = 'translateY(0)';
      drawer.style.opacity = '1';
      document.body.style.overflow = 'hidden';
    }

    function closePaymentScreen() {
      const container = document.getElementById('paymentScreen');
      const drawer = document.getElementById('paymentDrawer');
      container.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      container.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      drawer.style.transform = '';
      drawer.style.opacity = '';
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

  
