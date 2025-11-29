import '../styles/company-globals.css';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';
import FloatingAdminAssistant from '@/components/admin/FloatingAdminAssistant';
import GlobalChatWidget from '@/components/company/GlobalChatWidget';
import ErrorBoundary from '@/components/ErrorBoundary';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { useEffect } from 'react';
// Temporarily disabled to prevent rate limiting issues
// import EnhancedTracking from '../components/EnhancedTracking'

export default function App({ Component, pageProps }) {
  // Suppress React warning about fetchPriority prop (Next.js 13.5.6 compatibility issue)
  // This is a known issue where Next.js uses fetchPriority but React expects fetchpriority (lowercase)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      console.error = (...args) => {
        // Filter out fetchPriority warnings from Next.js Image component
        const message = args[0];
        if (
          (typeof message === 'string' && message.includes('fetchPriority') && message.includes('DOM element')) ||
          (message && typeof message === 'object' && message.toString && message.toString().includes('fetchPriority'))
        ) {
          return; // Suppress this specific harmless warning
        }
        originalError.apply(console, args);
      };
      
      return () => {
        console.error = originalError;
      };
    }
  }, []);
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith('/admin') || router.pathname.startsWith('/chat');
  const isSignInPage = router.pathname.startsWith('/signin');
  const isRequestsPage = router.pathname === '/requests' || router.pathname.startsWith('/crowd-request');
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <ErrorBoundary
        title="Application Error"
        message="Something went wrong. Please refresh the page or contact support if the problem persists."
      >
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
      {/* Admin Navbar - appears on all admin pages */}
      {isAdminRoute && !isSignInPage && <AdminNavbar />}
      <Component {...pageProps} />
      {isAdminRoute && !isSignInPage && <FloatingAdminAssistant />}
      {!isSignInPage && !isRequestsPage && !isAdminRoute && <GlobalChatWidget />}
      {/* Temporarily disabled to prevent rate limiting issues */}
      {/* <EnhancedTracking /> */}
      </ErrorBoundary>
    </ThemeProvider>
  );
} 