import '../styles/company-globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Favicon and app icons */}
        <link rel="icon" href="/logo-static.jpg" />
        <link rel="apple-touch-icon" href="/logo-static.jpg" />
        <link rel="shortcut icon" href="/logo-static.jpg" />
        
        {/* PWA and mobile app configuration */}
        <meta name="theme-color" content="#fcba00" />
        <meta name="msapplication-TileColor" content="#fcba00" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Open Graph default image */}
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="M10 DJ Company" />
        
        {/* Twitter Card default image */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://m10djcompany.com/logo-static.jpg" />
        <meta name="twitter:site" content="@m10djcompany" />
        
        {/* Additional meta tags */}
        <meta name="application-name" content="M10 DJ Company" />
        <meta name="apple-mobile-web-app-title" content="M10 DJ Company" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <Component {...pageProps} />
    </>
  )
} 