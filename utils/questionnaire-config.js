/**
 * Questionnaire configuration for different event types
 * Each event type has its own set of steps, special moments, and questions
 */

import { Sparkles, PartyPopper, Music, Heart, Mic, LinkIcon, Radio, CheckCircle } from 'lucide-react';

export const getQuestionnaireConfig = (eventType) => {
  // Normalize event type (handle variations)
  const normalizedType = (eventType || 'wedding').toLowerCase();
  
  // Map common variations to standard types
  const eventTypeMap = {
    'wedding': 'wedding',
    'corporate': 'corporate',
    'corporate_event': 'corporate',
    'school_dance': 'school_dance',
    'school': 'school_dance',
    'holiday_party': 'holiday_party',
    'holiday': 'holiday_party',
    'private_party': 'private_party',
    'private': 'private_party',
    'other': 'other'
  };
  
  const standardType = eventTypeMap[normalizedType] || normalizedType || 'wedding';
  
  switch (standardType) {
    case 'wedding':
      return weddingConfig;
    case 'corporate':
      return corporateConfig;
    case 'school_dance':
      return schoolDanceConfig;
    case 'holiday_party':
      return holidayPartyConfig;
    case 'private_party':
      return privatePartyConfig;
    default:
      return genericConfig;
  }
};

// Wedding Configuration (existing)
export const weddingConfig = {
  eventType: 'wedding',
  welcomeMessage: "We're so excited to be a part of your wedding day! Let's make sure your music is absolutely perfect.",
  vibePlaceholder: "Describe your wedding in 3 words (e.g., romantic, upbeat, classy)",
  
  specialDanceFields: [
    { 
      id: 'bridal_party_intro', 
      label: 'Bridal Party Intro Song',
      tooltip: 'The high-energy song when your wedding party makes their grand entrance'
    },
    { 
      id: 'bride_groom_intro', 
      label: 'Bride and Groom Introduction Song',
      tooltip: 'YOUR big moment walking in as the new Mr & Mrs!'
    },
    { 
      id: 'first_dance', 
      label: 'Bride and Groom First Dance',
      tooltip: 'The romantic song just for the two of you'
    },
    { 
      id: 'father_daughter', 
      label: 'Father Daughter Dance',
      tooltip: 'That tear-jerker moment with Dad'
    },
    { 
      id: 'mother_son', 
      label: 'Mother Son Dance',
      tooltip: 'A sweet dedication to Mom'
    },
    { 
      id: 'garter_toss', 
      label: 'Garter Toss Song',
      tooltip: 'The fun, upbeat song for the garter toss tradition'
    },
    { 
      id: 'bouquet_toss', 
      label: 'Bouquet Toss Song',
      tooltip: 'The celebratory song when you toss the bouquet to your single friends'
    },
    { 
      id: 'cake_cutting', 
      label: 'Cake Cutting Song',
      tooltip: 'The sweet song that plays while you cut your wedding cake together'
    },
    { 
      id: 'last_dance', 
      label: 'Bride and Groom Last Dance of the night',
      tooltip: 'Your final dance together as the night comes to a close'
    }
  ],
  
  ceremonyMusicFields: [
    { 
      id: 'prelude', 
      label: 'Prelude', 
      description: 'Soft background music while guests arrive and find their seats – think peaceful and welcoming'
    },
    { 
      id: 'interlude', 
      label: 'Interlude', 
      description: 'A beautiful song during the lighting of the unity candle or another special moment in your ceremony. It can be instrumental or vocal.'
    },
    { 
      id: 'processional', 
      label: 'Processional', 
      description: 'Stately, elegant music played as your bridal party walks down the aisle, with you and your escort at the very end. Often the bride\'s walk is accompanied by a different, more emotional tune.'
    },
    { 
      id: 'bridal_march', 
      label: 'Bridal March', 
      description: 'The moment everyone\'s been waiting for – the music that plays as you walk down the aisle.'
    },
    { 
      id: 'recessional', 
      label: 'Recessional', 
      description: 'Upbeat, triumphant music played at the end of the service as you make your way back up the aisle as newlyweds!'
    },
    { 
      id: 'postlude', 
      label: 'Postlude',
      description: 'Background music that plays until every last guest has exited the ceremony area. It should be gentle and last around fifteen minutes.'
    }
  ],
  
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Your Music Planning',
      icon: Sparkles,
      description: 'Let\'s make sure your wedding day music is absolutely perfect!'
    },
    {
      id: 'event_details',
      title: 'Event Details',
      icon: PartyPopper,
      description: 'Help us understand your event basics'
    },
    {
      id: 'big_no',
      title: 'Songs We\'ll Happily Skip',
      icon: Music,
      description: 'We\'ll steer clear of these so your dance floor stays perfect'
    },
    {
      id: 'special_dances',
      title: 'Special Dances',
      icon: Heart,
      description: 'Are we having any special songs played for first dance, father daughter dance, etc?'
    },
    {
      id: 'special_dance_songs',
      title: 'Special Dance Songs',
      icon: Music,
      description: 'Please provide the song names and artists for your special dances'
    },
    {
      id: 'mc_introduction',
      title: 'MC Introduction',
      icon: Mic,
      description: 'How would you like to be introduced?'
    },
    {
      id: 'playlists',
      title: 'Your Playlists',
      icon: LinkIcon,
      description: 'Have a playlist already started? We love it!'
    },
    {
      id: 'ceremony_type',
      title: 'Ceremony Music',
      icon: Radio,
      description: 'What music will be played at the ceremony?'
    },
    {
      id: 'ceremony_fields',
      title: 'Ceremony Music',
      icon: Music,
      description: 'Which ceremony music moments would you like to plan?'
    },
    {
      id: 'ceremony_details',
      title: 'Ceremony Music Details',
      icon: Music,
      description: 'Please provide the song names for your ceremony'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      icon: CheckCircle,
      description: 'Review your music selections before submitting'
    }
  ],
  
  hasCeremonyMusic: true,
  specialMomentsLabel: 'Special Dances',
  specialMomentsQuestion: 'Are we having any special songs played for first dance, father daughter dance, etc?'
};

