/**
 * Image placeholders — paste a transparent PNG URL into `url`.
 *
 * Same ideology as the EasyKorean student dashboard:
 *   width / height  = exact box the PNG is drawn in
 *   left / right    = distance from the container edge
 *   bottom          = distance from the container's bottom edge
 *
 * bannerPerson height (168) is GREATER than the banner card height (140),
 * so with bottom: 0 the head pops out above the top edge of the card.
 * Swap any image into `url` — placement stays the same.
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
  // Dashboard banner: person pops out above the top edge of the card
  bannerPerson: {
    name: "Banner person PNG",
    url: "/assets/banner-person.webp",
    alt: "Student smiling",
    mobile: { width: 120, height: 168, right: 12, bottom: 0 },
    desktop: { width: 165, height: 210, right: 56, bottom: 0 },
  },
};
