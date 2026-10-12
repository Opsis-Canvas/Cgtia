/**
 * Original page markup for index — visual source of truth (do not redesign)
 */
export const index_html = `

  <!-- Faded Sticky Header -->
  <header class="faded-sticky-header w-full smooth-transition">
    <div class="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
      <span class="font-editorial text-xl md:text-2xl font-bold tracking-tight text-blue-950">CGTIA.</span>
      <nav class="hidden md:flex space-x-7 text-xs font-semibold tracking-widest uppercase text-slate-500">
        <a href="/" class="text-blue-950 hover:text-blue-950 smooth-transition">Home</a>
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

      <!-- Mobile Structural Adaption (Immediate Action Visibility Stack) -->
      <button onclick="toggleApplyScreen()" class="block md:hidden bg-blue-950 text-white px-5 py-2 rounded-full text-[11px] font-medium tracking-wider uppercase shadow-md active:scale-95 transition-transform">
        Apply
      </button>
    </div>
  </header>

  <!-- Hero Workspace -->
  <section class="w-full max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-28 md:pb-36 text-center">
    <span class="text-xs font-bold tracking-widest text-blue-800 uppercase block mb-6 opacity-0 animate-[fadeIn_1s_ease-out_0.2s_forwards]"><span data-site-setting="cohortLabel">Enrolling Now / 2026 Cohort</span></span>
    <h1 class="font-editorial text-4xl sm:text-6xl md:text-8xl text-blue-950 font-bold tracking-tight leading-[1.1] md:leading-[1.05] mb-8 md:mb-10 opacity-0 blur-md animate-[blurFadeIn_1.6s_cubic-bezier(0.16,1,0.3,1)_0.3s_forwards]">
      Compassionate care begins <br class="hidden sm:inline"><span class="italic font-normal text-blue-900/90">with real training</span>.
    </h1>
    <p class="max-w-2xl mx-auto text-slate-500 text-base md:text-xl font-light leading-relaxed mb-10 md:mb-14 opacity-0 animate-[fadeIn_1.2s_ease-out_0.7s_forwards]">
      Caregivers Training & Internship Academy Limited (CGTIA) equips everyday people with certified caregiving skills, hands-on clinical practice, hands-on practice, and access to internship opportunities — building careers rooted in dignity and care.
    </p>
    <div class="opacity-0 animate-[fadeIn_1.2s_ease-out_0.9s_forwards]">
      <button onclick="toggleApplyScreen()" class="bg-blue-950 text-white px-9 py-4 rounded-full text-sm font-medium tracking-wide shadow-2xl shadow-blue-950/10 hover:shadow-blue-950/20 hover:scale-[1.015] smooth-transition">
        Apply for Admission
      </button>
    </div>
  </section>

  <!-- Philosophy Narrative -->
  <section class="w-full max-w-7xl mx-auto px-6 pb-28 md:pb-40">
    <div class="w-full border-t border-slate-200/60 pt-12 md:pt-16 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
      <div class="w-full md:w-1/3">
        <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold leading-tight">Our Approach to Caregiving Education</h2>
      </div>
      <div class="w-full md:w-2/3 text-slate-500 font-light text-base md:text-lg leading-relaxed">
        <p>Caregiving is a skill that deserves proper training, not just good intentions. CGTIA blends structured learning with hands-on clinical practice and access to internship opportunities, so every graduate leaves ready to provide safe, competent, and compassionate care — whether in a client's home, a care facility, or a hospital setting.</p>
      </div>
    </div>
  </section>

  <!-- Curated Structures Grid Section -->
  <section class="w-full max-w-7xl mx-auto px-6 pb-32">
    <div class="text-left mb-12 md:mb-16">
      <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-3">Why CGTIA</span>
      <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">Built Around Real Practice</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 auto-rows-auto md:auto-rows-[18rem]">
      <div class="md:col-span-5 md:row-span-2 soft-component-card p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] flex flex-col justify-between gap-8 group smooth-transition cursor-pointer">
        <div>
          <span class="text-xs font-bold tracking-widest text-blue-800 uppercase block mb-6">01 / Practice</span>
          <h3 class="font-editorial text-2xl md:text-4xl text-blue-950 font-bold mb-4 group-hover:translate-x-1.5 smooth-transition leading-tight">Hands-On Clinical Training</h3>
        </div>
        <p class="text-slate-500 font-light text-sm md:text-base leading-relaxed">Every module pairs classroom instruction with supervised practical sessions, so students build real confidence in moving & handling, hygiene, and daily-care routines before they ever meet a client.</p>
      </div>

      <div class="md:col-span-7 md:row-span-1 soft-component-card p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] flex flex-col justify-between gap-6 group smooth-transition cursor-pointer">
        <div class="flex justify-between items-start gap-4">
          <h3 class="font-editorial text-2xl md:text-3xl text-blue-950 font-bold group-hover:translate-x-1.5 smooth-transition leading-tight">Guided Internship Placement</h3>
          <span class="text-xs font-bold tracking-widest text-slate-400 uppercase pt-1.5 shrink-0">02 / Placement</span>
        </div>
        <p class="text-slate-500 font-light text-sm md:text-base max-w-xl">We share internship opportunities with partner care homes, clinics, and private households where possible — supporting your transition into professional caregiving, without guaranteeing a specific placement.</p>
      </div>

      <div class="md:col-span-3 md:row-span-1 soft-component-card p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] flex flex-col justify-between gap-6 group smooth-transition cursor-pointer">
        <div>
          <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-4">03 / Flexible</span>
          <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold group-hover:translate-x-1.5 smooth-transition">Online and in person</h3>
        </div>
        <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed">Diploma coursework and reading materials delivered directly to your phone, so learning fits around work and family life.</p>
      </div>

      <div class="md:col-span-4 md:row-span-1 soft-component-card p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] flex flex-col justify-between gap-6 group smooth-transition cursor-pointer">
        <div>
          <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-4">04 / Certified</span>
          <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold group-hover:translate-x-1.5 smooth-transition">Recognized Certification</h3>
        </div>
        <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed">Every graduate receives a CGTIA diploma covering caregiving fundamentals, food hygiene, and safe patient handling.</p>
      </div>

      <div class="md:col-span-12 md:row-span-1 soft-component-card p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] flex flex-col md:flex-row justify-between items-start md:items-center group smooth-transition cursor-pointer gap-6">
        <div class="max-w-xl">
          <span class="text-xs font-bold tracking-widest text-blue-800 uppercase block mb-3">05 / Pathway</span>
          <h3 class="font-editorial text-2xl md:text-3xl text-blue-950 font-bold mb-2 group-hover:translate-x-1.5 smooth-transition">From Student to Certified Caregiver</h3>
          <p class="text-slate-500 font-light text-sm md:text-base">Coursework, clinical practice, exams, and internship opportunities — one clear pathway from enrollment to a confident caregiving career.</p>
        </div>
        <button onclick="toggleApplyScreen()" class="bg-blue-950 text-white px-7 py-3.5 rounded-full text-xs font-semibold tracking-widest uppercase shadow-xl hover:scale-105 smooth-transition shrink-0">
          Start Your Application
        </button>
      </div>
    </div>
  </section>

   <!-- NEW SECTION: Tuition & Program Fees -->
  <!-- Dynamic programme cards from admin (populated when CMS data loads) -->
  <div id="cgtiaHomeProgramCards" class="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"></div>

  <section id="tuition" data-has-dynamic-cards="1" class="w-full max-w-7xl mx-auto px-6 pb-36">
    <div class="text-left mb-12 md:mb-16">
      <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-3">Tuition Options</span>
      <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">Straightforward Program Fees</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
      
      <!-- Tier 1: Orientation -->
      <div class="soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/60 flex flex-col justify-between group smooth-transition">
        <div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="font-editorial text-xl font-bold text-blue-950">Orientation Track</h3>
              <p class="text-xs text-slate-400 mt-1">For first-time applicants</p>
            </div>
            <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 py-1 bg-white/50 rounded-full">Intro</span>
          </div>
          <div class="my-8">
            <span class="font-editorial text-5xl font-bold text-blue-950 tracking-tight">Free</span>
            <span class="text-xs text-slate-400 ml-2 uppercase tracking-wider">Info Session</span>
          </div>
          <ul class="space-y-4 pt-6 border-t border-slate-200/40 text-sm text-slate-500 font-light">
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Academy Overview & Q&A
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Curriculum Walkthrough
            </li>
            <li class="flex items-center gap-3 opacity-40 line-through">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Clinical Practice Access
            </li>
          </ul>
        </div>
        <button onclick="toggleApplyScreen()" class="w-full mt-10 py-4 rounded-full border border-slate-200 text-xs font-semibold tracking-widest uppercase text-slate-700 hover:bg-slate-950 hover:text-white smooth-transition">
          Reserve a Seat
        </button>
      </div>

      <!-- Tier 2: Caregiver Certificate -->
      <div class="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 border-2 border-blue-900/10 flex flex-col justify-between shadow-xl relative scale-100 md:scale-[1.03] group smooth-transition z-10">
        <div class="absolute -top-3.5 right-8 bg-blue-950 text-white text-[9px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full shadow-md">
          Most Popular
        </div>
        <div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="font-editorial text-xl font-bold text-blue-950">Certificate</h3>
              <p class="text-xs text-blue-900/60 mt-1">Beginners training + Clinical placement</p>
            </div>
            <span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase px-3 py-1 bg-blue-50 rounded-full">Core</span>
          </div>
          <div class="my-8">
            <div data-tuition-program="certificate" data-full-amount="300000">
              <span data-tuition-price class="font-editorial text-5xl font-bold text-blue-950 tracking-tight">₦300k</span>
            </div>
            <span class="text-xs text-slate-400 ml-2 uppercase tracking-wider">/ Full Program</span>
          </div>
          <ul class="space-y-4 pt-6 border-t border-slate-200/40 text-sm text-slate-600 font-light">
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-blue-600 shadow-sm"></span> Full Caregiving Curriculum
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-blue-600 shadow-sm"></span data-tuition-feature="1"> 16 Course Modules
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-blue-600 shadow-sm"></span> Guided Clinical Placement
            </li>
            <li class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full bg-blue-600 shadow-sm"></span> CGTIA Certificate 
            </li>
          </ul>
        </div>
        <button onclick="toggleApplyScreen()" class="w-full mt-10 py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
          Apply for This Program
        </button>
      </div>
        
        
        
              <!-- Tier 3: Certified Diploma in Caregiving -->
      <div class="soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/60 flex flex-col justify-between group smooth-transition">
        <div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="font-editorial text-xl font-bold text-blue-950">Diploma</h3>
              <p class="text-xs text-slate-400 mt-1">Advanced + Nanny training</p>
            </div>
            <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 py-1 bg-white/50 rounded-full">Level 2</span>
          </div>
          <div class="my-8">
            <div data-tuition-program="diploma" data-full-amount="350000">
              <span data-tuition-price class="font-editorial text-5xl font-bold text-blue-950 tracking-tight">₦350k</span>
            </div>
            <span class="text-xs text-slate-400 ml-2 uppercase tracking-wider">/ Advanced program </span>
          </div>
          <ul class="space-y-4 pt-6 border-t border-slate-200/40 text-sm text-slate-500 font-light">
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Level 1 Certification 
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> 12 Course modules
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Nanny training 
            </li>
          </ul>
        </div>
        <button class="w-full mt-10 py-4 rounded-full border border-slate-200 text-xs font-semibold tracking-widest uppercase text-slate-700 hover:bg-slate-950 hover:text-white smooth-transition">
          Apply for this program
        </button>
        </div>
        
        
        
              <!-- Tier 4: CGTIA Higher Diploma Certificate -->
      <div class="soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/60 flex flex-col justify-between group smooth-transition">
        <div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="font-editorial text-xl font-bold text-blue-950"> Higher Diploma</h3>
              <p class="text-xs text-slate-400 mt-1">Proficiency + Leadership skill</p>
            </div>
            <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 py-1 bg-white/50 rounded-full">Level 3</span>
          </div>
          <div class="my-8">
            <div data-tuition-program="higher-diploma" data-full-amount="400000">
              <span data-tuition-price class="font-editorial text-5xl font-bold text-blue-950 tracking-tight">₦400k</span>
            </div>
            <span class="text-xs text-slate-400 ml-2 uppercase tracking-wider">/ Proficiency program</span>
          </div>
          <ul class="space-y-4 pt-6 border-t border-slate-200/40 text-sm text-slate-500 font-light">
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> On-Site Staff Training
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Bulk Enrollment Pricing
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Dedicated Program Coordinator
            </li>
          </ul>
        </div>
        <button class="w-full mt-10 py-4 rounded-full border border-slate-200 text-xs font-semibold tracking-widest uppercase text-slate-700 hover:bg-slate-950 hover:text-white smooth-transition">
          Apply for this program
        </button>
        </div>
        
        
        
              <!-- Tier 4: CGTIA Licensing -->
      <div class="soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/60 flex flex-col justify-between group smooth-transition">
        <div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="font-editorial text-xl font-bold text-blue-950"> Licensing</h3>
              <p class="text-xs text-slate-400 mt-1">For qualified individuals</p>
            </div>
            <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 py-1 bg-white/50 rounded-full">License</span>
          </div>
          <div class="my-8">
            <span class="font-editorial text-5xl font-bold text-blue-950 tracking-tight">₦150k</span>
            <span class="text-xs text-slate-400 ml-2 uppercase tracking-wider"><br>Below are the <span>Requirements</span></span>
          </div>
          <ul class="space-y-4 pt-6 border-t border-slate-200/40 text-sm text-slate-500 font-light">
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Must have undergone basic caregiver training in a reputable institution.
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Submission of proof of training.
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Must have mandatory lifesaving certifications.
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Basic literacy and communication benchmark. 
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Must have completed 72hours of clinical placement with certificate of completion.
            </li>
          </ul>
        </div>
        <button onclick="navigateWithPill('Licensing', 'licensing.html')" class="w-full mt-10 py-4 rounded-full border border-slate-200 text-xs font-semibold tracking-widest uppercase text-slate-700 hover:bg-slate-950 hover:text-white smooth-transition">
          Apply for licensing
        </button>
        </div>
        
        
        
        

      <!-- Tier 3: Institutional / Corporate Training -->
      <div class="soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/60 flex flex-col justify-between group smooth-transition">
        <div>
          <div class="flex justify-between items-start mb-6">
            <div>
              <h3 class="font-editorial text-xl font-bold text-blue-950">Institutional Training</h3>
              <p class="text-xs text-slate-400 mt-1">For hospitals & care homes</p>
            </div>
            <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 py-1 bg-white/50 rounded-full">Custom</span>
          </div>
          <div class="my-8">
            <span class="font-editorial text-5xl font-bold text-blue-950 tracking-tight">Custom</span>
            <span class="text-xs text-slate-400 ml-2 uppercase tracking-wider">Quoted per Cohort</span>
          </div>
          <ul class="space-y-4 pt-6 border-t border-slate-200/40 text-sm text-slate-500 font-light">
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> On-Site Staff Training
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Bulk Enrollment Pricing
            </li>
            <li class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Dedicated Program Coordinator
            </li>
          </ul>
        </div>
        <button onclick="navigateWithPill('Institutional Partnerships', 'custom.html')" class="w-full mt-10 py-4 rounded-full border border-slate-200 text-xs font-semibold tracking-widest uppercase text-slate-700 hover:bg-slate-950 hover:text-white smooth-transition">
          Contact Admissions
        </button>
      </div>

    </div>
  </section>


  <!-- SaaS Automated Dual-Track Marquee Section -->
  <!-- Internship & Placement Partners — stacked grid for fast scanning -->
<!-- SaaS Automated Dual-Track Marquee Section -->
  <section class="w-full pb-32 overflow-hidden marquee-container">
    <div class="w-full max-w-7xl mx-auto px-6 mb-12">
      <div class="w-full border-t border-slate-200/50 pt-12">
        <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-2">Clinical Network</span>
        <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">Internship & Placement Partners</h2>
      </div>
    </div>

    <div class="saas-edge-mask w-full flex flex-col gap-10 py-2 select-none">
      <div class="w-full overflow-hidden flex">
        <div class="animate-marquee-left gap-20 items-center px-4">
          <span class="font-editorial text-2xl font-bold tracking-tight text-blue-950/80 hover:text-blue-950 cursor-pointer transition-colors duration-300">Grace Haven Care Home</span>
          <span class="font-sans-clean text-lg font-light tracking-[0.25em] uppercase text-slate-700/80 hover:text-slate-900 cursor-pointer transition-colors duration-300">RADIANT HEALTH CLINIC</span>
          <span class="font-editorial italic text-2xl tracking-wide text-blue-900/70 hover:text-blue-900 cursor-pointer transition-colors duration-300">Wellspring Nursing Services</span>
          <span class="font-sans-clean text-xs font-bold tracking-[0.4em] uppercase text-slate-600/80 hover:text-slate-900 cursor-pointer transition-colors duration-300">ST. JUDE MEDICAL CENTER</span>
          <span class="font-editorial text-2xl font-semibold tracking-tighter text-slate-800/80 hover:text-slate-950 cursor-pointer transition-colors duration-300">Comfort Hands Agency</span>
          
          <span class="font-editorial text-2xl font-bold tracking-tight text-blue-950/80 hover:text-blue-950 cursor-pointer transition-colors duration-300">Grace Haven Care Home</span>
          <span class="font-sans-clean text-lg font-light tracking-[0.25em] uppercase text-slate-700/80 hover:text-slate-900 cursor-pointer transition-colors duration-300">RADIANT HEALTH CLINIC</span>
          <span class="font-editorial italic text-2xl tracking-wide text-blue-900/70 hover:text-blue-900 cursor-pointer transition-colors duration-300">Wellspring Nursing Services</span>
          <span class="font-sans-clean text-xs font-bold tracking-[0.4em] uppercase text-slate-600/80 hover:text-slate-900 cursor-pointer transition-colors duration-300">ST. JUDE MEDICAL CENTER</span>
          <span class="font-editorial text-2xl font-semibold tracking-tighter text-slate-800/80 hover:text-slate-950 cursor-pointer transition-colors duration-300">Comfort Hands Agency</span>
        </div>
      </div>

      <div class="w-full overflow-hidden flex">
        <div class="animate-marquee-right gap-20 items-center px-4">
          <span class="font-sans-clean text-xs font-bold tracking-[0.35em] uppercase text-slate-700/80 hover:text-slate-950 cursor-pointer transition-colors duration-300">ELDER BRIDGE FOUNDATION</span>
          <span class="font-editorial text-2xl font-bold italic tracking-tight text-blue-950/70 hover:text-blue-950 cursor-pointer transition-colors duration-300">HopeCare Multispecialty</span>
          <span class="font-sans-clean text-base font-medium tracking-widest uppercase text-slate-600/80 hover:text-slate-900 cursor-pointer transition-colors duration-300">Mainland Home Health</span>
          <span class="font-editorial text-2xl font-light tracking-tight text-blue-900/80 hover:text-blue-950 cursor-pointer transition-colors duration-300">Serenity Elder Care</span>
          <span class="font-sans-clean text-xs font-bold tracking-[0.5em] uppercase text-slate-500/70 hover:text-slate-800 cursor-pointer transition-colors duration-300">TRUSTLINE CLINICS</span>
          
          <span class="font-sans-clean text-xs font-bold tracking-[0.35em] uppercase text-slate-700/80 hover:text-slate-950 cursor-pointer transition-colors duration-300">ELDER BRIDGE FOUNDATION</span>
          <span class="font-editorial text-2xl font-bold italic tracking-tight text-blue-950/70 hover:text-blue-950 cursor-pointer transition-colors duration-300">HopeCare Multispecialty</span>
          <span class="font-sans-clean text-base font-medium tracking-widest uppercase text-slate-600/80 hover:text-slate-900 cursor-pointer transition-colors duration-300">Mainland Home Health</span>
          <span class="font-editorial text-2xl font-light tracking-tight text-blue-900/80 hover:text-blue-950 cursor-pointer transition-colors duration-300">Serenity Elder Care</span>
          <span class="font-sans-clean text-xs font-bold tracking-[0.5em] uppercase text-slate-500/70 hover:text-slate-800 cursor-pointer transition-colors duration-300">TRUSTLINE CLINICS</span>
        </div>
      </div>
    </div>
  </section>

  

  <!-- Masonry Post Card Grid Workspace -->
  <section class="w-full max-w-7xl mx-auto px-6 pb-36">
    <div class="text-left mb-12">
      <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-3">Caregiver Resources</span>
      <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">Insights & Training Notes</h2>
    </div>

    <div class="masonry-layout-column-grid">
      <div class="masonry-row-span-tall soft-component-card rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden border border-white/60 shadow-md group smooth-transition">
        <div class="w-full h-64 rounded-2xl overflow-hidden mb-6 relative">
          <img src="https://cgtia-assets.netlify.app/programs/caregiving-students-practicing-patient-handling-.webp" alt="Caregiving students practicing patient handling techniques" class="w-full h-full object-cover img-placeholder w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex');" /><div class="img-placeholder img-placeholder w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" style="display:none" data-image-slot="Caregiving students practicing patient handling techniques"><span class="img-placeholder-label">Caregiving students practicing patient handling techniques</span></div>
        </div>
        <div class="flex-grow flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-3">
              <span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase">Module Focus</span>
              <span class="text-xs text-slate-400 font-light">July 2026</span>
            </div>
            <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold leading-tight mb-3">Safe Moving & Handling Basics</h3>
            <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed mb-4">A practical look at the techniques every caregiver needs to safely assist clients with limited mobility, protecting both caregiver and client from injury.</p>
          </div>
          <div class="pt-4 border-t border-slate-200/40 flex items-center justify-between">
            <span class="text-xs font-medium text-slate-700">Read Guide</span>
            <div class="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center text-white text-xs">&rarr;</div>
          </div>
        </div>
      </div>

      <div class="masonry-row-span-short soft-component-card rounded-[2rem] p-6 flex flex-col justify-between border border-white/60 shadow-md group smooth-transition">
        <div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Insight Brief</span>
            <span class="text-xs text-slate-400 font-light">02 Min Read</span>
          </div>
          <h3 class="font-editorial text-lg md:text-xl text-blue-950 font-bold leading-tight mb-2">Food Hygiene for Home Care</h3>
          <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed">Why proper food handling and storage is one of the most overlooked but essential caregiving responsibilities.</p>
        </div>
        <div class="pt-4 mt-4 border-t border-slate-200/40 flex items-center justify-between">
          <span class="text-xs font-medium text-blue-900">Open Guide</span>
          <span class="text-xs text-slate-300">&#9670;</span>
        </div>
      </div>

      <div class="masonry-row-span-tall soft-component-card rounded-[2rem] p-6 flex flex-col justify-between overflow-hidden border border-white/60 shadow-md group smooth-transition">
        <div class="w-full h-72 rounded-2xl overflow-hidden mb-6 relative">
          <img src="https://cgtia-assets.netlify.app/programs/caregiving-diploma-students-in-a-training-classr.webp" alt="Caregiving diploma students in a training classroom" class="w-full h-full object-cover img-placeholder w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex');" /><div class="img-placeholder img-placeholder w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" style="display:none" data-image-slot="Caregiving diploma students in a training classroom"><span class="img-placeholder-label">Caregiving diploma students in a training classroom</span></div>
        </div>
        <div class="flex-grow flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-3">
              <span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase">Student Story</span>
              <span class="text-xs text-slate-400 font-light">June 2026</span>
            </div>
            <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold leading-tight mb-3">From Classroom to Care Home</h3>
            <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed mb-4">How one CGTIA graduate built confidence through practical training and stepped into full-time caregiving.</p>
          </div>
          <div class="pt-4 border-t border-slate-200/40 flex items-center justify-between">
            <span class="text-xs font-medium text-slate-700">Read Story</span>
            <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-blue-950 text-xs">&rarr;</div>
          </div>
        </div>
      </div>

      <div class="masonry-row-span-short soft-component-card rounded-[2rem] p-6 flex flex-col justify-between border border-white/60 shadow-md group smooth-transition">
        <div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Foundations</span>
            <span class="text-xs text-slate-400 font-light">05 Min Read</span>
          </div>
          <h3 class="font-editorial text-lg md:text-xl text-blue-950 font-bold leading-tight mb-2">Building Trust with Clients</h3>
          <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed">Communication habits that help new caregivers earn the confidence of clients and their families from day one.</p>
        </div>
        <div class="pt-4 mt-4 border-t border-slate-200/40 flex items-center justify-between">
          <span class="text-xs font-medium text-blue-900">Open Guide</span>
          <span class="text-xs text-slate-300">&#9670;</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Visual Campus Gallery Section -->
  <section id="gallery" class="w-full max-w-7xl mx-auto px-6 pb-36">
    <div class="text-left mb-12">
      <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-3"> Gallery</span>
      <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">Life at CGTIA</h2>
    </div>

    <div class="peel-gallery-container">
      <div class="peel-card group border border-white/30 shadow-lg" onclick="setPeelActive(this)">
        <div class="peel-image-wrapper">
          <img src="https://cgtia-assets.netlify.app/programs/cgtia-classroom-during-a-caregiving-lecture.webp" alt="CGTIA classroom during a caregiving lecture" class="w-full h-full object-cover img-placeholder w-full h-full" loading="lazy" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex');" /><div class="img-placeholder img-placeholder w-full h-full" style="display:none" data-image-slot="CGTIA classroom during a caregiving lecture"><span class="img-placeholder-label">CGTIA classroom during a caregiving lecture</span></div>
        </div>
        <div class="peel-overlay absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end h-full">
          <span class="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-2">Classroom</span>
          <h4 class="font-editorial text-xl md:text-2xl text-white font-bold mb-2">Lecture Sessions</h4>
          <p class="text-slate-300 font-light text-xs md:text-sm max-w-md">Small cohort classes where instructors walk through caregiving theory before students move to practical labs.</p>
        </div>
      </div>

      <div class="peel-card group border border-white/30 shadow-lg" onclick="setPeelActive(this)">
        <div class="peel-image-wrapper">
          <img src="https://cgtia-assets.netlify.app/programs/students-practicing-patient-care-skills-in-a-lab.webp" alt="Students practicing patient care skills in a lab setting" class="w-full h-full object-cover img-placeholder w-full h-full" loading="lazy" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex');" /><div class="img-placeholder img-placeholder w-full h-full" style="display:none" data-image-slot="Students practicing patient care skills in a lab setting"><span class="img-placeholder-label">Students practicing patient care skills in a lab setting</span></div>
        </div>
        <div class="peel-overlay absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end h-full">
          <span class="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-2">Clinical Lab</span>
          <h4 class="font-editorial text-xl md:text-2xl text-white font-bold mb-2">Practical Sessions</h4>
          <p class="text-slate-300 font-light text-xs md:text-sm max-w-md">Guided practice on real caregiving equipment, from mobility aids to vital-signs monitoring.</p>
        </div>
      </div>

      <div class="peel-card group border border-white/30 shadow-lg" onclick="setPeelActive(this)">
        <div class="peel-image-wrapper">
          <img src="https://cgtia-assets.netlify.app/partners/interns-at-a-partner-care-facility.webp" alt="Interns at a partner care facility" class="w-full h-full object-cover img-placeholder w-full h-full" loading="lazy" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex');" /><div class="img-placeholder img-placeholder w-full h-full" style="display:none" data-image-slot="Interns at a partner care facility"><span class="img-placeholder-label">Interns at a partner care facility</span></div>
        </div>
        <div class="peel-overlay absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end h-full">
          <span class="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-2">Internships</span>
          <h4 class="font-editorial text-xl md:text-2xl text-white font-bold mb-2">On-Site Placements</h4>
          <p class="text-slate-300 font-light text-xs md:text-sm max-w-md">Interns shadow experienced caregivers at partner homes and clinics before working independently.</p>
        </div>
      </div>

      <div class="peel-card group border border-white/30 shadow-lg" onclick="setPeelActive(this)">
        <div class="peel-image-wrapper">
          <img src="https://cgtia-assets.netlify.app/programs/graduation-ceremony-for-cgtia-caregiving-student.webp" alt="Graduation ceremony for CGTIA caregiving students" class="w-full h-full object-cover img-placeholder w-full h-full" loading="lazy" onerror="this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='flex');" /><div class="img-placeholder img-placeholder w-full h-full" style="display:none" data-image-slot="Graduation ceremony for CGTIA caregiving students"><span class="img-placeholder-label">Graduation ceremony for CGTIA caregiving students</span></div>
        </div>
        <div class="peel-overlay absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pt-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end h-full">
          <span class="text-[10px] font-bold tracking-widest text-blue-400 uppercase mb-2">Graduation</span>
          <h4 class="font-editorial text-xl md:text-2xl text-white font-bold mb-2">Diploma Day</h4>
          <p class="text-slate-300 font-light text-xs md:text-sm max-w-md">Every cohort closes with a certification ceremony celebrating each new caregiver's readiness to serve.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Programs Horizontal 3D Arc Carousel Section -->
  <section id="programs" class="w-full max-w-7xl mx-auto px-6 pb-36">
    <div class="text-left mb-10">
      <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-3">Institutional Offerings</span>
      <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">Academic Programs</h2>
    </div>

    <div class="arc-viewport-perspective relative w-full h-[340px] md:h-[400px] flex items-center justify-center overflow-hidden py-8">
      <div id="program-track" class="program-arc-track w-full h-full flex items-center justify-center">
        
        <div class="program-card-node absolute w-[280px] sm:w-[360px] h-[240px] md:h-[280px] soft-component-card rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between cursor-pointer border border-white/60 shadow-xl" data-p-index="0">
          <div>
            <span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase block mb-2">Diploma I</span>
            <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold leading-tight">Caregiving Fundamentals</h3>
          </div>
          <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed">Core skills every caregiver needs: hygiene, mobility support, basic first aid, and daily client care routines.</p>
        </div>

        <div class="program-card-node absolute w-[280px] sm:w-[360px] h-[240px] md:h-[280px] soft-component-card rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between cursor-pointer border border-white/60 shadow-xl" data-p-index="1">
          <div>
            <span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase block mb-2">Diploma II</span>
            <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold leading-tight">Elderly & Dementia Care</h3>
          </div>
          <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed">Specialized techniques for supporting aging clients, including memory care and safe mobility assistance.</p>
        </div>

        <div class="program-card-node absolute w-[280px] sm:w-[360px] h-[240px] md:h-[280px] soft-component-card rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between cursor-pointer border border-white/60 shadow-xl" data-p-index="2">
          <div>
            <span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase block mb-2">Diploma III</span>
            <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold leading-tight">Home Health Aide Certification</h3>
          </div>
          <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed">Preparing caregivers to work confidently and independently inside private client households.</p>
        </div>

        <div class="program-card-node absolute w-[280px] sm:w-[360px] h-[240px] md:h-[280px] soft-component-card rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between cursor-pointer border border-white/60 shadow-xl" data-p-index="3">
          <div>
            <span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase block mb-2">Diploma IV</span>
            <h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold leading-tight">Food Hygiene & Nutrition</h3>
          </div>
          <p class="text-slate-500 font-light text-xs md:text-sm leading-relaxed">Safe food handling, storage, and nutrition planning for clients with special dietary needs.</p>
        </div>

      </div>
    </div>

    <div class="flex justify-center items-center gap-3 mt-4">
      <button onclick="shiftArcLeft()" class="w-10 h-10 rounded-full soft-component-card flex items-center justify-center text-blue-950 hover:scale-105 transition-transform">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div id="arc-dots" class="flex items-center gap-2"></div>
      <button onclick="shiftArcRight()" class="w-10 h-10 rounded-full soft-component-card flex items-center justify-center text-blue-950 hover:scale-105 transition-transform">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>
  </section>

  <!-- Horizontal Editorial Testimonials Canvas -->
  <section class="w-full max-w-7xl mx-auto px-6 pb-36 md:pb-56 overflow-hidden">
    <div class="text-left mb-12">
      <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-3">Graduate Voices</span>
      <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">What Our Graduates Say</h2>
    </div>

    <div id="testimonialsScroll" class="w-full overflow-x-auto flex gap-8 pb-8 pt-2 px-1 no-scrollbar snap-x snap-mandatory">
      <div class="snap-center shrink-0 w-[85vw] sm:w-[480px] soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/70 shadow-sm flex flex-col justify-between gap-8">
        <p class="font-editorial text-xl md:text-2xl text-blue-950 font-light leading-relaxed italic">
          "CGTIA didn't just teach me theory — the practical training and internship opportunity gave me the confidence to walk into my first job and already know what to do."
        </p>
        <div class="flex items-center gap-4 pt-4 border-t border-slate-200/40">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-editorial font-bold text-blue-950 text-sm">O</div>
          <div>
            <h4 class="text-xs font-bold tracking-wide text-blue-950">Certified Caregiver</h4>
            <span class="text-[10px] text-slate-400 uppercase tracking-widest">2025 Graduate</span>
          </div>
        </div>
      </div>

      <div class="snap-center shrink-0 w-[85vw] sm:w-[480px] soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/70 shadow-sm flex flex-col justify-between gap-8">
        <p class="font-editorial text-xl md:text-2xl text-blue-950 font-light leading-relaxed italic">
          "Studying online meant I could learn between shifts at my old job. That flexibility is why I finished the programme at all."
        </p>
        <div class="flex items-center gap-4 pt-4 border-t border-slate-200/40">
          <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-editorial font-bold text-slate-700 text-sm">R</div>
          <div>
            <h4 class="text-xs font-bold tracking-wide text-blue-950">Home Health Aide</h4>
            <span class="text-[10px] text-slate-400 uppercase tracking-widest">2025 Graduate</span>
          </div>
        </div>
      </div>

      <div class="snap-center shrink-0 w-[85vw] sm:w-[480px] soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/70 shadow-sm flex flex-col justify-between gap-8">
        <p class="font-editorial text-xl md:text-2xl text-blue-950 font-light leading-relaxed italic">
          "We've hired several CGTIA graduates on staff, and the difference in preparedness compared to untrained applicants is night and day."
        </p>
        <div class="flex items-center gap-4 pt-4 border-t border-slate-200/40">
          <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-editorial font-bold text-blue-900 text-sm">C</div>
          <div>
            <h4 class="text-xs font-bold tracking-wide text-blue-950">Care Coordinator</h4>
            <span class="text-[10px] text-slate-400 uppercase tracking-widest">Partner Care Home</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center items-center gap-3 mt-2">
      <button onclick="shiftTestimonial(-1)" class="w-10 h-10 rounded-full soft-component-card flex items-center justify-center text-blue-950 hover:scale-105 transition-transform">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button onclick="shiftTestimonial(1)" class="w-10 h-10 rounded-full soft-component-card flex items-center justify-center text-blue-950 hover:scale-105 transition-transform">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>
  </section>

  <!-- Wall of Fame Teaser -->
  <section class="w-full max-w-7xl mx-auto px-6 pb-28 md:pb-36">
    <div class="w-full bg-blue-950 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
      <div class="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-blue-800/30 blur-3xl"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10">
        <div>
          <span class="text-xs font-bold tracking-widest text-blue-300 uppercase block mb-4">Honor Roll</span>
          <h2 class="font-editorial text-3xl md:text-4xl text-white font-bold leading-tight max-w-lg">Meet our Wall of Fame</h2>
          <p class="text-blue-100 text-sm md:text-base font-light mt-3 max-w-md">The best graduating students from every cohort, celebrated year after year.</p>
        </div>
        <a href="/wall-of-fame" class="shrink-0 inline-block px-7 py-3.5 rounded-full bg-white text-blue-950 text-xs font-semibold tracking-widest uppercase hover:bg-blue-50 smooth-transition">
          View Wall of Fame
        </a>
      </div>
      <div id="homeWallOfFamePreview" class="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <p class="text-blue-200 text-sm col-span-full text-center py-6">Loading honorees&hellip;</p>
      </div>
    </div>
  </section>

  <!-- Graduates & Activities -->
  <section class="w-full max-w-7xl mx-auto px-6 pb-28 md:pb-36">
    <div class="text-left mb-10 md:mb-12">
      <span class="text-xs font-bold tracking-widest text-slate-400 uppercase block mb-3">Our Graduates</span>
      <h2 class="font-editorial text-3xl md:text-4xl text-blue-950 font-bold">Where They Are Now</h2>
    </div>
    <div id="homeGraduatesPreview" class="grid grid-cols-2 sm:grid-cols-4 gap-5 md:gap-6">
      <p class="text-center text-sm text-slate-400 py-12 col-span-full">Loading graduates&hellip;</p>
    </div>
    <div class="text-center mt-10">
      <a href="/wall-of-fame" class="inline-block soft-component-card px-8 py-4 rounded-full text-xs font-semibold tracking-widest uppercase text-blue-950 border border-transparent hover:border-slate-200/50 smooth-transition">
        See All Graduates
      </a>
    </div>
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
            <li><a href="/contact" class="hover:text-blue-950 smooth-transition">Contact</a></li>
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
        <p>&copy; <span data-site-setting="footerYear">2026</span> Caregivers Training & Internship Academy Limited.</p>
      </div>
    </div>
  </footer>

  <!-- Fixed Bottom-Right Action Core (Replaced Swipe Shell Entirely) -->
  <div class="block md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-end gap-3 pointer-events-none">
    
    <!-- Sliding Morphing Rectangular Capsule Node -->
    <div id="morphingIndicatorPill" onclick="retryPillNav()" class="relative morph-nav-pill h-14 bg-slate-950 text-white rounded-full flex items-center justify-center px-6 border border-white/10 shadow-xl overflow-hidden backdrop-blur-2xl">
      <span id="morphingIndicatorText" class="text-[10px] font-bold tracking-[0.25em] uppercase text-blue-100 truncate">Home</span>
    </div>

    <!-- The Primary Base Ellipse Trigger Wrapper -->
    <button onclick="toggleMobileBottomSheet()" class="pointer-events-auto w-14 h-14 bg-slate-950 rounded-full flex items-center justify-center border border-white/10 text-white shadow-xl active:scale-95 transition-transform duration-200 shrink-0">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-4.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm0-4.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
      </svg>
    </button>
  </div>

  <!-- Mobile Sheet Index Drawer Container -->
  <div id="mobileBottomSheet" class="block md:hidden fixed inset-0 z-50 pointer-events-none transition-all duration-500 bg-slate-950/0 backdrop-blur-0">
    <div id="bottomSheetDrawer" data-has-promo-news="1" class="absolute bottom-0 inset-x-0 w-full max-h-[85vh] bg-white rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(15,23,42,0.15)] border-t border-slate-100 p-8 pt-4 pointer-events-auto transform translate-y-full transition-transform duration-500 cubic-bezier(0.16,1,0.3,1) flex flex-col">
      
      <!-- Functional Mobile Drag Handle Interceptor Area -->
      <div id="dragHandleWrapper" class="w-full py-4 cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto"></div>
      </div>
      
      <div class="flex justify-between items-center mb-4 shrink-0">
        <span class="font-editorial text-lg font-bold text-blue-950">Explore CGTIA</span>
        <button onclick="toggleMobileBottomSheet()" class="text-xs font-bold tracking-widest text-slate-400 uppercase">Close</button>
      </div>

      <!-- Scrollable Navigation Points -->
      <div class="overflow-y-auto no-scrollbar py-2 space-y-2 grow">
        <div onclick="navigateWithPill('Home', 'index.html')" class="px-6 py-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 flex justify-between items-center cursor-pointer transition-colors">
          <span class="font-editorial text-lg font-bold text-blue-950">Academy Home</span>
          <span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase">01</span>
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
          <span class="font-sans-clean text-sm font-medium text-slate-700">Academic Programs</span>
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

      <!-- Integrated Utility Access Point Core (Optimized Login Placement) -->
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
          <input required type="text" id="fullNameInput" placeholder="e.g. Ada Okonkwo" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Phone Number</label>
            <div class="flex gap-2">
            <select id="countryCodeSelect" class="w-[7.5rem] shrink-0 px-2 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-900/40">
              <option value="+234" selected>NG +234</option>
              <option value="+1">US +1</option>
              <option value="+44">UK +44</option>
              <option value="+233">GH +233</option>
              <option value="+254">KE +254</option>
              <option value="+27">ZA +27</option>
              <option value="+250">RW +250</option>
              <option value="+260">ZM +260</option>
              <option value="+91">IN +91</option>
              <option value="+971">AE +971</option>
            </select>
            <input required type="tel" id="phoneInput" placeholder="801 234 5678" class="flex-1 px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition" />
          </div>
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Email Address</label>
            <input required type="email" id="emailInput" placeholder="you@email.com" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition">
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
        <div id="studyModeWrap" class="hidden">
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">How do you want to study?</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="studyModeOptions">
            <label class="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer has-[:checked]:border-blue-900 has-[:checked]:bg-blue-50">
              <input type="radio" name="studyMode" id="studyModeOnline" value="online" class="accent-blue-900" />
              <span class="text-sm font-medium text-blue-950">Online</span>
            </label>
            <label class="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer has-[:checked]:border-blue-900 has-[:checked]:bg-blue-50">
              <input type="radio" name="studyMode" id="studyModeInPerson" value="in-person" class="accent-blue-900" />
              <span class="text-sm font-medium text-blue-950">In person</span>
            </label>
          </div>
          <p class="text-[11px] text-slate-400 mt-2">Certificate, Diploma, and Higher Diploma can be taken online or in person.</p>
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Program Start Date</label>
          <div id="programModalityDisplay" class="text-xs text-slate-500 mb-2"></div>
          <div id="startDateDisplay" class="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-sm text-slate-400">Select a programme to see the next start date</div>
          <p class="text-[11px] text-slate-400 mt-2">Each cohort has one fixed start date set by the academy.</p>
        </div>
        <div>
          <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2"> (Optional) Tell us a little about you</label>
          <textarea rows="3" placeholder="Why are you interested in caregiving training?" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition resize-none"></textarea>
        </div>

        <label class="flex items-start gap-3 text-xs text-slate-600 leading-relaxed cursor-pointer">
          <input required type="checkbox" id="ageConfirm18" class="mt-1 rounded border-slate-300 accent-blue-900" />
          <span>I confirm that I am <strong>18 years of age or older</strong> and eligible to enrol.</span>
        </label>
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

    <!-- Payment Screen — plan first, then Paystack (bank transfer / card inside Paystack) -->
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

      <p class="text-sm text-slate-500 font-light mb-2">Program</p>
      <p id="transferProgramDisplay" class="font-editorial text-lg font-bold text-blue-950 mb-1">—</p>
      <p id="cardProgramDisplay" class="hidden">—</p>

      <p class="text-sm text-slate-500 font-light mt-4 mb-2">Amount due</p>
      <p id="transferAmountDisplay" class="font-editorial text-3xl font-bold text-blue-950 mb-6">₦0</p>
      <p id="cardAmountDisplay" class="hidden">₦0</p>

      <!-- Full vs installment only -->
      <p class="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">Choose how to pay</p>
      <div class="flex gap-1.5 mb-4 bg-slate-100 rounded-full p-1.5 shrink-0">
        <button type="button" id="planFullBtn" onclick="switchPaymentPlan('full')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white text-blue-950 shadow-sm smooth-transition">Full Payment</button>
        <button type="button" id="planInstallmentBtn" onclick="switchPaymentPlan('installment')" class="flex-1 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-slate-500 smooth-transition">3 Installments</button>
      </div>

      <div id="installmentBreakdown" class="hidden mb-4 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 space-y-1">
        <div class="flex justify-between"><span>1st installment</span><span id="installment1Amount" class="font-semibold text-blue-950">—</span></div>
        <div class="flex justify-between"><span>2nd installment</span><span id="installment2Amount" class="font-semibold text-blue-950">—</span></div>
        <div class="flex justify-between"><span>3rd installment</span><span id="installment3Amount" class="font-semibold text-blue-950">—</span></div>
        <p id="installmentNote" class="text-xs text-slate-400 pt-2">You pay the first installment now. Remaining installments are scheduled with admissions.</p>
      </div>

      <div class="mb-4">
        <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Promo code (optional)</label>
        <input id="promoCodeInput" type="text" placeholder="If you have a referral or promo code" class="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-900/40" onchange="if(window.__cgtiaRefreshPaymentAmount)window.__cgtiaRefreshPaymentAmount()" />
        <p class="text-[11px] text-slate-400 mt-1">Leave blank for open offers. Codes are for referral or special campaigns.</p>
      </div>
      <p class="text-xs text-slate-500 leading-relaxed mb-5">
        Next you will complete payment securely online. You can pay by bank transfer or card.
      </p>

      <button type="button" onclick="payWithPaystackCard()" class="w-full py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
        Continue to payment
      </button>

      <p class="text-[11px] text-slate-400 text-center mt-4 leading-relaxed">
        After your payment is confirmed, we will email your student portal sign-in details. The first time you sign in, you will choose your own password.
      </p>

      <!-- Hidden legacy nodes so old JS helpers do not crash -->
      <div class="hidden" aria-hidden="true">
        <span id="acctNumberText"></span>
        <span id="tabTransferBtn"></span>
        <span id="tabCardBtn"></span>
        <span id="transferPane"></span>
        <span id="cardPane"></span>
      </div>
    </div>
  </div>

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
  <div class="relative">
    <input required type="password" id="loginPasswordInput" placeholder="••••••••" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition pr-12">
    <button type="button" onclick="togglePasswordVisibility('loginPasswordInput', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 smooth-transition z-10">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M12 4.5C7.5 4.5 3.5 7.5 1.5 12c2 4.5 6 7.5 10.5 7.5s8.5-3 10.5-7.5c-2-4.5-6-7.5-10.5-7.5zM12 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />
      </svg>
    </button>
  </div>
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
  <div class="relative">
    <input required type="password" id="newPasswordField" minlength="8" placeholder="At least 8 characters" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition pr-12">
    <button type="button" onclick="togglePasswordVisibility('newPasswordField', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 smooth-transition z-10">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M12 4.5C7.5 4.5 3.5 7.5 1.5 12c2 4.5 6 7.5 10.5 7.5s8.5-3 10.5-7.5c-2-4.5-6-7.5-10.5-7.5zM12 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />
      </svg>
    </button>
  </div>
</div>
<div>
  <label class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">Confirm New Password</label>
  <div class="relative">
    <input required type="password" id="confirmPasswordField" minlength="8" placeholder="Type it again" class="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition pr-12">
    <button type="button" onclick="togglePasswordVisibility('confirmPasswordField', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 smooth-transition z-10">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M12 4.5C7.5 4.5 3.5 7.5 1.5 12c2 4.5 6 7.5 10.5 7.5s8.5-3 10.5-7.5c-2-4.5-6-7.5-10.5-7.5zM12 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />
      </svg>
    </button>
  </div>
</div>

        <button id="forcePasswordSubmitBtn" onclick="handleForcePasswordSubmit(event)" type="button" onclick="handleForcePasswordSubmit(event)" class="w-full py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">
          Save & Continue
        </button>
      </form>
    </div>
  </div>

  <!-- Runtime Architecture Scripts -->
  

  `;
