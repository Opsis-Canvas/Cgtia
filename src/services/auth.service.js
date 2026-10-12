/**
 * Student portal auth — always bound via document capture so SPA re-inject works
 */
async function getAuthApi() {
  const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const {
    getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, updatePassword
  } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  const { getFirestore, doc, getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

  const firebaseConfig = {
    apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
    authDomain: "verify-cgtia-cert.firebaseapp.com",
    projectId: "verify-cgtia-cert",
    storageBucket: "verify-cgtia-cert.firebasestorage.app",
    messagingSenderId: "766655761701",
    appId: "1:766655761701:web:45f559e0e38023439b5ecc"
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
    auth: getAuth(app),
    db: getFirestore(app),
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updatePassword,
    doc,
    getDoc,
    updateDoc
  };
}

function openSheet(screenId, drawerId) {
  const container = document.getElementById(screenId);
  const drawer = document.getElementById(drawerId);
  if (!container) return;
  container.classList.remove("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
  container.classList.add("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
  container.style.pointerEvents = "auto";
  if (drawer) {
    drawer.style.transform = "translateY(0)";
    drawer.style.opacity = "1";
  }
  document.body.style.overflow = "hidden";
}

function closeSheet(screenId, drawerId) {
  const container = document.getElementById(screenId);
  const drawer = document.getElementById(drawerId);
  if (!container) return;
  container.classList.add("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
  container.classList.remove("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
  container.style.pointerEvents = "none";
  if (drawer) {
    drawer.style.transform = "";
    drawer.style.opacity = "";
  }
  document.body.style.overflow = "";
}

window.togglePasswordVisibility = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const showing = input.type === "password";
  input.type = showing ? "text" : "password";
  const svg = btn && btn.querySelector("svg");
  if (!svg) return;
  // Eye open = password visible; eye with slash = password hidden
  if (showing) {
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>';
  } else {
    svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>';
  }
};

window.toggleAuthScreen = function () {
  const container = document.getElementById("authScreen");
  if (!container) return;
  const closed =
    container.classList.contains("pointer-events-none") ||
    getComputedStyle(container).pointerEvents === "none";
  if (closed) openSheet("authScreen", "authDrawer");
  else closeSheet("authScreen", "authDrawer");
};

window.openForgotPasswordScreen = function () {
  closeSheet("authScreen", "authDrawer");
  setTimeout(() => openSheet("forgotPasswordScreen", "forgotPasswordDrawer"), 300);
};

window.closeForgotPasswordScreen = function () {
  closeSheet("forgotPasswordScreen", "forgotPasswordDrawer");
};

window.handleAuthSubmit = async function (event) {
  if (event && event.preventDefault) event.preventDefault();
  const form = document.getElementById("authForm");
  if (!form) return false;
  const email = (form.querySelector('input[type="email"]') || {}).value || "";
  const password = (form.querySelector('input[type="password"]') || {}).value || "";
  const submitBtn = document.getElementById("authSubmitBtn");
  const errorEl = document.getElementById("authErrorMsg");
  if (errorEl) errorEl.classList.add("hidden");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Signing in…";
  }
  try {
    const api = await getAuthApi();
    const cred = await api.signInWithEmailAndPassword(api.auth, email.trim(), password);
    const userSnap = await api.getDoc(api.doc(api.db, "users", cred.user.uid));
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Sign In";
    }
    window.toggleAuthScreen();
    if (userSnap.exists() && userSnap.data().mustChangePassword) {
      setTimeout(() => openSheet("forcePasswordScreen", "forcePasswordDrawer"), 350);
    } else {
      setTimeout(() => {
        if (window.navigateWithPill) window.navigateWithPill("My dashboard", "dashboard.html");
        else if (window.__cgtiaNavigate) window.__cgtiaNavigate("/dashboard");
      }, 350);
    }
  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Sign In";
    }
    let msg = "We could not sign you in. Please check your email and password.";
    if (err && ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(err.code)) {
      msg = "That email or password does not match our records. Try again, or use Forgot password.";
    } else if (err && err.code === "auth/too-many-requests") {
      msg = "Too many attempts. Please wait a few minutes and try again.";
    }
    if (errorEl) {
      errorEl.innerText = msg;
      errorEl.classList.remove("hidden");
    } else alert(msg);
  }
  return false;
};

window.handleForgotPasswordSubmit = async function (event) {
  if (event && event.preventDefault) event.preventDefault();
  const emailInput = document.getElementById("forgotPasswordEmail");
  const email = (emailInput && emailInput.value || "").trim();
  const btn = document.getElementById("forgotPasswordSubmitBtn");
  if (!email) {
    alert("Please enter the email you used when you applied.");
    return false;
  }
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Sending…";
  }
  try {
    const api = await getAuthApi();
    await api.sendPasswordResetEmail(api.auth, email);
    alert("If that email is registered with us, we have sent a message with a link to reset your password. Please check your inbox and spam folder.");
    window.closeForgotPasswordScreen();
  } catch (err) {
    alert("We could not send a reset link right now. Please try again shortly, or contact admissions.");
  }
  if (btn) {
    btn.disabled = false;
    btn.innerText = "Send reset link";
  }
  return false;
};

