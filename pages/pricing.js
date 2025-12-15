import Head from 'next/head';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import Pricing from '../components/ui/Pricing/Pricing';

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>DJ Service Packages & Pricing | M10 DJ Company | Memphis Wedding DJ</title>
        <meta 
          name="description" 
          content="Professional DJ service packages for weddings and events in Memphis. Get a personalized quote based on your event details. Packages starting in the $1,600-$2,400+ range. Contact us for exact pricing." 
        />
        <meta name="keywords" content="Memphis DJ pricing, wedding DJ packages, DJ service prices, Memphis wedding DJ cost, event DJ pricing, custom DJ quote" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/pricing" />
      </Head>

      <Header />
      
      <main>
        <Pricing user={null} products={[]} subscription={null} />
      </main>

      <Footer />
    </>
  );
}

