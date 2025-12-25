import Head from 'next/head';

// AMP disabled - using styled-jsx which requires JavaScript
// export const config = {
//   amp: true,
// };

export default function HomeAMP() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
  const ampUrl = `${siteUrl}/amp`;
  const canonicalUrl = `${siteUrl}/`;
  
  // Generate structured data for SEO (simplified for AMP)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "M10 DJ Company",
    "description": "Memphis's premier wedding and event DJ company with 15+ years of experience and 500+ successful celebrations.",
    "url": siteUrl,
    "telephone": "+19014102020",
    "email": "info@m10djcompany.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "65 Stewart Rd",
      "addressLocality": "Eads",
      "addressRegion": "TN",
      "postalCode": "38028",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 35.1495,
      "longitude": -90.0490
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "reviewCount": "500"
    },
    "priceRange": "$$",
    "areaServed": [
      {
        "@type": "City",
        "name": "Memphis"
      },
      {
        "@type": "City",
        "name": "Germantown"
      },
      {
        "@type": "City",
        "name": "Collierville"
      }
    ]
  };

  return (
    <>
      <Head>
        <title>Memphis Wedding DJ | M10 DJ Company | 500+ Events</title>
        <meta name="description" content="Memphis wedding DJ services for 500+ celebrations. Professional DJs for weddings, corporate events & parties. Same-day quotes. Call (901) 410-2020!" />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="amphtml" href={ampUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </Head>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>
              <span>Memphis Wedding DJ</span>
              <span className="gradient-text">Professional DJ Services for 500+ Memphis Events</span>
            </h1>
            
            <div className="content-card">
              <h2>Looking for the best Memphis DJ?</h2>
              <p className="lead">
                M10 DJ Company has been serving Memphis weddings and events for 15+ years, with 500+ celebrations under our belt.
              </p>
              <p>
                We know Memphis venues inside and out – from The Peabody's ballroom acoustics to Graceland's outdoor ceremony spaces. Our sound systems handle everything from intimate ceremonies to 300-guest receptions. We bring backup equipment to every event (because Memphis weather can be unpredictable), and our MC services keep your timeline on track without feeling scripted.
              </p>
              <p>
                As Memphis's premier wedding DJ company, we specialize in creating unforgettable experiences for couples throughout the Mid-South. Whether you're planning an elegant downtown Memphis wedding at The Peabody or an intimate celebration in Germantown, our professional Memphis DJ services ensure your special day flows seamlessly from ceremony to last dance.
              </p>
              <p>
                Our Memphis wedding DJ team brings over 15 years of local expertise, serving venues across Memphis, Germantown, Collierville, Cordova, and East Memphis. We understand the unique acoustics of Memphis event spaces and tailor our sound systems accordingly. From wireless microphones for outdoor ceremonies to powerful sound systems for large receptions, we have the equipment and experience to make your Memphis wedding or corporate event unforgettable.
              </p>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">15+</div>
                  <div className="stat-label">Years Experience</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">500+</div>
                  <div className="stat-label">Celebrations</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">27+</div>
                  <div className="stat-label">Premier Venues</div>
                </div>
              </div>
            </div>
            
            <div className="cta-buttons">
              <a href={`${siteUrl}/#contact`} className="btn-primary">
                Get Your Free Quote
              </a>
              <a href={`${siteUrl}/services`} className="btn-secondary">
                View Our Services
              </a>
            </div>
            
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">🏆</div>
                <h3>15+ Years Wedding Experience</h3>
                <p>Trusted by 500+ Memphis couples with deep venue knowledge at The Peabody, Graceland, Memphis Botanic Garden, and 27+ premier wedding venues.</p>
                <a href={`${siteUrl}/memphis-wedding-dj`} className="benefit-link">
                  View Wedding DJs →
                </a>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">🎵</div>
                <h3>Wedding-Grade Equipment</h3>
                <p>Crystal-clear sound systems, elegant uplighting, and wireless microphones for ceremony, cocktail hour, and reception perfection.</p>
                <a href={`${siteUrl}/services`} className="benefit-link">
                  View All Services →
                </a>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">✨</div>
                <h3>Your Perfect Wedding</h3>
                <p>Custom playlists, seamless timeline coordination, and MC services tailored to your love story and wedding vision.</p>
                <a href={`${siteUrl}/dj-near-me-memphis`} className="benefit-link">
                  Find DJs Near You →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services Content Section */}
        <section className="content-section">
          <div className="container">
            <h2>Why Choose M10 DJ Company for Your Memphis Wedding DJ Needs?</h2>
            
            <p>
              When searching for a <strong>Memphis wedding DJ</strong> or <strong>DJ Memphis</strong> services, you want a team that understands both the technical aspects of professional sound and the emotional importance of your special day. M10 DJ Company has been the trusted choice for <strong>Memphis wedding DJ</strong> services since 2009, with over 500 successful celebrations across the Mid-South region.
            </p>
            
            <p>
              Our <strong>professional Memphis DJ</strong> team serves all areas of Memphis, including East Memphis, Germantown, Collierville, Cordova, and downtown Memphis. We're familiar with the unique requirements of Memphis venues like The Peabody, Graceland, Memphis Botanic Garden, and dozens of other premier event spaces. This local expertise means we know how to handle everything from the acoustics of historic ballrooms to outdoor ceremony setups that require weather-resistant equipment.
            </p>
            
            <p>
              As a <strong>Memphis DJ company</strong>, we offer comprehensive services beyond just playing music. Our <strong>Memphis wedding DJ</strong> packages include professional MC services to keep your timeline on track, wireless microphones for ceremonies and toasts, elegant uplighting to transform your venue, and backup equipment to ensure your event continues smoothly even if technical issues arise. We understand that Memphis weather can be unpredictable, so we always come prepared with weather-resistant equipment for outdoor ceremonies.
            </p>
            
            <p>
              Whether you're planning an intimate wedding in Germantown or a large corporate event in downtown Memphis, our <strong>DJ Memphis</strong> services are tailored to your specific needs. We work closely with couples and event planners to create custom playlists that reflect your musical taste while ensuring your guests stay on the dance floor all night. Our <strong>Memphis wedding DJ</strong> team is known for reading the crowd and adjusting the music selection in real-time to keep the energy high throughout your celebration.
            </p>
            
            <p>
              Looking for a <strong>DJ near me Memphis</strong>? M10 DJ Company offers same-day quotes and flexible booking options to accommodate your timeline. We understand that planning a wedding or event can be stressful, so we make the booking process as simple as possible. Contact us today to discuss your <strong>Memphis DJ</strong> needs and receive a personalized quote for your upcoming celebration.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact-section">
          <div className="container">
            <div className="contact-header">
              <div className="badge">Same-Day Quotes Available</div>
              <h2>Ready for Your Perfect Wedding Day?</h2>
              <p>
                Let's discuss your Memphis wedding and create an unforgettable celebration. Get your free wedding consultation and quote today.
              </p>
            </div>
            
            <div className="contact-grid">
              <div className="contact-info">
                <div className="contact-card">
                  <div className="contact-icon">📞</div>
                  <div>
                    <h3>Call Us Today</h3>
                    <p>Ready to discuss your event? Give us a call!</p>
                    <a href="tel:+19014102020" className="contact-link">
                      (901) 410-2020
                    </a>
                  </div>
                </div>
                
                <div className="contact-card">
                  <div className="contact-icon">✉️</div>
                  <div>
                    <h3>Email Us</h3>
                    <p>Send us your event details and questions</p>
                    <a href="mailto:info@m10djcompany.com" className="contact-link">
                      info@m10djcompany.com
                    </a>
                  </div>
                </div>
                
                <div className="contact-card">
                  <div className="contact-icon">📍</div>
                  <div>
                    <h3>Service Area</h3>
                    <p>Memphis, TN and surrounding areas within 50 miles</p>
                  </div>
                </div>

                <div className="trust-badges">
                  <div className="trust-badge">
                    <div className="trust-value">500+</div>
                    <div className="trust-label">Events</div>
                  </div>
                  <div className="trust-badge">
                    <div className="trust-value">5★</div>
                    <div className="trust-label">Rating</div>
                  </div>
                  <div className="trust-badge">
                    <div className="trust-value">15+</div>
                    <div className="trust-label">Years</div>
                  </div>
                </div>
              </div>
              
              <div className="contact-form-wrapper">
                <div className="contact-form-card">
                  <h3>Get Your Free Quote</h3>
                  <p>
                    Fill out the form below and we'll get back to you within 24 hours with a personalized quote.
                  </p>
                  <p className="form-note">
                    <a href={`${siteUrl}/#contact`}>Visit our full website</a> to use the interactive contact form.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        main {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: #ffffff;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Hero Section */
        .hero-section {
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(to bottom right, #f8fafc, #ffffff, #fffbeb);
          padding: 2rem 1rem;
        }

        .hero-content {
          max-width: 1200px;
          width: 100%;
          text-align: center;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 2rem;
          line-height: 1.2;
        }

        h1 span {
          display: block;
        }

        .gradient-text {
          background: linear-gradient(to right, #f59e0b, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .content-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-top: 3px solid #f59e0b;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .lead {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        p {
          margin-bottom: 1rem;
          color: #374151;
          line-height: 1.7;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .stat-card {
          text-align: center;
          padding: 1rem;
          background: linear-gradient(to bottom right, #fffbeb, #fef3c7);
          border-radius: 0.75rem;
          border: 1px solid #fde68a;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #f59e0b;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 3rem;
          align-items: center;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-block;
          padding: 0.875rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 300px;
        }

        .btn-primary {
          background: #f59e0b;
          color: #000000;
        }

        .btn-primary:hover {
          background: #d97706;
        }

        .btn-secondary {
          background: #ffffff;
          color: #1f2937;
          border: 2px solid #e5e7eb;
        }

        .btn-secondary:hover {
          border-color: #f59e0b;
          color: #f59e0b;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-top: 3rem;
        }

        .benefit-card {
          background: #ffffff;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .benefit-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .benefit-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .benefit-card p {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .benefit-link {
          color: #f59e0b;
          font-weight: 600;
          text-decoration: none;
        }

        .benefit-link:hover {
          color: #d97706;
        }

        /* Content Section */
        .content-section {
          padding: 3rem 1rem;
          background: #ffffff;
        }

        .content-section h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2rem;
          text-align: center;
        }

        .content-section p {
          font-size: 1.125rem;
          margin-bottom: 1.5rem;
        }

        /* Contact Section */
        .contact-section {
          padding: 3rem 1rem;
          background: linear-gradient(to bottom right, #f8fafc, #fffbeb);
        }

        .contact-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .badge {
          display: inline-block;
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .contact-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .contact-header p {
          font-size: 1.25rem;
          color: #6b7280;
          max-width: 48rem;
          margin: 0 auto;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .contact-card {
          background: #ffffff;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .contact-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .contact-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #1f2937;
        }

        .contact-card p {
          color: #6b7280;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .contact-link {
          color: #f59e0b;
          font-weight: 700;
          font-size: 1.125rem;
          text-decoration: none;
        }

        .contact-link:hover {
          color: #d97706;
        }

        .trust-badges {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .trust-badge {
          text-align: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
        }

        .trust-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f59e0b;
          margin-bottom: 0.25rem;
        }

        .trust-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 600;
        }

        .contact-form-wrapper {
          background: #ffffff;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-top: 3px solid #f59e0b;
        }

        .contact-form-card h3 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .contact-form-card p {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .form-note {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .form-note a {
          color: #f59e0b;
          font-weight: 600;
          text-decoration: none;
        }

        .form-note a:hover {
          color: #d97706;
        }

        @media (min-width: 768px) {
          h1 {
            font-size: 3.5rem;
          }

          .content-card {
            padding: 3rem;
          }

          .cta-buttons {
            flex-direction: row;
            justify-content: center;
          }

          .benefits-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .contact-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </>
  );
}

