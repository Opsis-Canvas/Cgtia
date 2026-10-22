/**
 * Page on/off control. Rules are saved by the admin in siteContent/pageControl.
 */
import { getFirebase } from "./firebase.service.js";

export const PAGE_KEYS = {
  "/": "home",
  "/about": "about",
  "/programs": "programs",
  "/gallery": "gallery",
  "/tuition": "tuition",
  "/contact": "contact",
  "/licensing": "licensing",
  "/custom": "custom",
  "/privacy": "privacy",
  "/terms": "terms",
  "/verify": "verify",
  "/dashboard": "dashboard",
  "/wall-of-fame": "wallOfFame",
  "/faq": "faq",
  "/licensing/complete": "licensingComplete",
  "/pay-fee": "payFee",
  "/field-check/confirm": "fieldCheck"
};

export function pageKeyFor(pathname) {
  let p = String(pathname || "/").replace(/\.html$/, "").replace(/\/+$/, "");
  if (p === "" || p === "/index") p = "/";
  return PAGE_KEYS[p] || null;
}

export async function loadPageControl() {
  try {
    const { db, api } = await getFirebase();
    const snap = await api.getDoc(api.doc(db, "siteContent", "pageControl"));
    return snap.exists() ? snap.data() : {};
  } catch (e) {
    return {};
  }
}
