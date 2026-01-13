import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { StickyCTA } from '@/components/tipjar/StickyCTA';
import {
  Palette,
  Image as ImageIcon,
  Video,
  Type,
  Sparkles,
  Layers,
  Globe,
  Code,
  Eye,
  Settings,
  CheckCircle,
  ArrowRight,
  Zap,
  Music,
  DollarSign,
  MessageSquare,
  QrCode,
  Smartphone,
  BarChart3,
  Shield,
  TrendingUp,
  Wand2,
  Paintbrush,
  Layout,
  FileText,
  Link2,
  Camera,
  Film,
  Circle,
  Square,
  Triangle,
  Waves,
  Sun,
  Moon,
  Monitor,
  Upload
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Complete Customization Guide | Customize Your TipJar Page | TipJar.Live',
  description: 'Complete guide to customizing your TipJar page. From colors and fonts to backgrounds and branding—discover the extensive customization options available to make your TipJar page uniquely yours.',
  keywords: [
    'TipJar customization',
    'custom tip jar page',
    'DJ page customization',
    'tip jar branding',
    'custom tip jar design',
    'white label tip jar',
    'custom tip jar colors',
    'tip jar page design'
  ],
};

export default function CustomizationPage() {
  const customizationCategories = [
    {
      title: 'Header & Branding',
      icon: <Layout className="w-6 h-6" />,
      features: [
        {
          name: 'Custom Logo',
          description: 'Upload your logo to replace the default TipJar branding. Perfect for white-label customization.',
          tier: 'Pro+',
          details: [
            'PNG, JPG, or SVG format',
            'Recommended: 200x200px minimum',
            'Transparent background supported',
            'Auto-scales to fit header'
          ]
        },
        {
          name: 'Artist/Display Name',
          description: 'Customize the main heading that appears at the top of your page. Use your DJ name, brand, or event title.',
          tier: 'All Plans',
          details: [
            '40+ font options available',
            'Text transform (uppercase, lowercase, none)',
            'Custom colors',
            'Text shadows and outlines',
            'Letter spacing (kerning) control'
          ]
        },
        {
          name: 'Location & Subtitle',
          description: 'Display your location, venue name, or custom subtitle text below your artist name.',
          tier: 'All Plans',
          details: [
            'Show/hide subtitle',
            'Location (city/state)',
            'Venue name',
            'Custom text',
            'Independent font styling'
          ]
        },
        {
          name: 'Header Video Background',
          description: 'Upload a custom video to play in the header background. Creates a stunning, professional look.',
          tier: 'Pro+',
          details: [
            'MP4, WebM, or MOV format',
            'Auto-loops seamlessly',
            'Muted by default',
            'Responsive sizing',
            'Falls back to photo if video unavailable'
          ]
        },
        {
          name: 'Header Photo Background',
          description: 'Use a custom photo as your header background. Perfect for event photos or branded imagery.',
          tier: 'All Plans',
          details: [
            'JPG, PNG, or WebP format',
            'Auto-crops to fit',
            'Multiple photo sources (artist, venue)',
            'High-resolution support'
          ]
        },
        {
          name: 'Header Background Colors',
          description: 'Customize header background with solid colors or gradients when no video/photo is set.',
          tier: 'All Plans',
          details: [
            'Solid color option',
            'Gradient (start + end colors)',
            'Full color picker',
            'Hex color codes'
          ]
        }
      ]
    },
    {
      title: 'Typography & Text Styling',
      icon: <Type className="w-6 h-6" />,
      features: [
        {
          name: '40+ Font Options',
          description: 'Choose from a massive selection of professional fonts including sans-serif, serif, and monospace options.',
          tier: 'All Plans',
          details: [
            'Bold fonts: Impact, Bebas Neue, Anton',
            'Modern fonts: Montserrat, Poppins, Inter',
            'Elegant serifs: Playfair Display, Lora',
            'Condensed: Oswald, Space Grotesk',
            'Monospace: Fira Code, Roboto Mono'
          ]
        },
        {
          name: 'Text Transform',
          description: 'Control how your text appears: uppercase, lowercase, or natural case.',
          tier: 'All Plans',
          details: [
            'Uppercase (all caps)',
            'Lowercase',
            'None (natural case)',
            'Applied to artist name and subtitle independently'
          ]
        },
        {
          name: 'Text Shadows & Outlines',
          description: 'Add professional text effects with customizable shadows and stroke outlines.',
          tier: 'All Plans',
          details: [
            'Drop shadows (X, Y, blur, color)',
            'Text stroke/outline (width, color)',
            'Combined effects',
            'Full control over appearance'
          ]
        },
        {
          name: 'Letter Spacing (Kerning)',
          description: 'Adjust the spacing between letters for perfect typography control.',
          tier: 'All Plans',
          details: [
            'Pixel-level control',
            'Positive or negative values',
            'Applied independently to artist name and subtitle'
          ]
        },
        {
          name: 'Text Colors',
          description: 'Customize text colors for artist name, subtitle, and all page elements.',
          tier: 'All Plans',
          details: [
            'Full color picker',
            'Hex color codes',
            'Independent colors for each element',
            'High contrast options'
          ]
        }
      ]
    },
    {
      title: 'Backgrounds & Visual Effects',
      icon: <Layers className="w-6 h-6" />,
      features: [
        {
          name: '9 Animated Background Types',
          description: 'Choose from stunning animated backgrounds that create visual interest without being distracting.',
          tier: 'All Plans',
          details: [
            'Gradient - Smooth color transitions',
            'Subtle - Minimal, elegant animation',
            'Aurora - Northern lights effect',
            'Smoke - Wispy, atmospheric',
            'Smooth Spiral - Flowing spiral patterns',
            'Vortex - Dynamic swirling effect',
            'Fireflies - Twinkling light particles',
            'Wavy - Customizable wave animations',
            'None - Solid color background'
          ]
        },
        {
          name: 'Wavy Background Configuration',
          description: 'Advanced customization for the wavy background animation with full control over appearance.',
          tier: 'All Plans',
          details: [
            '5 customizable wave colors',
            'Wave width/thickness control',
            'Background fill color',
            'Blur intensity (0-100)',
            'Animation speed (slow/fast)',
            'Wave opacity (0-1)'
          ]
        },
        {
          name: 'Cover Photo Options',
          description: 'Set custom cover photos that appear when no video is set. Multiple photo sources available.',
          tier: 'All Plans',
          details: [
            'Primary cover photo',
            'Artist photo (fallback)',
            'Venue photo (fallback)',
            'Photo history tracking',
            'Auto-fallback system'
          ]
        },
        {
          name: 'Theme Mode',
          description: 'Control light/dark mode appearance or let it follow system preferences.',
          tier: 'All Plans',
          details: [
            'Light mode',
            'Dark mode',
            'System preference (auto)',
            'Consistent across all devices'
          ]
        }
      ]
    },
    {
      title: 'Colors & Branding',
      icon: <Palette className="w-6 h-6" />,
      features: [
        {
          name: 'Accent Color',
          description: 'Your primary brand color used throughout the page for buttons, links, and highlights.',
          tier: 'All Plans',
          details: [
            'Full color picker',
            'Preset color options',
            'Hex color code input',
            'Live preview',
            'Applied to all interactive elements'
          ]
        },
        {
          name: 'White-Label Branding',
          description: 'Complete brand customization with custom logo, colors, fonts, and favicon. Remove all TipJar branding.',
          tier: 'Embed Pro',
          details: [
            'Custom logo upload',
            'Custom favicon',
            'Primary, secondary, background, text colors',
            'Custom font family',
            'Remove "Powered by TipJar" badge',
            'Complete brand control'
          ]
        },
        {
          name: 'Secondary Brand Colors',
          description: 'Additional color options for borders, shadows, highlights, and secondary elements.',
          tier: 'Pro+',
          details: [
            'Secondary color 1',
            'Secondary color 2',
            'Full color picker',
            'Used for accents and highlights'
          ]
        },
        {
          name: 'Button Styles',
          description: 'Choose between gradient or flat button styles to match your brand aesthetic.',
          tier: 'All Plans',
          details: [
            'Gradient buttons (default)',
            'Flat/solid buttons',
            'Consistent across all buttons',
            'Matches accent color'
          ]
        }
      ]
    },
    {
      title: 'Content & Text Customization',
      icon: <FileText className="w-6 h-6" />,
      features: [
        {
          name: 'All Labels & Text Fields',
          description: 'Customize every piece of text on your page to match your voice and brand.',
          tier: 'All Plans',
          details: [
            'Main heading text',
            'Song request label',
            'Shoutout label',
            'Form field labels',
            'Placeholder text',
            'Help text',
            'Button text',
            'Step indicators',
            'And 20+ more text fields'
          ]
        },
        {
          name: 'Welcome Message',
          description: 'Customize the welcome message that greets guests when they visit your page.',
          tier: 'All Plans',
          details: [
            'Personalized greeting',
            'Event-specific messaging',
            'Brand voice customization',
            'Multi-line support'
          ]
        },
        {
          name: 'SEO & Meta Tags',
          description: 'Customize page title and description for better search engine optimization.',
          tier: 'All Plans',
          details: [
            'Custom page title',
            'Meta description',
            'SEO optimization',
            'Social media previews'
          ]
        }
      ]
    },
    {
      title: 'Advanced Customization',
      icon: <Code className="w-6 h-6" />,
      features: [
        {
          name: 'Custom CSS',
          description: 'Complete design freedom with custom CSS injection. Style every element exactly how you want.',
          tier: 'Embed Pro',
          details: [
            'Full CSS support',
            'Override any style',
            'Custom animations',
            'Advanced layouts',
            'Complete design control'
          ]
        },
        {
          name: 'Custom Domain',
          description: 'Use your own domain name for your TipJar page. Professional, branded URLs.',
          tier: 'Embed Pro',
          details: [
            'Custom domain setup',
            'SSL certificate included',
            'Branded URLs',
            'Professional appearance'
          ]
        },
        {
          name: 'API Access',
          description: 'Full API access for custom integrations and advanced workflows.',
          tier: 'Embed Pro',
          details: [
            'REST API access',
            'Webhook support',
            'Custom integrations',
            'Advanced automation'
          ]
        }
      ]
    },
    {
      title: 'Feature Customization',
      icon: <Settings className="w-6 h-6" />,
      features: [
        {
          name: 'Payment Amount Presets',
          description: 'Customize the preset tip amounts that appear on your page.',
          tier: 'All Plans',
          details: [
            '4 customizable preset amounts',
            'Sort order (ascending/descending)',
            'Default selected amount',
            'Minimum amount setting'
          ]
        },
        {
          name: 'Priority Options',
          description: 'Enable and customize Fast-Track and Next Song priority options with custom pricing.',
          tier: 'All Plans',
          details: [
            'Fast-Track option (play next)',
            'Next Song option (play immediately)',
            'Custom pricing for each',
            'Show/hide toggles'
          ]
        },
        {
          name: 'Bundle Discounts',
          description: 'Enable bundle discounts to encourage multiple requests with special pricing.',
          tier: 'All Plans',
          details: [
            'Show/hide toggle',
            'Configurable discount rules',
            'Increase average transaction value'
          ]
        },
        {
          name: 'Social Media Links',
          description: 'Add social media links that appear on your page. Connect all your platforms.',
          tier: 'All Plans',
          details: [
            'Facebook, Instagram, Twitter/X',
            'YouTube, TikTok, LinkedIn',
            'Snapchat, Pinterest',
            'Custom links',
            'Custom labels',
            'Show/hide individual links',
            'Custom ordering'
          ]
        },
        {
          name: 'Feature Toggles',
          description: 'Show or hide specific features to customize the guest experience.',
          tier: 'All Plans',
          details: [
            'Audio upload option',
            'Fast-Track option',
            'Next Song option',
            'Bundle discounts',
            'Individual feature control'
          ]
        }
      ]
    }
  ];

  const pricingTiers = [
    {
      name: 'Free Forever',
      customization: [
        'Accent color',
        'Basic fonts',
        'Text customization',
        'Animated backgrounds',
        'Cover photos',
        'Content labels',
        'Feature toggles'
      ]
    },
    {
      name: 'Pro ($29/month)',
      customization: [
        'Everything in Free',
        'Custom logo',
        'Header video backgrounds',
        'Secondary brand colors',
        'Advanced typography',
        'Social media links',
        'Priority options customization'
      ]
    },
    {
      name: 'Embed Pro ($49/month)',
      customization: [
        'Everything in Pro',
        'White-label branding',
        'Custom CSS',
        'Custom domain',
        'Remove TipJar branding',
        'API access',
        'Complete design freedom'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Wand2 className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">Complete Customization Control</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Make It<br />
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
                Uniquely Yours
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-emerald-50 mb-8 leading-relaxed max-w-3xl mx-auto">
              From colors and fonts to backgrounds and branding—discover the extensive customization options that let you create a TipJar page that perfectly matches your brand.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                asChild
                className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all"
              >
                <Link href="/signup">
                  Start Customizing
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 h-auto"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">40+ Font Options</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">9 Background Types</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Unlimited Colors</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Custom CSS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customization Categories */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              Complete Customization Control
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Every aspect of your TipJar page can be customized to match your brand
            </p>
          </div>

          <div className="max-w-7xl mx-auto space-y-16">
            {customizationCategories.map((category, categoryIdx) => (
              <div key={categoryIdx} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {category.features.length} customization options
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {category.features.map((feature, featureIdx) => (
                    <div 
                      key={featureIdx}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                              {feature.name}
                            </h4>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              feature.tier === 'All Plans' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : feature.tier === 'Pro+'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {feature.tier}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      
                      <ul className="space-y-2">
                        {feature.details.map((detail, detailIdx) => (
                          <li key={detailIdx} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Examples Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Real examples of customized TipJar pages
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="w-full h-48 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 rounded-xl mb-6 flex items-center justify-center">
                <Music className="w-16 h-16 text-white opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Bold & Vibrant
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Bright colors, animated gradients, and bold typography create an energetic, party-ready vibe.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="w-full h-48 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
                  backgroundSize: '20px 20px'
                }} />
                <Sparkles className="w-16 h-16 text-white opacity-60" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Elegant & Professional
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Dark themes, subtle animations, and refined typography for sophisticated, upscale events.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="w-full h-48 bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-400 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                <Waves className="w-16 h-16 text-white opacity-70" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Modern & Clean
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Minimalist design with custom fonts, wavy backgrounds, and clean layouts for a contemporary look.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customization by Plan */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              Customization by Plan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what customization options are available in each plan
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, tierIdx) => (
              <div 
                key={tierIdx}
                className={`rounded-2xl p-8 border-2 ${
                  tierIdx === 2
                    ? 'bg-gradient-to-br from-emerald-600 to-green-500 text-white border-emerald-300 shadow-2xl'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <h3 className={`text-2xl font-bold mb-2 ${
                  tierIdx === 2 ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {tier.name}
                </h3>
                <p className={`text-sm mb-6 ${
                  tierIdx === 2 ? 'text-emerald-50' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {tier.customization.length} customization options
                </p>
                
                <ul className="space-y-3">
                  {tier.customization.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start">
                      <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${
                        tierIdx === 2 ? 'text-white' : 'text-green-500'
                      }`} />
                      <span className={`text-sm ${
                        tierIdx === 2 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Highlight */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 border border-emerald-200 dark:border-emerald-800 shadow-xl">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <Code className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Custom CSS (Embed Pro)
                    </h3>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      Embed Pro Only
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    For complete design freedom, Embed Pro includes custom CSS support. Style every element exactly how you want with full CSS control.
                  </p>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Override any default style</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Add custom animations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Create advanced layouts</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Complete design control</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Showcase */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              40+ Professional Fonts
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choose from an extensive collection of Google Fonts
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                Bold & Condensed
              </h4>
              <div className="space-y-4">
                <div style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Impact
                </div>
                <div style={{ fontFamily: '"Oswald", sans-serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Oswald
                </div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Bebas Neue
                </div>
                <div style={{ fontFamily: '"Anton", sans-serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Anton
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                Modern & Clean
              </h4>
              <div className="space-y-4">
                <div style={{ fontFamily: '"Montserrat", sans-serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Montserrat
                </div>
                <div style={{ fontFamily: '"Poppins", sans-serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Poppins
                </div>
                <div style={{ fontFamily: '"Inter", sans-serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Inter
                </div>
                <div style={{ fontFamily: '"Roboto", sans-serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Roboto
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                Elegant Serifs
              </h4>
              <div className="space-y-4">
                <div style={{ fontFamily: '"Playfair Display", serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Playfair Display
                </div>
                <div style={{ fontFamily: '"Lora", serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Lora
                </div>
                <div style={{ fontFamily: '"Merriweather", serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Merriweather
                </div>
                <div style={{ fontFamily: '"Libre Baskerville", serif' }} className="text-2xl font-bold text-gray-900 dark:text-white">
                  Libre Baskerville
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 dark:text-gray-400">
              Plus 30+ more fonts including monospace, condensed, and decorative options
            </p>
          </div>
        </div>
      </section>

      {/* Background Types Showcase */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              9 Animated Background Types
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choose from stunning animated backgrounds that create visual interest
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              { name: 'Gradient', description: 'Smooth color transitions', color: 'from-purple-500 to-pink-500' },
              { name: 'Aurora', description: 'Northern lights effect', color: 'from-green-400 to-blue-500' },
              { name: 'Smoke', description: 'Wispy, atmospheric', color: 'from-gray-400 to-gray-600' },
              { name: 'Smooth Spiral', description: 'Flowing spiral patterns', color: 'from-cyan-400 to-blue-500' },
              { name: 'Vortex', description: 'Dynamic swirling effect', color: 'from-purple-600 to-indigo-600' },
              { name: 'Fireflies', description: 'Twinkling light particles', color: 'from-yellow-400 to-orange-500' },
              { name: 'Wavy', description: 'Customizable wave animations', color: 'from-blue-400 to-cyan-400' },
              { name: 'Subtle', description: 'Minimal, elegant animation', color: 'from-gray-300 to-gray-500' },
              { name: 'None', description: 'Solid color background', color: 'from-gray-200 to-gray-300' },
            ].map((bg, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
              >
                <div className={`w-full h-32 bg-gradient-to-br ${bg.color} rounded-lg mb-4 flex items-center justify-center`}>
                  <Sparkles className="w-8 h-8 text-white opacity-70" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {bg.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {bg.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customization Process */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              How to Customize
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Simple, intuitive customization process
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {[
              {
                step: 1,
                title: 'Access Customization Settings',
                description: 'Go to your dashboard and click "Customize Page" to access all customization options.',
                icon: <Settings className="w-8 h-8" />
              },
              {
                step: 2,
                title: 'Choose Your Style',
                description: 'Start with colors, fonts, and backgrounds. See live previews as you make changes.',
                icon: <Palette className="w-8 h-8" />
              },
              {
                step: 3,
                title: 'Upload Your Assets',
                description: 'Add your logo, cover photos, or video backgrounds. All formats supported.',
                icon: <Upload className="w-8 h-8" />
              },
              {
                step: 4,
                title: 'Customize Content',
                description: 'Edit all text, labels, and messages to match your voice and brand.',
                icon: <FileText className="w-8 h-8" />
              },
              {
                step: 5,
                title: 'Preview & Publish',
                description: 'Preview on mobile, tablet, and desktop. Save when you\'re happy with the result.',
                icon: <Eye className="w-8 h-8" />
              }
            ].map((step, idx) => (
              <div 
                key={idx}
                className="flex flex-col md:flex-row gap-6 items-start bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    {step.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">STEP {step.step}</span>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Create Your Perfect Page?
            </h2>
            <p className="text-xl md:text-2xl text-emerald-50 mb-10 leading-relaxed">
              Start customizing your TipJar page today. No credit card required. Full customization control from day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                asChild
                className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-10 py-7 h-auto shadow-2xl hover:shadow-3xl transition-all"
              >
                <Link href="/signup">
                  Start Customizing
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-10 py-7 h-auto"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-emerald-50">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Full customization control</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <TipJarFooter />
      <StickyCTA />
    </div>
  );
}
