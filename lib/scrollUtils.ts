/**
 * Smooth scroll to a section by ID with navbar offset.
 * Centralized utility to avoid duplicating scroll logic across components.
 */
export function scrollToSection(id: string, callback?: () => void) {
  const element = document.getElementById(id);
  if (element) {
    const NAVBAR_HEIGHT = 96;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - NAVBAR_HEIGHT;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
  callback?.();
}
