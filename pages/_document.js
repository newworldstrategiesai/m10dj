import NextDocument, { Html, Head, Main, NextScript } from 'next/document';

/**
 * Skip M10 GA and Facebook Pixel on tipjar.live so TipJar uses its own GA (see GoogleAnalyticsTipJar).
 */
function getIsTipJarDomain(ctx) {
  const host = ctx?.req?.headers?.['host'] || ctx?.req?.headers?.['x-forwarded-host'] || '';
  const h = (host || '').toLowerCase();
  return h.includes('tipjar.live') || h.includes('tipjar.com');
}

function Document({ isTipJarDomain = false }) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="M10 DJ Company" />
        {/* Favicon will be set dynamically in _app.js based on domain */}
        {/* Default fallback favicon - using M10 DJ logo PNG instead of generic favicon.ico */}
        <link rel="icon" type="image/png" href="/m10-black-clear-png.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        {/* M10/DJ Dash GA and FB Pixel - not loaded on tipjar.live (TipJar has its own GA) */}
        {!isTipJarDomain && (
          <>
            <script
              defer
              src="https://www.googletagmanager.com/gtag/js?id=G-8DQRX3LY9T"
            />
            <script
              defer
              dangerouslySetInnerHTML={{
                __html: `
                  window.addEventListener('load', function() {
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-8DQRX3LY9T');
                  });
                `,
              }}
            />
            <script
              defer
              dangerouslySetInnerHTML={{
                __html: `
                  window.addEventListener('load', function() {
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '1080417329531937');
                    fbq('track', 'PageView');
                  });
                `,
              }}
            />
            <noscript>
              <img 
                height="1" 
                width="1" 
                style={{ display: 'none' }}
                src="https://www.facebook.com/tr?id=1080417329531937&ev=PageView&noscript=1"
                alt=""
              />
            </noscript>
          </>
        )}
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              /* Remove body padding-top on requests and QR display pages - runs immediately on page load before CSS applies */
              (function() {
                try {
                  var path = window.location.pathname;
                  var isRequestsPage = path === '/requests' || 
                                       (path && path.includes && path.includes('/organizations/') && path.includes('/requests'));
                  var isQRPage = path && path.endsWith('/qr');
                  if ((isRequestsPage || isQRPage) && document.body) {
                    document.body.style.setProperty('padding-top', '0', 'important');
                    document.body.setAttribute('data-no-header-padding', 'true');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx) => {
  const initialProps = await NextDocument.getInitialProps(ctx);
  const isTipJarDomain = getIsTipJarDomain(ctx);
  return { ...initialProps, isTipJarDomain };
};

export default Document; 