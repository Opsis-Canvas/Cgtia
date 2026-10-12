
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import {
      getAuth, signInWithEmailAndPassword, sendPasswordResetEmail,
      updatePassword, onAuthStateChanged, signOut
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import {
      getFirestore, doc, getDoc, setDoc, addDoc, collection,
      updateDoc, serverTimestamp, query, where, getDocs
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
    import {
      getStorage, ref, uploadBytes, getDownloadURL
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

    const firebaseConfig = {
      apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
      authDomain: "verify-cgtia-cert.firebaseapp.com",
      projectId: "verify-cgtia-cert",
      storageBucket: "verify-cgtia-cert.firebasestorage.app",
      messagingSenderId: "766655761701",
      appId: "1:766655761701:web:45f559e0e38023439b5ecc",
      measurementId: "G-KEWZNLWNLW"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str == null ? '' : String(str);
      return div.innerHTML;
    }

    /* =====================================================================
       SIGN IN
       ===================================================================== */
    window.handleAuthSubmit = async function (event) {
      event.preventDefault();
      const form = document.getElementById('authForm');
      const email = form.querySelector('input[type="email"]').value.trim();
      const password = form.querySelector('input[type="password"]').value;
      const submitBtn = document.getElementById('authSubmitBtn');
      const errorEl = document.getElementById('authErrorMsg');
      errorEl.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Signing In\u2026';

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In';
        toggleAuthScreen();

        if (userSnap.exists() && userSnap.data().mustChangePassword) {
          setTimeout(() => { openForcePasswordChangeScreen(); }, 450);
        } else {
          setTimeout(() => { navigateWithPill('Dashboard', 'dashboard.html'); }, 450);
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In';
        let msg = 'Something went wrong \u2014 please check your details and try again.';
        if (err && err.code) {
          if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(err.code)) {
            msg = 'Incorrect email or code. Double-check what was emailed to you.';
          } else if (err.code === 'auth/too-many-requests') {
            msg = 'Too many attempts \u2014 please wait a moment and try again.';
          }
        }
        errorEl.innerText = msg;
        errorEl.classList.remove('hidden');
      }
    };

    /* =====================================================================
       FORGOT PASSWORD
       ===================================================================== */
    window.openForgotPasswordScreen = function () {
      toggleAuthScreen();
      setTimeout(() => {
        const c = document.getElementById('forgotPasswordScreen');
        const d = document.getElementById('forgotPasswordDrawer');
        c.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
        c.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
        d.style.transform = 'translateY(0)';
        d.style.opacity = '1';
        document.body.style.overflow = 'hidden';
      }, 450);
    };

    window.closeForgotPasswordScreen = function () {
      const c = document.getElementById('forgotPasswordScreen');
      const d = document.getElementById('forgotPasswordDrawer');
      c.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      c.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      d.style.transform = '';
      d.style.opacity = '';
      document.body.style.overflow = '';
    };

    window.handleForgotPasswordSubmit = async function (event) {
      event.preventDefault();
      const email = document.getElementById('forgotPasswordEmail').value.trim();
      const btn = document.getElementById('forgotPasswordSubmitBtn');
      btn.disabled = true;
      btn.innerText = 'Sending\u2026';

      // Always show the same outcome regardless of whether the email is
      // registered — this is deliberate so the form can't be used to probe
      // which emails have accounts.
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (err) {
        // swallow — same message either way, see above
      }

      btn.disabled = false;
      btn.innerText = 'Send Reset Link';
      closeForgotPasswordScreen();
      setTimeout(() => {
        openStatusScreen();
        setStatusLoading();
        setTimeout(() => {
          setStatusSuccess('Check Your Email', 'If an account exists for that email, a password reset link is on its way.');
        }, 900);
      }, 450);
    };

    /* =====================================================================
       FORCED FIRST-LOGIN PASSWORD CHANGE
       ===================================================================== */
    window.openForcePasswordChangeScreen = function () {
      const c = document.getElementById('forcePasswordScreen');
      const d = document.getElementById('forcePasswordDrawer');
      c.classList.remove('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      c.classList.add('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      d.style.transform = 'translateY(0)';
      d.style.opacity = '1';
      document.body.style.overflow = 'hidden';
    };

    function closeForcePasswordScreen() {
      const c = document.getElementById('forcePasswordScreen');
      const d = document.getElementById('forcePasswordDrawer');
      c.classList.remove('pointer-events-auto', 'bg-slate-950/40', 'backdrop-blur-md');
      c.classList.add('pointer-events-none', 'bg-slate-950/0', 'backdrop-blur-0');
      d.style.transform = '';
      d.style.opacity = '';
      document.body.style.overflow = '';
    }

    window.handleForcePasswordSubmit = async function (event) {
      event.preventDefault();
      const newPassword = document.getElementById('newPasswordField').value;
      const confirmPassword = document.getElementById('confirmPasswordField').value;
      const errorEl = document.getElementById('forcePasswordError');
      errorEl.classList.add('hidden');

      if (newPassword.length < 8) {
        errorEl.innerText = 'Password must be at least 8 characters.';
        errorEl.classList.remove('hidden');
        return;
      }
      if (newPassword !== confirmPassword) {
        errorEl.innerText = 'Passwords don\u2019t match.';
        errorEl.classList.remove('hidden');
        return;
      }

      const btn = document.getElementById('forcePasswordSubmitBtn');
      btn.disabled = true;
      btn.innerText = 'Saving\u2026';

      try {
        const user = auth.currentUser;
        if (!user) throw new Error('no-current-user');
        await updatePassword(user, newPassword);
        await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: false });
        btn.disabled = false;
        btn.innerText = 'Save & Continue';
        closeForcePasswordScreen();
        setTimeout(() => { navigateWithPill('Dashboard', 'dashboard.html'); }, 450);
      } catch (err) {
        btn.disabled = false;
        btn.innerText = 'Save & Continue';
        errorEl.innerText = 'Something went wrong \u2014 if your session expired, close this and sign in again.';
        errorEl.classList.remove('hidden');
      }
    };

    /* =====================================================================
       APPLY FORM (Certificate / Diploma / Higher Diploma)
       ===================================================================== */
    let __currentApplicationId = null;
    let __virtualAccountFetched = false;

    /**
     * Best-effort staff notification via the Netlify function — since
     * Netlify Functions can't listen for Firestore writes the way a
     * Firebase Cloud Function trigger can, the frontend calls this
     * directly right after each successful submission. Never blocks or
     * fails the person's actual submission if this call has trouble.
     */
    async function notifyStaff(type, summary) {
      try {
        await fetch('/api/notify-staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, summary })
        });
      } catch (err) {
        console.error('notifyStaff failed (non-critical)', err);
      }
    }

  window.handleApplySubmit = async function(event) {
  event.preventDefault();
  
  const form = document.getElementById('applyForm');
  const honeypot = document.getElementById('applyWebsiteField');
  
  if (honeypot && honeypot.value) {
    toggleApplyScreen();
    return;
  }
  
  const programKey = document.getElementById('programSelect').value;
  if (!programKey) return;
  
  const fullName = document.getElementById('fullNameInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const normalizedEmailId = email.toLowerCase();
  
  const startDateEl = document.getElementById('startDateDisplay');
  const startDate = startDateEl ? startDateEl.innerText.trim() : '';
  
  const messageEl = form.querySelector('textarea');
  const message = messageEl ? messageEl.value.trim() : '';
  
  Array.from(form.querySelectorAll('input, select, textarea, button'))
    .forEach((el) => (el.disabled = true));
  
  toggleApplyScreen();
  
  setTimeout(async () => {
    openStatusScreen();
    setStatusLoading();
    
    try {
      const applicationRef = doc(db, 'applications', normalizedEmailId);
      
      await setDoc(applicationRef, {
        fullName,
        phone,
        email: normalizedEmailId,
        program: programKey,
        startDate,
        message,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentPlan: 'full',
        installmentsTotal: 1,
        installmentsPaid: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      __currentApplicationId = normalizedEmailId;
      
      setTimeout(() => {
        setStatusSuccess(
          'Application Received',
          'Thanks — complete payment below to secure your seat for this cohort.'
        );
        
        const btn = document.getElementById('statusActionBtn');
        btn.innerText = 'Continue to Payment';
        btn.onclick = function() {
          closeStatusScreen();
          setTimeout(() => {
            openPaymentScreen(programKey, normalizedEmailId);
          }, 450);
        };
        
        Array.from(form.querySelectorAll('input, select, textarea, button'))
          .forEach((el) => (el.disabled = false));
      }, 1000);
      
    } catch (err) {
      console.error('Application submission failed:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      setStatusError(
        'Submission Failed',
        'We could not submit your application at this time. Please try again.',
        function() {
          closeStatusScreen();
          Array.from(form.querySelectorAll('input, select, textarea, button'))
            .forEach((el) => (el.disabled = false));
        }
      );
    }
  }, 500);
};

    /* =====================================================================
       DEDICATED VIRTUAL ACCOUNT (per-applicant, via Netlify function)
       Fired when the Transfer tab is opened. Replaces the static shared
       bank account with one unique to this application, so incoming
       transfers reconcile automatically — falls back to leaving the
       static account in place if Dedicated Virtual Accounts aren't
       available on the Paystack account yet.
       ===================================================================== */
    window.ensureVirtualAccount = async function () {
      if (!__currentApplicationId || __virtualAccountFetched) return;
      const statusEl = document.getElementById('virtualAccountStatus');
      if (statusEl) statusEl.classList.remove('hidden');

      try {
        const appSnap = await getDoc(doc(db, 'applications', __currentApplicationId));
        if (!appSnap.exists()) return;
        const appData = appSnap.data();

        const res = await fetch('/api/create-virtual-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: __currentApplicationId,
            email: appData.email,
            fullName: appData.fullName,
            phone: appData.phone
          })
        });
        const result = await res.json();

        if (result && !result.fallback && result.accountNumber) {
          __virtualAccountFetched = true;
          const bankEl = document.getElementById('transferBankNameDisplay');
          const acctEl = document.getElementById('acctNumberText');
          const nameEl = document.getElementById('transferAccountNameDisplay');
          const noteEl = document.getElementById('transferAccountNote');
          if (bankEl) bankEl.innerText = result.bankName || '\u2014';
          if (acctEl) acctEl.innerText = result.accountNumber;
          if (nameEl) nameEl.innerText = result.accountName || 'Caregivers Training & Internship Academy Ltd';
          if (noteEl) noteEl.innerText = 'This account number is unique to your application \u2014 payments to it are matched and confirmed automatically.';
        }
        // If result.fallback is true, quietly keep showing the static
        // shared account already in the HTML — that's an expected path,
        // not an error (Dedicated Virtual Accounts may not be enabled on
        // the Paystack account yet).
      } catch (err) {
        console.error('ensureVirtualAccount failed, using shared account instead', err);
      } finally {
        if (statusEl) statusEl.classList.add('hidden');
      }
    };

    /* =====================================================================
       PAYMENT CONFIRMATION (transfer + card)
       Both record the payment plan the person picked, then either wait on
       manual bank-transfer verification or hand off to Paystack. Neither
       one marks the application "paid" directly from the browser — that
       only ever happens server-side (Paystack webhook, or staff via the
       confirm-transfer Netlify function), since a client marking its own
       payment as complete would be trivial to fake.
       ===================================================================== */
  window.handleTransferConfirm = async function() {
  if (!__currentApplicationId) { closePaymentScreen(); return; }
  const state = getPaymentState();
  const plan = state.plan;
  const total = plan === 'installment' ? 3 : 1;
  
  try {
    await updateDoc(doc(db, 'applications', __currentApplicationId), {
      paymentPlan: plan,
      installmentsTotal: total,
      updatedAt: serverTimestamp(),
      email: __currentApplicationId
    });
  } catch (err) {
    console.error('Could not record payment plan', err);
  }
  
  closePaymentScreen();
  setTimeout(() => {
    openStatusScreen();
    setStatusLoading();
    document.getElementById('statusTitle').innerText = 'Recording your transfer\u2026';
    document.getElementById('statusMessage').innerText = 'Please hold on a moment.';
    setTimeout(() => {
      const isInstallment = plan === 'installment';
      setStatusSuccess(
        isInstallment ? 'First Installment Noted' : 'Transfer Noted',
        'We\u2019ve recorded your transfer and will verify it against our bank statement, then ' +
        (isInstallment ? 'email your login code' : 'confirm your seat by email') +
        ' \u2014 this can take a little while during manual review.'
      );
    }, 1600);
  }, 450);
};

    window.payWithPaystackCard = async function () {
  if (typeof PaystackPop === 'undefined') {
    alert('Paystack checkout isn\'t connected yet \u2014 add your Paystack public key to enable card payments.');
    return;
  }
  if (!__currentApplicationId) return;

  const state = getPaymentState();
  const plan = state.plan;
  const total = plan === 'installment' ? 3 : 1;
  const amountDue = plan === 'installment'
    ? state.installmentAmounts[0]
    : (state.program ? state.program.amount : 0);

  try {
    await updateDoc(doc(db, 'applications', __currentApplicationId), {
      paymentPlan: plan,
      installmentsTotal: total,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Could not record payment plan', err);
  }

  const applicationId = __currentApplicationId;
  console.log('🔑 Sending reference to Paystack:', applicationId);
  console.log('🔑 Email:', state.email);
  console.log('🔑 Plan:', plan);
  console.log('🔑 Amount:', amountDue);

  const handler = PaystackPop.setup({
    key: 'pk_test_d5e8813de6f1b2a281dd55d6aa71211acaa2e2b4', // Change to pk_live_... when ready
    email: state.email || 'applicant@example.com',
    amount: Math.round(amountDue * 100),
    currency: 'NGN',
    reference: applicationId,
    metadata: {
      applicationId: applicationId,
      paymentPlan: plan
    },
    callback: function (response) {
      console.log('✅ Paystack callback received:', response);
      closePaymentScreen();
      setTimeout(() => {
        openStatusScreen();
        setStatusLoading();
        document.getElementById('statusTitle').innerText = 'Confirming your payment\u2026';
        setTimeout(() => {
          const isInstallment = plan === 'installment';
          setStatusSuccess(
            isInstallment ? 'First Installment Received' : 'Payment Received',
            (isInstallment ? 'Your login code is on its way to your email. ' : 'Your seat is confirmed. ') +
            'Reference: ' + response.reference
          );
        }, 1400);
      }, 450);
    },
    onClose: function () {}
  });
  handler.openIframe();
};

    /* =====================================================================
       CONTACT FORM + FAQ "ASK US" BOX
       ===================================================================== */
    window.handleContactSubmit = async function (event) {
      event.preventDefault();
      const form = document.getElementById('contactForm');
      const honeypot = document.getElementById('contactWebsiteField');
      if (honeypot && honeypot.value) { form.reset(); return; }

      const name = form.querySelector('input[type="text"]').value.trim();
      const phone = form.querySelector('input[type="tel"]').value.trim();
      const email = form.querySelector('input[type="email"]').value.trim().toLowerCase();
      const subject = form.querySelector('select').value;
      const message = form.querySelector('textarea').value.trim();

      Array.from(form.querySelectorAll('input, select, textarea, button')).forEach((el) => (el.disabled = true));
      openStatusScreen();
      setStatusLoading();
      document.getElementById('statusTitle').innerText = 'Sending your message\u2026';
      document.getElementById('statusMessage').innerText = 'Please hold on while we deliver it to the CGTIA team.';

      try {
        await addDoc(collection(db, 'contactMessages'), {
          name, phone, email, subject, message,
          preferredContactMethod: 'email',
          contactValue: email,
          status: 'new',
          createdAt: serverTimestamp()
        });
        setStatusSuccess('Message Sent', 'Thanks for reaching out \u2014 we typically reply within 1\u20132 business days.');
        notifyStaff('contact', { name, email, phone, subject });
      } catch (err) {
        console.error(err);
        setStatusError('Message Not Sent', 'Something went wrong and your message didn\u2019t go through. Please try again.', function () {
          closeStatusScreen();
          Array.from(form.querySelectorAll('input, select, textarea, button')).forEach((el) => (el.disabled = false));
        });
      }
    };

    window.handleFaqQuestionSubmit = async function (event) {
      event.preventDefault();
      const form = document.getElementById('faqQuestionForm');
      const honeypot = document.getElementById('faqWebsiteField');
      if (honeypot && honeypot.value) { form.reset(); closeFaqQuestionBox(); return; }

      const message = form.querySelector('textarea').value.trim();
      const methodInput = form.querySelector('input[name="faqContactMethod"]:checked');
      const method = methodInput ? methodInput.value : 'email';
      const contactValue = form.querySelector('input[type="text"]').value.trim();
      const topicRaw = document.getElementById('faqTopicContext').innerText || '';
      const faqTopic = topicRaw.replace(/^Re:\s*/, '');

      Array.from(form.querySelectorAll('input, textarea, button')).forEach((el) => (el.disabled = true));
      closeFaqQuestionBox();

      setTimeout(async () => {
        openStatusScreen();
        setStatusLoading();
        document.getElementById('statusTitle').innerText = 'Sending your question\u2026';
        document.getElementById('statusMessage').innerText = 'Please hold on while we send this over.';
        try {
          await addDoc(collection(db, 'contactMessages'), {
            message,
            faqTopic,
            preferredContactMethod: method,
            contactValue,
            status: 'new',
            createdAt: serverTimestamp()
          });
          const methodLabel = method === 'whatsapp' ? 'WhatsApp' : 'email';
          setStatusSuccess('Question Sent', 'Thanks \u2014 we\u2019ll get back to you via ' + methodLabel + ' within 1\u20132 business days.');
          notifyStaff('contact', { topic: faqTopic || 'FAQ question', contact: contactValue, method });
        } catch (err) {
          console.error(err);
          setStatusError('Not Sent', 'Something went wrong and your question didn\u2019t go through. Please try again.', function () {
            closeStatusScreen();
            Array.from(form.querySelectorAll('input, textarea, button')).forEach((el) => (el.disabled = false));
          });
        }
      }, 450);
    };

    /* =====================================================================
       CUSTOM (Individual / School / Organization) REQUEST FORM
       ===================================================================== */
    window.handleCustomSubmit = async function (event) {
      event.preventDefault();
      const form = document.getElementById('customForm');
      const honeypot = document.getElementById('customWebsiteField');
      if (honeypot && honeypot.value) { form.reset(); return; }

      const applicantType = getCustomType();
      const name = document.getElementById('nameField').value.trim();
      const email = form.querySelector('input[type="email"]').value.trim();
      const phone = form.querySelector('input[type="tel"]').value.trim();

      let details = {};
      if (applicantType === 'individual') {
        const container = document.getElementById('individualFields');
        details = {
          priorTraining: container.querySelector('select').value,
          goal: container.querySelector('textarea').value.trim()
        };
      } else if (applicantType === 'school') {
        const container = document.getElementById('schoolFields');
        const textInputs = container.querySelectorAll('input[type="text"]');
        details = {
          schoolName: textInputs[0] ? textInputs[0].value.trim() : '',
          role: textInputs[1] ? textInputs[1].value.trim() : '',
          studentCount: container.querySelector('input[type="number"]').value,
          startPeriod: textInputs[2] ? textInputs[2].value.trim() : '',
          notes: container.querySelector('textarea').value.trim()
        };
      } else if (applicantType === 'organization') {
        const container = document.getElementById('organizationFields');
        const textInputs = container.querySelectorAll('input[type="text"]');
        details = {
          organizationName: textInputs[0] ? textInputs[0].value.trim() : '',
          requestType: container.querySelector('select').value,
          traineeCount: container.querySelector('input[type="number"]').value,
          startPeriod: textInputs[1] ? textInputs[1].value.trim() : '',
          notes: container.querySelector('textarea').value.trim()
        };
      }

      Array.from(form.querySelectorAll('input, select, textarea, button')).forEach((el) => (el.disabled = true));
      openStatusScreen();
      setStatusLoading();
      document.getElementById('statusTitle').innerText = 'Sending your request\u2026';
      document.getElementById('statusMessage').innerText = 'Please hold on while we pass this to our placement team.';

      try {
        await addDoc(collection(db, 'customRequests'), {
          applicantType, name, email, phone, details,
          status: 'new',
          createdAt: serverTimestamp()
        });
        setStatusSuccess('Request Received', 'Thanks \u2014 our team will reach out with next steps and a custom quote shortly.');
        notifyStaff('custom', { type: applicantType, name, email, phone });
      } catch (err) {
        console.error(err);
        setStatusError('Request Not Sent', 'Something went wrong and your request didn\u2019t go through. Please try again.', function () {
          closeStatusScreen();
          Array.from(form.querySelectorAll('input, select, textarea, button')).forEach((el) => (el.disabled = false));
        });
      }
    };

    /* =====================================================================
       LICENSING APPLICATION (uploads + Firestore doc)
       ===================================================================== */
    window.handleLicensingSubmit = async function (event) {
      event.preventDefault();
      const honeypot = document.getElementById('licensingWebsiteField');
      if (honeypot && honeypot.value) return;
      if (!isSelfieCaptured()) {
        alert('Please add a selfie photo (camera or upload) before submitting.');
        return;
      }

      const form = document.getElementById('licensingForm');
      const fullName = form.querySelector('input[type="text"]').value.trim();
      const phone = form.querySelector('input[type="tel"]').value.trim();
      const email = document.getElementById('licensingEmail').value.trim();
      const certFile = document.getElementById('certFileInput').files[0];
      const idFile = document.getElementById('idFileInput').files[0];
      const selfieDataUrl = document.getElementById('selfiePreview').src;

      if (!certFile || !idFile) {
        alert('Please attach both your certificate and a government ID before submitting.');
        return;
      }

      Array.from(form.querySelectorAll('input, select, textarea, button')).forEach((el) => (el.disabled = true));
      openStatusScreen();
      setStatusLoading();
      document.getElementById('statusTitle').innerText = 'Uploading your documents\u2026';
      document.getElementById('statusMessage').innerText = 'Please don\u2019t close this while your files upload.';

      try {
        // An unguessable id shared by the Storage folder and the Firestore
        // doc, generated client-side since licensing applicants are never
        // authenticated (see the auth-flow note in the blueprint).
        const requestId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);

        const certExt = (certFile.name.split('.').pop() || 'pdf').toLowerCase();
        const idExt = (idFile.name.split('.').pop() || 'pdf').toLowerCase();

        const certRef = ref(storage, `licensing/${requestId}/certificate.${certExt}`);
        const idRef = ref(storage, `licensing/${requestId}/id.${idExt}`);
        const selfieRef = ref(storage, `licensing/${requestId}/selfie.jpg`);

        await uploadBytes(certRef, certFile);
        await uploadBytes(idRef, idFile);

        const selfieBlob = await (await fetch(selfieDataUrl)).blob();
        await uploadBytes(selfieRef, selfieBlob);

        const [certificateFileUrl, idFileUrl, selfieFileUrl] = await Promise.all([
          getDownloadURL(certRef),
          getDownloadURL(idRef),
          getDownloadURL(selfieRef)
        ]);

        document.getElementById('statusTitle').innerText = 'Submitting your application\u2026';

        await setDoc(doc(db, 'licensingApplications', requestId), {
          fullName, phone, email,
          certificateFileUrl, idFileUrl, selfieFileUrl,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        setStatusSuccess('Application Received', 'Your documents are in. Our team will review them \u2014 we\u2019ll email you once that\u2019s done.');
        notifyStaff('licensing', { name: fullName, email, phone });
      } catch (err) {
        console.error(err);
        setStatusError('Submission Failed', 'Something went wrong uploading your documents. Please check your connection and try again.', function () {
          closeStatusScreen();
          Array.from(form.querySelectorAll('input, select, textarea, button')).forEach((el) => (el.disabled = false));
        });
      }
    };

    /* =====================================================================
       CERTIFICATE / LICENSE VERIFICATION (verify.html)
       ===================================================================== */
    window.handleVerifySubmit = async function (event) {
      event.preventDefault();
      const input = document.getElementById('verifySerialInput');
      const serial = input.value.trim();
      if (!serial) return;

      const btn = document.getElementById('verifySubmitBtn');
      const resultArea = document.getElementById('verifyResultArea');
      btn.disabled = true;
      btn.innerText = 'Checking\u2026';
      resultArea.innerHTML = '';

      try {
        const q = query(collection(db, 'certificates'), where('serialNumber', '==', serial));
        const snap = await getDocs(q);

        if (snap.empty) {
          resultArea.innerHTML =
            '<div class="rounded-[2rem] bg-red-50 border border-red-200 p-8 text-center">' +
            '<svg class="w-10 h-10 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>' +
            '<h3 class="font-editorial text-xl font-bold text-red-900 mb-2">Not Found</h3>' +
            '<p class="text-sm text-red-700">We couldn\u2019t find a certificate with that serial number. Double-check it and try again, or contact admissions if you believe this is an error.</p>' +
            '</div>';
        } else {
          const data = snap.docs[0].data();
          const statusValid = data.status === 'valid';
          const iconPath = statusValid
            ? '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
            : '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';
          resultArea.innerHTML =
            '<div class="rounded-[2rem] ' + (statusValid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200') + ' border p-8">' +
            '<div class="flex items-center gap-3 mb-5">' +
            '<svg class="w-8 h-8 ' + (statusValid ? 'text-emerald-600' : 'text-amber-600') + '" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">' + iconPath + '</svg>' +
            '<h3 class="font-editorial text-xl font-bold ' + (statusValid ? 'text-emerald-900' : 'text-amber-900') + '">' + (statusValid ? 'Certificate Verified' : 'Certificate Revoked') + '</h3>' +
            '</div>' +
            '<div class="space-y-3 text-sm">' +
            '<div class="flex justify-between"><span class="text-slate-500">Name</span><span class="font-semibold text-slate-800">' + escapeHtml(data.studentName) + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">Program</span><span class="font-semibold text-slate-800">' + escapeHtml(data.program) + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">Issued</span><span class="font-semibold text-slate-800">' + escapeHtml(data.issueDate) + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">Serial Number</span><span class="font-semibold text-slate-800 font-mono">' + escapeHtml(data.serialNumber || serial) + '</span></div>' +
            '</div></div>';
        }
      } catch (err) {
        console.error(err);
        resultArea.innerHTML = '<p class="text-center text-sm text-red-600">Something went wrong checking that serial number. Please try again.</p>';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Verify';
      }
    };

    /* =====================================================================
       DASHBOARD (dashboard.html) — auth gate + basic data load
       ===================================================================== */
    window.__firebaseSignOut = function () {
      signOut(auth).then(() => { navigateWithPill('Home', 'index.html'); });
    };

    if (document.getElementById('dashboardRoot')) {
      onAuthStateChanged(auth, async (user) => {
        const loadingEl = document.getElementById('dashboardLoading');
        const signedOutEl = document.getElementById('dashboardSignedOut');
        const contentEl = document.getElementById('dashboardContent');
        if (!user) {
          if (loadingEl) loadingEl.classList.add('hidden');
          if (signedOutEl) signedOutEl.classList.remove('hidden');
          return;
        }
        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (!userSnap.exists()) throw new Error('no-user-doc');
          const userData = userSnap.data();

          if (userData.mustChangePassword) {
            if (loadingEl) loadingEl.classList.add('hidden');
            openForcePasswordChangeScreen();
            return;
          }

          let appData = null;
          if (userData.applicationId) {
            const appSnap = await getDoc(doc(db, 'applications', userData.applicationId));
            if (appSnap.exists()) appData = appSnap.data();
          }

          if (loadingEl) loadingEl.classList.add('hidden');
          if (contentEl) {
            contentEl.classList.remove('hidden');
            const nameEl = document.getElementById('dashboardName');
            const programEl = document.getElementById('dashboardProgram');
            const progressEl = document.getElementById('dashboardPaymentProgress');
            if (nameEl) nameEl.innerText = userData.fullName || 'there';
            if (programEl) programEl.innerText = PROGRAM_LABELS[userData.program] || userData.program || '\u2014';
            if (progressEl && appData) {
              const total = appData.installmentsTotal || 1;
              const paid = appData.installmentsPaid || 0;
              progressEl.innerText = paid >= total
                ? 'Fully paid'
                : paid + ' of ' + total + ' installments paid';
            }
          }
        } catch (err) {
          console.error(err);
          if (loadingEl) loadingEl.classList.add('hidden');
          if (signedOutEl) signedOutEl.classList.remove('hidden');
        }
      });
    }

    const PROGRAM_LABELS = {
      'certificate': 'CGTIA Certificate',
      'diploma': 'CGTIA Diploma',
      'higher-diploma': 'CGTIA Higher Diploma'
    };

    /* =====================================================================
       WALL OF FAME + GRADUATES
       Shared rendering used across three spots: the full wall-of-fame.html
       page (podium per year + full graduating class), the home page teaser
       (latest year's top 3 + a handful of recent graduates), and the
       Gallery's year-grouped graduation section. All read from the same
       two collections — wallOfFame and graduates — which staff curate via
       the Firebase Console.
       ===================================================================== */
    async function fetchWallOfFame() {
      const snap = await getDocs(collection(db, 'wallOfFame'));
      const items = [];
      snap.forEach((d) => items.push(d.data()));
      return items;
    }

    async function fetchGraduates() {
      const snap = await getDocs(collection(db, 'graduates'));
      const items = [];
      snap.forEach((d) => items.push(d.data()));
      return items;
    }

    function groupByYear(items) {
      const byYear = {};
      items.forEach((item) => {
        const y = item.year || 'Unknown';
        if (!byYear[y]) byYear[y] = [];
        byYear[y].push(item);
      });
      return byYear;
    }

    function renderPodiumCard(entry, rank) {
      const rankLabels = { 1: 'Best Graduating Student', 2: '2nd Best Graduating Student', 3: '3rd Best Graduating Student' };
      const rankStyles = { 1: 'bg-amber-50 border-amber-200 text-amber-900', 2: 'bg-slate-50 border-slate-200 text-slate-700', 3: 'bg-orange-50 border-orange-200 text-orange-900' };
      const initial = escapeHtml((entry.studentName || '?').charAt(0));
      const photo = entry.photoUrl
        ? '<img src="' + escapeHtml(entry.photoUrl) + '" alt="' + escapeHtml(entry.studentName) + '" class="w-full h-full object-cover">'
        : '<div class="w-full h-full flex items-center justify-center text-4xl font-editorial font-bold text-slate-300">' + initial + '</div>';
      return (
        '<div class="soft-component-card rounded-[2.5rem] overflow-hidden border border-white/60' + (rank === 1 ? ' md:scale-105 md:-translate-y-2 shadow-xl' : '') + '">' +
        '<div class="aspect-square bg-slate-100 overflow-hidden">' + photo + '</div>' +
        '<div class="p-6">' +
        '<span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border ' + rankStyles[rank] + '">' + rankLabels[rank] + '</span>' +
        '<h3 class="font-editorial text-xl font-bold text-blue-950 mb-1">' + escapeHtml(entry.studentName) + '</h3>' +
        '<p class="text-xs text-slate-400">' + escapeHtml(entry.program || '') + '</p>' +
        (entry.quote ? '<p class="text-sm text-slate-500 font-light italic mt-3">\u201c' + escapeHtml(entry.quote) + '\u201d</p>' : '') +
        '</div></div>'
      );
    }

    function renderYearPodium(year, entries) {
      let cards = '';
      [1, 2, 3].forEach((rank) => {
        const entry = entries.find((e) => e.rank === rank);
        if (entry) cards += renderPodiumCard(entry, rank);
      });
      if (!cards) return '';
      return (
        '<div class="mb-16 md:mb-20">' +
        '<h2 class="font-editorial text-2xl md:text-3xl text-blue-950 font-bold mb-8">Class of ' + escapeHtml(year) + '</h2>' +
        '<div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-end">' + cards + '</div>' +
        '</div>'
      );
    }

    function renderGraduateCard(g) {
      const initial = escapeHtml((g.studentName || '?').charAt(0));
      const photo = g.photoUrl
        ? '<img src="' + escapeHtml(g.photoUrl) + '" alt="' + escapeHtml(g.studentName) + '" class="w-full h-full object-cover">'
        : '<div class="w-full h-full flex items-center justify-center text-3xl font-editorial font-bold text-slate-300">' + initial + '</div>';
      return (
        '<div class="soft-component-card rounded-[2rem] overflow-hidden border border-white/60">' +
        '<div class="aspect-[4/5] bg-slate-100 overflow-hidden">' + photo + '</div>' +
        '<div class="p-5">' +
        '<h4 class="font-editorial text-base font-bold text-blue-950">' + escapeHtml(g.studentName) + '</h4>' +
        '<p class="text-xs text-slate-400 mb-2">' + escapeHtml(g.program || '') + (g.year ? ' &middot; ' + escapeHtml(g.year) : '') + '</p>' +
        (g.activity ? '<p class="text-xs text-slate-500 font-light leading-relaxed">' + escapeHtml(g.activity) + '</p>' : '') +
        '</div></div>'
      );
    }

    function renderCompactHonoreeCard(entry, rank) {
      const rankLabels = { 1: 'Best Graduating Student', 2: '2nd Best', 3: '3rd Best' };
      const initial = escapeHtml((entry.studentName || '?').charAt(0));
      const photo = entry.photoUrl
        ? '<img src="' + escapeHtml(entry.photoUrl) + '" alt="' + escapeHtml(entry.studentName) + '" class="w-full h-full object-cover">'
        : '<div class="w-full h-full flex items-center justify-center text-2xl font-editorial font-bold text-white/40">' + initial + '</div>';
      return (
        '<div class="bg-white/10 rounded-[1.75rem] overflow-hidden border border-white/10">' +
        '<div class="aspect-square bg-white/5 overflow-hidden">' + photo + '</div>' +
        '<div class="p-4">' +
        '<span class="text-[9px] font-bold uppercase tracking-widest text-blue-300 block mb-1">' + rankLabels[rank] + '</span>' +
        '<h4 class="font-editorial text-sm font-bold text-white">' + escapeHtml(entry.studentName) + '</h4>' +
        '</div></div>'
      );
    }

    async function initWallOfFamePage() {
      const container = document.getElementById('wallOfFameContainer');
      const loadingEl = document.getElementById('wallOfFameLoading');
      try {
        const items = await fetchWallOfFame();
        if (loadingEl) loadingEl.classList.add('hidden');
        if (!items.length) {
          container.innerHTML = '<p class="text-center text-sm text-slate-400 py-16">Our Wall of Fame is being prepared \u2014 check back soon.</p>';
        } else {
          const byYear = groupByYear(items);
          const years = Object.keys(byYear).sort((a, b) => b - a);
          let html = '';
          years.forEach((year) => {
            const entries = byYear[year].slice().sort((a, b) => (a.rank || 9) - (b.rank || 9));
            html += renderYearPodium(year, entries);
          });
          container.innerHTML = html || '<p class="text-center text-sm text-slate-400 py-16">Our Wall of Fame is being prepared \u2014 check back soon.</p>';
        }
      } catch (err) {
        console.error(err);
        if (loadingEl) loadingEl.classList.add('hidden');
        container.innerHTML = '<p class="text-center text-sm text-red-500 py-16">Something went wrong loading the Wall of Fame.</p>';
      }

      const gradGrid = document.getElementById('graduatesGrid');
      if (gradGrid) {
        try {
          const grads = await fetchGraduates();
          if (!grads.length) {
            gradGrid.innerHTML = '<p class="text-center text-sm text-slate-400 py-12 col-span-full">Graduate highlights are coming soon.</p>';
          } else {
            grads.sort((a, b) => (b.year || 0) - (a.year || 0));
            gradGrid.innerHTML = grads.map(renderGraduateCard).join('');
          }
        } catch (err) {
          console.error(err);
          gradGrid.innerHTML = '<p class="text-center text-sm text-red-500 py-12 col-span-full">Something went wrong loading graduates.</p>';
        }
      }
    }

    async function initHomeWallOfFamePreview() {
      const previewEl = document.getElementById('homeWallOfFamePreview');
      if (previewEl) {
        try {
          const items = await fetchWallOfFame();
          if (!items.length) {
            previewEl.innerHTML = '<p class="text-blue-200 text-sm col-span-full text-center py-6">Our Wall of Fame is being prepared \u2014 check back soon.</p>';
          } else {
            const byYear = groupByYear(items);
            const years = Object.keys(byYear).sort((a, b) => b - a);
            const latestYear = years[0];
            const entries = byYear[latestYear].slice().sort((a, b) => (a.rank || 9) - (b.rank || 9));
            let html = '';
            [1, 2, 3].forEach((rank) => {
              const entry = entries.find((e) => e.rank === rank);
              if (entry) html += renderCompactHonoreeCard(entry, rank);
            });
            previewEl.innerHTML = html || '<p class="text-blue-200 text-sm col-span-full text-center py-6">Our Wall of Fame is being prepared \u2014 check back soon.</p>';
          }
        } catch (err) {
          console.error(err);
          previewEl.innerHTML = '<p class="text-blue-200 text-sm col-span-full text-center py-6">Something went wrong loading honorees.</p>';
        }
      }

      const gradPreviewEl = document.getElementById('homeGraduatesPreview');
      if (gradPreviewEl) {
        try {
          const grads = await fetchGraduates();
          if (!grads.length) {
            gradPreviewEl.innerHTML = '<p class="text-center text-sm text-slate-400 py-12 col-span-full">Graduate highlights are coming soon.</p>';
          } else {
            grads.sort((a, b) => (b.year || 0) - (a.year || 0));
            gradPreviewEl.innerHTML = grads.slice(0, 8).map(renderGraduateCard).join('');
          }
        } catch (err) {
          console.error(err);
          gradPreviewEl.innerHTML = '<p class="text-center text-sm text-red-500 py-12 col-span-full">Something went wrong loading graduates.</p>';
        }
      }
    }

    async function initGalleryGraduationSection() {
      const container = document.getElementById('galleryGraduationContainer');
      if (!container) return;
      try {
        const grads = await fetchGraduates();
        if (!grads.length) {
          container.innerHTML = '<p class="text-center text-sm text-slate-400 py-12">Graduation photos are coming soon.</p>';
          return;
        }
        const byYear = groupByYear(grads);
        const years = Object.keys(byYear).sort((a, b) => b - a);
        let html = '';
        years.forEach((year) => {
          const entries = byYear[year];
          html +=
            '<div class="mb-14">' +
            '<h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold mb-6">Class of ' + escapeHtml(year) + '</h3>' +
            '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">' +
            entries.map(renderGraduateCard).join('') +
            '</div></div>';
        });
        container.innerHTML = html;
      } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-center text-sm text-red-500 py-12">Something went wrong loading graduation photos.</p>';
      }
    }

    if (document.getElementById('wallOfFameContainer')) initWallOfFamePage();
    if (document.getElementById('homeWallOfFamePreview')) initHomeWallOfFamePreview();
    if (document.getElementById('galleryGraduationContainer')) initGalleryGraduationSection();
    
    // Toggle password visibility
window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const svg = btn.querySelector('svg');
  if (input.type === 'password') {
    input.type = 'text';
    // Eye-slash icon (visible state – show the password)
    svg.innerHTML = `
      <path d="M12 4.5C7.5 4.5 3.5 7.5 1.5 12c2 4.5 6 7.5 10.5 7.5s8.5-3 10.5-7.5c-2-4.5-6-7.5-10.5-7.5zM12 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"/>
      <path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `;
  } else {
    input.type = 'password';
    // Eye icon (hidden state – hide the password)
    svg.innerHTML = `
      <path d="M12 4.5C7.5 4.5 3.5 7.5 1.5 12c2 4.5 6 7.5 10.5 7.5s8.5-3 10.5-7.5c-2-4.5-6-7.5-10.5-7.5zM12 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"/>
    `;
  }
};
  