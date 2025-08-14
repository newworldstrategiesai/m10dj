// SEO Configuration for M10 DJ Company
// Centralized configuration for structured data and SEO

export const businessInfo = {
  name: 'M10 DJ Company',
  alternateName: 'M10 DJ',
  legalName: 'M10 DJ Company LLC',
  description: "Memphis's premier wedding and event DJ company with 15+ years of experience and 500+ successful celebrations.",
  url: 'https://www.m10djcompany.com',
  logo: {
    url: 'https://www.m10djcompany.com/logo-static.jpg',
    width: 400,
    height: 400
  },
  image: 'https://www.m10djcompany.com/logo-static.jpg',
  telephone: '+19014102020',
  email: 'info@m10djcompany.com',
  foundingDate: '2009',
  founder: {
    name: 'Ben Murray',
    jobTitle: 'Professional DJ & Entertainment Director'
  },
  address: {
    streetAddress: '65 Stewart Rd',
    addressLocality: 'Eads',
    addressRegion: 'TN',
    postalCode: '38028',
    addressCountry: 'US'
  },
  geo: {
    latitude: 35.1495,
    longitude: -90.0490
  },
  priceRange: '$799-$1899',
  currenciesAccepted: 'USD',
  paymentAccepted: ['Cash', 'Check', 'Credit Card', 'PayPal', 'Venmo'],
  openingHours: 'Mo-Su 09:00-21:00',
  socialMedia: [
    'https://www.facebook.com/m10djcompany',
    'https://www.instagram.com/m10djcompany',
    'https://www.linkedin.com/company/m10djcompany'
  ],
  aggregateRating: {
    ratingValue: '5.0',
    reviewCount: '150',
    bestRating: '5',
    worstRating: '1'
  }
};

export const locationData = {
  memphis: {
    name: 'Memphis',
    coordinates: { latitude: 35.1495, longitude: -90.0490 },
    neighborhoods: ['Downtown Memphis', 'Midtown Memphis', 'East Memphis', 'South Memphis', 'North Memphis'],
    zipCodes: ['38103', '38104', '38105', '38106', '38107', '38108', '38109', '38111', '38112', '38114', '38115', '38116', '38117', '38118', '38119', '38120', '38122', '38125', '38126', '38127', '38128', '38133', '38134', '38135', '38141', '38152'],
    radius: '25 miles'
  },
  germantown: {
    name: 'Germantown',
    coordinates: { latitude: 35.0867, longitude: -89.8101 },
    neighborhoods: ['Germantown Hills', 'Farmington', 'Forest Hill'],
    zipCodes: ['38138', '38139'],
    radius: '15 miles'
  },
  collierville: {
    name: 'Collierville',
    coordinates: { latitude: 35.0420, longitude: -89.6645 },
    neighborhoods: ['Historic Collierville', 'Schilling Farms', 'Bailey Station'],
    zipCodes: ['38017', '38027'],
    radius: '15 miles'
  },
  bartlett: {
    name: 'Bartlett',
    coordinates: { latitude: 35.2045, longitude: -89.8740 },
    neighborhoods: ['Bartlett Station', 'Elmore Park', 'Stage Hills'],
    zipCodes: ['38002', '38133', '38135'],
    radius: '15 miles'
  },
  cordova: {
    name: 'Cordova',
    coordinates: { latitude: 35.1556, longitude: -89.7734 },
    neighborhoods: ['Cordova', 'Dexter', 'Hickory Hill'],
    zipCodes: ['38016', '38018'],
    radius: '10 miles'
  }
};

