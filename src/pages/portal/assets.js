/**
 * Banner person + snapshot illustration slots.
 * Drop webp / png / svg files under /assets/snapshot/ (or set url overrides).
 * Until a file exists, the UI shows a dashed "Add icon" placeholder.
 */
export const ASSETS = {
  logo: "/assets/brand/cgtia-logo.webp",
  logoPng: "/assets/brand/cgtia-logo.png",
  onboardingPerson: {
    name: "Onboarding person PNG",
    url: "/assets/onboarding-person.webp",
    alt: "Student with a phone",
    mobile: { width: 354, height: 631, left: 13, bottom: 0 },
    desktop: { width: 520, height: 720, right: 4, bottom: 0 },
  },
  bannerPerson: {
    name: "Banner person PNG",
    url: "/assets/banner-person.webp",
    alt: "Student smiling",
    mobile: { width: 140, height: 168, right: 0, bottom: 0 },
    desktop: { width: 180, height: 210, right: 24, bottom: 0 },
  },
  /**
   * Snapshot tile art. Keys match stat ids from the app (courses, grades, score, fees).
   * Prefer .webp; .png and .svg also work. Set `url` to a full HTTPS path to override.
   */
  snapshot: {
    courses: { url: "", file: "/assets/snapshot/modules.webp", alt: "Modules" },
    grades:  { url: "", file: "/assets/snapshot/results.webp", alt: "Results" },
    score:   { url: "", file: "/assets/snapshot/score.webp", alt: "Average score" },
    fees:    { url: "", file: "/assets/snapshot/fees.webp", alt: "Fees" },
  },
};

/** Resolve snapshot art for a stat id. Returns { src, alt } or null if neither url nor file is set. */
export function snapshotArt(id) {
  const map = ASSETS.snapshot || {};
  const entry = map[id] || map[String(id || "").toLowerCase()] || null;
  if (!entry) return null;
  const src = (entry.url && String(entry.url).trim()) || (entry.file && String(entry.file).trim()) || "";
  if (!src) return null;
  return { src, alt: entry.alt || id || "Snapshot" };
}
