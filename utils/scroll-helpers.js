/**
 * Intelligent scroll-to-contact function that handles mobile and desktop layouts
 */
export const scrollToContact = () => {
  // First try to scroll directly to the form
  const formElement = document.getElementById('contact-form');
  if (formElement) {
    // Check if we're on mobile (screen width less than 1024px - lg breakpoint)
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
      // On mobile, scroll to form with some offset to account for header
      const headerOffset = 80; // Account for fixed header height
      const elementPosition = formElement.offsetTop - headerOffset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    } else {
      // On desktop, regular smooth scroll to form
      formElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    return;
  }
  
  // Fallback to contact section if form not found
  const contactElement = document.getElementById('contact');
  if (contactElement) {
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
      // On mobile, add extra offset to get closer to the form
      const headerOffset = 120; // Larger offset for mobile to account for contact info cards
      const elementPosition = contactElement.offsetTop + (contactElement.offsetHeight * 0.6) - headerOffset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    } else {
      contactElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
};

/**
 * Generic scroll to element with mobile-aware offset
 */
export const scrollToElement = (elementId, mobileOffset = 80) => {
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