// Corporate Event Configuration
export const corporateConfig = {
  eventType: 'corporate',
  welcomeMessage: "Let's create the perfect atmosphere for your corporate event. We'll ensure the music enhances your event's professional tone.",
  vibePlaceholder: "Describe your event atmosphere in 3 words (e.g., professional, upbeat, elegant)",
  
  specialDanceFields: [
    { 
      id: 'arrival_networking', 
      label: 'Arrival & Networking Music',
      tooltip: 'Background music during guest arrival and networking time. Typically instrumental or light vocals, professional tone.'
    },
    { 
      id: 'presentation_ambient', 
      label: 'Presentation Background Music',
      tooltip: 'Very subtle background music during presentations or speeches (if any). Usually instrumental only.'
    },
    { 
      id: 'awards_ceremony', 
      label: 'Awards/Recognition Music',
      tooltip: 'Music played during awards presentations, employee recognition, or achievement ceremonies. Often includes walk-up music for recipients.'
    },
    { 
      id: 'dinner_music', 
      label: 'Dinner Music',
      tooltip: 'Background music during dinner service. Should be pleasant but not distracting, allowing conversation.'
    },
    { 
      id: 'entertainment_dancing', 
      label: 'Entertainment & Dancing Music',
      tooltip: 'Music for the entertainment portion if your event includes dancing or social time after formal portions.'
    },
    { 
      id: 'closing_exit', 
      label: 'Closing & Exit Music',
      tooltip: 'Music as the event concludes and guests depart. Professional and positive.'
    }
  ],
  
  ceremonyMusicFields: [],
  
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Your Event Planning',
      icon: Sparkles,
      description: 'Let\'s plan the perfect music for your corporate event!'
    },
    {
      id: 'event_details',
      title: 'Event Details',
      icon: PartyPopper,
      description: 'Help us understand your event basics'
    },
    {
      id: 'big_no',
      title: 'Songs to Avoid',
      icon: Music,
      description: 'Any songs or genres you\'d like us to avoid?'
    },
    {
      id: 'special_dances',
      title: 'Special Moments',
      icon: Heart,
      description: 'Are there any special moments or presentations that need specific music?'
    },
    {
      id: 'special_dance_songs',
      title: 'Special Moment Music',
      icon: Music,
      description: 'Please provide the song names and artists for your special moments'
    },
    {
      id: 'mc_introduction',
      title: 'MC Services & Announcements',
      icon: Mic,
      description: 'What announcements, introductions, or MC services do you need? (speaker introductions, agenda items, etc.)'
    },
    {
      id: 'playlists',
      title: 'Your Playlists',
      icon: LinkIcon,
      description: 'Have any playlists or specific songs you\'d like us to include?'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      icon: CheckCircle,
      description: 'Review your music selections before submitting'
    }
  ],
  
  hasCeremonyMusic: false,
  specialMomentsLabel: 'Special Moments',
  specialMomentsQuestion: 'Are there any special moments or presentations that need specific music?'
};

