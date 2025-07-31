import { Metadata } from 'next';
import Footer from '@/components/company/Footer';
import Navbar from '@/components/ui/Navbar';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import { headers } from 'next/headers';
import 'styles/main.css';

const title = 'M10 DJ Company - Professional Event Entertainment';
const description = 'Memphis premier DJ and entertainment services for weddings, corporate events, and special occasions.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description
  }
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Hide navbar on sign-in pages
  const isSignInPage = pathname.includes('/signin');

  return (
    <html lang="en">
      <body className="bg-black">
        {!isSignInPage && <Navbar />}
        <main
          id="skip"
          className={`${!isSignInPage ? 'min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]' : 'min-h-screen'}`}
        >
          {children}
        </main>
        {!isSignInPage && <Footer />}
        <Suspense>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