export const serviceTypes = {
  wedding: {
    name: 'Wedding DJ Services',
    description: 'Professional wedding DJ services including ceremony music, reception entertainment, MC services, and complete wedding coordination.',
    serviceType: 'Wedding Entertainment',
    category: 'Wedding Services',
    priceRange: '$795-$1595',
    duration: '6-8 hours',
    includes: ['Professional DJ', 'Sound System', 'Wireless Microphones', 'MC Services', 'Uplighting', 'Music Library', 'Online Planning'],
    keywords: ['wedding DJ', 'wedding entertainment', 'wedding music', 'wedding MC', 'bridal party introductions']
  },
  corporate: {
    name: 'Corporate Event DJ Services',
    description: 'Professional corporate event entertainment including background music, presentations, awards ceremonies, and company celebrations.',
    serviceType: 'Corporate Entertainment',
    category: 'Business Services',
    priceRange: '$495-$995',
    duration: '2-6 hours',
    includes: ['Professional DJ', 'Sound System', 'Microphones', 'Background Music', 'Presentation Support', 'Professional Attire'],
    keywords: ['corporate DJ', 'business events', 'company parties', 'corporate entertainment', 'conference audio']
  },
  private: {
    name: 'Private Party DJ Services',
    description: 'Professional DJ services for private parties including birthdays, anniversaries, graduations, and family celebrations.',
    serviceType: 'Private Entertainment',
    category: 'Party Services',
    priceRange: '$395-$795',
    duration: '3-6 hours',
    includes: ['Professional DJ', 'Sound System', 'Party Music', 'Requests', 'Lighting Effects', 'MC Services'],
    keywords: ['party DJ', 'birthday party', 'anniversary party', 'graduation party', 'family celebration']
  },
  school: {
    name: 'School Dance DJ Services',
    description: 'Professional DJ services for school dances including proms, homecoming, formals, and student events.',
    serviceType: 'School Entertainment',
    category: 'Educational Services',
    priceRange: '$495-$895',
    duration: '3-5 hours',
    includes: ['Professional DJ', 'Sound System', 'Age-Appropriate Music', 'Interactive Entertainment', 'Lighting', 'Clean Versions'],
    keywords: ['school DJ', 'prom DJ', 'homecoming DJ', 'school dance', 'student events']
  },
  holiday: {
    name: 'Holiday Party DJ Services',
    description: 'Professional DJ services for holiday celebrations including Christmas parties, New Year events, and seasonal celebrations.',
    serviceType: 'Holiday Entertainment',
    category: 'Seasonal Services',
    priceRange: '$495-$995',
    duration: '3-6 hours',
    includes: ['Professional DJ', 'Holiday Music', 'Sound System', 'Festive Lighting', 'Interactive Entertainment', 'Special Requests'],
    keywords: ['holiday DJ', 'Christmas party', 'New Year DJ', 'holiday entertainment', 'seasonal music']
  },
  multicultural: {
    name: 'Multicultural DJ Services',
    description: 'Specialized DJ services for multicultural celebrations including Hispanic, Indian, and diverse cultural events with authentic music.',
    serviceType: 'Cultural Entertainment',
    category: 'Specialty Services',
    priceRange: '$595-$1195',
    duration: '4-8 hours',
    includes: ['Bilingual DJ', 'Cultural Music', 'Traditional Ceremonies', 'Sound System', 'Cultural Expertise', 'Custom Playlists'],
    keywords: ['Hispanic DJ', 'Indian wedding DJ', 'multicultural events', 'bilingual DJ', 'cultural celebrations']
  }
};

export const venueTypes = {
  wedding: {
    name: 'Wedding Venues',
    description: 'Professional DJ services at Memphis wedding venues with venue-specific setup and coordination.',
    includes: ['Venue Coordination', 'Custom Setup', 'Venue-Specific Experience', 'Preferred Vendor Status'],
    popularVenues: [
      'The Peabody Hotel',
      'Memphis Botanic Garden',
      'Dixon Gallery & Gardens',
      'The Columns',
      'Annesdale Mansion',
      'Graceland Chapel'
    ]
  },
  corporate: {
    name: 'Corporate Venues',
    description: 'Professional DJ services at corporate venues including hotels, conference centers, and business facilities.',
    includes: ['Professional Setup', 'AV Integration', 'Corporate Standards', 'Discrete Service'],
    popularVenues: [
      'FedEx Forum',
      'Memphis Cook Convention Center',
      'The Guest House at Graceland',
      'Hilton Memphis',
      'Sheraton Memphis Downtown'
    ]
  }
};

export const faqData = {
  general: [
    {
      question: 'What DJ services does M10 DJ Company offer in Memphis?',
      answer: 'M10 DJ Company provides comprehensive DJ services including wedding DJs, corporate event entertainment, private party DJs, school dances, holiday parties, and multicultural celebrations throughout Memphis and surrounding areas.',
      category: 'Services'
    },
    {
      question: 'How much does a DJ cost in Memphis?',
      answer: 'Memphis DJ pricing varies by event type and duration. Wedding DJ packages start at $795, corporate events from $495, and private parties from $395. All packages include professional equipment, setup, and experienced DJ services.',
      category: 'Pricing'
    },
    {
      question: 'Do you provide DJ services outside of Memphis?',
      answer: 'Yes, we serve the greater Memphis area including Germantown, Collierville, Bartlett, Cordova, and surrounding communities within 50 miles of Memphis.',
      category: 'Service Area'
    }
  ],
  wedding: [
    {
      question: 'What is included in your wedding DJ packages?',
      answer: 'Our wedding DJ packages include professional DJ, premium sound system, wireless microphones, MC services, basic uplighting, online planning portal, and music for ceremony and reception.',
      category: 'Wedding Services'
    },
    {
      question: 'Can you provide music for both ceremony and reception?',
      answer: 'Yes, we provide complete wedding day music including ceremony processional/recessional, cocktail hour background music, dinner music, and reception dance music.',
      category: 'Wedding Services'
    }
  ]
};

export const reviewData = {
  featured: [
    {
      author: 'Sarah M.',
      rating: 5,
      text: 'M10 DJ Company made our wedding absolutely perfect! Ben was professional, played exactly what we wanted, and kept the dance floor packed all night.',
      date: '2024-06-15',
      event: 'Wedding'
    },
    {
      author: 'Corporate Client',
      rating: 5,
      text: 'Outstanding service for our annual company party. Professional, punctual, and exactly what we needed for a successful corporate event.',
      date: '2024-05-20',
      event: 'Corporate Event'
    },
    {
      author: 'Jennifer L.',
      rating: 5,
      text: 'Hired M10 DJ for my daughter\'s sweet 16. They were amazing with the kids and played all the right music. Highly recommend!',
      date: '2024-04-10',
      event: 'Private Party'
    }
  ]
};