// School Dance Configuration
export const schoolDanceConfig = {
  eventType: 'school_dance',
  welcomeMessage: "Let's make your school dance unforgettable! We'll play age-appropriate music that gets everyone on the dance floor.",
  vibePlaceholder: "Describe your dance atmosphere in 3 words (e.g., fun, energetic, school-appropriate)",
  
  specialDanceFields: [
    { 
      id: 'grand_entrance', 
      label: 'Grand Entrance/Opening Music',
      tooltip: 'High-energy music for when students first enter the dance or for grand march/processional'
    },
    { 
      id: 'court_presentation', 
      label: 'Court Presentation Music',
      tooltip: 'Elegant music for homecoming/prom court introductions, king/queen announcements, or special recognition'
    },
    { 
      id: 'slow_dances', 
      label: 'Slow Dance Songs',
      tooltip: 'Appropriate slow dance songs students will enjoy. We\'ll ensure all selections are school-appropriate.'
    },
    { 
      id: 'line_dances', 
      label: 'Line Dance/Group Dance Songs',
      tooltip: 'Popular line dances or group activities (Cha Cha Slide, Cupid Shuffle, etc.) that get everyone involved'
    },
    { 
      id: 'crowd_favorites', 
      label: 'Must-Play Favorites',
      tooltip: 'Popular songs that students have specifically requested or that are trending with your age group'
    },
    { 
      id: 'last_song', 
      label: 'Final Song of the Night',
      tooltip: 'The memorable closing song that ends the dance on a high note'
    }
  ],
  
  ceremonyMusicFields: [],
  
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Your Dance Planning',
      icon: Sparkles,
      description: 'Let\'s plan amazing music for your school dance!'
    },
    {
      id: 'event_details',
      title: 'Event Details',
      icon: PartyPopper,
      description: 'Help us understand your dance basics'
    },
    {
      id: 'big_no',
      title: 'Songs to Avoid',
      icon: Music,
      description: 'Any songs, artists, or genres that should be avoided? (We always play clean versions, but let us know if there are specific songs to skip)'
    },
    {
      id: 'special_dances',
      title: 'Special Moments',
      icon: Heart,
      description: 'Are there any special moments or traditions that need specific music?'
    },
    {
      id: 'special_dance_songs',
      title: 'Special Moment Music',
      icon: Music,
      description: 'Please provide the song names and artists for your special moments'
    },
    {
      id: 'mc_introduction',
      title: 'Announcements & MC Services',
      icon: Mic,
      description: 'What announcements do you need? (court presentations, event timeline, rules/reminders, etc.)'
    },
    {
      id: 'playlists',
      title: 'Your Playlists',
      icon: LinkIcon,
      description: 'Have playlists or songs that are popular with your students?'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      icon: CheckCircle,
      description: 'Review your music selections before submitting'
    }
  ],
  
  hasCeremonyMusic: false,
  specialMomentsLabel: 'Special Moments',
  specialMomentsQuestion: 'Are there any special moments or traditions that need specific music?'
};

