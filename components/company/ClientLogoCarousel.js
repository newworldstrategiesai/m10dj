import React from 'react';

/**
 * ClientLogoCarousel - Infinite scrolling logo carousel
 * Continuously cycles client logos from left to right
 * 
 * Usage:
 * <ClientLogoCarousel 
 *   title="Trusted by Memphis's Premier Organizations"
 *   subtitle="Proudly serving these incredible clients"
 * />
 */

export default function ClientLogoCarousel({ 
  title = "Trusted by Memphis's Leading Organizations",
  subtitle = "Proudly serving corporate clients, wedding venues, and event organizers across Memphis",
  className = ""
}) {
  // Placeholder logos - will be replaced with actual client logos
  // Each logo should be ~200x100px, grayscale PNG with transparent background
  const clientLogos = [
    { name: 'Client 1', file: 'client-1.png' },
    { name: 'Client 2', file: 'client-2.png' },
    { name: 'Client 3', file: 'client-3.png' },
    { name: 'Client 4', file: 'client-4.png' },
    { name: 'Client 5', file: 'client-5.png' },
    { name: 'Client 6', file: 'client-6.png' },
    { name: 'Client 7', file: 'client-7.png' },
    { name: 'Client 8', file: 'client-8.png' },
    { name: 'Client 9', file: 'client-9.png' },
    { name: 'Client 10', file: 'client-10.png' },
  ];

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...clientLogos, ...clientLogos];

  return (
    <section className={`py-16 bg-gray-50 dark:bg-gray-900 overflow-hidden ${className}`}>
      <div className="section-container">
        {/* Header */}
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Infinite Scrolling Logo Container */}
        <div className="relative">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling logos wrapper */}
          <div className="logo-carousel-track flex items-center gap-12 md:gap-16">
            {duplicatedLogos.map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="flex-shrink-0 w-40 h-20 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              >
                {/* Placeholder logo box */}
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    {logo.name}
                  </span>
                </div>
                {/* 
                  Replace above div with actual logo image:
                  <img
                    src={`/assets/client-logos/${logo.file}`}
                    alt={`${logo.name} logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                */}
              </div>
            ))}
          </div>
        </div>

        {/* Optional CTA below carousel */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Join hundreds of satisfied clients across Memphis
          </p>
          <a 
            href="#contact" 
            className="inline-flex items-center text-brand hover:text-brand-600 dark:text-brand-gold dark:hover:text-brand-gold/80 font-semibold transition-colors"
          >
            Get Your Free Quote
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        .logo-carousel-track {
          animation: scroll-left 40s linear infinite;
          width: fit-content;
        }

        .logo-carousel-track:hover {
          animation-play-state: paused;
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Responsive speed adjustments */
        @media (max-width: 768px) {
          .logo-carousel-track {
            animation-duration: 30s;
            gap: 2rem;
          }
        }

        @media (min-width: 1536px) {
          .logo-carousel-track {
            animation-duration: 50s;
          }
        }
      `}</style>
    </section>
  );
}

