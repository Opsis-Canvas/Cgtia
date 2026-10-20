/**
 * PNG placeholders — paste a transparent PNG URL into `url`.
 * Until set, a dashed box shows the exact size.
 * mobile → ~Galaxy A51 · desktop → 1280px+
 *
 * bannerPerson is intentionally TALLER than the banner card so the
 * figure always crosses the top edge (feet near the bottom edge of
 * the card, head above the card). Swap any image into `url` and it
 * will keep this “stand-out-of-the-card” placement.
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
    /* Taller than the ~196px banner → head clears the top edge */
    mobile: { width: 158, height: 240, right: 0, bottom: -10 },
    desktop: { width: 210, height: 310, right: 20, bottom: -14 },
  },
};