window.handleForcePasswordSubmit = async function (event) {
  if (event && event.preventDefault) event.preventDefault();
  const newPassword = (document.getElementById("newPasswordField") || {}).value || "";
  const confirmPassword = (document.getElementById("confirmPasswordField") || {}).value || "";
  const errorEl = document.getElementById("forcePasswordError");
  if (errorEl) errorEl.classList.add("hidden");
  if (newPassword.length < 8) {
    if (errorEl) {
      errorEl.innerText = "Please choose a password with at least 8 characters.";
      errorEl.classList.remove("hidden");
    }
    return false;
  }
  if (newPassword !== confirmPassword) {
    if (errorEl) {
      errorEl.innerText = "The two passwords do not match.";
      errorEl.classList.remove("hidden");
    }
    return false;
  }
  const btn = document.getElementById("forcePasswordSubmitBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Saving…";
  }
  try {
    const api = await getAuthApi();
    if (!api.auth.currentUser) throw new Error("not-signed-in");
    await api.updatePassword(api.auth.currentUser, newPassword);
    await api.updateDoc(api.doc(api.db, "users", api.auth.currentUser.uid), { mustChangePassword: false });
    closeSheet("forcePasswordScreen", "forcePasswordDrawer");
    setTimeout(() => {
      if (window.navigateWithPill) window.navigateWithPill("My dashboard", "dashboard.html");
      else if (window.__cgtiaNavigate) window.__cgtiaNavigate("/dashboard");
    }, 350);
  } catch (err) {
    if (errorEl) {
      errorEl.innerText = "We could not save your new password. Please sign in again and try once more.";
      errorEl.classList.remove("hidden");
    }
  }
  if (btn) {
    btn.disabled = false;
    btn.innerText = "Save & Continue";
  }
  return false;
};

/** Capture-phase delegation — works even when markup is re-injected */
function bindAuthClicks() {
  if (window.__cgtiaAuthBound) return;
  window.__cgtiaAuthBound = true;
  document.addEventListener(
    "click",
    function (e) {
      const t = e.target.closest("button, a, [onclick]");
      if (!t) return;
      const id = t.id || "";
      const oc = t.getAttribute("onclick") || "";

      if (id === "authSubmitBtn" || /handleAuthSubmit/.test(oc)) {
        e.preventDefault();
        e.stopPropagation();
        window.handleAuthSubmit(e);
        return;
      }
      if (id === "forgotPasswordSubmitBtn" || /handleForgotPasswordSubmit/.test(oc)) {
        e.preventDefault();
        e.stopPropagation();
        window.handleForgotPasswordSubmit(e);
        return;
      }
      if (id === "forcePasswordSubmitBtn" || /handleForcePasswordSubmit/.test(oc)) {
        e.preventDefault();
        e.stopPropagation();
        window.handleForcePasswordSubmit(e);
        return;
      }
      if (/openForgotPasswordScreen/.test(oc) || /Forgot your password/i.test(t.textContent || "")) {
        if (t.closest("#authForm, #authDrawer, #authScreen")) {
          e.preventDefault();
          e.stopPropagation();
          window.openForgotPasswordScreen();
          return;
        }
      }
      if (/closeForgotPasswordScreen/.test(oc) && id !== "forgotPasswordSubmitBtn") {
        e.preventDefault();
        window.closeForgotPasswordScreen();
        return;
      }
      if (/togglePasswordVisibility/.test(oc)) {
        e.preventDefault();
        e.stopPropagation();
        const m = oc.match(/togglePasswordVisibility\(\s*['\"]([^'\"]+)['\"]/);
        if (m) window.togglePasswordVisibility(m[1], t);
        return;
      }
      if (/toggleAuthScreen/.test(oc) && !/openForgot/.test(oc)) {
        // let default also run; ensure function exists
      }
    },
    true
  );
}

export function installAuthFlow() {
  bindAuthClicks();
  // re-assert globals
  window.togglePasswordVisibility = window.togglePasswordVisibility;
  window.handleAuthSubmit = window.handleAuthSubmit;
  window.handleForgotPasswordSubmit = window.handleForgotPasswordSubmit;
  window.handleForcePasswordSubmit = window.handleForcePasswordSubmit;
  window.openForgotPasswordScreen = window.openForgotPasswordScreen;
  window.closeForgotPasswordScreen = window.closeForgotPasswordScreen;
  window.toggleAuthScreen = window.toggleAuthScreen;
}
