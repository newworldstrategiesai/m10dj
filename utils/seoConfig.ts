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
    reviewCount: '10', // Actual Google review count
    bestRating: '5',
    worstRating: '5' // All reviews are 5-star
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
      author: 'Quade Nowlin',
      rating: 5,
      text: 'Ben was an excellent choice for my wedding. He played everything we asked and built a playlist based on those preferences. He had a better price than everyone else we contacted, and he was more responsive than anyone else we reached out to. He had a professional demeanor the entire time while also being able to have fun. Highly recommended, 10/10',
      date: '2024-11-01', // 1 month ago
      event: 'Wedding',
      reviewAspect: 'Wedding Entertainment',
      headline: 'Excellent Wedding Choice - 10/10',
      positiveNotes: ['Better pricing than competitors', 'Most responsive communication', 'Professional yet fun demeanor', 'Custom playlist creation'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'Alexis Cameron',
      rating: 5,
      text: 'Ben DJ\'d our wedding last weekend and I couldn\'t be more thankful. He was communicative, paid great attention to detail, and ensured everything went smoothly. He had a lapel mic for my officiant and some speeches that made it all seamless and convenient. We had younger kids, grandparents and all the others in between- the music was appropriate and also right up our alley. Ben went over the top to make sure the night went amazingly. Will be recommending to friends and family and highly do to anyone reading this now. Thank you, Ben!',
      date: '2024-10-01', // 2 months ago
      event: 'Wedding',
      reviewAspect: 'Wedding Coordination',
      headline: 'Couldn\'t Be More Thankful',
      positiveNotes: ['Excellent communication', 'Great attention to detail', 'Lapel mic for officiant', 'Age-appropriate music for all guests', 'Went over the top'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'Chandler Keen',
      rating: 5,
      text: 'Ben Murray DJ\'d my wedding and could not have been more thoughtful in the planning process. He\'s extremely talented and all of the guests at our wedding raved about the song choices and DJ. I highly recommend Ben for any event, he will cater to your wants and needs and ensure that your event is filled with exciting music that fits your desires.',
      date: '2021-12-01', // 3 years ago
      event: 'Wedding',
      reviewAspect: 'Event Planning',
      headline: 'Extremely Thoughtful Planning Process',
      positiveNotes: ['Thoughtful planning process', 'Extremely talented', 'Guests raved about song choices', 'Caters to specific wants and needs'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'Dan Roberts',
      rating: 5,
      text: 'Ben worked as the DJ at my fairly large (200-250 people) wedding. He was extremely professional with his communication and knew the right questions to ask us about specific music for planned dances and also about what kind of music we thought our attendees would like. I\'ve never been to a wedding where the DJ mixes his own tracks throughout the open dance time, but Ben made that work extremely well! He read the room and knew when to switch to keep the energy up on the dancefloor.',
      date: '2021-12-01', // 3 years ago
      event: 'Large Wedding',
      reviewAspect: 'Live Mixing & Crowd Reading',
      headline: 'Professional Large Wedding DJ',
      positiveNotes: ['Handled 200-250 people expertly', 'Professional communication', 'Live track mixing during dancing', 'Excellent crowd reading abilities'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'Brad Eiseman',
      rating: 5,
      text: 'This company is professional, courteous, and kind! Easily one of the best DJs we could have chosen for our wedding which was obviously one of the most important moments in our lives! DJ Ben Murray is a great person and a great DJ and we were lucky to have him as our DJ for our wedding!- Brad & Sarah',
      date: '2021-12-01', // 3 years ago
      event: 'Wedding',
      reviewAspect: 'Overall Service Quality',
      headline: 'One of the Best DJs We Could Have Chosen',
      positiveNotes: ['Professional, courteous, and kind', 'Great person and great DJ', 'Perfect for most important life moments'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'Steven Gordon',
      rating: 5,
      text: 'Ben is the best DJ in Memphis. We had him DJ our wedding, very easy to work with and the reception music, lighting, etc was perfect…made sure everybody was enjoying the vibe and accommodated requests. From prior experience, he\'s also a great party/club, etc DJ.',
      date: '2021-12-01', // 3 years ago
      event: 'Wedding',
      reviewAspect: 'Memphis DJ Expertise',
      headline: 'Best DJ in Memphis',
      positiveNotes: ['Best DJ in Memphis', 'Easy to work with', 'Perfect music and lighting', 'Accommodated requests', 'Great for all event types'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'Mary Nguyen',
      rating: 5,
      text: 'Ben is AMAZING! He\'s professional and knows what he\'s doing. He got us to put together our playlist and combined it with his and made the night magical! I don\'t know if he\'s ever done a Vietnamese wedding before, but he rocked it for my brother\'s.',
      date: '2021-12-01', // 3 years ago
      event: 'Vietnamese Wedding',
      reviewAspect: 'Multicultural Events',
      headline: 'Amazing Vietnamese Wedding DJ',
      positiveNotes: ['Professional and knowledgeable', 'Collaborative playlist creation', 'Made the night magical', 'Excellent with cultural events'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'AK Warmus',
      rating: 5,
      text: 'Would have another wedding just to have Ben DJ for us again.',
      date: '2022-12-01', // 2 years ago
      event: 'Wedding',
      reviewAspect: 'Overall Satisfaction',
      headline: 'Would Have Another Wedding Just for Ben',
      positiveNotes: ['So satisfied would repeat the experience', 'Exceptional service quality'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'Haley Blalack',
      rating: 5,
      text: 'Great!!!!! He did the music at the ceremony and Dj the reception! He did a fantastic job and it was a day not many people will forget.',
      date: '2021-12-01', // 3 years ago
      event: 'Wedding',
      reviewAspect: 'Ceremony & Reception',
      headline: 'Fantastic Job - Unforgettable Day',
      positiveNotes: ['Handled both ceremony and reception', 'Fantastic performance', 'Created unforgettable memories'],
      verified: true,
      source: 'Google Reviews'
    },
    {
      author: 'Jamie Irby',
      rating: 5,
      text: 'Super professional and punctual. Took care of our every need and want, would use again!',
      date: '2021-12-01', // 3 years ago
      event: 'Wedding',
      reviewAspect: 'Professional Service',
      headline: 'Super Professional and Punctual',
      positiveNotes: ['Super professional', 'Always punctual', 'Took care of every need', 'Would use again'],
      verified: true,
      source: 'Google Reviews'
    }
  ],
  aggregateStats: {
    totalReviews: 10, // Actual Google review count
    averageRating: 5.0,
    ratingDistribution: {
      5: 10, // All 10 reviews are 5-star
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  }
};
