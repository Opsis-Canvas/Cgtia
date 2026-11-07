export const faq_html = `
  <main class="max-w-3xl mx-auto px-6 py-16 md:py-24">
    <p class="text-xs font-semibold tracking-widest uppercase text-blue-900/70 mb-3">Help</p>
    <h1 class="font-editorial text-4xl font-bold text-blue-950 mb-4">Frequently asked questions</h1>
    <p class="text-slate-500 text-sm mb-10">Tap a question to expand. Official answers will replace these placeholders later.</p>
    <div class="space-y-3" id="faqAccordion">
      <div class="faq-item soft-component-card rounded-2xl border border-white/60 overflow-hidden">
        <button type="button" class="faq-q w-full text-left px-6 py-4 flex justify-between items-center gap-4 font-semibold text-blue-950 text-sm" aria-expanded="false">
          How do I apply for a programme?
          <span class="faq-chev text-slate-400 text-lg leading-none">+</span>
        </button>
        <div class="faq-a hidden px-6 pb-4 text-sm text-slate-600 font-light leading-relaxed">Use Apply on the site, complete the form, and follow payment instructions. You will receive email confirmation after payment is verified.</div>
      </div>
      <div class="faq-item soft-component-card rounded-2xl border border-white/60 overflow-hidden">
        <button type="button" class="faq-q w-full text-left px-6 py-4 flex justify-between items-center gap-4 font-semibold text-blue-950 text-sm" aria-expanded="false">
          How does caregiver licensing work?
          <span class="faq-chev text-slate-400 text-lg leading-none">+</span>
        </button>
        <div class="faq-a hidden px-6 pb-4 text-sm text-slate-600 font-light leading-relaxed">Submit a licensing request on the Licensing page. CGTIA students and external applicants follow different next steps. External applicants may receive a one-time link after interview to upload documents.</div>
      </div>
      <div class="faq-item soft-component-card rounded-2xl border border-white/60 overflow-hidden">
        <button type="button" class="faq-q w-full text-left px-6 py-4 flex justify-between items-center gap-4 font-semibold text-blue-950 text-sm" aria-expanded="false">
          How do I verify a certificate or ID card?
          <span class="faq-chev text-slate-400 text-lg leading-none">+</span>
        </button>
        <div class="faq-a hidden px-6 pb-4 text-sm text-slate-600 font-light leading-relaxed">Open Verify, choose Certificate, ID card, Licence, or Student, and enter the code or registration number.</div>
      </div>
      <div class="faq-item soft-component-card rounded-2xl border border-white/60 overflow-hidden">
        <button type="button" class="faq-q w-full text-left px-6 py-4 flex justify-between items-center gap-4 font-semibold text-blue-950 text-sm" aria-expanded="false">
          Where is the academy located?
          <span class="faq-chev text-slate-400 text-lg leading-none">+</span>
        </button>
        <div class="faq-a hidden px-6 pb-4 text-sm text-slate-600 font-light leading-relaxed">Imo State, Nigeria. See Contact for map and email.</div>
      </div>
    </div>
  </main>
  <script>
    (function(){
      function bind(){
        var root = document.getElementById('faqAccordion');
        if (!root || root.dataset.bound === '1') return;
        root.dataset.bound = '1';
        root.addEventListener('click', function(e){
          var btn = e.target.closest('.faq-q');
          if (!btn || !root.contains(btn)) return;
          var item = btn.closest('.faq-item');
          var ans = item.querySelector('.faq-a');
          var chev = item.querySelector('.faq-chev');
          var open = !ans.classList.contains('hidden');
          root.querySelectorAll('.faq-a').forEach(function(a){ a.classList.add('hidden'); });
          root.querySelectorAll('.faq-chev').forEach(function(c){ c.textContent = '+'; });
          root.querySelectorAll('.faq-q').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
          if (!open) {
            ans.classList.remove('hidden');
            if (chev) chev.textContent = '−';
            btn.setAttribute('aria-expanded','true');
          }
        });
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
      else setTimeout(bind, 30);
    })();
  </script>
`;
