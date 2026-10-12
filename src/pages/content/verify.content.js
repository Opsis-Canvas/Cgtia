/**
 * Verify page shell — interactive UI mounted by verify.page.js
 */
export const verify_html = `

  <header class="faded-sticky-header w-full smooth-transition">
    <div class="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
      <a href="/" data-pill-label="Home" class="font-editorial text-xl md:text-2xl font-bold tracking-tight text-blue-950">CGTIA.</a>
      <nav class="hidden md:flex space-x-7 text-xs font-semibold tracking-widest uppercase text-slate-500">
        <a href="/about" class="hover:text-blue-950 smooth-transition">About</a>
        <a href="/programs" class="hover:text-blue-950 smooth-transition">Programmes</a>
        <a href="/verify" class="text-blue-950">Verify</a>
        <a href="/contact" class="hover:text-blue-950 smooth-transition">Contact</a>
      </nav>
    </div>
  </header>

  <div id="cgtiaVerifyMount"></div>

  <footer class="w-full border-t border-slate-100 mt-8">
    <div class="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-6 text-xs text-slate-400">
      <p>&copy; Caregivers Training &amp; Internship Academy Limited</p>
      <div class="flex gap-6">
        <a href="/privacy" class="hover:text-blue-950">Privacy</a>
        <a href="/terms" class="hover:text-blue-950">Terms</a>
        <a href="/contact" class="hover:text-blue-950">Contact</a>
      </div>
    </div>
  </footer>

`;