// Holiday Party Configuration
export const holidayPartyConfig = {
  eventType: 'holiday_party',
  welcomeMessage: "Let's create a festive atmosphere for your holiday celebration! We'll ensure the music matches the holiday spirit.",
  vibePlaceholder: "Describe your party atmosphere in 3 words (e.g., festive, joyful, elegant)",
  
  specialDanceFields: [
    { 
      id: 'arrival_music', 
      label: 'Arrival & Welcome Music',
      tooltip: 'Festive holiday music as guests arrive and mingle'
    },
    { 
      id: 'holiday_classics', 
      label: 'Must-Play Holiday Classics',
      tooltip: 'Traditional holiday songs you definitely want to hear (White Christmas, Jingle Bells, etc.)'
    },
    { 
      id: 'modern_holiday', 
      label: 'Modern Holiday Songs',
      tooltip: 'Contemporary holiday music (recent pop holiday songs, covers, etc.)'
    },
    { 
      id: 'dinner_cocktail', 
      label: 'Dinner/Cocktail Music',
      tooltip: 'Background music during dinner or cocktail hour - can be all holiday or mix of holiday and regular'
    },
    { 
      id: 'dancing_music', 
      label: 'Dancing Music Mix',
      tooltip: 'Mix of holiday and regular dance music to keep the party going'
    },
    { 
      id: 'special_moments', 
      label: 'Special Moment Songs',
      tooltip: 'Music for gift exchanges, special announcements, or holiday traditions'
    },
    { 
      id: 'closing_song', 
      label: 'Closing Song',
      tooltip: 'Final festive song as the party concludes'
    }
  ],
  
  ceremonyMusicFields: [],
  
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Your Holiday Party Planning',
      icon: Sparkles,
      description: 'Let\'s plan festive music for your holiday celebration!'
    },
    {
      id: 'event_details',
      title: 'Event Details',
      icon: PartyPopper,
      description: 'Help us understand your party basics'
    },
    {
      id: 'big_no',
      title: 'Songs to Avoid',
      icon: Music,
      description: 'Any songs or genres you\'d like us to avoid?'
    },
    {
      id: 'special_dances',
      title: 'Special Moments',
      icon: Heart,
      description: 'Are there any special moments that need specific music?'
    },
    {
      id: 'special_dance_songs',
      title: 'Special Moment Music',
      icon: Music,
      description: 'Please provide the song names and artists for your special moments'
    },
    {
      id: 'mc_introduction',
      title: 'Announcements',
      icon: Mic,
      description: 'Any announcements or introductions needed?'
    },
    {
      id: 'playlists',
      title: 'Your Playlists',
      icon: LinkIcon,
      description: 'Have holiday playlists, specific songs, or a mix preference? (All holiday, mix with regular music, etc.)'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      icon: CheckCircle,
      description: 'Review your music selections before submitting'
    }
  ],
  
  hasCeremonyMusic: false,
  specialMomentsLabel: 'Special Moments & Activities',
  specialMomentsQuestion: 'Any special holiday activities that need music? (gift exchanges, photo ops, special announcements, etc.)'
};

