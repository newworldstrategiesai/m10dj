import { useState } from 'react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Upload, Check, AlertCircle } from 'lucide-react';

export default function VenuesImport() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const venues = [
    {
      venue_name: "The Peabody Hotel",
      venue_type: "hotel",
      city: "Memphis",
      state: "TN",
      website: "https://www.peabodymemphis.com",
      address: "149 Union Ave, Memphis, TN 38103",
      description: "Iconic luxury hotel dubbed \"The South's Grand Hotel,\" offering historic charm, opulent ballrooms, and its famous resident ducks."
    },
    {
      venue_name: "Memphis Botanic Garden",
      city: "Memphis",
      state: "TN", 
      website: "https://membg.org",
      description: "96-acre garden oasis with indoor and outdoor venues amid specialty gardens and arboretum vistas. A haven for nature-loving couples seeking romantic natural backdrops."
    },
    {
      venue_name: "Dixon Gallery & Gardens",
      city: "Memphis",
      state: "TN",
      website: "https://www.dixon.org",
      description: "Art museum and garden venue offering an artful ambiance with blooming gardens. Ideal for intimate weddings that blend artistic elegance with natural beauty."
    },
    {
      venue_name: "Woodruff-Fontaine House",
      city: "Memphis",
      state: "TN",
      website: "http://www.woodruff-fontaine.org",
      description: "Victorian-era mansion providing a timeless 19th-century backdrop with ornate interiors and picturesque gardens."
    },
    {
      venue_name: "Annesdale Mansion",
      city: "Memphis",
      state: "TN",
      website: "https://www.zola.com/wedding-vendors/wedding-venues/annesdale-mansion",
      description: "1850s Italianate villa combining European romantic architecture with vintage Southern charm. Provides an elegant setting for weddings in Midtown Memphis."
    },
    {
      venue_name: "The Atrium at Overton Square",
      city: "Memphis",
      state: "TN",
      website: "https://memphiseventgroup.com",
      description: "Bright, modern event venue in the heart of Overton Square. Features soaring steel arches and high ceilings in an airy contemporary space—perfect for chic urban weddings."
    },
    {
      venue_name: "Central Station Hotel",
      city: "Memphis", 
      state: "TN",
      website: "https://centralstationmemphis.com",
      description: "Boutique hotel inside a 1914 train station blending Memphis' musical soul with modern design. Features exposed brick and soaring ceilings for an industrial-chic vibe."
    },
    {
      venue_name: "Avon Acres",
      city: "Memphis",
      state: "TN",
      website: "https://www.uniquevenues.com/venue/avon-acres-memphis",
      description: "Elegant banquet hall-style venue covering 5,800 sq ft, immersing guests in a modern, sophisticated atmosphere with rustic glamour. Offers indoor–outdoor flexibility for up to 350 guests."
    },
    {
      venue_name: "The Balinese Ballroom",
      city: "Memphis",
      state: "TN",
      website: "http://www.balineseballroom.com",
      description: "Historic downtown venue with three flexible event spaces in a vintage setting. Exposed brick, hardwood floors, and a charming ambiance provide an authentic backdrop."
    },
    {
      venue_name: "The Cadre Building",
      city: "Memphis",
      state: "TN",
      website: "http://www.cadrememphis.com",
      description: "1928 Art Deco ballroom adorned with towering columns and crystal chandeliers. A glamorous historic venue known for its grand architectural elegance in downtown Memphis."
    },
    {
      venue_name: "The Columns at One Commerce Square",
      city: "Memphis",
      state: "TN",
      website: "http://www.thecolumnsmemphis.com",
      description: "Grand 1929 bank lobby turned gala venue, defined by towering Ionic columns and vast marble interiors. Delivers a monumental historic setting ideal for large formal events."
    },
    {
      venue_name: "Old Dominick Distillery",
      city: "Memphis",
      state: "TN",
      website: "https://olddominick.com",
      description: "Working distillery offering a one-of-a-kind industrial venue with whiskey barrels and river views."
    },
    {
      venue_name: "Memphis Brooks Museum of Art",
      city: "Memphis",
      state: "TN",
      website: "https://www.brooksmuseum.org",
      description: "Historic art museum providing a spectacular backdrop surrounded by world-class art in a tranquil park setting."
    },
    {
      venue_name: "Memphis Zoo (Event Venues)",
      city: "Memphis",
      state: "TN",
      website: "https://www.memphiszoo.org",
      description: "One-of-a-kind wedding experience among exotic animal exhibits and lush habitats at the Memphis Zoo. Six distinctive ceremony and reception sites offer a truly wild celebration."
    },
    {
      venue_name: "Graceland's Chapel in the Woods",
      city: "Memphis",
      state: "TN",
      website: "https://www.graceland.com/chapel-in-the-woods",
      description: "Quaint white chapel in a serene forest on Elvis Presley's Graceland estate. An intimate, charming site for couples seeking a private, music-inspired ceremony in the woods."
    },
    {
      venue_name: "The Guest House at Graceland",
      city: "Memphis",
      state: "TN",
      website: "https://guesthousegraceland.com",
      description: "Four-Diamond resort hotel adjacent to Graceland, featuring elegant ballrooms and a private theater. Offers full-service wedding packages in an Elvis-inspired luxury setting."
    },
    {
      venue_name: "Heartwood Hall",
      city: "Rossville",
      state: "TN",
      website: "https://heartwoodhall.wheree.com",
      description: "Historic 1840 estate on 25 wooded acres blending rustic charm with modern elegance. Enchanting gardens, a lakeside ceremony site, and a refurbished barn create a memorable country celebration."
    },
    {
      venue_name: "Cedar Hall",
      city: "Bartlett",
      state: "TN",
      website: "https://www.evergroveestates.com/cedar-hall",
      description: "Antebellum manor with formal gardens and an English equestrian-style stable for receptions. Offers elegant indoor and outdoor settings on a picturesque estate."
    },
    {
      venue_name: "Orion Hill",
      city: "Arlington",
      state: "TN",
      website: "https://www.orionhillevents.com",
      description: "1830s estate on 20 acres just outside Memphis—a scenic countryside oasis with multiple indoor and outdoor spaces for versatile celebrations."
    },
    {
      venue_name: "The Robinshaw",
      city: "Rossville",
      state: "TN",
      website: "https://memphisweddingsvenue.com",
      description: "New 12,000 sq ft event center on a 150-acre estate near Rossville. A bright venue with lakeside and oak grove ceremony sites, hosting up to 350 guests in country style."
    },
    {
      venue_name: "Pin Oak Farms",
      city: "Somerville",
      state: "TN",
      website: "https://www.pinoakfarms.org",
      description: "Rustic-elegant barn venue on a private 10-acre property surrounded by mature trees. A charming pond and wooded scenery provide a peaceful countryside setting for weddings."
    },
    {
      venue_name: "Mallard's Croft",
      city: "Byhalia",
      state: "MS",
      website: "https://mallardscroft.com",
      description: "Expansive farm venue featuring a glass-walled forest chapel for enchanting ceremonies and a modern barn-style hall for receptions. A luxurious yet rustic destination just outside Memphis."
    },
    {
      venue_name: "The Gin at Nesbit",
      city: "Nesbit",
      state: "MS",
      website: "https://www.theginatnesbit.com",
      description: "Restored historic cotton gin featuring 13,000 sq ft of stylish industrial event space. Blends vintage mill charm with modern amenities for a unique wedding backdrop in Mississippi."
    },
    {
      venue_name: "Bonne Terre (Inn & Chapel)",
      city: "Nesbit",
      state: "MS",
      website: "https://bonneterre.co",
      description: "23-acre estate with a white chapel, on-site inn, restaurant, and pool. A relaxed scenic venue 20 minutes from Memphis, offering all-inclusive convenience for weddings."
    },
    {
      venue_name: "The Great Hall & Conference Center",
      city: "Germantown",
      state: "TN",
      website: "https://www.germantown-tn.gov/thegreathall",
      description: "8,600 sq ft event center tucked in the heart of Germantown. Surrounded by trees and set below street level, it offers a contemporary space for weddings up to 600 guests."
    },
    {
      venue_name: "Pike & West",
      city: "Germantown",
      state: "TN",
      website: "https://pikeandwest.com",
      description: "Modern art gallery venue opened in 2023, offering a fresh, creative space (with a multi-story patio) for intimate weddings in Germantown."
    },
    {
      venue_name: "Snowden House",
      city: "Horseshoe Lake",
      state: "AR",
      website: "https://www.facebook.com/snowdenhouse",
      description: "Historic lakefront mansion at Horseshoe Lake surrounded by magnolias and cypress trees. A serene Southern backdrop for weddings on the lawn (up to 400 guests) 32 miles from Memphis."
    }
  ];

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venues })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import venues');
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Import Venues - M10 DJ Company Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/admin/dashboard" className="mr-4">
                  <ArrowLeft className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Import Memphis Area Venues</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Venue Import Details</h2>
                <p className="text-gray-600">
                  This will import {venues.length} premium wedding venues from the Memphis area into your database.
                  Each venue will be automatically categorized and configured with appropriate capacity and amenities.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Upload className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Venues to be imported:
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>27 total venues across Memphis, TN and surrounding areas</li>
                        <li>Includes historic mansions, luxury hotels, gardens, museums, and unique venues</li>
                        <li>Covers Memphis, Germantown, Bartlett, and Mississippi border venues</li>
                        <li>Automatic venue type classification and capacity estimation</li>
                        <li>Amenity extraction from descriptions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample venues preview */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">Sample Venues Preview:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venues.slice(0, 4).map((venue, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-3">
                      <h4 className="font-medium text-gray-900">{venue.venue_name}</h4>
                      <p className="text-sm text-gray-600">{venue.city}, {venue.state}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{venue.description}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">...and {venues.length - 4} more venues</p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleImport}
                  disabled={isLoading || results}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isLoading || results
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing Venues...
                    </>
                  ) : results ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Import Complete
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import {venues.length} Venues
                    </>
                  )}
                </button>

                {results && (
                  <Link 
                    href="/venues"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Venues Page
                  </Link>
                )}
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Import Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {results && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Import Successful</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{results.message}</p>
                        <div className="mt-2">
                          <p className="font-medium">Imported venues include:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {results.venues.slice(0, 5).map((venue, index) => (
                              <li key={index}>{venue.venue_name} ({venue.city}, {venue.state})</li>
                            ))}
                            {results.venues.length > 5 && (
                              <li>...and {results.venues.length - 5} more venues</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req, res }) {
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}