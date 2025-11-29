import '../styles/company-globals.css';
import Head from 'next/head';
import { useRouter } from 'next/router';
import FloatingAdminAssistant from '@/components/admin/FloatingAdminAssistant';
import GlobalChatWidget from '@/components/company/GlobalChatWidget';
// Temporarily disabled to prevent rate limiting issues
// import EnhancedTracking from '../components/EnhancedTracking'

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith('/admin') || router.pathname.startsWith('/chat');
  const isSignInPage = router.pathname.startsWith('/signin');
  const isRequestsPage = router.pathname === '/requests' || router.pathname.startsWith('/crowd-request');
  
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
        
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="gvyoj4VOR-ZSnrkrcpUfKdX4Qh81QsZBuIviCWJDSAI" />
        
        {/* Additional meta tags */}
        <meta name="application-name" content="M10 DJ Company" />
        <meta name="apple-mobile-web-app-title" content="M10 DJ Company" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preload critical fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <Component {...pageProps} />
      {isAdminRoute && !isSignInPage && <FloatingAdminAssistant />}
      {!isSignInPage && !isRequestsPage && <GlobalChatWidget />}
      {/* Temporarily disabled to prevent rate limiting issues */}
      {/* <EnhancedTracking /> */}
    </>
  );
} 