// Private Party Configuration
export const privatePartyConfig = {
  eventType: 'private_party',
  welcomeMessage: "Let's make your private party amazing! We'll play the music that creates the perfect atmosphere for your celebration.",
  vibePlaceholder: "Describe your party atmosphere in 3 words (e.g., fun, relaxed, energetic)",
  
  specialDanceFields: [
    { 
      id: 'arrival_music', 
      label: 'Arrival Music',
      tooltip: 'Music playing as guests arrive and get settled'
    },
    { 
      id: 'guest_of_honor', 
      label: 'Guest of Honor Song',
      tooltip: 'Special song for the birthday person, anniversary couple, or person being celebrated'
    },
    { 
      id: 'cake_candles', 
      label: 'Cake/Candle Moment',
      tooltip: 'Song for birthday candles, cake cutting, or similar celebration moment'
    },
    { 
      id: 'toast_announcement', 
      label: 'Toast/Announcement Music',
      tooltip: 'Background music during toasts or special announcements'
    },
    { 
      id: 'era_preferences', 
      label: 'Era or Genre Preferences',
      tooltip: 'Preferred music decades or genres (80s, 90s, current hits, country, etc.)'
    },
    { 
      id: 'must_play_songs', 
      label: 'Must-Play Songs',
      tooltip: 'Songs that absolutely must be played - crowd favorites or special requests'
    },
    { 
      id: 'final_song', 
      label: 'Final Song',
      tooltip: 'The memorable closing song to end the night'
    }
  ],
  
  ceremonyMusicFields: [],
  
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Your Party Planning',
      icon: Sparkles,
      description: 'Let\'s plan amazing music for your private party!'
    },
    {
      id: 'event_details',
      title: 'Event Details',
      icon: PartyPopper,
      description: 'Help us understand your party basics'
    },
    {
      id: 'big_no',
      title: 'Songs to Avoid',
      icon: Music,
      description: 'Any songs you\'d like us to avoid?'
    },
    {
      id: 'special_dances',
      title: 'Special Moments & Traditions',
      icon: Heart,
      description: 'What special moments do you want music for? (birthday candles, anniversary toast, photo moments, etc.)'
    },
    {
      id: 'special_dance_songs',
      title: 'Special Moment Music',
      icon: Music,
      description: 'Please provide the song names and artists for your special moments'
    },
    {
      id: 'mc_introduction',
      title: 'Announcements & Introductions',
      icon: Mic,
      description: 'Any announcements needed? (guest introductions, special moments, timeline items, etc.)'
    },
    {
      id: 'playlists',
      title: 'Your Playlists',
      icon: LinkIcon,
      description: 'Have any playlists or songs you\'d like us to include?'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      icon: CheckCircle,
      description: 'Review your music selections before submitting'
    }
  ],
  
  hasCeremonyMusic: false,
  specialMomentsLabel: 'Special Moments & Traditions',
  specialMomentsQuestion: 'What special moments do you want music for? (birthday candles, anniversary toast, photo moments, etc.)'
};

// Generic/Other Configuration (fallback)
export const genericConfig = {
  eventType: 'other',
  welcomeMessage: "Let's create the perfect music experience for your event! We'll tailor everything to match your vision.",
  vibePlaceholder: "Describe your event atmosphere in 3 words (e.g., fun, elegant, energetic)",
  
  specialDanceFields: [
    { 
      id: 'opening_music', 
      label: 'Opening Music',
      tooltip: 'Music for the beginning of your event'
    },
    { 
      id: 'background_music', 
      label: 'Background Music',
      tooltip: 'Music during meal or social time'
    },
    { 
      id: 'special_moment', 
      label: 'Special Moment Song',
      tooltip: 'Music for a special moment in your event'
    },
    { 
      id: 'entertainment_music', 
      label: 'Entertainment Music',
      tooltip: 'Music for dancing or entertainment'
    },
    { 
      id: 'closing_music', 
      label: 'Closing Music',
      tooltip: 'Music as the event ends'
    }
  ],
  
  ceremonyMusicFields: [],
  
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Your Event Planning',
      icon: Sparkles,
      description: 'Let\'s plan the perfect music for your event!'
    },
    {
      id: 'event_details',
      title: 'Event Details',
      icon: PartyPopper,
      description: 'Help us understand your event basics'
    },
    {
      id: 'big_no',
      title: 'Songs to Avoid',
      icon: Music,
      description: 'Any songs or genres you\'d like us to avoid?'
    },
    {
      id: 'special_dances',
      title: 'Special Moments',
      icon: Heart,
      description: 'Are there any special moments that need specific music?'
    },
    {
      id: 'special_dance_songs',
      title: 'Special Moment Music',
      icon: Music,
      description: 'Please provide the song names and artists for your special moments'
    },
    {
      id: 'mc_introduction',
      title: 'Announcements',
      icon: Mic,
      description: 'Any announcements or introductions needed?'
    },
    {
      id: 'playlists',
      title: 'Your Playlists',
      icon: LinkIcon,
      description: 'Have any playlists or songs you\'d like us to include?'
    },
    {
      id: 'review',
      title: 'Review & Submit',
      icon: CheckCircle,
      description: 'Review your music selections before submitting'
    }
  ],
  
  hasCeremonyMusic: false,
  specialMomentsLabel: 'Special Moments',
  specialMomentsQuestion: 'Are there any special moments that need specific music?'
};

