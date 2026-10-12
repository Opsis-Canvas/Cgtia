/**
 * Original page markup for custom — visual source of truth (do not redesign)
 */
export const custom_html = `

  <!-- Faded Sticky Header -->
  <header class="faded-sticky-header w-full smooth-transition">
    <div class="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
      <a href="/" data-pill-label="Home" class="font-editorial text-xl md:text-2xl font-bold tracking-tight text-blue-950">CGTIA.</a>
      <nav class="hidden md:flex space-x-7 text-xs font-semibold tracking-widest uppercase text-slate-500">
        <a href="/" class="hover:text-blue-950 smooth-transition">Home</a>
        <a href="/about" class="hover:text-blue-950 smooth-transition">About</a>
        <a href="/programs" class="hover:text-blue-950 smooth-transition">Programs</a>
        <a href="/gallery" class="hover:text-blue-950 smooth-transition">Gallery</a>
        <a href="/tuition" class="hover:text-blue-950 smooth-transition">Tuition</a>
        <a href="/contact" class="hover:text-blue-950 smooth-transition">Contact</a>
      </nav>

      <!-- Desktop Interface Control Matrix -->
      <div class="hidden md:flex items-center space-x-8">
        <a href="#" onclick="toggleAuthScreen('signin'); return false;" class="text-xs font-semibold tracking-widest uppercase text-slate-500 hover:text-blue-950 smooth-transition">Portal</a>
        <button onclick="toggleApplyScreen()" class="soft-component-card px-7 py-3 rounded-full text-xs font-semibold tracking-wider uppercase text-blue-950 border border-transparent hover:border-slate-200/50 smooth-transition">
          Apply Now
        </button>
      </div>

      <!-- Mobile Structural Adaption -->
      <button onclick="toggleApplyScreen()" class="block md:hidden bg-blue-950 text-white px-5 py-2 rounded-full text-[11px] font-medium tracking-wider uppercase shadow-md active:scale-95 transition-transform">
        Apply
      </button>
    </div>
  </header>

  <!-- Hero -->
  <section class="w-full max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-14 md:pb-20 text-center">
    <span class="text-xs font-bold tracking-widest text-blue-800 uppercase block mb-6 opacity-0 animate-[fadeIn_1s_ease-out_0.2s_forwards]">Clinical Placement & Partnerships</span>
    <h1 class="font-editorial text-4xl sm:text-6xl md:text-7xl text-blue-950 font-bold tracking-tight leading-[1.1] mb-8 opacity-0 blur-md animate-[blurFadeIn_1.6s_cubic-bezier(0.16,1,0.3,1)_0.3s_forwards]">
      Custom <span class="italic font-normal text-blue-900/90">Requests</span>.
    </h1>
    <p class="max-w-2xl mx-auto text-slate-500 text-base md:text-xl font-light leading-relaxed opacity-0 animate-[fadeIn_1.2s_ease-out_0.7s_forwards]">
      For anyone seeking clinical placement outside our standard programs &mdash; individuals, schools sending students, or organizations training staff. Pricing is quoted case by case.
    </p>
  </section>

  <!-- What We Offer -->
  <section class="w-full max-w-7xl mx-auto px-6 pb-20 md:pb-24">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      <div class="soft-component-card p-8 md:p-10 rounded-[2.5rem] flex flex-col gap-4 border border-white/60">
        <span class="text-xs font-bold tracking-widest text-blue-800 uppercase">For Individuals</span>
        <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold">Just Need Placement Hours</h3>
        <p class="text-slate-500 font-light text-sm leading-relaxed">Already trained elsewhere and just need supervised clinical hours to complete your qualification? We can host you directly.</p>
      </div>
      <div class="soft-component-card p-8 md:p-10 rounded-[2.5rem] flex flex-col gap-4 border border-white/60">
        <span class="text-xs font-bold tracking-widest text-blue-800 uppercase">For Schools</span>
        <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold">Host Your Students</h3>
        <p class="text-slate-500 font-light text-sm leading-relaxed">Your students complete supervised clinical hours at CGTIA's training center and partner facilities, under our placement team.</p>
      </div>
      <div class="soft-component-card p-8 md:p-10 rounded-[2.5rem] flex flex-col gap-4 border border-white/60">
        <span class="text-xs font-bold tracking-widest text-blue-800 uppercase">For Organizations</span>
        <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold">Train Your Staff</h3>
        <p class="text-slate-500 font-light text-sm leading-relaxed">We bring CGTIA's curriculum to your facility &mdash; ideal for care homes and clinics upskilling existing staff as a group.</p>
      </div>
    </div>
  </section>

  <!-- Request Form -->
  <section class="w-full max-w-4xl mx-auto px-6 pb-32 md:pb-48">
    <div class="text-left mb-8 md:mb-10">
      <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-3">Request a Quote</span>
      <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">Tell Us Who You Are</h2>
    </div>

    <!-- Applicant Type Selector -->
    <div class="flex gap-1.5 mb-8 bg-slate-100 rounded-full p-1.5 max-w-md">
      <button type="button" id="typeIndividualBtn" onclick="switchCustomType('individual')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white text-blue-950 shadow-sm smooth-transition">Individual</button>
      <button type="button" id="typeSchoolBtn" onclick="switchCustomType('school')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-500 smooth-transition">School</button>
      <button type="button" id="typeOrgBtn" onclick="switchCustomType('organization')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-500 smooth-transition">Organization</button>
    </div>

    <form id="customForm" class="soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/60 space-y-5" onsubmit="handleCustomSubmit(event)">
      <div class="hidden" aria-hidden="true">
        <label for="customWebsiteField">Leave this field empty</label>
        <input type="text" id="customWebsiteField" name="website" tabindex="-1" autocomplete="off">
      </div>

      <!-- Shared fields -->
      <div>
        <label id="nameFieldLabel" class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Full Name</label>
        <input required id="nameField" type="text" placeholder="e.g. Ada Okonkwo" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Email Address</label>
          <input required type="email" placeholder="you@email.com" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Phone Number</label>
          <input required type="tel" placeholder="080X XXX XXXX" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
      </div>

      <!-- Individual-only fields -->
      <div id="individualFields" class="space-y-5">
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Prior Caregiving Training</label>
          <select class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
            <option>Certified elsewhere, need clinical hours</option>
            <option>Some informal experience, no certificate</option>
            <option>No prior training</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">What are you hoping to get from placement?</label>
          <textarea rows="3" placeholder="e.g. I need 72 supervised hours to complete my licensing" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition resize-none"></textarea>
        </div>
      </div>

      <!-- School-only fields -->
      <div id="schoolFields" class="space-y-5 hidden">
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">School / Academy Name</label>
          <input type="text" placeholder="e.g. Riverside Health Academy" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Your Role</label>
          <input type="text" placeholder="e.g. Academic Coordinator" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Number of Students</label>
            <input type="number" min="1" placeholder="e.g. 15" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Preferred Start Period</label>
            <input type="text" placeholder="e.g. Q1 2027" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Anything else we should know?</label>
          <textarea rows="3" placeholder="Program depth, duration, or other details" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition resize-none"></textarea>
        </div>
      </div>

      <!-- Organization-only fields -->
      <div id="organizationFields" class="space-y-5 hidden">
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Organization Name</label>
          <input type="text" placeholder="e.g. Sunrise Care Homes Ltd" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Type of Request</label>
          <select class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
            <option>On-Site Staff Training</option>
            <option>Bulk / Cohort Enrollment</option>
            <option>Other Partnership</option>
          </select>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Number of Trainees</label>
            <input type="number" min="1" placeholder="e.g. 20" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Preferred Start Period</label>
            <input type="text" placeholder="e.g. Q1 2027" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Anything else we should know?</label>
          <textarea rows="3" placeholder="Scope, duration, or other details" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition resize-none"></textarea>
        </div>
      </div>

      <button type="submit" class="w-full mt-2 py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
        Request a Quote
      </button>
    </form>
  </section>

  <!-- Grounded Layout Footer Container -->
  <footer class="w-full relative bg-slate-50 border-t border-slate-200/50 pt-28 md:pt-48 pb-24 md:pb-16 overflow-hidden">
    <div class="absolute inset-x-0 bottom-0 w-full text-center z-0 select-none overflow-hidden translate-y-[15%] md:translate-y-[22%]">
      <h2 class="font-editorial text-[24vw] font-bold watermark-text-depth uppercase tracking-tighter">CGTIA</h2>
    </div>

    <div class="w-full max-w-7xl mx-auto px-6 relative z-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 pb-24 md:pb-32">
        <div class="space-y-4">
          <h4 class="text-xs font-bold tracking-widest text-blue-950 uppercase">Academy</h4>
          <ul class="space-y-2.5 text-sm text-slate-500 font-light">
            <li><a href="/about" class="hover:text-blue-950 smooth-transition">About CGTIA</a></li>
            <li><a href="/programs" class="hover:text-blue-950 smooth-transition">Programs</a></li>
            <li><a href="/gallery" class="hover:text-blue-950 smooth-transition">Gallery</a></li>
          </ul>
        </div>
        <div class="space-y-4">
          <h4 class="text-xs font-bold tracking-widest text-blue-950 uppercase">Admissions</h4>
          <ul class="space-y-2.5 text-sm text-slate-500 font-light">
            <li><a href="/tuition" class="hover:text-blue-950 smooth-transition">Tuition & Fees</a></li>
            <li><a href="#" onclick="toggleApplyScreen(); return false;" class="hover:text-blue-950 smooth-transition">Apply Now</a></li>
            <li><a href="/licensing" class="hover:text-blue-950 smooth-transition">Licensing Application</a></li>
            <li><a href="/custom" class="hover:text-blue-950 smooth-transition">Institutional Partnerships</a></li>
            <li><a href="/verify" class="hover:text-blue-950 smooth-transition">Verify</a></li>
          </ul>
        </div>
        <div class="space-y-4">
          <h4 class="text-xs font-bold tracking-widest text-blue-950 uppercase">Access</h4>
          <ul class="space-y-2.5 text-sm text-slate-500 font-light">
            <li><a href="#" onclick="toggleAuthScreen('signin'); return false;" class="hover:text-blue-950 smooth-transition">Portal</a></li>
            <li><a href="#" class="hover:text-blue-950 smooth-transition" href="/contact">Inquiries</a></li>
            <li><a href="/contact" class="hover:text-blue-950 smooth-transition">Press Room</a></li>
          </ul>
        </div>
        <div class="space-y-4">
          <h4 class="text-xs font-bold tracking-widest text-blue-950 uppercase">Location</h4>
          <p class="text-sm text-slate-500 font-light leading-relaxed">CGTIA training center<br>Imo State, Nigeria</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-200/60 text-[10px] md:text-xs font-medium text-slate-400 tracking-wider uppercase gap-4">
        <div class="flex space-x-8">
          <a href="/terms" class="hover:text-blue-950 smooth-transition">Terms of Use</a>
          <a href="/privacy" class="hover:text-blue-950 smooth-transition">Privacy Standards</a>
        </div>
        <p>&copy; 2026 Caregivers Training & Internship Academy Limited.</p>
      </div>
    </div>
  </footer>

  <!-- Fixed Bottom-Right Action Core -->
  <div class="block md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-end gap-3 pointer-events-none">
    <div id="morphingIndicatorPill" onclick="retryPillNav()" class="relative morph-nav-pill h-14 bg-slate-950 text-white rounded-full flex items-center justify-center px-6 border border-white/10 shadow-xl overflow-hidden backdrop-blur-2xl">
      <span id="morphingIndicatorText" class="text-[10px] font-bold tracking-[0.25em] uppercase text-blue-100 truncate">Home</span>
    </div>
    <button onclick="toggleMobileBottomSheet()" class="pointer-events-auto w-14 h-14 bg-slate-950 rounded-full flex items-center justify-center border border-white/10 text-white shadow-xl active:scale-95 transition-transform duration-200 shrink-0">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-4.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-4.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
      </svg>
    </button>
  </div>

  <!-- Mobile Sheet Index Drawer Container -->
  <div id="mobileBottomSheet" class="block md:hidden fixed inset-0 z-50 pointer-events-none transition-all duration-500 bg-slate-950/0 backdrop-blur-0">
    <div id="bottomSheetDrawer" class="absolute bottom-0 inset-x-0 w-full max-h-[85vh] bg-white rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(15,23,42,0.15)] border-t border-slate-100 p-8 pt-4 pointer-events-auto transform translate-y-full transition-transform duration-500 cubic-bezier(0.16,1,0.3,1) flex flex-col">
      <div id="dragHandleWrapper" class="w-full py-4 cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto"></div>
      </div>
      <div class="flex justify-between items-center mb-4 shrink-0">
        <span class="font-editorial text-lg font-bold text-blue-950">Explore CGTIA</span>
        <button onclick="toggleMobileBottomSheet()" class="text-xs font-bold tracking-widest text-slate-400 uppercase">Close</button>
      </div>
      <div class="overflow-y-auto no-scrollbar py-2 space-y-2 grow">
        <div onclick="navigateWithPill('Home', 'index.html')" class="px-6 py-4 rounded-2xl hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors">
          <span class="font-sans-clean text-sm font-medium text-slate-700">Home</span>
          <span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">01</span>
        </div>
        <div onclick="navigateWithPill('About', 'about.html')" class="px-6 py-4 rounded-2xl hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors">
          <span class="font-sans-clean text-sm font-medium text-slate-700">About Academy</span>
          <span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">02</span>
        </div>
        <div onclick="navigateWithPill('Tuition', 'tuition.html')" class="px-6 py-4 rounded-2xl hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors">
          <span class="font-sans-clean text-sm font-medium text-slate-700">Tuition & Fees</span>
          <span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">03</span>
        </div>
        <div onclick="navigateWithPill('Programs', 'programs.html')" class="px-6 py-4 rounded-2xl hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors">
          <span class="font-sans-clean text-sm font-medium text-slate-700">Programs</span>
          <span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">04</span>
        </div>
        <div onclick="navigateWithPill('Gallery', 'gallery.html')" class="px-6 py-4 rounded-2xl hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors">
          <span class="font-sans-clean text-sm font-medium text-slate-700">Gallery</span>
          <span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">05</span>
        </div>
        <div onclick="navigateWithPill('Contact', 'contact.html')" class="px-6 py-4 rounded-2xl hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors">
          <span class="font-sans-clean text-sm font-medium text-slate-700">Contact</span>
          <span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">06</span>
        </div>
      </div>
      <div class="pt-6 mt-4 border-t border-slate-100 shrink-0 space-y-3">
        <button onclick="toggleMobileBottomSheet(); setTimeout(() => toggleAuthScreen('signin'), 450);" class="w-full py-4 rounded-2xl bg-slate-950 text-white font-sans-clean text-xs font-semibold tracking-widest uppercase shadow-md active:scale-[0.99] transition-transform">
          School Portal
        </button>
      </div>
    </div>
  </div>

  <!-- Apply Screen Overlay -->
  <div id="applyScreen" class="fixed inset-0 z-[60] pointer-events-none transition-all duration-500 bg-slate-950/0 backdrop-blur-0 flex items-end md:items-center md:justify-center">
    <div id="applyDrawer" class="w-full md:w-[560px] md:max-h-[88vh] max-h-[92vh] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-15px_40px_rgba(15,23,42,0.15)] md:shadow-2xl border-t md:border border-slate-100 p-8 md:p-10 pointer-events-auto transform translate-y-full md:translate-y-8 md:opacity-0 transition-transform md:transition-all duration-500 flex flex-col overflow-y-auto no-scrollbar">
      <div class="w-full py-2 mb-2 md:hidden">
        <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto"></div>
      </div>
      <div class="flex justify-between items-start mb-6 shrink-0">
        <div>
          <span class="text-xs font-bold tracking-widest text-blue-800 uppercase block mb-2">Admissions</span>
          <h3 class="font-editorial text-2xl md:text-3xl font-bold text-blue-950">Apply to CGTIA</h3>
        </div>
        <button onclick="toggleApplyScreen()" class="text-xs font-bold tracking-widest text-slate-400 uppercase mt-2">Close</button>
      </div>
      <form id="applyForm" class="space-y-5" onsubmit="handleApplySubmit(event)">
        <div class="hidden" aria-hidden="true">
          <label for="applyWebsiteField">Leave this field empty</label>
          <input type="text" id="applyWebsiteField" name="website" tabindex="-1" autocomplete="off">
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Full Name</label>
          <input required type="text" placeholder="e.g. Ada Okonkwo" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Phone Number</label>
            <input required type="tel" placeholder="080X XXX XXXX" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Email Address</label>
            <input required type="email" placeholder="you@email.com" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Program of Interest</label>
          <select id="programSelect" required onchange="handleProgramChange()" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
            <option value="">Select a program</option>
            <option value="certificate">CGTIA Certificate</option>
            <option value="diploma">CGTIA Diploma</option>
            <option value="higher-diploma">CGTIA Higher Diploma</option>
            <option value="licensing">Licensing</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Program Start Date</label>
          <div id="startDateDisplay" class="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-sm text-slate-400">Select a program to see its fixed start date</div>
          <p class="text-[11px] text-slate-400 mt-2">Each cohort has one fixed start date &mdash; there's no need to pick your own.</p>
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Tell us a little about you</label>
          <textarea rows="3" placeholder="Why are you interested in caregiving training?" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition resize-none"></textarea>
        </div>
        <button type="submit" class="w-full mt-4 py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
          Submit Application
        </button>
      </form>
    </div>
  </div>

  <!-- Submission Status Overlay (mobile bottom-sheet style) -->
  <div id="statusScreen" class="fixed inset-0 z-[70] pointer-events-none transition-all duration-500 bg-slate-950/0 backdrop-blur-0 flex items-end md:items-center md:justify-center">
    <div id="statusDrawer" class="w-full md:w-[420px] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-15px_40px_rgba(15,23,42,0.15)] md:shadow-2xl border-t md:border border-slate-100 p-8 md:p-10 pb-10 pointer-events-auto transform translate-y-full md:translate-y-8 md:opacity-0 transition-transform md:transition-all duration-500 flex flex-col items-center text-center">
      <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4 md:hidden"></div>
      <div id="statusIconWrap" class="w-20 h-20 rounded-full flex items-center justify-center my-4 bg-blue-50"></div>
      <h3 id="statusTitle" class="font-editorial text-2xl font-bold text-blue-950 mb-3">Sending your application&hellip;</h3>
      <p id="statusMessage" class="text-sm text-slate-500 font-light leading-relaxed mb-8 max-w-[280px]">Please hold on while we submit your details to admissions.</p>
      <button id="statusActionBtn" class="hidden w-full py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">Done</button>
    </div>
  </div>

  <!-- Payment Screen Overlay (Paystack — transfer preferred, card also available) -->
  <div id="paymentScreen" class="fixed inset-0 z-[75] pointer-events-none transition-all duration-500 bg-slate-950/0 backdrop-blur-0 flex items-end md:items-center md:justify-center">
    <div id="paymentDrawer" class="w-full md:w-[480px] md:max-h-[88vh] max-h-[92vh] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-15px_40px_rgba(15,23,42,0.15)] md:shadow-2xl border-t md:border border-slate-100 p-8 md:p-10 pointer-events-auto transform translate-y-full md:translate-y-8 md:opacity-0 transition-transform md:transition-all duration-500 flex flex-col overflow-y-auto no-scrollbar">
      <div class="w-full py-2 mb-2 md:hidden">
        <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto"></div>
      </div>
      <div class="flex justify-between items-start mb-6 shrink-0">
        <div>
          <span class="text-xs font-bold tracking-widest text-blue-800 uppercase block mb-2">Secure Payment</span>
          <h3 class="font-editorial text-2xl md:text-3xl font-bold text-blue-950">Complete Your Payment</h3>
        </div>
        <button onclick="closePaymentScreen()" class="text-xs font-bold tracking-widest text-slate-400 uppercase mt-2">Close</button>
      </div>

      <!-- Payment plan: pay in full, or 3 installments -->
      <div class="flex gap-1.5 mb-3 bg-slate-100 rounded-full p-1.5 shrink-0">
        <button id="planFullBtn" onclick="switchPaymentPlan('full')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white text-blue-950 shadow-sm smooth-transition">Full Payment</button>
        <button id="planInstallmentBtn" onclick="switchPaymentPlan('installment')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-500 smooth-transition">3 Installments</button>
      </div>

      <div id="installmentBreakdown" class="hidden rounded-2xl bg-slate-50 border border-slate-200 p-5 mb-5 space-y-3">
        <div class="flex justify-between items-center pb-3 border-b border-slate-200">
          <span class="text-xs font-semibold text-blue-950">1st Installment <span class="text-emerald-600">(Due Now)</span></span>
          <span id="installment1Amount" class="text-sm font-bold text-blue-950">&#8358;0</span>
        </div>
        <div class="flex justify-between items-center pb-3 border-b border-slate-200">
          <span class="text-xs font-semibold text-slate-500">2nd Installment</span>
          <span id="installment2Amount" class="text-sm font-bold text-slate-500">&#8358;0</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs font-semibold text-slate-500">3rd Installment</span>
          <span id="installment3Amount" class="text-sm font-bold text-slate-500">&#8358;0</span>
        </div>
      </div>
      <p id="installmentNote" class="hidden text-[11px] text-slate-400 mb-5 leading-relaxed">Your login code is sent as soon as this first installment is confirmed &mdash; we'll follow up about installments 2 and 3 as your program progresses.</p>

      <div class="flex gap-1.5 mb-6 bg-slate-100 rounded-full p-1.5 shrink-0">
        <button id="tabTransferBtn" onclick="switchPaymentTab('transfer')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white text-blue-950 shadow-sm smooth-transition">Bank Transfer</button>
        <button id="tabCardBtn" onclick="switchPaymentTab('card')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-500 smooth-transition">Card</button>
      </div>

      <div id="transferPane">
        <p class="text-xs text-slate-500 leading-relaxed mb-5">Copy each detail below exactly &mdash; including the amount and the program name for your transfer remark &mdash; then tap "I've Made This Transfer." This is our preferred payment method.</p>
        <div class="space-y-3">
          <div class="flex justify-between items-center px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div class="min-w-0">
              <span class="text-[10px] font-bold uppercase tracking-widest text-amber-700 block mb-1">Program <span class="normal-case font-medium">(use as remark)</span></span>
              <span id="transferProgramDisplay" class="text-sm font-semibold text-amber-950 break-words">&mdash;</span>
            </div>
            <button onclick="copyFieldValue('transferProgramDisplay','copyProgramBtn')" id="copyProgramBtn" class="text-[10px] font-bold tracking-widest uppercase text-amber-800 border border-amber-300 px-4 py-2.5 rounded-full hover:bg-amber-100 smooth-transition shrink-0">Copy</button>
          </div>
          <div class="flex justify-between items-center px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-amber-700 block mb-1">Amount to Transfer</span>
              <span id="transferAmountDisplay" class="font-editorial text-xl sm:text-2xl font-bold text-amber-950">&#8358;0</span>
            </div>
            <button onclick="copyFieldValue('transferAmountDisplay','copyAmountBtn')" id="copyAmountBtn" class="text-[10px] font-bold tracking-widest uppercase text-amber-800 border border-amber-300 px-4 py-2.5 rounded-full hover:bg-amber-100 smooth-transition shrink-0">Copy</button>
          </div>
          <div class="flex justify-between items-center px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Bank Name</span>
              <span class="text-sm font-semibold text-blue-950">[Bank Name Here]</span>
            </div>
          </div>
          <div class="flex justify-between items-center px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Account Number</span>
              <span id="acctNumberText" class="text-lg font-bold tracking-wider text-blue-950 font-mono">0000000000</span>
            </div>
            <button onclick="copyFieldValue('acctNumberText','copyAcctBtn')" id="copyAcctBtn" class="text-[10px] font-bold tracking-widest uppercase text-blue-800 border border-blue-200 px-4 py-2.5 rounded-full hover:bg-blue-50 smooth-transition shrink-0">Copy</button>
          </div>
          <div class="flex justify-between items-center px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Account Name</span>
              <span class="text-sm font-semibold text-blue-950">Caregivers Training & Internship Academy Ltd</span>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-4 leading-relaxed">Cross-check the account name shown above with your bank app before sending &mdash; it should read exactly "Caregivers Training & Internship Academy Ltd."</p>
        <button onclick="handleTransferConfirm()" class="w-full mt-6 py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
          I've Made This Transfer
        </button>
        <p class="text-[11px] text-slate-400 mt-3 text-center leading-relaxed">We verify transfers manually and will confirm your seat by email &mdash; this can take a little while.</p>
      </div>

      <div id="cardPane" class="hidden">
        <div class="flex justify-between items-center px-5 py-4 rounded-2xl bg-blue-50 border border-blue-100 mb-5">
          <div class="min-w-0">
            <span class="text-[10px] font-bold uppercase tracking-widest text-blue-700 block mb-1">You're Paying For</span>
            <span id="cardProgramDisplay" class="text-sm font-semibold text-blue-950 break-words">&mdash;</span>
          </div>
          <span id="cardAmountDisplay" class="font-editorial text-xl font-bold text-blue-950 shrink-0">&#8358;0</span>
        </div>
        <p class="text-xs text-slate-500 leading-relaxed mb-5">Pay securely by card through Paystack's checkout.</p>
        <div class="px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5 flex items-center gap-3">
          <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg>
          <span class="text-xs text-slate-500">You'll be taken to Paystack's secure checkout to enter your card details.</span>
        </div>
        <button onclick="payWithPaystackCard()" class="w-full py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
          Pay with Card
        </button>
      </div>
    </div>
  </div>

  <!-- Sign In Screen Overlay -->
  <div id="authScreen" class="fixed inset-0 z-[60] pointer-events-none transition-all duration-500 bg-slate-950/0 backdrop-blur-0 flex items-end md:items-center md:justify-center">
    <div id="authDrawer" class="w-full md:w-[440px] max-h-[92vh] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-15px_40px_rgba(15,23,42,0.15)] md:shadow-2xl border-t md:border border-slate-100 p-8 md:p-10 pointer-events-auto transform translate-y-full md:translate-y-8 md:opacity-0 transition-transform md:transition-all duration-500 flex flex-col overflow-y-auto no-scrollbar">
      <div class="w-full py-2 mb-2 md:hidden">
        <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto"></div>
      </div>
      <div class="flex justify-between items-start mb-8 shrink-0">
        <div>
          <h3 id="authTitle" class="font-editorial text-2xl md:text-3xl font-bold text-blue-950">Student Portal</h3>
          <p class="text-xs text-slate-400 mt-1.5">Sign in with the email and code sent after your payment was confirmed.</p>
        </div>
        <button onclick="toggleAuthScreen()" class="text-xs font-bold tracking-widest text-slate-400 uppercase mt-2 shrink-0">Close</button>
      </div>
      <p id="authErrorMsg" class="hidden text-xs text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5"></p>
      <form id="authForm" class="space-y-5" onsubmit="return false;">
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Email Address</label>
          <input required type="email" placeholder="you@email.com" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Password / Login Code</label>
          <input required type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <button id="authSubmitBtn" type="button" onclick="handleAuthSubmit(event)" class="w-full mt-2 py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
          Sign In
        </button>
        <button type="button" onclick="openForgotPasswordScreen()" class="w-full text-center text-xs font-semibold text-slate-400 hover:text-blue-950 smooth-transition">
          Forgot your password?
        </button>
      </form>
    </div>
  </div>

  <!-- Forgot Password Overlay -->
  <div id="forgotPasswordScreen" class="fixed inset-0 z-[62] pointer-events-none transition-all duration-500 bg-slate-950/0 backdrop-blur-0 flex items-end md:items-center md:justify-center">
    <div id="forgotPasswordDrawer" class="w-full md:w-[420px] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-15px_40px_rgba(15,23,42,0.15)] md:shadow-2xl border-t md:border border-slate-100 p-8 md:p-10 pointer-events-auto transform translate-y-full md:translate-y-8 md:opacity-0 transition-transform md:transition-all duration-500 flex flex-col overflow-y-auto no-scrollbar">
      <div class="w-full py-2 mb-2 md:hidden">
        <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto"></div>
      </div>
      <div class="flex justify-between items-start mb-6 shrink-0">
        <div>
          <span class="text-xs font-bold tracking-widest text-blue-800 uppercase block mb-2">Reset Access</span>
          <h3 class="font-editorial text-2xl font-bold text-blue-950">Forgot Your Password?</h3>
        </div>
        <button onclick="closeForgotPasswordScreen()" class="text-xs font-bold tracking-widest text-slate-400 uppercase mt-2">Close</button>
      </div>
      <p class="text-xs text-slate-500 leading-relaxed mb-6">Enter the email you applied with, and we'll send a link to reset your password.</p>
      <form id="forgotPasswordForm" class="space-y-5" onsubmit="return false;">
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Email Address</label>
          <input required type="email" id="forgotPasswordEmail" placeholder="you@email.com" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <button id="forgotPasswordSubmitBtn" type="button" onclick="handleForgotPasswordSubmit(event)" class="w-full py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
          Send Reset Link
        </button>
        <button type="button" onclick="closeForgotPasswordScreen(); setTimeout(() => toggleAuthScreen('signin'), 350);" class="w-full text-center text-xs font-semibold text-slate-400 hover:text-blue-950 smooth-transition">
          Back to Sign In
        </button>
      </form>
    </div>
  </div>

  <!-- Forced First-Login Password Change Overlay -->
  <div id="forcePasswordScreen" class="fixed inset-0 z-[68] pointer-events-none transition-all duration-500 bg-slate-950/0 backdrop-blur-0 flex items-end md:items-center md:justify-center">
    <div id="forcePasswordDrawer" class="w-full md:w-[440px] bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-15px_40px_rgba(15,23,42,0.15)] md:shadow-2xl border-t md:border border-slate-100 p-8 md:p-10 pointer-events-auto transform translate-y-full md:translate-y-8 md:opacity-0 transition-transform md:transition-all duration-500 flex flex-col overflow-y-auto no-scrollbar">
      <div class="w-full py-2 mb-2 md:hidden">
        <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto"></div>
      </div>
      <span class="text-xs font-bold tracking-widest text-blue-800 uppercase block mb-2">One Last Step</span>
      <h3 class="font-editorial text-2xl font-bold text-blue-950 mb-2">Set Your Password</h3>
      <p class="text-xs text-slate-500 leading-relaxed mb-6">This is your first time signing in &mdash; choose a permanent password to replace the code you were emailed.</p>
      <p id="forcePasswordError" class="hidden text-xs text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5"></p>
      <form id="forcePasswordForm" class="space-y-5" onsubmit="return false;">
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">New Password</label>
          <input required type="password" id="newPasswordField" minlength="8" placeholder="At least 8 characters" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Confirm New Password</label>
          <input required type="password" id="confirmPasswordField" minlength="8" placeholder="Type it again" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <button id="forcePasswordSubmitBtn" type="button" onclick="handleForcePasswordSubmit(event)" class="w-full py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
          Save & Continue
        </button>
      </form>
    </div>
  </div>

  

  `;
