// Script to insert Memphis area wedding venues into the database
// Run with: node scripts/insert-venues.js

const venues = [
  {
    venue_name: "The Peabody Hotel",
    city: "Memphis",
    state: "TN",
    website: "https://www.peabodymemphis.com",
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

console.log('Preparing to insert', venues.length, 'venues...');
console.log('Venues data:', JSON.stringify(venues, null, 2));

// If running in browser, you would make a fetch request to your API:
// fetch('/api/admin/venues', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({ venues })
// })
// .then(response => response.json())
// .then(data => console.log('Success:', data))
// .catch(error => console.error('Error:', error));

console.log('Copy the venues array above and use it in your admin interface or API call.');