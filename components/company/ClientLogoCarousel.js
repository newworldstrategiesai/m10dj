import React from 'react';
import Image from 'next/image';

/**
 * ClientLogoCarousel - Infinite scrolling logo carousel
 * Uses logo images from /assets/logos/ when logoFile is set; otherwise shows venue name text.
 *
 * Usage:
 * <ClientLogoCarousel
 *   title="Trusted by Memphis's Premier Organizations"
 *   subtitle="Proudly serving these incredible clients"
 *   logoSet="wedding" // or "corporate", "general"
 * />
 */

// Logo files in public/assets/logos (logoFile = filename only). Optional url = venue website (opens in new tab).
// stackedLogos: [logoFile, typographyFile] — logo on top, typography directly below (one carousel item).
const logoSets = {
  wedding: [
    { name: 'The Peabody Hotel', logoFile: 'Peabody_logo_black.png', category: 'venue', url: 'https://www.peabodymemphis.com' },
    { name: 'Memphis Botanic Garden', logoFile: 'Memphis-Botanic-Garden-Logo.webp', category: 'venue', invert: true, url: 'https://membg.org/' },
    { name: 'Dixon Gallery & Gardens', logoFile: 'Dixon_Gallery_and_Gardens_logo.png', category: 'venue', url: 'https://www.dixon.org' },
    { name: "Mallard's Croft", logoFile: 'mallardscroft-logo.webp', category: 'venue', url: 'https://mallardscroft.com/' },
    { name: 'The Atrium', logoFile: 'The-atrium-logo.jpg', category: 'venue', url: 'https://memphiseventgroup.com/' },
    { name: 'Orion Hill', logoFile: 'Orion-Hill-Logo.jpg', category: 'venue', url: 'https://www.orionhillevents.com/' },
    { name: 'Carahills', logoFile: 'Carahills-Logo.webp', category: 'venue', url: 'https://www.carahills.com' },
    { name: 'The Columns', nameOnly: true, category: 'venue', url: 'https://www.resourceentertainment.com/the-columns' },
    { name: 'Graceland', logoFile: 'Graceland-Logo.jpg', category: 'venue', url: 'https://www.graceland.com' },
    { name: 'Annesdale Mansion', nameOnly: true, category: 'venue', url: 'https://www.annesdalemansion.com' },
    { name: 'Memphis Hunt & Country Club', nameOnly: true, category: 'venue', url: 'https://www.memphishunt.com' },
    { name: 'Memphis Hunt Polo Club', logoFile: 'Memphis-Hunt-Polo-Club-Logo.png', category: 'venue', invert: true, url: 'https://huntpolo.com/' },
    { name: 'Memphis Tourism', logoFile: 'Memphis-Tourism-Logo.jpg', category: 'venue', url: 'https://www.memphistravel.com' },
    { name: 'New Daisy Theatre', logoFile: 'New-Daisy-Logo.png', category: 'venue', url: 'https://bealestreet.com/visit/the-new-daisy' },
    { name: 'Avon Acres', logoFile: 'Avon-Acres-Logo.jpg', category: 'venue', url: 'https://www.avonacresmemphis.com/' },
    { name: 'University Club of Memphis', logoFile: 'University-Club-Of-Memphis-Logo.svg', category: 'venue', invert: true, url: 'https://www.ucmem.com/' },
    { name: 'Ridgeway Country Club', stackedLogos: ['Ridgeway-Country-Club-Logo.svg', 'Ridgeway-Country-Club-Logo-Typography.svg'], stackedInvert: [true, false], category: 'venue', url: 'https://www.ridgewaycountryclub.com' },
    { name: 'Madison Tavern', logoFile: 'Madison-Tavern-Logo.jpeg', category: 'venue', invert: true, url: 'https://www.madisontavern.com' },
    { name: 'Overton Square', logoFile: 'Overton-Square-logo.png', category: 'venue', url: 'https://www.overtonsquare.com' },
    { name: "Silky O'Sullivan's", logoFile: 'Silky-O-Sullivans-Logo.png', category: 'venue', url: 'https://silkyosullivans.com/' },
    { name: 'Xfinity', logoFile: 'Xfinity-logo.jpg', category: 'corporate', url: 'https://www.xfinity.com' },
    { name: 'Lichterman Nature Center', logoFile: 'Lichterman-Nature-Center-Logo.png', category: 'venue', url: 'https://www.memphismuseums.org/lichterman-nature-center' },
    { name: 'Historic Elmwood Cemetery', nameOnly: true, category: 'venue', url: 'https://www.elmwoodcemetery.org' },
    { name: 'AutoZone Park', nameOnly: true, category: 'venue', url: 'https://www.milb.com/memphis' },
  ],
  corporate: [
    { name: 'Renasant Convention Center', logoFile: 'Renasant-logo.png', category: 'venue', url: 'https://www.renasantconventioncenter.com' },
    { name: 'The Peabody Hotel', logoFile: 'Peabody_logo_black.png', category: 'venue', url: 'https://www.peabodymemphis.com' },
    { name: "Mallard's Croft", logoFile: 'mallardscroft-logo.webp', category: 'venue', url: 'https://mallardscroft.com/' },
    { name: 'The Atrium', logoFile: 'The-atrium-logo.jpg', category: 'venue', url: 'https://memphiseventgroup.com/' },
    { name: 'Orion Hill', logoFile: 'Orion-Hill-Logo.jpg', category: 'venue', url: 'https://www.orionhillevents.com/' },
    { name: 'Carahills', logoFile: 'Carahills-Logo.webp', category: 'venue', url: 'https://www.carahills.com' },
    { name: 'Memphis Hunt Polo Club', logoFile: 'Memphis-Hunt-Polo-Club-Logo.png', category: 'venue', invert: true, url: 'https://huntpolo.com/' },
    { name: 'Memphis Tourism', logoFile: 'Memphis-Tourism-Logo.jpg', category: 'venue', url: 'https://www.memphistravel.com' },
    { name: 'New Daisy Theatre', logoFile: 'New-Daisy-Logo.png', category: 'venue', url: 'https://bealestreet.com/visit/the-new-daisy' },
    { name: 'Avon Acres', logoFile: 'Avon-Acres-Logo.jpg', category: 'venue', url: 'https://www.avonacresmemphis.com/' },
    { name: 'University Club of Memphis', logoFile: 'University-Club-Of-Memphis-Logo.svg', category: 'venue', invert: true, url: 'https://www.ucmem.com/' },
    { name: 'Ridgeway Country Club', stackedLogos: ['Ridgeway-Country-Club-Logo.svg', 'Ridgeway-Country-Club-Logo-Typography.svg'], stackedInvert: [true, false], category: 'venue', url: 'https://www.ridgewaycountryclub.com' },
    { name: 'Madison Tavern', logoFile: 'Madison-Tavern-Logo.jpeg', category: 'venue', invert: true, url: 'https://www.madisontavern.com' },
    { name: 'Overton Square', logoFile: 'Overton-Square-logo.png', category: 'venue', url: 'https://www.overtonsquare.com' },
    { name: "Silky O'Sullivan's", logoFile: 'Silky-O-Sullivans-Logo.png', category: 'venue', url: 'https://silkyosullivans.com/' },
    { name: 'International Paper', nameOnly: true, category: 'corporate', url: 'https://www.internationalpaper.com' },
    { name: 'Crosstown Concourse', nameOnly: true, category: 'venue', url: 'https://crosstownconcourse.org' },
    { name: 'FedExForum', nameOnly: true, category: 'venue', url: 'https://www.fedexforum.com' },
    { name: 'University of Memphis', nameOnly: true, category: 'education', url: 'https://www.memphis.edu' },
    { name: 'Xfinity', logoFile: 'Xfinity-logo.jpg', category: 'corporate', url: 'https://www.xfinity.com' },
  ],
  general: [
    { name: 'The Peabody Hotel', logoFile: 'Peabody_logo_black.png', category: 'venue', url: 'https://www.peabodymemphis.com' },
    { name: 'Memphis Botanic Garden', logoFile: 'Memphis-Botanic-Garden-Logo.webp', category: 'venue', invert: true, url: 'https://membg.org/' },
    { name: 'Dixon Gallery & Gardens', logoFile: 'Dixon_Gallery_and_Gardens_logo.png', category: 'venue', url: 'https://www.dixon.org' },
    { name: "Mallard's Croft", logoFile: 'mallardscroft-logo.webp', category: 'venue', url: 'https://mallardscroft.com/' },
    { name: 'The Atrium', logoFile: 'The-atrium-logo.jpg', category: 'venue', url: 'https://memphiseventgroup.com/' },
    { name: 'Orion Hill', logoFile: 'Orion-Hill-Logo.jpg', category: 'venue', url: 'https://www.orionhillevents.com/' },
    { name: 'Carahills', logoFile: 'Carahills-Logo.webp', category: 'venue', url: 'https://www.carahills.com' },
    { name: 'Graceland', logoFile: 'Graceland-Logo.jpg', category: 'venue', url: 'https://www.graceland.com' },
    { name: 'Renasant Convention Center', logoFile: 'Renasant-logo.png', category: 'venue', url: 'https://www.renasantconventioncenter.com' },
    { name: 'Memphis Hunt Polo Club', logoFile: 'Memphis-Hunt-Polo-Club-Logo.png', category: 'venue', invert: true, url: 'https://huntpolo.com/' },
    { name: 'Memphis Tourism', logoFile: 'Memphis-Tourism-Logo.jpg', category: 'venue', url: 'https://www.memphistravel.com' },
    { name: 'New Daisy Theatre', logoFile: 'New-Daisy-Logo.png', category: 'venue', url: 'https://bealestreet.com/visit/the-new-daisy' },
    { name: 'Avon Acres', logoFile: 'Avon-Acres-Logo.jpg', category: 'venue', url: 'https://www.avonacresmemphis.com/' },
    { name: 'University Club of Memphis', logoFile: 'University-Club-Of-Memphis-Logo.svg', category: 'venue', invert: true, url: 'https://www.ucmem.com/' },
    { name: 'Ridgeway Country Club', stackedLogos: ['Ridgeway-Country-Club-Logo.svg', 'Ridgeway-Country-Club-Logo-Typography.svg'], stackedInvert: [true, false], category: 'venue', url: 'https://www.ridgewaycountryclub.com' },
    { name: 'Madison Tavern', logoFile: 'Madison-Tavern-Logo.jpeg', category: 'venue', invert: true, url: 'https://www.madisontavern.com' },
    { name: 'Overton Square', logoFile: 'Overton-Square-logo.png', category: 'venue', url: 'https://www.overtonsquare.com' },
    { name: "Silky O'Sullivan's", logoFile: 'Silky-O-Sullivans-Logo.png', category: 'venue', url: 'https://silkyosullivans.com/' },
    { name: 'Xfinity', logoFile: 'Xfinity-logo.jpg', category: 'corporate', url: 'https://www.xfinity.com' },
  ],
};

