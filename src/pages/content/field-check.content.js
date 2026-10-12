/**
 * Student legal profile form — invite token required (?token=)
 * Path: /field-check/confirm
 */
export const field_check_html = `

  <header class="w-full border-b border-slate-100 bg-white/80 backdrop-blur-sm">
    <div class="w-full max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
      <span class="font-editorial text-xl font-bold tracking-tight text-blue-950">CGTIA.</span>
      <span class="text-[10px] font-semibold tracking-widest uppercase text-slate-400">Student profile</span>
    </div>
  </header>

  <main class="w-full max-w-2xl mx-auto px-6 py-12 md:py-16">
    <div id="fieldCheckGate" class="hidden">
      <div class="soft-component-card rounded-[2rem] p-8 border border-amber-200 bg-amber-50 text-sm text-amber-900">
        <p class="font-semibold mb-2">Invite required</p>
        <p id="fieldCheckGateMsg">This page only works with a personal link from the academy. The link may have expired or already been used.</p>
      </div>
    </div>

    <div id="fieldCheckMain" class="hidden">
      <p class="text-xs font-semibold tracking-widest uppercase text-blue-900/70 mb-3">Enrolled students only</p>
      <h1 class="font-editorial text-3xl md:text-4xl font-bold text-blue-950 tracking-tight mb-3">Confirm your details</h1>
      <p class="text-slate-600 text-sm leading-relaxed mb-2">
        Enter your legal information exactly as on your official documents.
        This is for academy records and certificates only — not shown on the public site.
      </p>
      <p id="fieldCheckInviteMeta" class="text-[11px] text-slate-400 mb-8"></p>

      <form id="fieldCheckForm" class="soft-component-card rounded-[2rem] p-6 md:p-10 border border-white/60 shadow-xl space-y-6" novalidate>
        <input type="hidden" id="fcToken" name="token" value="" />

        <fieldset class="space-y-4">
          <legend class="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-1">Identity</legend>
          <div>
            <label for="fcFullLegalName" class="block text-xs font-semibold text-slate-600 mb-1.5">Full legal name <span class="text-rose-500">*</span></label>
            <input id="fcFullLegalName" name="fullLegalName" required autocomplete="name"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800"
              placeholder="As on NIN / passport" />
          </div>
          <div>
            <label for="fcNin" class="block text-xs font-semibold text-slate-600 mb-1.5">NIN (National Identification Number) <span class="text-rose-500">*</span></label>
            <input id="fcNin" name="nin" required inputmode="numeric" pattern="[0-9]{11}" maxlength="11"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 font-mono tracking-wide"
              placeholder="11 digits" />
          </div>
          <div>
            <label for="fcDob" class="block text-xs font-semibold text-slate-600 mb-1.5">Date of birth <span class="text-rose-500">*</span></label>
            <input id="fcDob" name="dateOfBirth" type="date" required
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800" />
          </div>
        </fieldset>

        <fieldset class="space-y-4">
          <legend class="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-1">Contact</legend>
          <div>
            <label for="fcEmail" class="block text-xs font-semibold text-slate-600 mb-1.5">Email <span class="text-rose-500">*</span></label>
            <input id="fcEmail" name="email" type="email" required autocomplete="email"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800"
              placeholder="you@email.com" />
            <p class="text-[11px] text-slate-400 mt-1">Each email can complete this form only once</p>
          </div>
          <div>
            <label for="fcPhone" class="block text-xs font-semibold text-slate-600 mb-1.5">Phone number <span class="text-rose-500">*</span></label>
            <input id="fcPhone" name="phone" type="tel" required autocomplete="tel"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800"
              placeholder="080X XXX XXXX" />
          </div>
        </fieldset>

        <fieldset class="space-y-4">
          <legend class="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-1">Next of kin</legend>
          <div>
            <label for="fcKinName" class="block text-xs font-semibold text-slate-600 mb-1.5">Next of kin full name <span class="text-rose-500">*</span></label>
            <input id="fcKinName" name="nextOfKinName" required
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800" />
          </div>
          <div>
            <label for="fcKinPhone" class="block text-xs font-semibold text-slate-600 mb-1.5">Next of kin phone <span class="text-rose-500">*</span></label>
            <input id="fcKinPhone" name="nextOfKinPhone" type="tel" required
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800" />
          </div>
          <div>
            <label for="fcKinRelation" class="block text-xs font-semibold text-slate-600 mb-1.5">Relationship <span class="text-rose-500">*</span></label>
            <select id="fcKinRelation" name="nextOfKinRelation" required
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800">
              <option value="">Select…</option>
              <option value="Parent">Parent</option>
              <option value="Spouse">Spouse</option>
              <option value="Sibling">Sibling</option>
              <option value="Guardian">Guardian</option>
              <option value="Child">Child</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </fieldset>

        <p id="fieldCheckError" class="hidden text-sm text-rose-600"></p>
        <p id="fieldCheckSuccess" class="hidden text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3"></p>

        <button type="submit" id="fieldCheckSubmit"
          class="w-full px-8 py-3.5 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase hover:bg-blue-900 smooth-transition disabled:opacity-60">
          Submit profile
        </button>
      </form>

      <p class="text-[11px] text-slate-400 mt-8 text-center leading-relaxed max-w-md mx-auto">
        Your data is stored for academy records only. This invite link works once and expires on the time set by the academy.
      </p>
    </div>
  </main>

`;
