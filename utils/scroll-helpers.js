/**
 * Intelligent scroll-to-contact function that handles mobile and desktop layouts
 * Now opens a full-screen modal instead of scrolling
 * @param {string} [source] - Which CTA opened the form (e.g. 'hero', 'packages-essential') for tracking
 */
export const scrollToContact = (source) => {
  // Dispatch event to open modal (handled by Header or page components)
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('openContactModal', { detail: source != null ? { source } : {} });
    window.dispatchEvent(event);
  }
};

/**
 * Generic scroll to element with mobile-aware offset
 */
export const scrollToElement = (elementId, mobileOffset = 120) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const isMobile = window.innerWidth < 1024;
  
  if (isMobile) {
    const elementPosition = element.offsetTop - mobileOffset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  } else {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
};