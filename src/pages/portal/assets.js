/**
 * PNG placeholders — set `url` to your transparent PNG.
 * Banner figure: sized to sit on the right of the card (same idea as the
 * compact reference dashboard). Slight overhang above the top edge is OK.
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
    /* Compact card (~150px). Figure a bit taller so the head can clear the top. */
    mobile: { width: 132, height: 188, right: 6, bottom: -4 },
    desktop: { width: 175, height: 240, right: 28, bottom: -6 },
  },
};
