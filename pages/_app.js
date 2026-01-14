import '../styles/company-globals.css';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
import FloatingAdminAssistant from '@/components/admin/FloatingAdminAssistant';
import GlobalChatWidget from '@/components/company/GlobalChatWidget';
import ErrorBoundary from '@/components/ErrorBoundary';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { Toaster } from '@/components/ui/Toasts/toaster-pages';
import { useEffect } from 'react';
import { trackPageView } from '@/utils/visitor-tracking';
// Temporarily disabled to prevent rate limiting issues
// import EnhancedTracking from '../components/EnhancedTracking'

export default function App({ Component, pageProps }) {
  // Suppress React warning about fetchPriority prop (Next.js 13.5.6 compatibility issue)
  // This is a known issue where Next.js uses fetchPriority but React expects fetchpriority (lowercase)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Global error handler for unhandled AbortErrors from Supabase auth
      const handleUnhandledError = (event) => {
        const error = event.error || event.reason;
        if (error && (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('signal is aborted'))) {
          // Suppress AbortError - it's expected when components unmount or requests are cancelled
          event.preventDefault();
          return true;
        }
        return false;
      };

      window.addEventListener('error', handleUnhandledError);
      window.addEventListener('unhandledrejection', handleUnhandledError);

      // Suppress console.error warnings
      const originalError = console.error;
      console.error = (...args) => {
        // Filter out AbortError warnings from Supabase auth
        const message = args[0];
        const isAbortError = (
          (typeof message === 'string' && (
            message.includes('AbortError') || 
            message.includes('signal is aborted') ||
            message.includes('aborted without reason')
          )) ||
          (message && typeof message === 'object' && (
            (message.toString && message.toString().includes('AbortError')) ||
            (message.name === 'AbortError') ||
            (message.message && typeof message.message === 'string' && (
              message.message.includes('AbortError') || 
              message.message.includes('signal is aborted')
            ))
          ))
        );

        if (isAbortError) {
          return; // Suppress AbortError warnings
        }

        // Filter out fetchPriority warnings from Next.js Image component
        const shouldSuppress = (
          (typeof message === 'string' && (
            message.includes('fetchPriority') || 
            message.includes('fetchpriority') ||
            (message.includes('React does not recognize') && message.includes('prop on a DOM element'))
          )) ||
          (message && typeof message === 'object' && (
            (message.toString && message.toString().includes('fetchPriority')) ||
            (message.message && typeof message.message === 'string' && message.message.includes('fetchPriority'))
          ))
        );
        
        if (shouldSuppress) {
          return; // Suppress this specific harmless warning
        }
        originalError.apply(console, args);
      };

      // Also suppress React DevTools warnings
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args[0];
        const shouldSuppress = (
          typeof message === 'string' && (
            message.includes('fetchPriority') || 
            message.includes('fetchpriority')
          )
        );
        
        if (shouldSuppress) {
          return;
        }
        originalWarn.apply(console, args);
      };
      
      return () => {
        window.removeEventListener('error', handleUnhandledError);
        window.removeEventListener('unhandledrejection', handleUnhandledError);
        console.error = originalError;
        console.warn = originalWarn;
      };
    }
  }, []);
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith('/admin') || router.pathname.startsWith('/chat');
  const isSignInPage = router.pathname.startsWith('/signin');
  const isSignContractPage = router.pathname.startsWith('/sign-contract');
  // Check for requests pages - includes both /requests and /organizations/[slug]/requests
  const isRequestsPage = router.pathname === '/requests' || 
    router.pathname.startsWith('/crowd-request') || 
    (router.pathname.includes('/organizations/') && router.pathname.includes('/requests'));
  const isBidPage = router.pathname === '/bid';
  // Check if we're on DJ Dash pages (djdash.net domain or /djdash routes or /dj/ profile routes)
  const isDJDashPage = router.pathname.startsWith('/djdash') || router.pathname.startsWith('/dj/');

  // Set data attribute to remove body padding on admin pages
  useEffect(() => {
    if (isAdminRoute) {
      document.documentElement.setAttribute('data-admin-page', 'true');
    } else {
      document.documentElement.removeAttribute('data-admin-page');
    }
  }, [isAdminRoute]);

  // Track page views for M10 DJ Company pages (customer journey tracking)
  // Skip admin pages and DJ Dash pages - only track public-facing M10 pages
  useEffect(() => {
    if (!isAdminRoute && !isDJDashPage && !isSignInPage) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        trackPageView();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [router.asPath, isAdminRoute, isDJDashPage, isSignInPage]);
  
  return (
    <ThemeProviderWrapper>
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
      {/* Only show chat widget on m10djcompany.com, not on djdash.net or sign-contract pages */}
      {!isSignInPage && !isRequestsPage && !isBidPage && !isAdminRoute && !isDJDashPage && !isSignContractPage && <GlobalChatWidget />}
      {/* Toast notifications for Pages Router */}
      <Toaster />
      {/* Temporarily disabled to prevent rate limiting issues */}
      {/* <EnhancedTracking /> */}
      </ErrorBoundary>
    </ThemeProviderWrapper>
  );
} 