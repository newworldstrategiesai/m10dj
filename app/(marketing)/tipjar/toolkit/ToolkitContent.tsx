'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  QrCode,
  Heart,
  Music,
  Calendar,
  Building2,
  Wine,
  Camera,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  CheckCircle,
  Coffee,
  Utensils,
  PartyPopper,
  Mic,
  Gift,
  Truck,
  Ticket,
  Crown,
  ChefHat,
  Beer,
  Disc
} from 'lucide-react';

interface ApplicationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  tips: string[];
}

function ApplicationCard({ title, description, icon, category, tips }: ApplicationCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:border-emerald-200 dark:hover:border-emerald-600">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
              {category}
            </Badge>
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{description}</p>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Pro Tips:</h4>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const applications = [
  // Wedding Applications
  {
    title: 'Wedding Reception Tables',
    description: 'Place QR codes on table cards or centerpieces at wedding receptions. Guests can easily tip the DJ and request songs throughout dinner and dancing.',
    icon: <Heart className="w-6 h-6 text-white" />,
    category: 'Weddings',
    tips: [
      'Include QR code on table numbers or place cards',
      'Add to wedding program or menu cards',
      'Place on sweetheart table for easy access'
    ]
  },
  {
    title: 'Wedding Ceremony Programs',
    description: 'Include TipJar QR codes in wedding ceremony programs. Guests can access the tipping link immediately after the ceremony.',
    icon: <Calendar className="w-6 h-6 text-white" />,
    category: 'Weddings',
    tips: [
      'Print QR code on program cover or inside pages',
      'Include brief instructions for guests',
      'Use as call-to-action during speeches'
    ]
  },
  {
    title: 'Wedding Photo Booth',
    description: 'Display QR codes near wedding photo booths. Guests can tip the DJ while taking photos or waiting in line.',
    icon: <Camera className="w-6 h-6 text-white" />,
    category: 'Weddings',
    tips: [
      'Place QR code signs near photo props',
      'Include in photo booth instructions',
      'Perfect for post-ceremony entertainment'
    ]
  },

  // Bar & Restaurant Applications
  {
    title: 'Bar Counter Displays',
    description: 'Display QR codes on bar counters and menus. Bartenders can point customers to the digital tip jar when serving drinks.',
    icon: <Beer className="w-6 h-6 text-white" />,
    category: 'Bars & Restaurants',
    tips: [
      'Laminate QR code cards for bar tops',
      'Include in drink menus and specials boards',
      'Place near POS systems for staff reference'
    ]
  },
  {
    title: 'Restaurant Table Tents',
    description: 'Use table tents with QR codes at restaurant tables. Customers can tip servers and request songs while dining.',
    icon: <Utensils className="w-6 h-6 text-white" />,
    category: 'Bars & Restaurants',
    tips: [
      'Design custom table tents with venue branding',
      'Include on dessert menus or check presenters',
      'Perfect for fine dining establishments'
    ]
  },
  {
    title: 'Coffee Shop Counters',
    description: 'Place QR codes at coffee shop registers and pickup counters. Customers can tip baristas while ordering or picking up drinks.',
    icon: <Coffee className="w-6 h-6 text-white" />,
    category: 'Bars & Restaurants',
    tips: [
      'Include in loyalty program cards',
      'Place near tip jars for dual options',
      'Great for busy morning rushes'
    ]
  },

  // Event Applications
  {
    title: 'Corporate Event Stages',
    description: 'Display QR codes on stage monitors and event signage at corporate events. Attendees can tip performers and speakers.',
    icon: <Building2 className="w-6 h-6 text-white" />,
    category: 'Corporate Events',
    tips: [
      'Use large QR codes on stage backdrops',
      'Include in event agendas and programs',
      'Perfect for award ceremonies and presentations'
    ]
  },
  {
    title: 'Festival Booth Signs',
    description: 'Create custom booth signs with QR codes for music festivals and fairs. Attendees can tip artists and performers.',
    icon: <PartyPopper className="w-6 h-6 text-white" />,
    category: 'Festivals & Fairs',
    tips: [
      'Weather-resistant signage for outdoor events',
      'Include in performer bios and schedules',
      'Multiple QR codes for different performers'
    ]
  },
  {
    title: 'Private Party Invitations',
    description: 'Include QR codes in private party invitations and RSVPs. Guests can pre-tip or request songs before arriving.',
    icon: <Gift className="w-6 h-6 text-white" />,
    category: 'Private Parties',
    tips: [
      'Add to digital invitations and emails',
      'Include on paper invitations when possible',
      'Create excitement before the event'
    ]
  },

  // Hospitality Applications
  {
    title: 'Hotel Event Spaces',
    description: 'Display QR codes in hotel ballrooms and event spaces. Hotel guests can easily tip wedding and event DJs.',
    icon: <Building2 className="w-6 h-6 text-white" />,
    category: 'Hotels & Venues',
    tips: [
      'Work with hotel staff for placement approval',
      'Include in room service menus',
      'Perfect for wedding and conference venues'
    ]
  },
  {
    title: 'Catering Company Menus',
    description: 'Include QR codes on catering menus and order forms. Clients can tip catering staff and event entertainers.',
    icon: <ChefHat className="w-6 h-6 text-white" />,
    category: 'Catering',
    tips: [
      'Add to plated dinner menus',
      'Include in buffet signage',
      'Works for both on-site and delivery catering'
    ]
  },
  {
    title: 'Food Truck Windows',
    description: 'Display QR codes on food truck windows and order boards. Customers can tip while ordering food.',
    icon: <Truck className="w-6 h-6 text-white" />,
    category: 'Food Trucks',
    tips: [
      'Weather-resistant window decals',
      'Include in social media posts',
      'Perfect for festivals and events'
    ]
  },

  // Digital Applications
  {
    title: 'Social Media Posts',
    description: 'Share QR codes on Instagram, Facebook, and TikTok. Followers can tip you directly from your social media profiles.',
    icon: <Instagram className="w-6 h-6 text-white" />,
    category: 'Social Media',
    tips: [
      'Create eye-catching social media graphics',
      'Include in Stories and Reels',
      'Use for live streaming events'
    ]
  },
  {
    title: 'Email Signatures',
    description: 'Add QR codes to email signatures and newsletters. Clients and fans can tip you directly from emails.',
    icon: <Mail className="w-6 h-6 text-white" />,
    category: 'Email Marketing',
    tips: [
      'Include in booking confirmation emails',
      'Add to promotional newsletters',
      'Works for both business and personal emails'
    ]
  },
  {
    title: 'Website Integration',
    description: 'Embed TipJar on your website with one line of code. Visitors can tip you directly from your site.',
    icon: <Globe className="w-6 h-6 text-white" />,
    category: 'Websites',
    tips: [
      'Add to "Book Now" or contact pages',
      'Include on blog posts and portfolios',
      'Works on WordPress, Squarespace, and more'
    ]
  },
  {
    title: 'YouTube Channel',
    description: 'Add QR codes to YouTube video descriptions and end screens. Viewers can tip you for content they enjoy.',
    icon: <Youtube className="w-6 h-6 text-white" />,
    category: 'YouTube',
    tips: [
      'Include in video descriptions',
      'Add to end screen annotations',
      'Perfect for music and performance content'
    ]
  },
  {
    title: 'Business Cards',
    description: 'Print QR codes on business cards and promotional materials. Clients can easily access your TipJar link.',
    icon: <Ticket className="w-6 h-6 text-white" />,
    category: 'Business Cards',
    tips: [
      'Design professional business cards',
      'Include on rack cards and brochures',
      'Perfect for networking events'
    ]
  }
];

const categories = [
  'All',
  'Weddings',
  'Bars & Restaurants',
  'Corporate Events',
  'Festivals & Fairs',
  'Private Parties',
  'Hotels & Venues',
  'Catering',
  'Food Trucks',
  'Social Media',
  'Email Marketing',
  'Websites',
  'YouTube',
  'Business Cards'
];

export default function ToolkitContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Search and Filter Section */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              What are you looking for?
            </h2>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search applications (e.g., weddings, bars, social media)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 rounded-xl"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full ${
                    selectedCategory === category
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>

            <p className="text-center text-gray-600 dark:text-gray-400">
              Showing {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </div>
        </div>
      </section>

      {/* Applications Grid */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredApplications.map((app, index) => (
                <ApplicationCard
                  key={index}
                  title={app.title}
                  description={app.description}
                  icon={app.icon}
                  category={app.category}
                  tips={app.tips}
                />
              ))}
            </div>

            {filteredApplications.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No applications found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search terms or category filter.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}