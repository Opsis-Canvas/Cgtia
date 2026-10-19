
/**
 * PNG placeholders — paste a transparent PNG URL into `url`.
 * Until set, a dashed box shows the exact size.
 * mobile → ~Galaxy A51 · desktop → 1280px+
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
    mobile: { width: 120, height: 168, right: 12, bottom: 0 },
    desktop: { width: 165, height: 210, right: 56, bottom: 0 },
  },
};