export default function ClientLogoCarousel({ 
  title = "Trusted by Memphis's Leading Organizations",
  subtitle = "Proudly serving corporate clients, wedding venues, and event organizers across Memphis",
  logoSet = "general", // "wedding", "corporate", or "general"
  className = ""
}) {
  // Get the appropriate logo set
  const clientLogos = logoSets[logoSet] || logoSets.general;

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...clientLogos, ...clientLogos];

  return (
    <section className={`py-16 bg-white overflow-hidden ${className}`}>
      <div className="section-container">
        {/* Header - always dark text on white for contrast with white-background logos */}
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Full-viewport logo strip so edge gradients are flush with screen */}
      <div className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden">
        {/* Gradient overlays - flush with viewport edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling logos - grayscale for dark logos on white; hover shows color */}
        <div className="logo-carousel-track flex items-center gap-12 md:gap-16">
          {duplicatedLogos.map((logo, index) => {
            const isStacked = Array.isArray(logo.stackedLogos) && logo.stackedLogos.length >= 2;
            const wrapperClass = `flex-shrink-0 w-40 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-90 hover:opacity-100 ${logo.invert ? 'invert hover:invert-0' : ''} ${isStacked ? 'h-24 flex-col gap-0.5' : 'h-20'}`;
            const content = isStacked ? (
              <div className="relative w-full flex-1 flex flex-col items-center justify-center gap-0 min-h-0">
                <div className={`flex-shrink-0 flex items-center justify-center flex-1 min-h-0 w-full ${logo.stackedInvert?.[0] ? 'invert hover:invert-0' : ''}`}>
                  <Image
                    src={`/assets/logos/${logo.stackedLogos[0]}`}
                    alt={`${logo.name} logo`}
                    width={120}
                    height={48}
                    className="object-contain max-w-full w-auto h-auto max-h-12"
                  />
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-full">
                  <Image
                    src={`/assets/logos/${logo.stackedLogos[1]}`}
                    alt=""
                    width={140}
                    height={28}
                    className="object-contain max-w-full w-auto h-auto max-h-7"
                  />
                </div>
              </div>
            ) : logo.logoFile ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={`/assets/logos/${logo.logoFile}`}
                  alt={`${logo.name} logo`}
                  width={160}
                  height={80}
                  className="object-contain max-w-full max-h-full w-auto h-auto"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-white rounded-lg shadow-md border border-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-700 font-bold px-2 text-center">
                  {logo.name}
                </span>
              </div>
            );
            return logo.url ? (
              <a
                key={`${logo.name}-${index}`}
                href={logo.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${wrapperClass} no-underline outline-none focus:outline-none`}
                aria-label={`${logo.name} website`}
              >
                {content}
              </a>
            ) : (
              <div key={`${logo.name}-${index}`} className={wrapperClass}>
                {content}
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-container">
        {/* Optional CTA below carousel */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Join hundreds of satisfied clients across Memphis
          </p>
          <a 
            href="#contact" 
            className="inline-flex items-center text-brand hover:text-brand-600 font-semibold transition-colors"
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

