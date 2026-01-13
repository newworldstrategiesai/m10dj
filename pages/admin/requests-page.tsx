'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminPageLayout from '@/components/layouts/AdminPageLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  CheckCircle, 
  ExternalLink, 
  Plus, 
  Trash2,
  Upload,
  X,
  Eye,
  Globe,
  Music,
  Settings,
  ArrowUp,
  ArrowDown,
  Type,
  ToggleLeft,
  Search,
  FileText,
  Palette,
  DollarSign,
  Sparkles,
  Video,
  Link as LinkIcon,
  MessageCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ImageUploadInput from '@/components/admin/ImageUploadInput';
import VideoUploadInput from '@/components/admin/VideoUploadInput';
import Link from 'next/link';
import FontSelect, { FontOption } from '@/components/ui/font-select';

interface SocialLink {
  platform: string;
  url: string;
  label: string;
  enabled: boolean;
  order: number;
}

const SUPPORTED_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'snapchat', label: 'Snapchat', icon: '👻' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' },
  { value: 'custom', label: 'Custom Link', icon: '🔗' },
];

const FONT_OPTIONS: FontOption[] = [
  { value: 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif', label: 'Impact (Bold)' },
  { value: '"Arial Black", Arial, sans-serif', label: 'Arial Black' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica Neue' },
  { value: '"Oswald", sans-serif', label: 'Oswald (Condensed)' },
  { value: '"Montserrat", sans-serif', label: 'Montserrat' },
  { value: '"Poppins", sans-serif', label: 'Poppins' },
  { value: '"Roboto", sans-serif', label: 'Roboto' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: '"Lato", sans-serif', label: 'Lato' },
  { value: '"Nunito", sans-serif', label: 'Nunito' },
  { value: '"Ubuntu", sans-serif', label: 'Ubuntu' },
  { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro' },
  { value: '"Inter", sans-serif', label: 'Inter' },
  { value: '"Work Sans", sans-serif', label: 'Work Sans' },
  { value: '"DM Sans", sans-serif', label: 'DM Sans' },
  { value: '"Space Grotesk", sans-serif', label: 'Space Grotesk' },
  { value: '"Bebas Neue", sans-serif', label: 'Bebas Neue (Bold)' },
  { value: '"Anton", sans-serif', label: 'Anton (Condensed)' },
  { value: '"Raleway", sans-serif', label: 'Raleway' },
  { value: '"PT Sans", sans-serif', label: 'PT Sans' },
  { value: '"Josefin Sans", sans-serif', label: 'Josefin Sans' },
  { value: '"Libre Franklin", sans-serif', label: 'Libre Franklin' },
  { value: '"Quicksand", sans-serif', label: 'Quicksand' },
  { value: '"Rubik", sans-serif', label: 'Rubik' },
  { value: '"Fira Sans", sans-serif', label: 'Fira Sans' },
  { value: '"Manrope", sans-serif', label: 'Manrope' },
  { value: '"Comfortaa", sans-serif', label: 'Comfortaa' },
  { value: '"Kanit", sans-serif', label: 'Kanit' },
  { value: '"Titillium Web", sans-serif', label: 'Titillium Web' },
  { value: '"Muli", sans-serif', label: 'Muli' },
  { value: '"Exo 2", sans-serif', label: 'Exo 2' },
  { value: '"Rajdhani", sans-serif', label: 'Rajdhani (Condensed)' },
  { value: '"Orbitron", sans-serif', label: 'Orbitron (Futuristic)' },
  { value: '"Righteous", sans-serif', label: 'Righteous' },
  { value: '"Fredoka One", sans-serif', label: 'Fredoka One' },
  { value: '"Bungee", sans-serif', label: 'Bungee' },
  { value: '"Russo One", sans-serif', label: 'Russo One' },
  { value: '"Playfair Display", serif', label: 'Playfair Display (Elegant)' },
  { value: '"Lora", serif', label: 'Lora (Serif)' },
  { value: '"Merriweather", serif', label: 'Merriweather (Serif)' },
  { value: '"Libre Baskerville", serif', label: 'Libre Baskerville (Serif)' },
  { value: '"Crimson Text", serif', label: 'Crimson Text (Serif)' },
  { value: '"Georgia", serif', label: 'Georgia (Serif)' },
  { value: '"PT Serif", serif', label: 'PT Serif' },
  { value: '"Bitter", serif', label: 'Bitter (Serif)' },
  { value: '"Arvo", serif', label: 'Arvo (Serif)' },
  { value: '"Courier New", monospace', label: 'Courier New (Monospace)' },
  { value: '"Space Mono", monospace', label: 'Space Mono (Monospace)' },
  { value: '"Roboto Mono", monospace', label: 'Roboto Mono (Monospace)' },
  { value: '"Fira Code", monospace', label: 'Fira Code (Monospace)' },
];

export default function RequestsPageSettings() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [originalSlug, setOriginalSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'payments' | 'features' | 'assistant' | 'advanced'>('design');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [biddingEnabled, setBiddingEnabled] = useState(false);
  const [minimumBid, setMinimumBid] = useState(500); // In cents
  const [startingBid, setStartingBid] = useState(500); // In cents - default starting bid (never $0)
  
  // Payment amount settings
  const [minimumAmount, setMinimumAmount] = useState(1000); // In cents, default $10
  const [presetAmounts, setPresetAmounts] = useState([1000, 1500, 2000, 2500]); // In cents
  const [amountsSortOrder, setAmountsSortOrder] = useState<'desc' | 'asc'>('desc');
  const [defaultPresetAmount, setDefaultPresetAmount] = useState<number | null>(null); // In cents, null means use max preset
  
  // Priority placement fees
  const [fastTrackFee, setFastTrackFee] = useState(1000); // In cents, default $10
  const [nextFee, setNextFee] = useState(2000); // In cents, default $20
  
  const [coverPhotos, setCoverPhotos] = useState({
    requests_cover_photo_url: '',
    requests_artist_photo_url: '',
    requests_venue_photo_url: '',
    requests_header_video_url: ''
  });
  
  // Custom header logo (premium feature)
  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [canCustomizeHeaderLogo, setCanCustomizeHeaderLogo] = useState(false);
  
  // Accent color customization (available to all users)
  // Default to TipJar green, will be updated when organization loads
  const [accentColor, setAccentColor] = useState('#10b981');
  
  // Secondary brand colors (optional - used for borders, shadows, highlights, etc.)
  const [secondaryColor1, setSecondaryColor1] = useState<string | null>(null);
  const [secondaryColor2, setSecondaryColor2] = useState<string | null>(null);
  
  // Theme mode (light/dark/system)
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('dark');
  
  // Button style (gradient/flat)
  const [buttonStyle, setButtonStyle] = useState<'gradient' | 'flat'>('gradient');
  
  // Payment usernames for tips section
  const [cashAppTag, setCashAppTag] = useState('');
  const [venmoUsername, setVenmoUsername] = useState('');
  const [venmoPhoneNumber, setVenmoPhoneNumber] = useState('');
  
  // Payment method enabled settings
  const [paymentMethodEnabled, setPaymentMethodEnabled] = useState({
    card: true,
    cashapp: true,
    venmo: true
  });
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  
  // Header fields
  const [headerFields, setHeaderFields] = useState({
    requests_header_artist_name: '',
    requests_header_location: '',
    requests_header_date: '',
    requests_main_heading: ''
  });
  
  // Label and text fields
  const [labelFields, setLabelFields] = useState({
    requests_song_request_label: '',
    requests_shoutout_label: '',
    requests_song_title_label: '',
    requests_song_title_placeholder: '',
    requests_artist_name_label: '',
    requests_artist_name_placeholder: '',
    requests_recipient_name_label: '',
    requests_recipient_name_placeholder: '',
    requests_message_label: '',
    requests_message_placeholder: '',
    requests_music_link_label: '',
    requests_music_link_placeholder: '',
    requests_music_link_help_text: '',
    requests_manual_entry_divider: '',
    requests_start_over_text: '',
    requests_audio_upload_label: '',
    requests_audio_upload_description: '',
    requests_artist_rights_text: '',
    requests_is_artist_text: '',
    requests_audio_fee_text: '',
    requests_submit_button_text: '',
    requests_step_1_text: '',
    requests_step_2_text: ''
  });
  
  // Show artist name over video header toggle
  const [showArtistNameOverVideo, setShowArtistNameOverVideo] = useState(true);
  
  // Show subtitle (location) toggle
  const [showSubtitle, setShowSubtitle] = useState(true);
  
  // Subtitle type: 'location' (city/state), 'venue', or 'custom'
  const [subtitleType, setSubtitleType] = useState<'location' | 'venue' | 'custom'>('location');
  
  // Venue name for subtitle
  const [subtitleVenue, setSubtitleVenue] = useState('');
  
  // Custom subtitle text
  const [subtitleCustomText, setSubtitleCustomText] = useState('');
  
  // Flag to track if subtitle font was manually changed (if false, use artist name font)
  const [subtitleFontManuallyChanged, setSubtitleFontManuallyChanged] = useState(false);
  
  // Background type (gradient, subtle, bubble, spiral, aurora, smoke, smooth-spiral, none)
  const [backgroundType, setBackgroundType] = useState<'gradient' | 'subtle' | 'aurora' | 'smoke' | 'smooth-spiral' | 'vortex' | 'fireflies' | 'wavy' | 'none'>('gradient');
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  
  // Wavy background configuration
  const [wavyColors, setWavyColors] = useState<string[]>(['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee']);
  const [wavyWaveWidth, setWavyWaveWidth] = useState(50);
  const [wavyBackgroundFill, setWavyBackgroundFill] = useState('black');
  const [wavyBlur, setWavyBlur] = useState(10);
  const [wavySpeed, setWavySpeed] = useState<'slow' | 'fast'>('fast');
  const [wavyWaveOpacity, setWavyWaveOpacity] = useState(0.5);
  
  // Header background color settings
  const [headerBackgroundType, setHeaderBackgroundType] = useState<'solid' | 'gradient'>('solid');
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState('#000000'); // Default black
  const [headerBackgroundGradientStart, setHeaderBackgroundGradientStart] = useState('#000000');
  const [headerBackgroundGradientEnd, setHeaderBackgroundGradientEnd] = useState('#1a1a1a');
  
  // Artist name font
  const [artistNameFont, setArtistNameFont] = useState('Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif');
  
  // Artist name text transform
  const [artistNameTextTransform, setArtistNameTextTransform] = useState<'uppercase' | 'lowercase' | 'none'>('uppercase');
  
  // Artist name stroke (outline) controls
  const [artistNameStrokeEnabled, setArtistNameStrokeEnabled] = useState(false);
  const [artistNameStrokeWidth, setArtistNameStrokeWidth] = useState(2);
  const [artistNameStrokeColor, setArtistNameStrokeColor] = useState('#000000');
  
  // Artist name drop shadow controls
  const [artistNameShadowEnabled, setArtistNameShadowEnabled] = useState(true);
  const [artistNameShadowXOffset, setArtistNameShadowXOffset] = useState(3);
  const [artistNameShadowYOffset, setArtistNameShadowYOffset] = useState(3);
  const [artistNameShadowBlur, setArtistNameShadowBlur] = useState(6);
  const [artistNameShadowColor, setArtistNameShadowColor] = useState('rgba(0, 0, 0, 0.8)');
  
  // Artist name color
  const [artistNameColor, setArtistNameColor] = useState('#ffffff');
  
  // Artist name kerning (letter-spacing)
  const [artistNameKerning, setArtistNameKerning] = useState(0); // In pixels
  
  // Subtitle (location) font - defaults to artist name font unless manually changed
  const [subtitleFont, setSubtitleFont] = useState('Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif');
  
  // Computed subtitle font - uses artist name font by default unless manually changed
  const effectiveSubtitleFont = subtitleFontManuallyChanged ? subtitleFont : artistNameFont;
  
  // Subtitle text transform
  const [subtitleTextTransform, setSubtitleTextTransform] = useState<'uppercase' | 'lowercase' | 'none'>('none');
  
  // Subtitle stroke (outline) controls
  const [subtitleStrokeEnabled, setSubtitleStrokeEnabled] = useState(false);
  const [subtitleStrokeWidth, setSubtitleStrokeWidth] = useState(2);
  const [subtitleStrokeColor, setSubtitleStrokeColor] = useState('#000000');
  
  // Subtitle drop shadow controls
  const [subtitleShadowEnabled, setSubtitleShadowEnabled] = useState(true);
  const [subtitleShadowXOffset, setSubtitleShadowXOffset] = useState(3);
  const [subtitleShadowYOffset, setSubtitleShadowYOffset] = useState(3);
  const [subtitleShadowBlur, setSubtitleShadowBlur] = useState(6);
  const [subtitleShadowColor, setSubtitleShadowColor] = useState('rgba(0, 0, 0, 0.8)');
  
  // Subtitle color
  const [subtitleColor, setSubtitleColor] = useState('#ffffff');
  
  // Subtitle kerning (letter-spacing)
  const [subtitleKerning, setSubtitleKerning] = useState(0); // In pixels
  
  // Feature toggles
  const [featureToggles, setFeatureToggles] = useState({
    requests_show_audio_upload: true,
    requests_show_fast_track: true,
    requests_show_next_song: true,
    requests_show_bundle_discount: true
  });

  // Assistant settings
  const [assistantEnabled, setAssistantEnabled] = useState(true);
  const [assistantCustomPrompt, setAssistantCustomPrompt] = useState('');
  const [assistantFunctions, setAssistantFunctions] = useState({
    enable_user_status: true,
    enable_all_requests: true,
    enable_queue: true,
    enable_played: true,
    enable_popular: true,
    enable_count: true,
    enable_search: true
  });
  const [assistantQuickActions, setAssistantQuickActions] = useState({
    show_quick_actions: true,
    quick_action_has_played: true,
    quick_action_when_will_play: true
  });
  
  // SEO fields
  const [seoFields, setSeoFields] = useState({
    requests_page_title: '',
    requests_page_description: '',
    requests_default_request_type: 'song_request' as 'song_request' | 'shoutout'
  });

  // Helper function to generate text-shadow outline effect (preserves fill color)
  const generateTextShadowOutline = (strokeEnabled: boolean, strokeWidth: number, strokeColor: string, shadowEnabled: boolean, shadowX: number, shadowY: number, shadowBlur: number, shadowColor: string) => {
    const shadows: string[] = [];
    
    // If stroke is enabled, create outline using multiple text-shadows in all directions
    if (strokeEnabled && strokeWidth > 0) {
      const outlineShadows: string[] = [];
      // Create shadows in 8 directions (every 45 degrees) plus intermediate positions for smoother outline
      const directions: { x: number; y: number }[] = [
        { x: 0, y: -strokeWidth },      // top
        { x: strokeWidth, y: -strokeWidth }, // top-right
        { x: strokeWidth, y: 0 },       // right
        { x: strokeWidth, y: strokeWidth },  // bottom-right
        { x: 0, y: strokeWidth },       // bottom
        { x: -strokeWidth, y: strokeWidth }, // bottom-left
        { x: -strokeWidth, y: 0 },      // left
        { x: -strokeWidth, y: -strokeWidth }, // top-left
      ];
      
      // Add more directions for thicker strokes (every 30 degrees for strokeWidth >= 3)
      if (strokeWidth >= 3) {
        const angle45 = Math.PI / 4;
        directions.push(
          { x: Math.round(Math.cos(angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 2 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 2 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 3 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 3 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 4 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 4 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 5 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 5 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 6 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 6 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 7 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 7 + angle45 / 2) * strokeWidth) }
        );
      }
      
      directions.forEach(dir => {
        outlineShadows.push(`${dir.x}px ${dir.y}px 0 ${strokeColor}`);
      });
      shadows.push(...outlineShadows);
    }
    
    // Add regular shadow if enabled (and not overridden by stroke outline)
    if (shadowEnabled && (shadows.length === 0 || !strokeEnabled)) {
      shadows.push(`${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`);
    } else if (shadowEnabled && strokeEnabled) {
      // If both stroke and shadow are enabled, add shadow after outline (on top)
      shadows.push(`${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`);
    }
    
    return shadows.length > 0 ? shadows.join(', ') : 'none';
  };

  // Generate text-shadow for previews
  const artistNameTextShadow = generateTextShadowOutline(
    artistNameStrokeEnabled,
    artistNameStrokeWidth,
    artistNameStrokeColor,
    artistNameShadowEnabled,
    artistNameShadowXOffset,
    artistNameShadowYOffset,
    artistNameShadowBlur,
    artistNameShadowColor
  );

  const subtitleTextShadow = generateTextShadowOutline(
    subtitleStrokeEnabled,
    subtitleStrokeWidth,
    subtitleStrokeColor,
    subtitleShadowEnabled,
    subtitleShadowXOffset,
    subtitleShadowYOffset,
    subtitleShadowBlur,
    subtitleShadowColor
  );

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  // Load all Google Fonts for dropdown preview
  useEffect(() => {
    const fontFamilies = [
      'Oswald:wght@400;500;600;700',
      'Montserrat:wght@400;500;600;700;800;900',
      'Poppins:wght@400;500;600;700;800;900',
      'Roboto:wght@400;500;700;900',
      'Open+Sans:wght@400;600;700;800',
      'Lato:wght@400;700;900',
      'Nunito:wght@400;600;700;800;900',
      'Ubuntu:wght@400;500;700',
      'Source+Sans+Pro:wght@400;600;700;900',
      'Inter:wght@400;500;600;700;800;900',
      'Work+Sans:wght@400;500;600;700;800;900',
      'DM+Sans:wght@400;500;700',
      'Space+Grotesk:wght@400;500;600;700',
      'Bebas+Neue',
      'Anton',
      'Raleway:wght@400;500;600;700;800;900',
      'PT+Sans:wght@400;700',
      'Josefin+Sans:wght@400;600;700',
      'Libre+Franklin:wght@400;600;700;800;900',
      'Quicksand:wght@400;500;600;700',
      'Rubik:wght@400;500;700;900',
      'Fira+Sans:wght@400;500;600;700;800;900',
      'Manrope:wght@400;500;600;700;800',
      'Comfortaa:wght@400;500;600;700',
      'Kanit:wght@400;500;600;700;800;900',
      'Titillium+Web:wght@400;600;700;900',
      'Muli:wght@400;600;700;800;900',
      'Exo+2:wght@400;500;600;700;800;900',
      'Rajdhani:wght@400;500;600;700',
      'Orbitron:wght@400;500;600;700;800;900',
      'Righteous',
      'Fredoka+One',
      'Bungee',
      'Russo+One',
      'Playfair+Display:wght@400;500;600;700;800;900',
      'Lora:wght@400;500;600;700',
      'Merriweather:wght@400;700;900',
      'Libre+Baskerville:wght@400;700',
      'Crimson+Text:wght@400;600;700',
      'PT+Serif:wght@400;700',
      'Bitter:wght@400;700;900',
      'Arvo:wght@400;700',
      'Space+Mono:wght@400;700',
      'Roboto+Mono:wght@400;500;700',
      'Fira+Code:wght@400;500;600;700',
    ];

    // Create a single link element with all fonts
    const linkId = 'google-fonts-all';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${fontFamilies.map(f => `family=${f}`).join('&')}&display=swap`;
      document.head.appendChild(link);
    }
  }, []);

  // Handle tab from URL query parameter
  useEffect(() => {
    const { tab } = router.query;
    if (tab === 'design' || tab === 'content' || tab === 'payments' || tab === 'features' || tab === 'assistant' || tab === 'advanced') {
      setActiveTab(tab as typeof activeTab);
    }
  }, [router.query]);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/signin');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/signin');
    }
  };

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (orgError && orgError.code !== 'PGRST116') {
        console.error('Error fetching organization:', orgError);
        setError('Failed to load organization');
        return;
      }

      if (org) {
        setOrganization(org);
        setOriginalSlug(org.slug || ''); // Store original slug for comparison
        setCoverPhotos({
          requests_cover_photo_url: org.requests_cover_photo_url || '',
          requests_artist_photo_url: org.requests_artist_photo_url || '',
          requests_venue_photo_url: org.requests_venue_photo_url || '',
          requests_header_video_url: org.requests_header_video_url || ''
        });
        
        // Set whether to show artist name over video (defaults to true for new users)
        setShowArtistNameOverVideo(org.requests_show_artist_name_over_video !== false);
        
        // Set whether to show subtitle (defaults to true for new users)
        setShowSubtitle(org.requests_show_subtitle !== false);
        
        // Set background type (defaults to 'gradient' for new users)
        setBackgroundType(org.requests_background_type || 'gradient');
        
        // Set wavy background configuration
        if (org.requests_wavy_colors && Array.isArray(org.requests_wavy_colors)) {
          setWavyColors(org.requests_wavy_colors);
        } else {
          setWavyColors(['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee']);
        }
        setWavyWaveWidth(org.requests_wavy_wave_width || 50);
        setWavyBackgroundFill(org.requests_wavy_background_fill || 'black');
        setWavyBlur(org.requests_wavy_blur || 10);
        setWavySpeed(org.requests_wavy_speed === 'slow' ? 'slow' : 'fast');
        setWavyWaveOpacity(org.requests_wavy_wave_opacity || 0.5);
        
        // Set header background color settings
        setHeaderBackgroundType(org.requests_header_background_type || 'solid');
        setHeaderBackgroundColor(org.requests_header_background_color || '#000000');
        setHeaderBackgroundGradientStart(org.requests_header_background_gradient_start || '#000000');
        setHeaderBackgroundGradientEnd(org.requests_header_background_gradient_end || '#1a1a1a');
        
        // Set artist name font
        setArtistNameFont(org.requests_artist_name_font || 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif');
        
        // Set artist name text transform
        setArtistNameTextTransform(org.requests_artist_name_text_transform || 'uppercase');
        
        // Set artist name stroke settings
        setArtistNameStrokeEnabled(org.requests_artist_name_stroke_enabled || false);
        setArtistNameStrokeWidth(org.requests_artist_name_stroke_width || 2);
        setArtistNameStrokeColor(org.requests_artist_name_stroke_color || '#000000');
        
        // Set artist name shadow settings
        setArtistNameShadowEnabled(org.requests_artist_name_shadow_enabled !== false); // Default to true
        setArtistNameShadowXOffset(org.requests_artist_name_shadow_x_offset || 3);
        setArtistNameShadowYOffset(org.requests_artist_name_shadow_y_offset || 3);
        setArtistNameShadowBlur(org.requests_artist_name_shadow_blur || 6);
        setArtistNameShadowColor(org.requests_artist_name_shadow_color || 'rgba(0, 0, 0, 0.8)');
        
        // Set artist name color
        setArtistNameColor(org.requests_artist_name_color || '#ffffff');
        
        // Set artist name kerning (letter-spacing)
        setArtistNameKerning(org.requests_artist_name_kerning || 0);
        
        // Set subtitle type and related fields
        setSubtitleType(org.requests_subtitle_type || 'location');
        setSubtitleVenue(org.requests_subtitle_venue || '');
        setSubtitleCustomText(org.requests_subtitle_custom_text || '');
        
        // Set subtitle font - check if it was manually changed
        const savedSubtitleFont = org.requests_subtitle_font || '';
        const savedArtistNameFont = org.requests_artist_name_font || 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif';
        const fontWasManuallyChanged = savedSubtitleFont !== '' && savedSubtitleFont !== savedArtistNameFont;
        setSubtitleFontManuallyChanged(fontWasManuallyChanged);
        setSubtitleFont(savedSubtitleFont || savedArtistNameFont);
        
        // Set subtitle text transform
        setSubtitleTextTransform(org.requests_subtitle_text_transform || 'none');
        
        // Set subtitle stroke settings
        setSubtitleStrokeEnabled(org.requests_subtitle_stroke_enabled || false);
        setSubtitleStrokeWidth(org.requests_subtitle_stroke_width || 2);
        setSubtitleStrokeColor(org.requests_subtitle_stroke_color || '#000000');
        
        // Set subtitle shadow settings
        setSubtitleShadowEnabled(org.requests_subtitle_shadow_enabled !== false); // Default to true
        setSubtitleShadowXOffset(org.requests_subtitle_shadow_x_offset || 3);
        setSubtitleShadowYOffset(org.requests_subtitle_shadow_y_offset || 3);
        setSubtitleShadowBlur(org.requests_subtitle_shadow_blur || 6);
        setSubtitleShadowColor(org.requests_subtitle_shadow_color || 'rgba(0, 0, 0, 0.8)');
        
        // Set subtitle color
        setSubtitleColor(org.requests_subtitle_color || '#ffffff');
        
        // Set subtitle kerning (letter-spacing)
        setSubtitleKerning(org.requests_subtitle_kerning || 0);
        
        // Set custom header logo settings
        setHeaderLogoUrl(org.requests_header_logo_url || '');
        setCanCustomizeHeaderLogo(org.can_customize_header_logo || false);
        
        // Set accent color - default based on product context (black for TipJar if not set)
        const defaultAccentColor = org.product_context === 'tipjar' ? '#000000' : '#fcba00';
        setAccentColor(org.requests_accent_color || defaultAccentColor);
        
        // Set secondary brand colors (optional)
        setSecondaryColor1(org.requests_secondary_color_1 || null);
        setSecondaryColor2(org.requests_secondary_color_2 || null);
        
        // Set theme mode
        setThemeMode(org.requests_theme_mode || 'dark');
        
        // Set button style
        setButtonStyle(org.requests_button_style || 'gradient');
        
        // Parse social links - if none exist, start with empty array
        // User can add their own links via the UI
        const links = org.social_links && Array.isArray(org.social_links) && org.social_links.length > 0
          ? org.social_links as SocialLink[]
          : [];
        setSocialLinks(links.sort((a, b) => (a.order || 0) - (b.order || 0)));
        
        // Set bidding settings - ensure bidding is disabled by default
        const biddingEnabledValue = org.requests_bidding_enabled === true;
        console.log('[ADMIN] Loading bidding enabled:', biddingEnabledValue, 'from:', org.requests_bidding_enabled);
        setBiddingEnabled(biddingEnabledValue);
        setMinimumBid(org.requests_bidding_minimum_bid || 500);
        setStartingBid(org.requests_bidding_starting_bid || 500); // Default to $5.00 if not set
        
        // Set payment amount settings
        setMinimumAmount(org.requests_minimum_amount || 1000);
        const presets = org.requests_preset_amounts && Array.isArray(org.requests_preset_amounts) && org.requests_preset_amounts.length > 0
          ? org.requests_preset_amounts
          : [1000, 1500, 2000, 2500];
        setPresetAmounts(presets);
        setAmountsSortOrder(org.requests_amounts_sort_order || 'desc');
        setDefaultPresetAmount(org.requests_default_preset_amount || null);
        
        // Set priority placement fees
        setFastTrackFee(org.requests_fast_track_fee || 1000);
        setNextFee(org.requests_next_fee || 2000);
        
        // Set payment usernames for tips section
        setCashAppTag(org.requests_cashapp_tag || '');
        setVenmoUsername(org.requests_venmo_username || '');
        setVenmoPhoneNumber(org.requests_venmo_phone_number || '');
        
        // Set payment method enabled settings
        // Card and CashApp (via Stripe) default to true, Venmo only enabled if username is set
        const hasVenmoUsername = !!(org.requests_venmo_username || '');
        setPaymentMethodEnabled({
          card: org.requests_payment_method_card_enabled !== false,
          cashapp: org.requests_payment_method_cashapp_enabled !== false, // CashApp goes through Stripe, doesn't need tag
          venmo: hasVenmoUsername ? (org.requests_payment_method_venmo_enabled !== false) : false
        });
        
        // Set assistant enabled setting (defaults to true for new users)
        setAssistantEnabled(org.requests_assistant_enabled !== false);
        
        // Set assistant custom prompt
        setAssistantCustomPrompt(org.requests_assistant_custom_prompt || '');
        
        // Set assistant function toggles (default to true if not set)
        setAssistantFunctions({
          enable_user_status: org.requests_assistant_enable_user_status !== false,
          enable_all_requests: org.requests_assistant_enable_all_requests !== false,
          enable_queue: org.requests_assistant_enable_queue !== false,
          enable_played: org.requests_assistant_enable_played !== false,
          enable_popular: org.requests_assistant_enable_popular !== false,
          enable_count: org.requests_assistant_enable_count !== false,
          enable_search: org.requests_assistant_enable_search !== false
        });
        
        // Set assistant quick action toggles (default to true if not set)
        setAssistantQuickActions({
          show_quick_actions: org.requests_assistant_show_quick_actions !== false,
          quick_action_has_played: org.requests_assistant_quick_action_has_played !== false,
          quick_action_when_will_play: org.requests_assistant_quick_action_when_will_play !== false
        });
        
        // Set header fields
        setHeaderFields({
          requests_header_artist_name: org.requests_header_artist_name || org.name || '',
          requests_header_location: org.requests_header_location || '',
          requests_header_date: org.requests_header_date || '',
          requests_main_heading: org.requests_main_heading || 'What would you like to request?'
        });
        
        // Set label fields (with defaults from schema)
        setLabelFields({
          requests_song_request_label: org.requests_song_request_label || 'Song Request',
          requests_shoutout_label: org.requests_shoutout_label || 'Shoutout',
          requests_song_title_label: org.requests_song_title_label || 'Song Title',
          requests_song_title_placeholder: org.requests_song_title_placeholder || 'Enter song title',
          requests_artist_name_label: org.requests_artist_name_label || 'Artist Name',
          requests_artist_name_placeholder: org.requests_artist_name_placeholder || 'Enter artist name',
          requests_recipient_name_label: org.requests_recipient_name_label || 'Recipient Name',
          requests_recipient_name_placeholder: org.requests_recipient_name_placeholder || 'Who is this shoutout for?',
          requests_message_label: org.requests_message_label || 'Message',
          requests_message_placeholder: org.requests_message_placeholder || 'What would you like to say?',
          requests_music_link_label: org.requests_music_link_label || 'Paste Music Link (Optional)',
          requests_music_link_placeholder: org.requests_music_link_placeholder || 'Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link',
          requests_music_link_help_text: org.requests_music_link_help_text || "We'll automatically fill in the song title and artist name",
          requests_manual_entry_divider: org.requests_manual_entry_divider || 'Or enter manually',
          requests_start_over_text: org.requests_start_over_text || 'Start over',
          requests_audio_upload_label: org.requests_audio_upload_label || 'Upload Your Own Audio File',
          requests_audio_upload_description: org.requests_audio_upload_description || 'Upload your own audio file to be played. This is perfect for upcoming artists or custom tracks. ($100 per file)',
          requests_artist_rights_text: org.requests_artist_rights_text || 'I confirm that I own the rights to this music or have permission to use it',
          requests_is_artist_text: org.requests_is_artist_text || 'I am the artist (this is for promotion, not just a play)',
          requests_audio_fee_text: org.requests_audio_fee_text || '+$100.00 for audio upload',
          requests_submit_button_text: org.requests_submit_button_text || 'Submit Request',
          requests_step_1_text: org.requests_step_1_text || 'Step 1 of 2: Choose your request',
          requests_step_2_text: org.requests_step_2_text || 'Step 2 of 2: Payment'
        });
        
        // Set feature toggles (default to true if not set)
        setFeatureToggles({
          requests_show_audio_upload: org.requests_show_audio_upload !== false,
          requests_show_fast_track: org.requests_show_fast_track !== false,
          requests_show_next_song: org.requests_show_next_song !== false,
          requests_show_bundle_discount: org.requests_show_bundle_discount !== false
        });
        
        // Set SEO fields (don't set default in state - let placeholder show default)
        setSeoFields({
          requests_page_title: org.requests_page_title || '',
          requests_page_description: org.requests_page_description || '',
          requests_default_request_type: org.requests_default_request_type || 'song_request'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlChange = (field: string, value: string) => {
    setCoverPhotos(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };
  
  const handleHeaderFieldChange = (field: keyof typeof headerFields, value: string) => {
    setHeaderFields(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
    // Update preview iframe in real-time for header fields (especially location/subtitle)
    setTimeout(() => updatePreviewIframe(), 100);
  };
  
  const handleLabelFieldChange = (field: keyof typeof labelFields, value: string) => {
    setLabelFields(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };
  
  const handleFeatureToggleChange = (field: keyof typeof featureToggles, value: boolean) => {
    setFeatureToggles(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };
  
  const handleSeoFieldChange = (field: keyof typeof seoFields, value: string) => {
    setSeoFields(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  // Sync subtitle font with artist name font when artist name font changes (unless manually changed)
  useEffect(() => {
    if (!subtitleFontManuallyChanged && artistNameFont) {
      setSubtitleFont(artistNameFont);
    }
  }, [artistNameFont, subtitleFontManuallyChanged]);

  // Function to compute subtitle text based on selected type
  const getSubtitleText = () => {
    if (subtitleType === 'venue') {
      return subtitleVenue || '';
    } else if (subtitleType === 'custom') {
      return subtitleCustomText || '';
    } else {
      // Location - use saved city/state from header fields
      return headerFields.requests_header_location || '';
    }
  };

  // Function to get the preview URL with all display name styling parameters
  const getPreviewUrl = (overrideSubtitleText?: string, overrideBackgroundType?: typeof backgroundType) => {
    if (!organization?.slug) return '';
    
    // Use override subtitle text if provided (for real-time preview), otherwise use computed value
    const subtitleText = overrideSubtitleText !== undefined ? overrideSubtitleText : getSubtitleText();
    
    // Use override background type if provided (for real-time preview), otherwise use state value
    const effectiveBackgroundType = overrideBackgroundType !== undefined ? overrideBackgroundType : backgroundType;
    
    // Build URL with all display name styling parameters
    const params = new URLSearchParams({
      preview: 'true',
      t: String(organization._lastUpdated || Date.now()),
      accentColor: accentColor,
      secondaryColor1: secondaryColor1 || '',
      secondaryColor2: secondaryColor2 || '',
      buttonStyle: buttonStyle,
      themeMode: themeMode,
      // Header field values for preview (including subtitle/location)
      headerArtistName: headerFields.requests_header_artist_name || '',
      headerLocation: subtitleText, // Use provided override or computed subtitle text
      headerDate: headerFields.requests_header_date || '',
      // Display name styling parameters
      artistNameFont: encodeURIComponent(artistNameFont),
      artistNameTextTransform: artistNameTextTransform,
      artistNameColor: artistNameColor,
      artistNameKerning: String(artistNameKerning),
      artistNameStrokeEnabled: String(artistNameStrokeEnabled),
      artistNameStrokeWidth: String(artistNameStrokeWidth),
      artistNameStrokeColor: artistNameStrokeColor,
      artistNameShadowEnabled: String(artistNameShadowEnabled),
      artistNameShadowXOffset: String(artistNameShadowXOffset),
      artistNameShadowYOffset: String(artistNameShadowYOffset),
      artistNameShadowBlur: String(artistNameShadowBlur),
      artistNameShadowColor: artistNameShadowColor,
      // Subtitle styling parameters
      subtitleFont: encodeURIComponent(effectiveSubtitleFont), // Use effective font (artist name font if not manually changed)
      subtitleTextTransform: subtitleTextTransform,
      subtitleColor: subtitleColor,
      subtitleKerning: String(subtitleKerning),
      subtitleStrokeEnabled: String(subtitleStrokeEnabled),
      subtitleStrokeWidth: String(subtitleStrokeWidth),
      subtitleStrokeColor: subtitleStrokeColor,
      subtitleShadowEnabled: String(subtitleShadowEnabled),
      subtitleShadowXOffset: String(subtitleShadowXOffset),
      subtitleShadowYOffset: String(subtitleShadowYOffset),
      subtitleShadowBlur: String(subtitleShadowBlur),
      subtitleShadowColor: subtitleShadowColor,
      // Payment amount settings for preview
      amountsSortOrder: amountsSortOrder,
      // Background type for preview
      backgroundType: effectiveBackgroundType,
      // Wavy background configuration for preview
      wavyColors: JSON.stringify(wavyColors),
      wavyWaveWidth: String(wavyWaveWidth),
      wavyBackgroundFill: wavyBackgroundFill,
      wavyBlur: String(wavyBlur),
      wavySpeed: wavySpeed,
      wavyWaveOpacity: String(wavyWaveOpacity),
      // Header background color settings for preview
      headerBackgroundType: headerBackgroundType,
      headerBackgroundColor: headerBackgroundColor,
      headerBackgroundGradientStart: headerBackgroundGradientStart,
      headerBackgroundGradientEnd: headerBackgroundGradientEnd,
      // Social links for preview - serialize as JSON (filter valid links and sort by order)
      socialLinks: JSON.stringify(
        socialLinks
          .filter(link => link.url.trim() !== '' && link.label.trim() !== '' && link.enabled !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
      ),
    });
    
    return `/${organization.slug}/requests?${params.toString()}`;
  };

  // Function to update the preview iframe with current display name styling
  const updatePreviewIframe = (overrideSubtitleText?: string, overrideBackgroundType?: typeof backgroundType) => {
    if (!organization?.slug) return;
    
    const iframe = document.getElementById('live-preview-iframe') as HTMLIFrameElement;
    if (!iframe) return;
    
    // Force reload by using current timestamp (cache-busting)
    const previewUrl = getPreviewUrl(overrideSubtitleText, overrideBackgroundType);
    if (!previewUrl) return;
    
    // Parse the relative URL and update timestamp to force reload
    const url = new URL(previewUrl, window.location.origin);
    url.searchParams.set('t', String(Date.now())); // Always use current timestamp to force reload
    
    iframe.src = url.pathname + url.search;
  };

  const handleSave = async () => {
    console.log('[ADMIN] Saving bidding settings - biddingEnabled:', biddingEnabled, 'type:', typeof biddingEnabled);
    if (!organization) {
      setError('No organization found');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Filter and prepare social links
      // Auto-populate labels for known platforms if missing
      const linksWithLabels = socialLinks.map(link => {
        // If platform is set but label is empty, auto-populate from platform
        if (link.platform && link.platform !== 'custom' && (!link.label || link.label.trim() === '')) {
          const platform = SUPPORTED_PLATFORMS.find(p => p.value === link.platform);
          return {
            ...link,
            label: platform?.label || link.platform.charAt(0).toUpperCase() + link.platform.slice(1)
          };
        }
        return link;
      });
      
      const validSocialLinks = linksWithLabels
        .filter(link => link.url.trim() !== '' && link.label.trim() !== '')
        .map(link => ({
          ...link,
          url: link.url.trim(),
          label: link.label.trim(),
        }));

      // Prepare update data
      const updateData: any = {
        // Cover photos and video
        requests_cover_photo_url: coverPhotos.requests_cover_photo_url || null,
        requests_artist_photo_url: coverPhotos.requests_artist_photo_url || null,
        requests_venue_photo_url: coverPhotos.requests_venue_photo_url || null,
        requests_header_video_url: coverPhotos.requests_header_video_url || null,
        // Show artist name over video setting
        requests_show_artist_name_over_video: showArtistNameOverVideo,
        // Show subtitle setting
        requests_show_subtitle: showSubtitle,
        // Background type setting
        requests_background_type: backgroundType,
        // Wavy background configuration
        requests_wavy_colors: backgroundType === 'wavy' ? wavyColors : null,
        requests_wavy_wave_width: backgroundType === 'wavy' ? wavyWaveWidth : null,
        requests_wavy_background_fill: backgroundType === 'wavy' ? wavyBackgroundFill : null,
        requests_wavy_blur: backgroundType === 'wavy' ? wavyBlur : null,
        requests_wavy_speed: backgroundType === 'wavy' ? wavySpeed : null,
        requests_wavy_wave_opacity: backgroundType === 'wavy' ? wavyWaveOpacity : null,
        // Header background color settings
        requests_header_background_type: headerBackgroundType || 'solid',
        requests_header_background_color: headerBackgroundType === 'solid' ? (headerBackgroundColor || '#000000') : null,
        requests_header_background_gradient_start: headerBackgroundType === 'gradient' ? (headerBackgroundGradientStart || '#000000') : null,
        requests_header_background_gradient_end: headerBackgroundType === 'gradient' ? (headerBackgroundGradientEnd || '#1a1a1a') : null,
        // Artist name font
        requests_artist_name_font: artistNameFont || 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif',
        // Artist name text transform
        requests_artist_name_text_transform: artistNameTextTransform || 'uppercase',
        // Artist name stroke settings
        requests_artist_name_stroke_enabled: artistNameStrokeEnabled,
        requests_artist_name_stroke_width: artistNameStrokeWidth || 2,
        requests_artist_name_stroke_color: artistNameStrokeColor || '#000000',
        // Artist name shadow settings
        requests_artist_name_shadow_enabled: artistNameShadowEnabled,
        requests_artist_name_shadow_x_offset: artistNameShadowXOffset || 3,
        requests_artist_name_shadow_y_offset: artistNameShadowYOffset || 3,
        requests_artist_name_shadow_blur: artistNameShadowBlur || 6,
        requests_artist_name_shadow_color: artistNameShadowColor || 'rgba(0, 0, 0, 0.8)',
        // Artist name color
        requests_artist_name_color: artistNameColor || '#ffffff',
        // Artist name kerning (letter-spacing)
        requests_artist_name_kerning: artistNameKerning || 0,
        // Subtitle type and content
        requests_subtitle_type: subtitleType || 'location',
        requests_subtitle_venue: subtitleType === 'venue' ? (subtitleVenue || '') : null,
        requests_subtitle_custom_text: subtitleType === 'custom' ? (subtitleCustomText || '') : null,
        // Subtitle font - only save if manually changed, otherwise it uses artist name font
        requests_subtitle_font: subtitleFontManuallyChanged ? (effectiveSubtitleFont || null) : null,
        // Subtitle text transform
        requests_subtitle_text_transform: subtitleTextTransform || 'none',
        // Subtitle stroke settings
        requests_subtitle_stroke_enabled: subtitleStrokeEnabled,
        requests_subtitle_stroke_width: subtitleStrokeWidth || 2,
        requests_subtitle_stroke_color: subtitleStrokeColor || '#000000',
        // Subtitle shadow settings
        requests_subtitle_shadow_enabled: subtitleShadowEnabled,
        requests_subtitle_shadow_x_offset: subtitleShadowXOffset || 3,
        requests_subtitle_shadow_y_offset: subtitleShadowYOffset || 3,
        requests_subtitle_shadow_blur: subtitleShadowBlur || 6,
        requests_subtitle_shadow_color: subtitleShadowColor || 'rgba(0, 0, 0, 0.8)',
        // Subtitle color
        requests_subtitle_color: subtitleColor || '#ffffff',
        // Subtitle kerning (letter-spacing)
        requests_subtitle_kerning: subtitleKerning || 0,
        // Custom header logo (only save if user can customize)
        requests_header_logo_url: canCustomizeHeaderLogo ? (headerLogoUrl || null) : null,
        // Accent color (available to all users) - use product-aware default (black for TipJar if not set)
        requests_accent_color: accentColor || (organization?.product_context === 'tipjar' ? '#000000' : '#fcba00'),
        // Secondary brand colors (optional)
        requests_secondary_color_1: secondaryColor1 || null,
        requests_secondary_color_2: secondaryColor2 || null,
        // Theme mode
        requests_theme_mode: themeMode,
        // Button style
        requests_button_style: buttonStyle,
        // Social links
        social_links: validSocialLinks,
        // Bidding settings
        requests_bidding_enabled: biddingEnabled, // Should be boolean
        requests_bidding_minimum_bid: minimumBid,
        requests_bidding_starting_bid: startingBid,
        // Payment amount settings
        requests_minimum_amount: minimumAmount,
        requests_preset_amounts: presetAmounts,
        requests_amounts_sort_order: amountsSortOrder,
        requests_default_preset_amount: defaultPresetAmount,
        // Priority placement fees
        requests_fast_track_fee: fastTrackFee,
        requests_next_fee: nextFee,
        // Payment usernames for tips section
        requests_cashapp_tag: cashAppTag || null,
        requests_venmo_username: venmoUsername || null,
        requests_venmo_phone_number: venmoPhoneNumber || null,
        // Payment method enabled settings
        requests_payment_method_card_enabled: paymentMethodEnabled.card,
        requests_payment_method_cashapp_enabled: paymentMethodEnabled.cashapp,
        requests_payment_method_venmo_enabled: paymentMethodEnabled.venmo,
        // Assistant settings
        requests_assistant_enabled: assistantEnabled,
        requests_assistant_custom_prompt: assistantCustomPrompt?.trim() || null,
        requests_assistant_enable_user_status: assistantFunctions.enable_user_status,
        requests_assistant_enable_all_requests: assistantFunctions.enable_all_requests,
        requests_assistant_enable_queue: assistantFunctions.enable_queue,
        requests_assistant_enable_played: assistantFunctions.enable_played,
        requests_assistant_enable_popular: assistantFunctions.enable_popular,
        requests_assistant_enable_count: assistantFunctions.enable_count,
        requests_assistant_enable_search: assistantFunctions.enable_search,
        requests_assistant_show_quick_actions: assistantQuickActions.show_quick_actions,
        requests_assistant_quick_action_has_played: assistantQuickActions.quick_action_has_played,
        requests_assistant_quick_action_when_will_play: assistantQuickActions.quick_action_when_will_play,
        // Header fields
        ...headerFields,
        // Label fields
        ...labelFields,
        // Feature toggles
        ...featureToggles,
        // SEO fields - convert empty strings to null so defaults are used
        requests_page_title: seoFields.requests_page_title?.trim() || null,
        requests_page_description: seoFields.requests_page_description?.trim() || null,
        requests_default_request_type: seoFields.requests_default_request_type || 'song_request',
      };

      // Update slug if it changed (validate and update via API if needed)
      const currentSlug = organization?.slug || '';
      const normalizedSlug = currentSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      
      if (normalizedSlug && normalizedSlug !== originalSlug && normalizedSlug.length >= 3) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await fetch('/api/organizations/update-slug', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ slug: normalizedSlug })
          });

          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to update URL slug');
          }

          // Update original slug to new value
          setOriginalSlug(normalizedSlug);
          setOrganization((prev: any) => prev ? { ...prev, slug: normalizedSlug } : prev);
        } catch (slugError: any) {
          throw new Error(`Failed to update URL slug: ${slugError.message}`);
        }
      } else if (normalizedSlug && normalizedSlug.length < 3) {
        throw new Error('URL slug must be at least 3 characters long');
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Refresh the local organization data to reflect changes in the preview
      fetchOrganization();

      // Update timestamp to trigger iframe refresh
      const newTimestamp = Date.now();
      setOrganization((prev: any) => prev ? { ...prev, _lastUpdated: newTimestamp } : prev);
      
      // Auto-refresh the preview iframe after a short delay (to allow database to update)
      setTimeout(() => {
        updatePreviewIframe();
      }, 1000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      // Log more details for debugging
      if (error.code) console.error('Error code:', error.code);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
      setError(error.message || error.details || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Social Links Management
  const addSocialLink = () => {
    const newLink: SocialLink = {
      platform: 'custom',
      url: '',
      label: '',
      enabled: true,
      order: socialLinks.length + 1,
    };
    setSocialLinks([...socialLinks, newLink]);
    setActiveTab('design'); // Social links are now part of Design tab
    
    // Update preview iframe after adding link (will show once URL and label are filled)
    setTimeout(() => updatePreviewIframe(), 100);
  };

  const removeSocialLink = (index: number) => {
    const updated = socialLinks.filter((_, i) => i !== index);
    const reordered = updated.map((link, i) => ({ ...link, order: i + 1 }));
    setSocialLinks(reordered);
    
    // Update preview iframe in real-time when social link is removed
    setTimeout(() => updatePreviewIframe(), 100);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate label when platform changes (if label is empty or missing)
    if (field === 'platform' && value !== 'custom') {
      const currentLabel = updated[index].label;
      // If label is empty, undefined, or just whitespace, auto-populate it
      if (!currentLabel || currentLabel.trim() === '') {
        const platform = SUPPORTED_PLATFORMS.find(p => p.value === value);
        updated[index].label = platform?.label || value.charAt(0).toUpperCase() + value.slice(1);
      }
    }
    
    setSocialLinks(updated);
    
    // Update preview iframe in real-time when social links change
    setTimeout(() => updatePreviewIframe(), 100);
  };

  const moveSocialLink = (index: number, direction: 'up' | 'down') => {
    const updated = [...socialLinks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= updated.length) return;
    
    const tempOrder = updated[index].order;
    updated[index].order = updated[newIndex].order;
    updated[newIndex].order = tempOrder;
    
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSocialLinks(updated);
    
    // Update preview iframe in real-time when social link order changes
    setTimeout(() => updatePreviewIframe(), 100);
  };

  // Helper function to get effective brand colors with fallback
  // For TipJar: falls back to black (#000000) if no colors are set
  // For others: falls back to accent color if secondary colors not set
  const getEffectiveBrandColor = (colorType: 'accent' | 'secondary1' | 'secondary2'): string => {
    const isTipJar = organization?.product_context === 'tipjar';
    
    if (colorType === 'accent') {
      // If accent color is set, use it; otherwise black for TipJar, default for others
      if (accentColor) return accentColor;
      return isTipJar ? '#000000' : '#fcba00';
    } else if (colorType === 'secondary1') {
      // Secondary 1: use if set, otherwise accent color, otherwise black for TipJar
      if (secondaryColor1) return secondaryColor1;
      return accentColor || (isTipJar ? '#000000' : '#fcba00');
    } else { // secondary2
      // Secondary 2: use if set, otherwise accent color, otherwise black for TipJar
      if (secondaryColor2) return secondaryColor2;
      return accentColor || (isTipJar ? '#000000' : '#fcba00');
    }
  };

  const effectiveBrandColor = getEffectiveBrandColor('accent');
  const effectiveSecondaryColor1 = getEffectiveBrandColor('secondary1');
  const effectiveSecondaryColor2 = getEffectiveBrandColor('secondary2');

  if (loading) {
    // Get effective brand color even during loading (use default)
    const loadingBrandColor = organization?.product_context === 'tipjar' ? '#000000' : accentColor || '#fcba00';
    return (
      <>
        <style 
          dangerouslySetInnerHTML={{ 
            __html: `
              :root {
                --admin-brand-color: ${loadingBrandColor};
                --admin-brand-color-hover: ${loadingBrandColor}dd;
              }
              .text-\\[\\#fcba00\\] { color: var(--admin-brand-color) !important; }
              .bg-\\[\\#fcba00\\] { background-color: var(--admin-brand-color) !important; }
              .hover\\:bg-\\[\\#d99f00\\]:hover { background-color: var(--admin-brand-color-hover) !important; }
            `
          }}
        />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#fcba00] mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!organization) {
    // Default brand color for error state
    const errorBrandColor = '#000000'; // Black fallback
    return (
      <>
        <style 
          dangerouslySetInnerHTML={{ 
            __html: `
              :root {
                --admin-brand-color: ${errorBrandColor};
                --admin-brand-color-hover: ${errorBrandColor}dd;
              }
              .bg-\\[\\#fcba00\\] { background-color: var(--admin-brand-color) !important; }
              .hover\\:bg-\\[\\#d99f00\\]:hover { background-color: var(--admin-brand-color-hover) !important; }
            `
          }}
        />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Organization Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to create an organization first before managing requests page settings.
            </p>
            <Link
              href="/admin/organizations"
              className="inline-flex items-center px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#d99f00] transition-colors"
            >
              Go to Organizations
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Use direct slug-based URL for cleaner TipJar links
  const requestsPageUrl = `/${organization.slug}/requests?t=${Date.now()}`;

  return (
    <AdminPageLayout title="Requests Page Settings" description="Customize your public song requests page with cover photos and social links">
      {/* Brand Color CSS Variables - Apply user's brand colors to admin UI */}
      <style 
        dangerouslySetInnerHTML={{ 
          __html: `
            :root {
              --admin-brand-color: ${effectiveBrandColor};
              --admin-brand-color-hover: ${effectiveBrandColor}dd;
              --admin-secondary-color-1: ${effectiveSecondaryColor1};
              --admin-secondary-color-2: ${effectiveSecondaryColor2};
            }
            /* Map all brand color references to CSS variables */
            .bg-admin-brand { background-color: var(--admin-brand-color) !important; }
            .text-admin-brand { color: var(--admin-brand-color) !important; }
            .border-admin-brand { border-color: var(--admin-brand-color) !important; }
            .ring-admin-brand { --tw-ring-color: var(--admin-brand-color) !important; }
            .hover\\:bg-admin-brand:hover { background-color: var(--admin-brand-color-hover) !important; }
            /* Override hardcoded gold references */
            .bg-\\[\\#fcba00\\] { background-color: var(--admin-brand-color) !important; }
            .text-\\[\\#fcba00\\] { color: var(--admin-brand-color) !important; }
            .border-\\[\\#fcba00\\] { border-color: var(--admin-secondary-color-1) !important; }
            .ring-\\[\\#fcba00\\] { --tw-ring-color: var(--admin-secondary-color-1) !important; }
            .hover\\:bg-\\[\\#d99f00\\]:hover { background-color: var(--admin-brand-color-hover) !important; }
            .accent-\\[\\#fcba00\\] { accent-color: var(--admin-brand-color) !important; }
            .peer-checked\\:bg-\\[\\#fcba00\\] { background-color: var(--admin-brand-color) !important; }
            .focus\\:ring-\\[\\#fcba00\\]:focus { --tw-ring-color: var(--admin-secondary-color-1) !important; }
            .dark .peer-focus\\:ring-\\[\\#fcba00\\] { --tw-ring-color: var(--admin-secondary-color-1) !important; }
            .from-\\[\\#fcba00\\] { --tw-gradient-from: var(--admin-brand-color) !important; }
            .to-\\[\\#fcba00\\] { --tw-gradient-to: var(--admin-brand-color) !important; }
            .border-\\[\\#fcba00\\]\\/30 { border-color: ${effectiveSecondaryColor1}4d !important; }
            .bg-\\[\\#fcba00\\]\\/5 { background-color: ${effectiveSecondaryColor2}0d !important; }
            .bg-\\[\\#fcba00\\]\\/10 { background-color: ${effectiveSecondaryColor2}1a !important; }
            .text-\\[\\#fcba00\\]\\/10 { color: ${effectiveSecondaryColor2}1a !important; }
            .ring-\\[\\#fcba00\\]\\/20 { --tw-ring-color: ${effectiveSecondaryColor2}33 !important; }
            .ring-\\[\\#fcba00\\]\\/40 { --tw-ring-color: ${effectiveSecondaryColor2}66 !important; }
          `
        }}
      />
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 lg:pb-8">
          {/* Header - Mobile optimized */}
          <div className="mb-4 sm:mb-8">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 sm:mb-4 text-sm"
            >
              ← Back
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                  <Music className="w-6 h-6 sm:w-8 sm:h-8 text-[#fcba00] flex-shrink-0" />
                  <span className="truncate">Requests Page</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                  Customize your public requests page
                </p>
              </div>
              <Link
                href={requestsPageUrl}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fcba00] text-black rounded-lg hover:bg-[#d99f00] transition-colors text-sm font-medium w-full sm:w-auto"
                onClick={() => {
                  window.open(`/${organization.slug}/requests?t=${Date.now()}`, '_blank');
                  return false;
                }}
              >
                <Eye className="w-4 h-4" />
                View Live Page
              </Link>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-300">Settings saved successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Mobile-optimized Tab Navigation */}
          <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0">
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl overflow-x-auto mx-3 sm:mx-0">
              {[
                { id: 'design', label: 'Design', icon: Palette },
                { id: 'content', label: 'Content', icon: Type },
                { id: 'payments', label: 'Payments', icon: DollarSign },
                { id: 'features', label: 'Features', icon: ToggleLeft },
                { id: 'assistant', label: 'Assistant', icon: MessageCircle },
                { id: 'advanced', label: 'More', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-0 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-900 text-[#fcba00] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mx-auto sm:hidden" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-[10px] block mt-0.5">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* ===== DESIGN TAB ===== */}
              {activeTab === 'design' ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Branding Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#fcba00]" />
                        Branding & Style
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Colors, theme, and visual identity</p>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Custom Header Logo Section */}
                    <div className={`p-4 rounded-lg border-2 ${
                      canCustomizeHeaderLogo 
                        ? 'border-[#fcba00]/30 bg-[#fcba00]/5 dark:bg-[#fcba00]/10' 
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            Custom Header Logo
                            {!canCustomizeHeaderLogo && (
                              <span className="text-xs px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium">
                                Premium
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {canCustomizeHeaderLogo 
                              ? 'Replace the TipJar logo with your own branding'
                              : 'Upgrade to customize the header logo with your own branding'}
                          </p>
                        </div>
                      </div>
                      
                      {canCustomizeHeaderLogo ? (
                        <ImageUploadInput
                          label="Header Logo"
                          value={headerLogoUrl}
                          onChange={(url) => {
                            setHeaderLogoUrl(url);
                            setError(null);
                            setSuccess(false);
                          }}
                          recommendedDimensions="200x80px"
                          aspectRatio="2.5:1"
                          maxSizeMB={2}
                          previewClassName="h-16 w-auto object-contain bg-gray-900 rounded-lg p-2"
                          showPreview={true}
                          required={false}
                        />
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Custom branding is available on premium plans
                          </p>
                          <button
                            type="button"
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                            onClick={() => {
                              // TODO: Open upgrade modal or redirect to pricing
                              alert('Contact support to upgrade your plan and unlock custom branding!');
                            }}
                          >
                            Upgrade to Unlock
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Accent Color */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Accent Color
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Your brand color used for buttons, highlights, and accents
                          </p>
                          
                          <div className="flex items-center gap-4">
                            {/* Color picker */}
                            <div className="relative">
                              <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => {
                                  setAccentColor(e.target.value);
                                  setError(null);
                                  setSuccess(false);
                                }}
                                className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                                style={{ padding: 0 }}
                              />
                            </div>
                            
                            {/* Hex input */}
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hex Code</label>
                              <input
                                type="text"
                                value={accentColor}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                    setAccentColor(value);
                                    setError(null);
                                    setSuccess(false);
                                  }
                                }}
                                className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                placeholder="#fcba00"
                              />
                            </div>
                            
                            {/* Preview */}
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Preview</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                                  style={{ backgroundColor: accentColor }}
                                >
                                  Sample Button
                                </button>
                                <span 
                                  className="font-medium"
                                  style={{ color: accentColor }}
                                >
                                  Accent Text
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick presets */}
                          <div className="mt-4">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Quick Presets</label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { color: '#fcba00', name: 'Gold' },
                                { color: '#10b981', name: 'Green' },
                                { color: '#3b82f6', name: 'Blue' },
                                { color: '#8b5cf6', name: 'Purple' },
                                { color: '#ec4899', name: 'Pink' },
                                { color: '#ef4444', name: 'Red' },
                                { color: '#f97316', name: 'Orange' },
                                { color: '#14b8a6', name: 'Teal' },
                              ].map(({ color, name }) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => {
                                    setAccentColor(color);
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    accentColor === color 
                                      ? 'border-gray-900 dark:border-white scale-110' 
                                      : 'border-transparent hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  title={name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Secondary Brand Colors */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Secondary Brand Colors
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Optional colors for borders, shadows, highlights, and other accented elements. If not set, the accent color will be used.
                          </p>
                          
                          <div className="space-y-4">
                            {/* Secondary Color 1 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Secondary Color #1
                              </label>
                              <div className="flex items-center gap-4">
                                {/* Color picker */}
                                <div className="relative">
                                  <input
                                    type="color"
                                    value={secondaryColor1 || accentColor}
                                    onChange={(e) => {
                                      setSecondaryColor1(e.target.value || null);
                                      setError(null);
                                      setSuccess(false);
                                      setTimeout(() => updatePreviewIframe(), 100);
                                    }}
                                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                                    style={{ padding: 0 }}
                                  />
                                </div>
                                
                                {/* Hex input */}
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hex Code</label>
                                  <input
                                    type="text"
                                    value={secondaryColor1 || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                        setSecondaryColor1(value || null);
                                        setError(null);
                                        setSuccess(false);
                                        setTimeout(() => updatePreviewIframe(), 100);
                                      }
                                    }}
                                    className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                    placeholder="Optional"
                                  />
                                </div>
                                
                                {/* Preview */}
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Preview</label>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="px-3 py-2 rounded-lg border-2 text-sm font-medium"
                                      style={{ 
                                        borderColor: secondaryColor1 || accentColor,
                                        color: secondaryColor1 || accentColor
                                      }}
                                    >
                                      Border & Text
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Clear button */}
                                {secondaryColor1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSecondaryColor1(null);
                                      setError(null);
                                      setSuccess(false);
                                      setTimeout(() => updatePreviewIframe(), 100);
                                    }}
                                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Secondary Color 2 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Secondary Color #2
                              </label>
                              <div className="flex items-center gap-4">
                                {/* Color picker */}
                                <div className="relative">
                                  <input
                                    type="color"
                                    value={secondaryColor2 || accentColor}
                                    onChange={(e) => {
                                      setSecondaryColor2(e.target.value || null);
                                      setError(null);
                                      setSuccess(false);
                                      setTimeout(() => updatePreviewIframe(), 100);
                                    }}
                                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                                    style={{ padding: 0 }}
                                  />
                                </div>
                                
                                {/* Hex input */}
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hex Code</label>
                                  <input
                                    type="text"
                                    value={secondaryColor2 || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                        setSecondaryColor2(value || null);
                                        setError(null);
                                        setSuccess(false);
                                        setTimeout(() => updatePreviewIframe(), 100);
                                      }
                                    }}
                                    className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                    placeholder="Optional"
                                  />
                                </div>
                                
                                {/* Preview */}
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Preview</label>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
                                      style={{ 
                                        backgroundColor: `${(secondaryColor2 || accentColor)}20`,
                                        color: secondaryColor2 || accentColor,
                                        boxShadow: `0 4px 14px ${(secondaryColor2 || accentColor)}40`
                                      }}
                                    >
                                      Shadow & Highlight
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Clear button */}
                                {secondaryColor2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSecondaryColor2(null);
                                      setError(null);
                                      setSuccess(false);
                                      setTimeout(() => updatePreviewIframe(), 100);
                                    }}
                                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Theme Mode */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Theme Mode
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Choose whether your requests page appears in light or dark mode
                      </p>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {/* Light Mode */}
                        <button
                          type="button"
                          onClick={() => {
                            setThemeMode('light');
                            setError(null);
                            setSuccess(false);
                            // Update preview iframe in real-time
                            setTimeout(() => updatePreviewIframe(), 100);
                          }}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            themeMode === 'light'
                              ? 'border-[var(--accent-color)] bg-white dark:bg-gray-100 ring-2 ring-[var(--accent-color)]/30'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-100 hover:border-gray-300'
                          }`}
                          style={themeMode === 'light' ? { borderColor: accentColor } : {}}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900">Light</span>
                          </div>
                          {themeMode === 'light' && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                        
                        {/* Dark Mode */}
                        <button
                          type="button"
                          onClick={() => {
                            setThemeMode('dark');
                            setError(null);
                            setSuccess(false);
                            // Update preview iframe in real-time
                            setTimeout(() => updatePreviewIframe(), 100);
                          }}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            themeMode === 'dark'
                              ? 'border-[var(--accent-color)] bg-gray-900 ring-2 ring-[var(--accent-color)]/30'
                              : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                          }`}
                          style={themeMode === 'dark' ? { borderColor: accentColor } : {}}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-8 rounded bg-gray-800 border border-gray-700 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-white">Dark</span>
                          </div>
                          {themeMode === 'dark' && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                        
                        {/* System Mode */}
                        <button
                          type="button"
                          onClick={() => {
                            setThemeMode('system');
                            setError(null);
                            setSuccess(false);
                          }}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            themeMode === 'system'
                              ? 'border-[var(--accent-color)] bg-gradient-to-r from-white to-gray-900 ring-2 ring-[var(--accent-color)]/30'
                              : 'border-gray-300 dark:border-gray-600 bg-gradient-to-r from-white to-gray-900 hover:border-gray-400'
                          }`}
                          style={themeMode === 'system' ? { borderColor: accentColor } : {}}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-8 rounded bg-gradient-to-r from-gray-100 to-gray-800 border border-gray-400 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-600">System</span>
                          </div>
                          {themeMode === 'system' && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        {themeMode === 'light' && '☀️ Your page will always display in light mode'}
                        {themeMode === 'dark' && '🌙 Your page will always display in dark mode'}
                        {themeMode === 'system' && '💻 Your page will match the visitor\'s device preference'}
                      </p>
                    </div>
                    
                    {/* Button Style */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Button Style
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Choose how your buttons appear on the requests page
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Gradient */}
                        <button
                          type="button"
                          onClick={() => {
                            setButtonStyle('gradient');
                            setError(null);
                            setSuccess(false);
                          }}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            buttonStyle === 'gradient'
                              ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          } bg-white dark:bg-gray-800`}
                          style={buttonStyle === 'gradient' ? { borderColor: accentColor } : {}}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div 
                              className="px-6 py-2.5 rounded-lg text-white font-medium text-sm"
                              style={{ 
                                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 50%, ${accentColor}99 100%)`,
                                boxShadow: `0 4px 14px ${accentColor}40`
                              }}
                            >
                              Sample Button
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Gradient</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Shimmery, premium look</span>
                          </div>
                          {buttonStyle === 'gradient' && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                        
                        {/* Flat */}
                        <button
                          type="button"
                          onClick={() => {
                            setButtonStyle('flat');
                            setError(null);
                            setSuccess(false);
                          }}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            buttonStyle === 'flat'
                              ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          } bg-white dark:bg-gray-800`}
                          style={buttonStyle === 'flat' ? { borderColor: accentColor } : {}}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div 
                              className="px-6 py-2.5 rounded-lg text-white font-medium text-sm"
                              style={{ backgroundColor: accentColor }}
                            >
                              Sample Button
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Flat</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Clean, minimal look</span>
                          </div>
                          {buttonStyle === 'flat' && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <Video className="w-5 h-5 text-gray-400" />
                        Background Media
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cover photos and video header</p>
                    </div>

                    {/* Primary Cover Photo */}
                    <ImageUploadInput
                      label="Primary Cover Photo (Required)"
                      value={coverPhotos.requests_cover_photo_url}
                      onChange={(url) => handleImageUrlChange('requests_cover_photo_url', url)}
                      recommendedDimensions="1920x800px"
                      aspectRatio="16:9"
                      previewClassName="w-full h-64 object-cover"
                      showPreview={true}
                      required={true}
                    />

                    {/* Artist Photo */}
                    <ImageUploadInput
                      label="Artist/DJ Photo (Optional - Fallback)"
                      value={coverPhotos.requests_artist_photo_url}
                      onChange={(url) => handleImageUrlChange('requests_artist_photo_url', url)}
                      recommendedDimensions="1200x600px"
                      aspectRatio="2:1"
                      previewClassName="w-full h-48 object-cover"
                      showPreview={true}
                      required={false}
                    />

                    {/* Venue Photo */}
                    <ImageUploadInput
                      label="Venue Photo (Optional - Fallback)"
                      value={coverPhotos.requests_venue_photo_url}
                      onChange={(url) => handleImageUrlChange('requests_venue_photo_url', url)}
                      recommendedDimensions="1200x600px"
                      aspectRatio="2:1"
                      previewClassName="w-full h-48 object-cover"
                      showPreview={true}
                      required={false}
                    />

                    {/* Header Video Upload */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <VideoUploadInput
                        label="Header Video (Optional)"
                        value={coverPhotos.requests_header_video_url}
                        onChange={(url) => handleImageUrlChange('requests_header_video_url', url)}
                        maxSizeMB={100}
                        previewClassName="w-full h-48 object-cover"
                        showPreview={true}
                        helpText="Animated header video. If set, this plays instead of the cover photo. Use a looping video with your logo for best effect."
                      />
                      
                      {/* Show Artist Name Over Video Toggle - only show when video is set */}
                      {coverPhotos.requests_header_video_url && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-900 dark:text-white">
                                Show Artist Name Over Video
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Turn this off if your video already contains your name or logo
                              </p>
                            </div>
                            <Switch
                              checked={showArtistNameOverVideo}
                              onCheckedChange={(checked) => {
                                setShowArtistNameOverVideo(checked);
                                setError(null);
                                setSuccess(false);
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Background Type Selection */}
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Background Animation Type
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Choose the animated background style when no video or cover photo is set
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowBackgroundModal(true)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-[#fcba00] focus:border-transparent transition-colors flex items-center justify-between"
                          >
                            <span>
                              {backgroundType === 'gradient' && 'Gradient (New)'}
                              {backgroundType === 'subtle' && 'Subtle (Original)'}
                              {backgroundType === 'aurora' && 'Aurora'}
                              {backgroundType === 'smoke' && 'Smoke'}
                              {backgroundType === 'smooth-spiral' && 'Smooth Spiral'}
                              {backgroundType === 'vortex' && 'Vortex'}
                              {backgroundType === 'fireflies' && 'Fireflies'}
                              {backgroundType === 'wavy' && 'Wavy'}
                              {backgroundType === 'none' && 'None (No Animation)'}
                            </span>
                            <Sparkles className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      {/* Background Animation Selection Modal */}
                      <Dialog open={showBackgroundModal} onOpenChange={setShowBackgroundModal}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <style dangerouslySetInnerHTML={{ __html: `
                            @keyframes gradient-shift-preview {
                              0% { background-position: 0% 50%; }
                              50% { background-position: 100% 50%; }
                              100% { background-position: 0% 50%; }
                            }
                            @keyframes spin-preview {
                              from { transform: rotate(0deg); }
                              to { transform: rotate(360deg); }
                            }
                            @keyframes pulse-preview {
                              0%, 100% { opacity: 0.4; }
                              50% { opacity: 0.6; }
                            }
                            @keyframes aurora {
                              0% {
                                background-position: 50% 50%, 50% 50%;
                              }
                              33% {
                                background-position: 0% 0%, 100% 100%;
                              }
                              66% {
                                background-position: 100% 100%, 0% 0%;
                              }
                              100% {
                                background-position: 50% 50%, 50% 50%;
                              }
                            }
                          `}} />
                          <DialogHeader>
                            <DialogTitle>Select Background Animation</DialogTitle>
                            <DialogDescription>
                              Choose the animated background style when no video or cover photo is set
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                            {[
                              { value: 'gradient', label: 'Gradient (New)' },
                              { value: 'subtle', label: 'Subtle (Original)' },
                              { value: 'aurora', label: 'Aurora' },
                              { value: 'smoke', label: 'Smoke' },
                              { value: 'smooth-spiral', label: 'Smooth Spiral' },
                              { value: 'vortex', label: 'Vortex' },
                              { value: 'fireflies', label: 'Fireflies' },
                              { value: 'wavy', label: 'Wavy' },
                              { value: 'none', label: 'None (No Animation)' },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  const newBackgroundType = option.value as typeof backgroundType;
                                  setBackgroundType(newBackgroundType);
                                  setShowBackgroundModal(false);
                              setError(null);
                              setSuccess(false);
                                  // Update preview immediately with new value (before state updates)
                                  setTimeout(() => updatePreviewIframe(undefined, newBackgroundType), 0);
                                }}
                                className={`relative rounded-lg border-2 transition-all overflow-hidden ${
                                  backgroundType === option.value
                                    ? 'border-[#fcba00] ring-2 ring-[#fcba00]/30'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                                }`}
                              >
                                {backgroundType === option.value && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <CheckCircle className="w-5 h-5 text-[#fcba00]" fill="currentColor" />
                        </div>
                                )}
                                {/* Animation Preview */}
                                <div className="relative w-full h-24 bg-black overflow-hidden">
                                  {option.value === 'gradient' && (
                                    <div 
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}44 25%, #000 50%, ${accentColor}33 75%, ${accentColor}22 100%)`,
                                        backgroundSize: '400% 400%',
                                        animation: 'gradient-shift-preview 15s ease infinite'
                                      }}
                                    />
                                  )}
                                  {option.value === 'subtle' && (
                                    <div 
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 50%, ${accentColor}10 100%)`,
                                        backgroundSize: '200% 200%',
                                        animation: 'gradient-shift-preview 10s ease infinite'
                                      }}
                                    />
                                  )}
                                  {option.value === 'aurora' && typeof window !== 'undefined' && (() => {
                                    try {
                                      const AuroraBackground = require('@/components/ui/shadcn-io/aurora-background').default;
                                      return (
                                        <AuroraBackground showRadialGradient={true} />
                                      );
                                    } catch (e) {
                                      return (
                                        <div className="absolute inset-0">
                                          <div 
                                            className="absolute inset-0 opacity-60"
                                            style={{
                                              background: `linear-gradient(45deg, ${accentColor}30, transparent 30%, transparent 70%, ${accentColor}30)`,
                                              backgroundSize: '200% 200%',
                                              animation: 'gradient-shift-preview 12s ease infinite'
                                            }}
                                          />
                                          <div 
                                            className="absolute inset-0 opacity-40"
                                            style={{
                                              background: `radial-gradient(ellipse at top, ${accentColor}40, transparent 50%)`,
                                              animation: 'pulse-preview 4s ease-in-out infinite'
                                            }}
                                          />
                                        </div>
                                      );
                                    }
                                  })()}
                                  {option.value === 'smoke' && typeof window !== 'undefined' && (() => {
                                    try {
                                      const Smoke = require('@/components/ui/shadcn-io/smoke').default;
                                      return (
                                        <Smoke
                                          density={50}
                                          color="#cccccc"
                                          opacity={0.6}
                                          enableRotation={true}
                                          enableWind={true}
                                          windStrength={[0.02, 0.01, 0.01]}
                                          enableTurbulence={true}
                                          turbulenceStrength={[0.02, 0.02, 0.01]}
                                        />
                                      );
                                    } catch (e) {
                                      return <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white/50 text-xs">Smoke</div>;
                                    }
                                  })()}
                                  {option.value === 'smooth-spiral' && typeof window !== 'undefined' && (() => {
                                    try {
                                      const PsychedelicSpiral = require('@/components/ui/shadcn-io/psychedelic-spiral').default;
                                      return (
                                        <PsychedelicSpiral
                                          spinRotation={-2.0}
                                          spinSpeed={7.0}
                                          offset={[0.0, 0.0]}
                                          color1="#871d87"
                                          color2="#b2dfdf"
                                          color3="#0c204e"
                                          contrast={3.5}
                                          lighting={0.4}
                                          spinAmount={0.25}
                                          pixelFilter={745.0}
                                          spinEase={1.0}
                                          isRotate={true}
                                        />
                                      );
                                    } catch (e) {
                                      return <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white/50 text-xs">Spiral</div>;
                                    }
                                  })()}
                                  {option.value === 'vortex' && typeof window !== 'undefined' && (() => {
                                    try {
                                      const Vortex = require('@/components/ui/shadcn-io/vortex').default;
                                      return (
                                        <Vortex
                                          backgroundColor="black"
                                          rangeY={800}
                                          particleCount={300}
                                          baseHue={120}
                                        />
                                      );
                                    } catch (e) {
                                      return <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white/50 text-xs">Vortex</div>;
                                    }
                                  })()}
                                  {option.value === 'fireflies' && typeof window !== 'undefined' && (() => {
                                    try {
                                      const Fireflies = require('@/components/ui/shadcn-io/fireflies').default;
                                      return (
                                        <Fireflies
                                          count={30}
                                          speed={0.3}
                                          size={2}
                                          color={accentColor}
                                          backgroundColor="black"
                                        />
                                      );
                                    } catch (e) {
                                      return <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white/50 text-xs">Fireflies</div>;
                                    }
                                  })()}
                                  {option.value === 'wavy' && typeof window !== 'undefined' && (() => {
                                    try {
                                      const WavyBackground = require('@/components/ui/shadcn-io/wavy-background').default;
                                      return (
                                        <WavyBackground
                                          backgroundFill={wavyBackgroundFill}
                                          colors={wavyColors.length >= 2 ? wavyColors : [accentColor, secondaryColor1 || accentColor, secondaryColor2 || accentColor]}
                                          waveWidth={wavyWaveWidth}
                                          blur={wavyBlur}
                                          speed={wavySpeed}
                                          waveOpacity={wavyWaveOpacity}
                                        />
                                      );
                                    } catch (e) {
                                      return <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white/50 text-xs">Wavy</div>;
                                    }
                                  })()}
                                  {option.value === 'none' && (
                                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                      <div className="text-white/30 text-xs">No Animation</div>
                                    </div>
                                  )}
                                </div>
                                {/* Label */}
                                <div className="p-2 bg-white dark:bg-gray-800">
                                  <div className="text-xs font-medium text-gray-900 dark:text-white text-center">
                                    {option.label}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {/* Header Background Color */}
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Header Background Color
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Custom background color or gradient shown when no video, photo, or animation is set
                          </p>
                          
                          {/* Background Type: Solid or Gradient */}
                          <div className="flex gap-2 mb-4">
                            <button
                              type="button"
                              onClick={() => {
                                setHeaderBackgroundType('solid');
                                setError(null);
                                setSuccess(false);
                                setTimeout(() => updatePreviewIframe(), 100);
                              }}
                              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                headerBackgroundType === 'solid'
                                  ? 'bg-[#fcba00] text-black shadow-sm'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              Solid Color
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setHeaderBackgroundType('gradient');
                                setError(null);
                                setSuccess(false);
                                setTimeout(() => updatePreviewIframe(), 100);
                              }}
                              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                headerBackgroundType === 'gradient'
                                  ? 'bg-[#fcba00] text-black shadow-sm'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              Gradient
                            </button>
                          </div>
                          
                          {/* Solid Color Input */}
                          {headerBackgroundType === 'solid' && (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="header_background_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Background Color
                                </Label>
                                <div className="flex items-center gap-3">
                                  <input
                                    id="header_background_color"
                                    type="color"
                                    value={headerBackgroundColor}
                                    onChange={(e) => {
                                      setHeaderBackgroundColor(e.target.value);
                                      setError(null);
                                      setSuccess(false);
                                      setTimeout(() => updatePreviewIframe(), 100);
                                    }}
                                    className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                                  />
                                  <input
                                    type="text"
                                    value={headerBackgroundColor}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                        setHeaderBackgroundColor(value);
                                        setError(null);
                                        setSuccess(false);
                                        setTimeout(() => updatePreviewIframe(), 100);
                                      }
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                                <div 
                                  className="w-full h-20 rounded"
                                  style={{ backgroundColor: headerBackgroundColor }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Gradient Inputs */}
                          {headerBackgroundType === 'gradient' && (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="header_background_gradient_start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Gradient Start Color
                                </Label>
                                <div className="flex items-center gap-3">
                                  <input
                                    id="header_background_gradient_start"
                                    type="color"
                                    value={headerBackgroundGradientStart}
                                    onChange={(e) => {
                                      setHeaderBackgroundGradientStart(e.target.value);
                                      setError(null);
                                      setSuccess(false);
                                      setTimeout(() => updatePreviewIframe(), 100);
                                    }}
                                    className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                                  />
                                  <input
                                    type="text"
                                    value={headerBackgroundGradientStart}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                        setHeaderBackgroundGradientStart(value);
                                        setError(null);
                                        setSuccess(false);
                                        setTimeout(() => updatePreviewIframe(), 100);
                                      }
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="header_background_gradient_end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Gradient End Color
                                </Label>
                                <div className="flex items-center gap-3">
                                  <input
                                    id="header_background_gradient_end"
                                    type="color"
                                    value={headerBackgroundGradientEnd}
                                    onChange={(e) => {
                                      setHeaderBackgroundGradientEnd(e.target.value);
                                      setError(null);
                                      setSuccess(false);
                                      setTimeout(() => updatePreviewIframe(), 100);
                                    }}
                                    className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                                  />
                                  <input
                                    type="text"
                                    value={headerBackgroundGradientEnd}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                        setHeaderBackgroundGradientEnd(value);
                                        setError(null);
                                        setSuccess(false);
                                        setTimeout(() => updatePreviewIframe(), 100);
                                      }
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                    placeholder="#1a1a1a"
                                  />
                                </div>
                              </div>
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                                <div 
                                  className="w-full h-20 rounded"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${headerBackgroundGradientStart} 0%, ${headerBackgroundGradientEnd} 100%)`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                  
                  {/* Social Links Section - Part of Design tab */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#fcba00] flex-shrink-0" />
                            Social Links
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">Links shown on your page</p>
                        </div>
                        <button
                          onClick={addSocialLink}
                          className="inline-flex items-center px-3 sm:px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#d99f00] transition-colors font-medium text-xs sm:text-sm flex-shrink-0"
                        >
                          <Plus className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Add Link</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                  {socialLinks.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Globe className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">No social links added yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                        Default links (Instagram & Facebook) will be shown to visitors
                      </p>
                      <button
                        onClick={addSocialLink}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Link
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialLinks.map((link, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 transition-all ${
                            link.enabled
                              ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Move Controls */}
                            <div className="flex flex-col gap-1 pt-2">
                              <button
                                onClick={() => moveSocialLink(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveSocialLink(index, 'down')}
                                disabled={index === socialLinks.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Platform
                                </label>
                                <select
                                  value={link.platform}
                                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                                >
                                  {SUPPORTED_PLATFORMS.map((platform) => (
                                    <option key={platform.value} value={platform.value}>
                                      {platform.icon} {platform.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Link Label
                                </label>
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                                  placeholder="e.g., Follow Us"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  URL
                                </label>
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                  placeholder="https://..."
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col items-end gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={link.enabled}
                                  onChange={(e) => updateSocialLink(index, 'enabled', e.target.checked)}
                                  className="w-4 h-4 text-[#fcba00] border-gray-300 rounded focus:ring-[#fcba00]"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                              </label>
                              <button
                                onClick={() => removeSocialLink(index)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                    </div>
                  </div>
                </div>
              ) : activeTab === 'payments' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Payment Amount Settings
                  </h2>
                  
                  {(!minimumAmount || !presetAmounts || presetAmounts.length === 0) && (
                    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Loading payment settings...
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    {/* Minimum Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Minimum Tip Amount
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        The minimum amount users can pay for requests and tips
                      </p>
                      <div className="relative w-full sm:w-48">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={(minimumAmount || 1000) / 100}
                          onChange={(e) => {
                            const newMin = Math.max(100, Math.round(parseFloat(e.target.value) * 100) || 100);
                            setMinimumAmount(newMin);
                            
                            // Auto-adjust preset amounts if minimum changes
                            if (presetAmounts && presetAmounts.length > 0) {
                              const currentMin = Math.min(...presetAmounts);
                              if (newMin !== currentMin) {
                                // Calculate the difference and shift all presets
                                const diff = newMin - currentMin;
                                const newPresets = presetAmounts.map(amount => amount + diff);
                                setPresetAmounts(newPresets);
                              }
                            }
                            
                            setError(null);
                            setSuccess(false);
                          }}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                          placeholder="10"
                        />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        💡 Changing the minimum will automatically adjust the quick amount buttons
                      </p>
                    </div>

                    {/* Preset Amounts */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quick Amount Buttons
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        These are the preset amounts shown as buttons on the request page
                      </p>
                      <div className="space-y-3">
                        {presetAmounts && presetAmounts.length > 0 ? presetAmounts.map((amount, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 w-16">Button {index + 1}:</span>
                            <div className="relative w-32">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                              <input
                                type="number"
                                step="1"
                                min="1"
                                value={amount / 100}
                                onChange={(e) => {
                                  const value = Math.round(parseFloat(e.target.value) * 100) || 100;
                                  const newPresets = [...presetAmounts];
                                  newPresets[index] = Math.max(100, value);
                                  setPresetAmounts(newPresets);
                                  setError(null);
                                  setSuccess(false);
                                }}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                              />
                            </div>
                            {presetAmounts.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newPresets = presetAmounts.filter((_, i) => i !== index);
                                  setPresetAmounts(newPresets);
                                  setError(null);
                                  setSuccess(false);
                                }}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            No preset amounts configured. Default amounts will be used.
                          </div>
                        )}
                        {presetAmounts && presetAmounts.length > 0 && presetAmounts.length < 6 && (
                          <button
                            type="button"
                            onClick={() => {
                              const lastAmount = presetAmounts[presetAmounts.length - 1] || 1000;
                              setPresetAmounts([...presetAmounts, lastAmount + 500]);
                              setError(null);
                              setSuccess(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#fcba00] hover:bg-[#fcba00]/10 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Amount Button
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Button Display Order
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        How the amount buttons are ordered on the request page
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAmountsSortOrder('desc');
                            setError(null);
                            setSuccess(false);
                            // Update preview iframe in real-time
                            updatePreviewIframe();
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                            amountsSortOrder === 'desc'
                              ? 'border-[#fcba00] bg-[#fcba00]/10 text-[#fcba00]'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          <ArrowDown className="w-4 h-4" />
                          Highest First
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAmountsSortOrder('asc');
                            setError(null);
                            setSuccess(false);
                            // Update preview iframe in real-time
                            updatePreviewIframe();
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                            amountsSortOrder === 'asc'
                              ? 'border-[#fcba00] bg-[#fcba00]/10 text-[#fcba00]'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          <ArrowUp className="w-4 h-4" />
                          Lowest First
                        </button>
                      </div>
                    </div>

                    {/* Default Selected Button */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Selected Button
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Which amount button should be pre-selected when the page loads
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="defaultPresetAmount"
                            checked={defaultPresetAmount === null}
                            onChange={() => {
                              setDefaultPresetAmount(null);
                              setError(null);
                              setSuccess(false);
                            }}
                            className="w-4 h-4 text-[#fcba00] focus:ring-[#fcba00] focus:ring-offset-0"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Auto (Highest Amount)
                          </span>
                        </label>
                        {presetAmounts && presetAmounts.length > 0 ? presetAmounts.map((amount, index) => (
                          <label key={index} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="defaultPresetAmount"
                              checked={defaultPresetAmount === amount}
                              onChange={() => {
                                setDefaultPresetAmount(amount);
                                setError(null);
                                setSuccess(false);
                              }}
                              className="w-4 h-4 text-[#fcba00] focus:ring-[#fcba00] focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              ${(amount / 100).toFixed(0)}
                            </span>
                          </label>
                        )) : null}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        💡 &quot;Auto&quot; will select the highest preset amount by default
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Preview
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {presetAmounts && presetAmounts.length > 0 ? (
                          [...presetAmounts]
                            .sort((a, b) => amountsSortOrder === 'desc' ? b - a : a - b)
                            .map((amount, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium"
                              >
                                ${(amount / 100).toFixed(0)}
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No preset amounts configured</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        Minimum: ${((minimumAmount || 1000) / 100).toFixed(0)}
                      </p>
                    </div>
                    
                    {/* Priority Placement Fees Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Priority Placement Fees
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Set the fees for Fast-Track and Next Song options. These are added to the base payment amount.
                      </p>
                      
                      <div className="space-y-4">
                        {/* Fast-Track Fee */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fast-Track Fee
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Fee for playing the song immediately (in dollars)
                          </p>
                          <div className="relative w-full sm:w-48">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={((fastTrackFee || 1000) / 100).toFixed(2)}
                              onChange={(e) => {
                                const value = Math.round(parseFloat(e.target.value) * 100) || 0;
                                setFastTrackFee(Math.max(0, value));
                                setError(null);
                                setSuccess(false);
                              }}
                              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                              placeholder="10.00"
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Current: ${(fastTrackFee / 100).toFixed(2)} (stored as {fastTrackFee} cents)
                          </p>
                        </div>
                        
                        {/* Next Song Fee */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Next Song Fee
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Fee for jumping the song to the front of the queue (in dollars)
                          </p>
                          <div className="relative w-full sm:w-48">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={((nextFee || 2000) / 100).toFixed(2)}
                              onChange={(e) => {
                                const value = Math.round(parseFloat(e.target.value) * 100) || 0;
                                setNextFee(Math.max(0, value));
                                setError(null);
                                setSuccess(false);
                              }}
                              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                              placeholder="20.00"
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Current: ${(nextFee / 100).toFixed(2)} (stored as {nextFee} cents)
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Alternative Payment Methods Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Alternative Payment Methods
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        These usernames are shown on the Tip tab as backup payment options. Leave blank to hide this section.
                      </p>
                      
                      <div className="space-y-4">
                        {/* CashApp Tag */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CashApp Tag
                          </label>
                          <div className="relative w-full sm:w-64">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="text"
                              value={(cashAppTag || '').replace(/^\$/, '')}
                              onChange={(e) => {
                                const value = e.target.value.replace(/^\$/, '');
                                setCashAppTag(value ? `$${value}` : '');
                                setError(null);
                                setSuccess(false);
                              }}
                              placeholder="YourCashAppTag"
                              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Example: $YourName
                          </p>
                        </div>
                        
                        {/* Venmo Username */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Venmo Username
                          </label>
                          <div className="relative w-full sm:w-64">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <input
                              type="text"
                              value={(venmoUsername || '').replace(/^@/, '')}
                              onChange={(e) => {
                                const value = e.target.value.replace(/^@/, '');
                                const newUsername = value ? `@${value}` : '';
                                setVenmoUsername(newUsername);
                                // Auto-enable Venmo if username is entered, disable if cleared
                                if (newUsername && !paymentMethodEnabled.venmo) {
                                  setPaymentMethodEnabled(prev => ({ ...prev, venmo: true }));
                                } else if (!newUsername && paymentMethodEnabled.venmo) {
                                  setPaymentMethodEnabled(prev => ({ ...prev, venmo: false }));
                                }
                                setError(null);
                                setSuccess(false);
                              }}
                              placeholder="YourVenmoUsername"
                              className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                            />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Example: @YourName
                          </p>
                        </div>
                        
                        {/* Venmo Phone Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Venmo Phone Number (Optional - Recommended)
                          </label>
                          <input
                            type="tel"
                            value={venmoPhoneNumber}
                            onChange={(e) => {
                              // Only allow digits
                              const digits = e.target.value.replace(/\D/g, '');
                              setVenmoPhoneNumber(digits);
                              setError(null);
                              setSuccess(false);
                            }}
                            placeholder="9014977001"
                            maxLength={10}
                            className="w-full sm:w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                          />
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Your Venmo phone number (10 digits, no dashes). This prevents customers from needing to verify your phone number when making payments. If provided, the deep link will use your phone number instead of username, which is more reliable.
                          </p>
                        </div>
                      </div>
                      
                      {/* Payment Method Visibility Toggles */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Payment Method Buttons
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Choose which payment method buttons appear on the payment selection screen after users submit a request.
                        </p>
                        
                        <div className="space-y-4">
                          {/* Card/Stripe Toggle */}
                          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                                Card Payment (Stripe)
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Secure credit/debit card payments via Stripe
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={paymentMethodEnabled.card}
                                onChange={(e) => {
                                  setPaymentMethodEnabled(prev => ({ ...prev, card: e.target.checked }));
                                  setError(null);
                                  setSuccess(false);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#fcba00] dark:peer-focus:ring-[#fcba00] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#fcba00]"></div>
                            </label>
                          </div>
                          
                          {/* CashApp Toggle */}
                          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                                CashApp Payment
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Payments processed via Stripe Checkout (CashApp tag above is only for manual/fallback payments)
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={paymentMethodEnabled.cashapp}
                                onChange={(e) => {
                                  setPaymentMethodEnabled(prev => ({ ...prev, cashapp: e.target.checked }));
                                  setError(null);
                                  setSuccess(false);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#fcba00] dark:peer-focus:ring-[#fcba00] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#fcba00]"></div>
                            </label>
                          </div>
                          
                          {/* Venmo Toggle */}
                          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                                Venmo Payment
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {venmoUsername ? `Shows Venmo button with ${venmoUsername}` : 'Enter Venmo username above to enable'}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={paymentMethodEnabled.venmo && !!venmoUsername}
                                onChange={(e) => {
                                  if (venmoUsername) {
                                    setPaymentMethodEnabled(prev => ({ ...prev, venmo: e.target.checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }
                                }}
                                disabled={!venmoUsername}
                                className="sr-only peer"
                              />
                              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#fcba00] dark:peer-focus:ring-[#fcba00] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#fcba00] ${!venmoUsername ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Info box */}
                      {(!cashAppTag && !venmoUsername) && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              💡 Add your CashApp or Venmo to give customers an alternative way to tip you if they have trouble with card payments.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bidding Mode Section - Merged into Payments tab */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Bidding War Mode
                      </h3>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        How Bidding Mode Works
                      </h3>
                      <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                        <li>Users submit requests and place bids</li>
                        <li>Every 30 minutes, the highest bidder wins</li>
                        <li>Winner is charged, others&apos; authorizations are released</li>
                        <li>Winning request is played by the DJ</li>
                      </ul>
                    </div>

                    {/* Enable Bidding Toggle */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Enable Bidding War Mode
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          When enabled, requests go to bidding rounds instead of direct payment
                        </p>
                      </div>
                      <Switch
                        checked={biddingEnabled}
                        onCheckedChange={(checked) => {
                          setBiddingEnabled(checked);
                          setError(null);
                          setSuccess(false);
                        }}
                        className="data-[state=checked]:bg-[#fcba00] data-[state=checked]:border-[#fcba00] data-[state=checked]:hover:bg-[#e6a800] dark:data-[state=checked]:bg-[#fcba00] dark:data-[state=checked]:border-[#fcba00] dark:data-[state=checked]:hover:bg-[#e6a800] transition-colors"
                      />
                    </div>

                    {/* Starting Bid Amount */}
                    {biddingEnabled && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Starting Bid Amount <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          The default initial bid amount for new requests. This ensures bids never start at $0. (in dollars)
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            value={(startingBid / 100).toFixed(2)}
                            onChange={(e) => {
                              const value = Math.round(parseFloat(e.target.value) * 100) || 100;
                              setStartingBid(Math.max(100, value)); // Minimum $1.00
                              setError(null);
                              setSuccess(false);
                            }}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                            placeholder="5.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Current starting bid: ${(startingBid / 100).toFixed(2)} (stored as {startingBid} cents)
                        </p>
                      </div>
                    )}

                    {/* Minimum Bid Amount */}
                    {biddingEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Minimum Bid Amount
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          The minimum amount users must bid to beat the current winning bid (in dollars)
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            value={(minimumBid / 100).toFixed(2)}
                            onChange={(e) => {
                              const value = Math.round(parseFloat(e.target.value) * 100) || 100;
                              setMinimumBid(Math.max(100, value)); // Minimum $1.00
                              setError(null);
                              setSuccess(false);
                            }}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                            placeholder="5.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Current minimum: ${(minimumBid / 100).toFixed(2)} (stored as {minimumBid} cents)
                        </p>
                      </div>
                    )}

                    {/* Info when disabled */}
                    {!biddingEnabled && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Bidding mode is currently <strong>disabled</strong>. Requests will use the normal payment flow.
                        </p>
                      </div>
                    )}

                    {/* Link to bidding rounds admin */}
                    {biddingEnabled && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                          Manage Bidding Rounds
                        </h3>
                        <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">
                          View active rounds, winners, and statistics
                        </p>
                        <Link
                          href="/admin/bidding-rounds"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <Settings className="w-4 h-4" />
                          View Bidding Rounds
                        </Link>
                      </div>
                    )}
                  </div>
              ) : activeTab === 'content' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Header Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="header_artist_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Artist/DJ Name <span className="text-gray-500 dark:text-gray-400 font-normal">(Displayed in header)</span>
                      </Label>
                      <Input
                        id="header_artist_name"
                        value={headerFields.requests_header_artist_name}
                        onChange={(e) => handleHeaderFieldChange('requests_header_artist_name', e.target.value)}
                        placeholder={organization?.name || 'Your DJ Name'}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The name displayed prominently at the top of your requests page
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="artist_name_font" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name Font
                      </Label>
                      <select
                        id="artist_name_font"
                        value={artistNameFont}
                        onChange={(e) => {
                          setArtistNameFont(e.target.value);
                          setError(null);
                          setSuccess(false);
                          // Update preview iframe in real-time
                          setTimeout(() => updatePreviewIframe(), 100);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                      >
                        <option value='Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif' style={{ fontFamily: 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif' }}>Impact (Bold)</option>
                        <option value='"Arial Black", Arial, sans-serif' style={{ fontFamily: '"Arial Black", Arial, sans-serif' }}>Arial Black</option>
                        <option value='"Helvetica Neue", Helvetica, Arial, sans-serif' style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Helvetica Neue</option>
                        <option value='"Oswald", sans-serif' style={{ fontFamily: '"Oswald", sans-serif' }}>Oswald (Condensed)</option>
                        <option value='"Montserrat", sans-serif' style={{ fontFamily: '"Montserrat", sans-serif' }}>Montserrat</option>
                        <option value='"Poppins", sans-serif' style={{ fontFamily: '"Poppins", sans-serif' }}>Poppins</option>
                        <option value='"Roboto", sans-serif' style={{ fontFamily: '"Roboto", sans-serif' }}>Roboto</option>
                        <option value='"Open Sans", sans-serif' style={{ fontFamily: '"Open Sans", sans-serif' }}>Open Sans</option>
                        <option value='"Lato", sans-serif' style={{ fontFamily: '"Lato", sans-serif' }}>Lato</option>
                        <option value='"Nunito", sans-serif' style={{ fontFamily: '"Nunito", sans-serif' }}>Nunito</option>
                        <option value='"Ubuntu", sans-serif' style={{ fontFamily: '"Ubuntu", sans-serif' }}>Ubuntu</option>
                        <option value='"Source Sans Pro", sans-serif' style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>Source Sans Pro</option>
                        <option value='"Inter", sans-serif' style={{ fontFamily: '"Inter", sans-serif' }}>Inter</option>
                        <option value='"Work Sans", sans-serif' style={{ fontFamily: '"Work Sans", sans-serif' }}>Work Sans</option>
                        <option value='"DM Sans", sans-serif' style={{ fontFamily: '"DM Sans", sans-serif' }}>DM Sans</option>
                        <option value='"Space Grotesk", sans-serif' style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Space Grotesk</option>
                        <option value='"Bebas Neue", sans-serif' style={{ fontFamily: '"Bebas Neue", sans-serif' }}>Bebas Neue (Bold)</option>
                        <option value='"Anton", sans-serif' style={{ fontFamily: '"Anton", sans-serif' }}>Anton (Condensed)</option>
                        <option value='"Raleway", sans-serif' style={{ fontFamily: '"Raleway", sans-serif' }}>Raleway</option>
                        <option value='"PT Sans", sans-serif' style={{ fontFamily: '"PT Sans", sans-serif' }}>PT Sans</option>
                        <option value='"Josefin Sans", sans-serif' style={{ fontFamily: '"Josefin Sans", sans-serif' }}>Josefin Sans</option>
                        <option value='"Libre Franklin", sans-serif' style={{ fontFamily: '"Libre Franklin", sans-serif' }}>Libre Franklin</option>
                        <option value='"Quicksand", sans-serif' style={{ fontFamily: '"Quicksand", sans-serif' }}>Quicksand</option>
                        <option value='"Rubik", sans-serif' style={{ fontFamily: '"Rubik", sans-serif' }}>Rubik</option>
                        <option value='"Fira Sans", sans-serif' style={{ fontFamily: '"Fira Sans", sans-serif' }}>Fira Sans</option>
                        <option value='"Manrope", sans-serif' style={{ fontFamily: '"Manrope", sans-serif' }}>Manrope</option>
                        <option value='"Comfortaa", sans-serif' style={{ fontFamily: '"Comfortaa", sans-serif' }}>Comfortaa</option>
                        <option value='"Kanit", sans-serif' style={{ fontFamily: '"Kanit", sans-serif' }}>Kanit</option>
                        <option value='"Titillium Web", sans-serif' style={{ fontFamily: '"Titillium Web", sans-serif' }}>Titillium Web</option>
                        <option value='"Muli", sans-serif' style={{ fontFamily: '"Muli", sans-serif' }}>Muli</option>
                        <option value='"Exo 2", sans-serif' style={{ fontFamily: '"Exo 2", sans-serif' }}>Exo 2</option>
                        <option value='"Rajdhani", sans-serif' style={{ fontFamily: '"Rajdhani", sans-serif' }}>Rajdhani (Condensed)</option>
                        <option value='"Orbitron", sans-serif' style={{ fontFamily: '"Orbitron", sans-serif' }}>Orbitron (Futuristic)</option>
                        <option value='"Righteous", sans-serif' style={{ fontFamily: '"Righteous", sans-serif' }}>Righteous</option>
                        <option value='"Fredoka One", sans-serif' style={{ fontFamily: '"Fredoka One", sans-serif' }}>Fredoka One</option>
                        <option value='"Bungee", sans-serif' style={{ fontFamily: '"Bungee", sans-serif' }}>Bungee</option>
                        <option value='"Russo One", sans-serif' style={{ fontFamily: '"Russo One", sans-serif' }}>Russo One</option>
                        <option value='"Playfair Display", serif' style={{ fontFamily: '"Playfair Display", serif' }}>Playfair Display (Elegant)</option>
                        <option value='"Lora", serif' style={{ fontFamily: '"Lora", serif' }}>Lora (Serif)</option>
                        <option value='"Merriweather", serif' style={{ fontFamily: '"Merriweather", serif' }}>Merriweather (Serif)</option>
                        <option value='"Libre Baskerville", serif' style={{ fontFamily: '"Libre Baskerville", serif' }}>Libre Baskerville (Serif)</option>
                        <option value='"Crimson Text", serif' style={{ fontFamily: '"Crimson Text", serif' }}>Crimson Text (Serif)</option>
                        <option value='"Georgia", serif' style={{ fontFamily: '"Georgia", serif' }}>Georgia (Serif)</option>
                        <option value='"PT Serif", serif' style={{ fontFamily: '"PT Serif", serif' }}>PT Serif</option>
                        <option value='"Bitter", serif' style={{ fontFamily: '"Bitter", serif' }}>Bitter (Serif)</option>
                        <option value='"Arvo", serif' style={{ fontFamily: '"Arvo", serif' }}>Arvo (Serif)</option>
                        <option value='"Courier New", monospace' style={{ fontFamily: '"Courier New", monospace' }}>Courier New (Monospace)</option>
                        <option value='"Space Mono", monospace' style={{ fontFamily: '"Space Mono", monospace' }}>Space Mono (Monospace)</option>
                        <option value='"Roboto Mono", monospace' style={{ fontFamily: '"Roboto Mono", monospace' }}>Roboto Mono (Monospace)</option>
                        <option value='"Fira Code", monospace' style={{ fontFamily: '"Fira Code", monospace' }}>Fira Code (Monospace)</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Choose the font style for your display name
                      </p>
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name Casing
                      </Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setArtistNameTextTransform('uppercase');
                            setError(null);
                            setSuccess(false);
                            // Update preview iframe in real-time
                            setTimeout(() => updatePreviewIframe(), 100);
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            artistNameTextTransform === 'uppercase'
                              ? 'bg-[#fcba00] text-black shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          ALL CAPS
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setArtistNameTextTransform('lowercase');
                            setError(null);
                            setSuccess(false);
                            // Update preview iframe in real-time
                            setTimeout(() => updatePreviewIframe(), 100);
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            artistNameTextTransform === 'lowercase'
                              ? 'bg-[#fcba00] text-black shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          all lowercase
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setArtistNameTextTransform('none');
                            setError(null);
                            setSuccess(false);
                            // Update preview iframe in real-time
                            setTimeout(() => updatePreviewIframe(), 100);
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            artistNameTextTransform === 'none'
                              ? 'bg-[#fcba00] text-black shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          Normal Case
                        </button>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                        <h1 
                          className="font-black text-gray-900 dark:text-white tracking-tight text-3xl"
                          style={{ 
                            fontFamily: artistNameFont,
                            textTransform: artistNameTextTransform,
                            color: artistNameColor,
                            letterSpacing: `${artistNameKerning}px`,
                            textShadow: artistNameTextShadow
                          } as React.CSSProperties}
                        >
                          {(() => {
                            const previewText = headerFields.requests_header_artist_name || organization?.name || 'Your Display Name';
                            // Apply the transform for preview
                            if (artistNameTextTransform === 'uppercase') {
                              return previewText.toUpperCase();
                            } else if (artistNameTextTransform === 'lowercase') {
                              return previewText.toLowerCase();
                            }
                            return previewText;
                          })()}
                        </h1>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Choose how the display name is cased
                      </p>
                    </div>
                    
                    {/* Display Name Color */}
                    <div>
                      <Label htmlFor="artist_name_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name Color
                      </Label>
                      <div className="flex items-center gap-3">
                        <input
                          id="artist_name_color"
                          type="color"
                          value={artistNameColor}
                          onChange={(e) => {
                            setArtistNameColor(e.target.value);
                            setError(null);
                            setSuccess(false);
                            // Update preview iframe in real-time
                            setTimeout(() => updatePreviewIframe(), 100);
                          }}
                          className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={artistNameColor}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                              setArtistNameColor(value);
                              setError(null);
                              setSuccess(false);
                              // Update preview iframe in real-time
                              setTimeout(() => updatePreviewIframe(), 100);
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                          placeholder="#ffffff"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Choose the color of the display name text
                      </p>
                    </div>
                    
                    {/* Display Name Kerning (Letter Spacing) */}
                    <div>
                      <Label htmlFor="artist_name_kerning" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Letter Spacing (Kerning): {artistNameKerning}px
                      </Label>
                      <input
                        id="artist_name_kerning"
                        type="range"
                        min="-5"
                        max="20"
                        step="0.5"
                        value={artistNameKerning}
                        onChange={(e) => {
                          setArtistNameKerning(parseFloat(e.target.value));
                          setError(null);
                          setSuccess(false);
                          // Update preview iframe in real-time
                          setTimeout(() => updatePreviewIframe(), 100);
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Tighter</span>
                        <span>Normal</span>
                        <span>Wider</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Adjust the spacing between letters
                      </p>
                    </div>
                    
                    {/* Stroke (Outline) Controls */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Text Stroke (Outline)
                        </Label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={artistNameStrokeEnabled}
                            onChange={(e) => {
                              setArtistNameStrokeEnabled(e.target.checked);
                              setError(null);
                              setSuccess(false);
                              // Update preview iframe in real-time
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#fcba00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fcba00]"></div>
                        </label>
                      </div>
                      {artistNameStrokeEnabled && (
                        <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div>
                            <Label htmlFor="stroke_width" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Stroke Width: {artistNameStrokeWidth}px
                            </Label>
                            <input
                              id="stroke_width"
                              type="range"
                              min="1"
                              max="10"
                              value={artistNameStrokeWidth}
                              onChange={(e) => {
                                setArtistNameStrokeWidth(parseInt(e.target.value));
                                setError(null);
                                setSuccess(false);
                                // Update preview iframe in real-time
                                setTimeout(() => updatePreviewIframe(), 100);
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="stroke_color" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Stroke Color
                            </Label>
                            <div className="flex items-center gap-3">
                              <input
                                id="stroke_color"
                                type="color"
                                value={artistNameStrokeColor}
                                onChange={(e) => {
                                  setArtistNameStrokeColor(e.target.value);
                                  setError(null);
                                  setSuccess(false);
                                  // Update preview iframe in real-time
                                  setTimeout(() => updatePreviewIframe(), 100);
                                }}
                                className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                              />
                              <input
                                type="text"
                                value={artistNameStrokeColor}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                    setArtistNameStrokeColor(value);
                                    setError(null);
                                    setSuccess(false);
                                    // Update preview iframe in real-time
                                    setTimeout(() => updatePreviewIframe(), 100);
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Drop Shadow Controls */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Drop Shadow
                        </Label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={artistNameShadowEnabled}
                            onChange={(e) => {
                              setArtistNameShadowEnabled(e.target.checked);
                              setError(null);
                              setSuccess(false);
                              // Update preview iframe in real-time
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#fcba00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fcba00]"></div>
                        </label>
                      </div>
                      {artistNameShadowEnabled && (
                        <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="shadow_x" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                X Offset: {artistNameShadowXOffset}px
                              </Label>
                              <input
                                id="shadow_x"
                                type="range"
                                min="-20"
                                max="20"
                                value={artistNameShadowXOffset}
                                onChange={(e) => {
                                  setArtistNameShadowXOffset(parseInt(e.target.value));
                                  setError(null);
                                  setSuccess(false);
                                  // Update preview iframe in real-time
                                  setTimeout(() => updatePreviewIframe(), 100);
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                              />
                            </div>
                            <div>
                              <Label htmlFor="shadow_y" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Y Offset: {artistNameShadowYOffset}px
                              </Label>
                              <input
                                id="shadow_y"
                                type="range"
                                min="-20"
                                max="20"
                                value={artistNameShadowYOffset}
                                onChange={(e) => {
                                  setArtistNameShadowYOffset(parseInt(e.target.value));
                                  setError(null);
                                  setSuccess(false);
                                  // Update preview iframe in real-time
                                  setTimeout(() => updatePreviewIframe(), 100);
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="shadow_blur" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Blur: {artistNameShadowBlur}px
                            </Label>
                            <input
                              id="shadow_blur"
                              type="range"
                              min="0"
                              max="30"
                              value={artistNameShadowBlur}
                              onChange={(e) => {
                                setArtistNameShadowBlur(parseInt(e.target.value));
                                setError(null);
                                setSuccess(false);
                                // Update preview iframe in real-time
                                setTimeout(() => updatePreviewIframe(), 100);
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shadow_color" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Shadow Color
                            </Label>
                            <input
                              id="shadow_color"
                              type="text"
                              value={artistNameShadowColor}
                              onChange={(e) => {
                                setArtistNameShadowColor(e.target.value);
                                setError(null);
                                setSuccess(false);
                                // Update preview iframe in real-time
                                setTimeout(() => updatePreviewIframe(), 100);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                              placeholder="rgba(0, 0, 0, 0.8)"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Use rgba() format, e.g., rgba(0, 0, 0, 0.8)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Subtitle (Location) Styling Controls */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Subtitle (Location) Styling
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Customize how the location/subtitle appears below the display name
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Label htmlFor="show_subtitle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Show Subtitle
                          </Label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id="show_subtitle"
                              checked={showSubtitle}
                              onChange={(e) => {
                                setShowSubtitle(e.target.checked);
                                setError(null);
                                setSuccess(false);
                                setTimeout(() => updatePreviewIframe(), 100);
                              }}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#fcba00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fcba00]"></div>
                          </label>
                        </div>
                      </div>
                      
                      {showSubtitle && (
                        <>
                      {/* Subtitle Type Selection */}
                      <div className="mb-6">
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subtitle Content
                        </Label>
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitleType('location');
                              setError(null);
                              setSuccess(false);
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              subtitleType === 'location'
                                ? 'bg-[#fcba00] text-black shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            City & State
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitleType('venue');
                              setError(null);
                              setSuccess(false);
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              subtitleType === 'venue'
                                ? 'bg-[#fcba00] text-black shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            Venue
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitleType('custom');
                              setError(null);
                              setSuccess(false);
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              subtitleType === 'custom'
                                ? 'bg-[#fcba00] text-black shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            Custom Text
                          </button>
                        </div>
                        
                        {/* Venue input - shown when venue is selected */}
                        {subtitleType === 'venue' && (
                          <div className="mt-3">
                            <Input
                              placeholder="Enter venue name"
                              value={subtitleVenue}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setSubtitleVenue(newValue);
                                setError(null);
                                setSuccess(false);
                                // Pass the new value directly to preview to avoid state timing issues
                                setTimeout(() => updatePreviewIframe(newValue), 100);
                              }}
                              className="w-full"
                            />
                          </div>
                        )}
                        
                        {/* Custom text input - shown when custom is selected */}
                        {subtitleType === 'custom' && (
                          <div className="mt-3">
                            <Input
                              placeholder="Enter custom subtitle text"
                              value={subtitleCustomText}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setSubtitleCustomText(newValue);
                                setError(null);
                                setSuccess(false);
                                // Pass the new value directly to preview to avoid state timing issues
                                setTimeout(() => updatePreviewIframe(newValue), 100);
                              }}
                              className="w-full"
                            />
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Choose what to display as the subtitle: City & State (from saved location), Venue name, or Custom text
                        </p>
                      </div>
                      
                      {/* Subtitle Font */}
                      <div className="mb-6">
                        <Label htmlFor="subtitle_font" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subtitle Font {!subtitleFontManuallyChanged && <span className="text-xs text-gray-500">(uses Display Name font by default)</span>}
                        </Label>
                        <FontSelect
                          id="subtitle_font"
                          value={effectiveSubtitleFont}
                          onChange={(value) => {
                            setSubtitleFont(value);
                            setSubtitleFontManuallyChanged(true);
                            setError(null);
                            setSuccess(false);
                            setTimeout(() => updatePreviewIframe(), 100);
                          }}
                          options={FONT_OPTIONS}
                          placeholder="Select a font..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Choose the font style for your subtitle
                        </p>
                      </div>
                      
                      {/* Subtitle Casing */}
                      <div className="mb-6">
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subtitle Casing
                        </Label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitleTextTransform('uppercase');
                              setError(null);
                              setSuccess(false);
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              subtitleTextTransform === 'uppercase'
                                ? 'bg-[#fcba00] text-black shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            ALL CAPS
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitleTextTransform('lowercase');
                              setError(null);
                              setSuccess(false);
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              subtitleTextTransform === 'lowercase'
                                ? 'bg-[#fcba00] text-black shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            all lowercase
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubtitleTextTransform('none');
                              setError(null);
                              setSuccess(false);
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              subtitleTextTransform === 'none'
                                ? 'bg-[#fcba00] text-black shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            Normal Case
                          </button>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                          <p 
                            className="font-black text-gray-900 dark:text-white tracking-tight text-2xl"
                            style={{ 
                              fontFamily: effectiveSubtitleFont,
                              textTransform: subtitleTextTransform,
                              color: subtitleColor,
                              letterSpacing: `${subtitleKerning}px`,
                              textShadow: subtitleTextShadow
                            } as React.CSSProperties}
                          >
                            {(() => {
                              const previewText = getSubtitleText() || (subtitleType === 'location' ? 'Memphis, TN' : subtitleType === 'venue' ? 'Venue Name' : 'Custom Text');
                              if (subtitleTextTransform === 'uppercase') {
                                return previewText.toUpperCase();
                              } else if (subtitleTextTransform === 'lowercase') {
                                return previewText.toLowerCase();
                              }
                              return previewText;
                            })()}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Choose how the subtitle is cased
                        </p>
                      </div>
                      
                      {/* Subtitle Color */}
                      <div className="mb-6">
                        <Label htmlFor="subtitle_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subtitle Color
                        </Label>
                        <div className="flex items-center gap-3">
                          <input
                            id="subtitle_color"
                            type="color"
                            value={subtitleColor}
                            onChange={(e) => {
                              setSubtitleColor(e.target.value);
                              setError(null);
                              setSuccess(false);
                              setTimeout(() => updatePreviewIframe(), 100);
                            }}
                            className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                          />
                          <input
                            type="text"
                            value={subtitleColor}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                setSubtitleColor(value);
                                setError(null);
                                setSuccess(false);
                                setTimeout(() => updatePreviewIframe(), 100);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                            placeholder="#ffffff"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Choose the color of the subtitle text
                        </p>
                      </div>
                      
                      {/* Subtitle Kerning */}
                      <div className="mb-6">
                        <Label htmlFor="subtitle_kerning" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Letter Spacing (Kerning): {subtitleKerning}px
                        </Label>
                        <input
                          id="subtitle_kerning"
                          type="range"
                          min="-5"
                          max="20"
                          step="0.5"
                          value={subtitleKerning}
                          onChange={(e) => {
                            setSubtitleKerning(parseFloat(e.target.value));
                            setError(null);
                            setSuccess(false);
                            setTimeout(() => updatePreviewIframe(), 100);
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>Tighter</span>
                          <span>Normal</span>
                          <span>Wider</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Adjust the spacing between letters
                        </p>
                      </div>
                      
                      {/* Subtitle Stroke Controls */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Text Stroke (Outline)
                          </Label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={subtitleStrokeEnabled}
                              onChange={(e) => {
                                setSubtitleStrokeEnabled(e.target.checked);
                                setError(null);
                                setSuccess(false);
                                setTimeout(() => updatePreviewIframe(), 100);
                              }}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#fcba00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fcba00]"></div>
                          </label>
                        </div>
                        {subtitleStrokeEnabled && (
                          <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            <div>
                              <Label htmlFor="subtitle_stroke_width" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Stroke Width: {subtitleStrokeWidth}px
                              </Label>
                              <input
                                id="subtitle_stroke_width"
                                type="range"
                                min="1"
                                max="10"
                                value={subtitleStrokeWidth}
                                onChange={(e) => {
                                  setSubtitleStrokeWidth(parseInt(e.target.value));
                                  setError(null);
                                  setSuccess(false);
                                  setTimeout(() => updatePreviewIframe(), 100);
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                              />
                            </div>
                            <div>
                              <Label htmlFor="subtitle_stroke_color" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Stroke Color
                              </Label>
                              <div className="flex items-center gap-3">
                                <input
                                  id="subtitle_stroke_color"
                                  type="color"
                                  value={subtitleStrokeColor}
                                  onChange={(e) => {
                                    setSubtitleStrokeColor(e.target.value);
                                    setError(null);
                                    setSuccess(false);
                                    setTimeout(() => updatePreviewIframe(), 100);
                                  }}
                                  className="w-12 h-12 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                                />
                                <input
                                  type="text"
                                  value={subtitleStrokeColor}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                      setSubtitleStrokeColor(value);
                                      setError(null);
                                      setSuccess(false);
                                      setTimeout(() => updatePreviewIframe(), 100);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Subtitle Drop Shadow Controls */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Drop Shadow
                          </Label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={subtitleShadowEnabled}
                              onChange={(e) => {
                                setSubtitleShadowEnabled(e.target.checked);
                                setError(null);
                                setSuccess(false);
                                setTimeout(() => updatePreviewIframe(), 100);
                              }}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#fcba00] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fcba00]"></div>
                          </label>
                        </div>
                        {subtitleShadowEnabled && (
                          <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="subtitle_shadow_x" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  X Offset: {subtitleShadowXOffset}px
                                </Label>
                                <input
                                  id="subtitle_shadow_x"
                                  type="range"
                                  min="-20"
                                  max="20"
                                  value={subtitleShadowXOffset}
                                  onChange={(e) => {
                                    setSubtitleShadowXOffset(parseInt(e.target.value));
                                    setError(null);
                                    setSuccess(false);
                                    setTimeout(() => updatePreviewIframe(), 100);
                                  }}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                                />
                              </div>
                              <div>
                                <Label htmlFor="subtitle_shadow_y" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Y Offset: {subtitleShadowYOffset}px
                                </Label>
                                <input
                                  id="subtitle_shadow_y"
                                  type="range"
                                  min="-20"
                                  max="20"
                                  value={subtitleShadowYOffset}
                                  onChange={(e) => {
                                    setSubtitleShadowYOffset(parseInt(e.target.value));
                                    setError(null);
                                    setSuccess(false);
                                    setTimeout(() => updatePreviewIframe(), 100);
                                  }}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="subtitle_shadow_blur" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Blur: {subtitleShadowBlur}px
                              </Label>
                              <input
                                id="subtitle_shadow_blur"
                                type="range"
                                min="0"
                                max="30"
                                value={subtitleShadowBlur}
                                onChange={(e) => {
                                  setSubtitleShadowBlur(parseInt(e.target.value));
                                  setError(null);
                                  setSuccess(false);
                                  setTimeout(() => updatePreviewIframe(), 100);
                                }}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fcba00]"
                              />
                            </div>
                            <div>
                              <Label htmlFor="subtitle_shadow_color" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Shadow Color
                              </Label>
                              <input
                                id="subtitle_shadow_color"
                                type="text"
                                value={subtitleShadowColor}
                                onChange={(e) => {
                                  setSubtitleShadowColor(e.target.value);
                                  setError(null);
                                  setSuccess(false);
                                  setTimeout(() => updatePreviewIframe(), 100);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                placeholder="rgba(0, 0, 0, 0.8)"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Use rgba() format, e.g., rgba(0, 0, 0, 0.8)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                        </>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="header_location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location/Venue
                      </Label>
                      <Input
                        id="header_location"
                        value={headerFields.requests_header_location}
                        onChange={(e) => handleHeaderFieldChange('requests_header_location', e.target.value)}
                        placeholder="Chicago, IL"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Optional: Location or venue name displayed in the header
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="header_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date
                      </Label>
                      <Input
                        id="header_date"
                        value={headerFields.requests_header_date}
                        onChange={(e) => handleHeaderFieldChange('requests_header_date', e.target.value)}
                        placeholder={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Optional: Event date displayed in the header
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="main_heading" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Main Heading
                      </Label>
                      <Input
                        id="main_heading"
                        value={headerFields.requests_main_heading}
                        onChange={(e) => handleHeaderFieldChange('requests_main_heading', e.target.value)}
                        placeholder="What would you like to request?"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The main heading displayed on the requests page
                      </p>
                    </div>
                  </div>
                  
                  {/* Note about standard labels */}
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">ℹ️ Standard Labels:</span> Form field labels use consistent, industry-standard terminology to ensure the best user experience.
                    </p>
                  </div>
                </div>
              ) : activeTab === 'features' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Feature Toggles
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Show Audio Upload Option</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Display the audio file upload option on the requests page</p>
                      </div>
                      <Switch
                        checked={featureToggles.requests_show_audio_upload}
                        onCheckedChange={(checked) => handleFeatureToggleChange('requests_show_audio_upload', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Show Fast Track Option</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allow users to pay extra to play their request immediately</p>
                      </div>
                      <Switch
                        checked={featureToggles.requests_show_fast_track}
                        onCheckedChange={(checked) => handleFeatureToggleChange('requests_show_fast_track', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Show Next Song Option</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allow users to pay extra to play their request as the next song</p>
                      </div>
                      <Switch
                        checked={featureToggles.requests_show_next_song}
                        onCheckedChange={(checked) => handleFeatureToggleChange('requests_show_next_song', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Show Bundle Discount</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Display bundle discount options for multiple song requests</p>
                      </div>
                      <Switch
                        checked={featureToggles.requests_show_bundle_discount}
                        onCheckedChange={(checked) => handleFeatureToggleChange('requests_show_bundle_discount', checked)}
                      />
                    </div>
                  </div>
                </div>
              ) : activeTab === 'assistant' ? (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                      Assistant Settings
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white mb-1">Enable Assistant Widget</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Show the AI assistant chat widget on your requests page to help customers with questions
                          </p>
                        </div>
                        <Switch
                          checked={assistantEnabled}
                          onCheckedChange={(checked) => {
                            setAssistantEnabled(checked);
                            setError(null);
                            setSuccess(false);
                          }}
                        />
                      </div>
                      
                      {assistantEnabled && (
                        <>
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>About the Assistant:</strong> The assistant helps customers with questions about your business and how to use TipJar. 
                              It uses AI to answer questions using information from your page settings, including your display name, location, and social media links.
                            </p>
                          </div>

                          {/* Custom Prompt Section */}
                          <div className="mt-6 space-y-2">
                            <label className="block text-sm font-medium text-gray-900 dark:text-white">
                              Custom System Prompt (Optional)
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              Customize the assistant&apos;s behavior and knowledge. Leave empty to use the default prompt. 
                              You can use placeholders like {'{artistName}'}, {'{location}'}, {'{organizationName}'} which will be replaced automatically.
                            </p>
                            <Textarea
                              value={assistantCustomPrompt}
                              onChange={(e) => {
                                setAssistantCustomPrompt(e.target.value);
                                setError(null);
                                setSuccess(false);
                              }}
                              placeholder="Leave empty to use default prompt..."
                              className="min-h-[200px] font-mono text-sm"
                              rows={10}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              The default prompt includes information about TipJar, your organization, and how to answer questions. 
                              Your custom prompt will replace the entire default prompt, so make sure to include all necessary context.
                            </p>
                          </div>

                          {/* Function Availability Section */}
                          <div className="mt-6 space-y-4">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Available Functions
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                Control which capabilities the assistant has. Disable functions you don&apos;t want customers to access.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">Check Request Status</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow users to ask &quot;Has my song been played?&quot; or &quot;When did my song play?&quot;
                                  </p>
                                </div>
                                <Switch
                                  checked={assistantFunctions.enable_user_status}
                                  onCheckedChange={(checked) => {
                                    setAssistantFunctions(prev => ({ ...prev, enable_user_status: checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">Show All Requests</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow users to ask &quot;What songs have been requested?&quot;
                                  </p>
                                </div>
                                <Switch
                                  checked={assistantFunctions.enable_all_requests}
                                  onCheckedChange={(checked) => {
                                    setAssistantFunctions(prev => ({ ...prev, enable_all_requests: checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">Show Queue</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow users to ask &quot;What&apos;s in the queue?&quot; or &quot;What songs are waiting?&quot;
                                  </p>
                                </div>
                                <Switch
                                  checked={assistantFunctions.enable_queue}
                                  onCheckedChange={(checked) => {
                                    setAssistantFunctions(prev => ({ ...prev, enable_queue: checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">Show Played Songs</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow users to ask &quot;What songs have been played?&quot;
                                  </p>
                                </div>
                                <Switch
                                  checked={assistantFunctions.enable_played}
                                  onCheckedChange={(checked) => {
                                    setAssistantFunctions(prev => ({ ...prev, enable_played: checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">Show Popular Songs</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow users to ask &quot;What&apos;s the most popular song?&quot; or &quot;What&apos;s the most requested song?&quot;
                                  </p>
                                </div>
                                <Switch
                                  checked={assistantFunctions.enable_popular}
                                  onCheckedChange={(checked) => {
                                    setAssistantFunctions(prev => ({ ...prev, enable_popular: checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">Show Statistics</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow users to ask &quot;How many requests have been made?&quot;
                                  </p>
                                </div>
                                <Switch
                                  checked={assistantFunctions.enable_count}
                                  onCheckedChange={(checked) => {
                                    setAssistantFunctions(prev => ({ ...prev, enable_count: checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">Search Songs</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow users to ask &quot;Has [song name] been requested?&quot; or &quot;Who requested [song name]?&quot;
                                  </p>
                                </div>
                                <Switch
                                  checked={assistantFunctions.enable_search}
                                  onCheckedChange={(checked) => {
                                    setAssistantFunctions(prev => ({ ...prev, enable_search: checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons Section */}
                          <div className="mt-6 space-y-4">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Quick Action Buttons
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                Show quick action buttons in the chat widget that allow users to quickly ask common questions.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white">Show Quick Actions</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Enable quick action buttons in the chat widget
                                  </p>
                                </div>
                                <Switch
                                  checked={assistantQuickActions.show_quick_actions}
                                  onCheckedChange={(checked) => {
                                    setAssistantQuickActions(prev => ({ ...prev, show_quick_actions: checked }));
                                    setError(null);
                                    setSuccess(false);
                                  }}
                                />
                              </div>

                              {assistantQuickActions.show_quick_actions && (
                                <>
                                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ml-4">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-gray-900 dark:text-white">&quot;Has my song played yet?&quot;</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Show button to quickly check if user&apos;s song has been played
                                      </p>
                                    </div>
                                    <Switch
                                      checked={assistantQuickActions.quick_action_has_played}
                                      onCheckedChange={(checked) => {
                                        setAssistantQuickActions(prev => ({ ...prev, quick_action_has_played: checked }));
                                        setError(null);
                                        setSuccess(false);
                                      }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ml-4">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-gray-900 dark:text-white">&quot;When will my song play?&quot;</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Show button to quickly check when user&apos;s song will play
                                      </p>
                                    </div>
                                    <Switch
                                      checked={assistantQuickActions.quick_action_when_will_play}
                                      onCheckedChange={(checked) => {
                                        setAssistantQuickActions(prev => ({ ...prev, quick_action_when_will_play: checked }));
                                        setError(null);
                                        setSuccess(false);
                                      }}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeTab === 'advanced' ? (
                <div className="space-y-6">
                  {/* Custom URL Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-[#fcba00]" />
                      Your Page URL
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="custom_slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Custom URL Slug
                        </Label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">tipjar.live/</span>
                          <Input
                            id="custom_slug"
                            value={organization?.slug || ''}
                            onChange={async (e) => {
                              const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                              if (newSlug !== organization?.slug) {
                                // Update local state immediately for UI feedback
                                setOrganization((prev: any) => prev ? { ...prev, slug: newSlug } : prev);
                              }
                            }}
                            onBlur={async (e) => {
                              const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                              if (newSlug && newSlug.length >= 3 && newSlug !== organization?.slug) {
                                try {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  const response = await fetch('/api/organizations/update-slug', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${session?.access_token}`
                                    },
                                    body: JSON.stringify({ slug: newSlug })
                                  });
                                  
                                  const result = await response.json();
                                  
                                  if (!response.ok) {
                                    setError(result.error || 'Failed to update URL');
                                    // Revert to original slug
                                    fetchOrganization();
                                  } else {
                                    setSuccess(true);
                                    setTimeout(() => setSuccess(false), 3000);
                                  }
                                } catch (err: any) {
                                  setError(err.message || 'Failed to update URL');
                                  fetchOrganization();
                                }
                              }
                            }}
                            placeholder="your-custom-slug"
                            className="flex-1"
                            pattern="[a-z0-9-]+"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Choose a custom URL for your requests page. Only lowercase letters, numbers, and hyphens allowed. Minimum 3 characters.
                        </p>
                        {organization?.slug && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-[#fcba00]/10 to-[#fcba00]/5 border border-[#fcba00]/30 rounded-lg">
                            <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">Your live page URL:</p>
                            <a
                              href={`https://tipjar.live/${organization.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#fcba00] hover:text-[#d99f00] hover:underline break-all font-mono"
                            >
                              https://tipjar.live/{organization.slug}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* SEO & Metadata Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                      SEO & Metadata
                    </h2>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="page_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Page Title <span className="text-gray-500 dark:text-gray-400 font-normal">(SEO & Browser Tab)</span>
                      </Label>
                      <Input
                        id="page_title"
                        value={seoFields.requests_page_title}
                        onChange={(e) => handleSeoFieldChange('requests_page_title', e.target.value)}
                        placeholder="Request a Song or Shoutout | M10 DJ Company"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The title shown in browser tabs and search engine results (recommended: 50-60 characters)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="page_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Meta Description <span className="text-gray-500 dark:text-gray-400 font-normal">(SEO)</span>
                      </Label>
                      <Textarea
                        id="page_description"
                        value={seoFields.requests_page_description}
                        onChange={(e) => handleSeoFieldChange('requests_page_description', e.target.value)}
                        placeholder="Request a song or shoutout for your event..."
                        className="w-full min-h-[100px]"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Description shown in search engine results (recommended: 150-160 characters)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="default_request_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Request Type
                      </Label>
                      <select
                        id="default_request_type"
                        value={seoFields.requests_default_request_type}
                        onChange={(e) => handleSeoFieldChange('requests_default_request_type', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                      >
                        <option value="song_request">Song Request</option>
                        <option value="shoutout">Shoutout</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The request type selected by default when the page loads
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              ) : null}
            </div>

            {/* Sidebar - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block space-y-6">
              {/* Quick Preview - Desktop only */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 sticky top-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#fcba00]" />
                  Live Preview
                </h3>
                
                {/* Device selector */}
                <div className="flex items-center justify-center gap-1 mb-3 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      previewDevice === 'mobile'
                        ? 'bg-[#fcba00] text-black shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Mobile (375px)"
                  >
                    📱
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('tablet')}
                    className={`flex-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      previewDevice === 'tablet'
                        ? 'bg-[#fcba00] text-black shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Tablet (768px)"
                  >
                    📱
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex-1 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      previewDevice === 'desktop'
                        ? 'bg-[#fcba00] text-black shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="Desktop (1280px)"
                  >
                    🖥️
                  </button>
                </div>
                
                <div className="flex gap-2 mb-3">
                  <Link
                    href={requestsPageUrl}
                    target="_blank"
                    className="flex-1 text-center px-3 py-2 bg-[#fcba00] hover:bg-[#d99f00] text-black rounded-lg transition-colors text-sm font-medium shadow-md"
                    onClick={() => {
                      window.open(requestsPageUrl, '_blank');
                      return false;
                    }}
                  >
                    <ExternalLink className="w-4 h-4 inline mr-1" />
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const iframe = document.getElementById('live-preview-iframe') as HTMLIFrameElement;
                      if (iframe && organization?.slug) {
                        // Update timestamp and refresh
                        setOrganization((prev: any) => prev ? { ...prev, _lastUpdated: Date.now() } : prev);
                        setTimeout(() => updatePreviewIframe(), 100);
                      }
                    }}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                  >
                    ↻
                  </button>
                </div>
                
                {/* Live iframe preview - renders the actual page */}
                <div 
                  className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex justify-center items-start py-4"
                  style={{ height: previewDevice === 'mobile' ? '580px' : previewDevice === 'tablet' ? '500px' : '450px' }}
                >
                  {previewDevice === 'mobile' ? (
                    // iPhone frame for mobile preview
                    <div 
                      className="relative bg-gray-900 rounded-[40px] p-2 shadow-2xl"
                      style={{ 
                        width: '220px',
                        height: '450px',
                        border: '3px solid #1a1a1a'
                      }}
                    >
                      {/* Dynamic Island / Notch */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
                      
                      {/* Screen */}
                      <div 
                        className="relative bg-black rounded-[32px] overflow-hidden"
                        style={{ width: '100%', height: '100%' }}
                      >
                        <iframe
                          id="live-preview-iframe"
                          src={getPreviewUrl()}
                          className="border-0 bg-black"
                          style={{ 
                            transform: 'scale(0.57)',
                            transformOrigin: 'top left',
                            width: '375px',
                            height: '812px',
                            borderRadius: '32px'
                          }}
                          title="Live Preview"
                        />
                      </div>
                      
                      {/* Home indicator */}
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-600 rounded-full" />
                    </div>
                  ) : previewDevice === 'tablet' ? (
                    // iPad frame for tablet preview
                    <div 
                      className="relative bg-gray-800 rounded-[20px] p-2 shadow-2xl"
                      style={{ 
                        width: '320px',
                        height: '430px',
                        border: '3px solid #2a2a2a'
                      }}
                    >
                      {/* Camera */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full z-10" />
                      
                      {/* Screen */}
                      <div 
                        className="relative bg-black rounded-[12px] overflow-hidden"
                        style={{ width: '100%', height: '100%' }}
                      >
                        <iframe
                          id="live-preview-iframe"
                          src={getPreviewUrl()}
                          className="border-0 bg-black"
                          style={{ 
                            transform: 'scale(0.41)',
                            transformOrigin: 'top left',
                            width: '768px',
                            height: '1024px'
                          }}
                          title="Live Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    // Desktop: iPhone frame with animated background
                    <>
                      <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes gradientShift {
                          0% { background-position: 0% 50%; }
                          50% { background-position: 100% 50%; }
                          100% { background-position: 0% 50%; }
                        }
                        @keyframes float {
                          0%, 100% { transform: translateY(0px); }
                          50% { transform: translateY(-10px); }
                        }
                        .desktop-preview-bg {
                          background: linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 25%, transparent 50%, ${accentColor}05 75%, ${accentColor}15 100%);
                          background-size: 200% 200%;
                          animation: gradientShift 8s ease infinite;
                        }
                        .floating-phone {
                          animation: float 3s ease-in-out infinite;
                        }
                      `}} />
                      <div 
                        className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg desktop-preview-bg"
                        style={{ minHeight: '580px' }}
                      >
                        {/* Floating iPhone frame */}
                        <div className="relative z-10 floating-phone">
                          {/* iPhone frame */}
                          <div 
                            className="relative bg-gray-900 rounded-[40px] p-2 shadow-2xl"
                            style={{ 
                              width: '280px',
                              height: '570px',
                              border: '4px solid #1a1a1a',
                              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
                            }}
                          >
                            {/* Dynamic Island / Notch */}
                            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-10" />
                            
                            {/* Screen */}
                            <div 
                              className="relative bg-black rounded-[32px] overflow-hidden"
                              style={{ width: '100%', height: '100%' }}
                            >
                              <iframe
                                id="live-preview-iframe"
                                src={getPreviewUrl() || `/${organization?.slug}/requests?preview=true&t=${organization?._lastUpdated || Date.now()}&accentColor=${encodeURIComponent(accentColor)}&buttonStyle=${buttonStyle}&themeMode=${themeMode}&backgroundType=${backgroundType}`}
                                className="border-0 bg-black"
                                style={{ 
                                  transform: 'scale(0.73)',
                                  transformOrigin: 'top left',
                                  width: '375px',
                                  height: '812px',
                                  borderRadius: '32px'
                                }}
                                title="Live Preview"
                              />
                            </div>
                            
                            {/* Home indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-600 rounded-full" />
                          </div>
                        </div>
                        
                        {/* Subtle glow effect behind phone */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at center, ${accentColor}20 0%, transparent 70%)`,
                            filter: 'blur(40px)',
                            zIndex: 1
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>This is the actual live page (scaled 50%)</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>Click &quot;Refresh&quot; after saving to see changes</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>Live page updates within 5 seconds of save</span>
                  </p>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  How It Works
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Cover photos appear in order: Primary → Artist → Venue → Default</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Social links display as minimal icons in header and hero</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>If no custom links are set, default Instagram & Facebook links are shown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Images should be at least 1920x800px for best quality</span>
                  </li>
                </ul>
              </div>

              {/* Save Button - Desktop Sidebar Only */}
              <div className="sticky top-8 hidden lg:block">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#fcba00] text-black rounded-lg hover:bg-[#d99f00] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save All Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        
        {/* Mobile Floating Preview + Save */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          {/* Expandable Preview Panel */}
          {showMobilePreview && (
            <div className="bg-gray-900 border-t border-gray-700 p-3 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#fcba00]" />
                  Live Preview
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={requestsPageUrl}
                    target="_blank"
                    className="px-3 py-1.5 bg-[#fcba00] text-black rounded-lg text-xs font-medium"
                    onClick={() => {
                      window.open(requestsPageUrl, '_blank');
                      return false;
                    }}
                  >
                    Open Full
                  </Link>
                  <button
                    onClick={() => setShowMobilePreview(false)}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Mini iPhone Preview */}
              <div className="flex justify-center">
                <div 
                  className="relative bg-black rounded-[24px] p-1.5 shadow-xl"
                  style={{ width: '160px', height: '320px', border: '2px solid #333' }}
                >
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10" />
                  <div className="relative bg-black rounded-[20px] overflow-hidden w-full h-full">
                    <iframe
                      src={`/${organization?.slug}/requests?preview=true&t=${organization?._lastUpdated || Date.now()}&accentColor=${encodeURIComponent(accentColor)}&buttonStyle=${buttonStyle}&themeMode=${themeMode}`}
                      className="border-0 bg-black"
                      style={{ 
                        transform: 'scale(0.42)',
                        transformOrigin: 'top left',
                        width: '375px',
                        height: '750px',
                        borderRadius: '20px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom Action Bar */}
          <div className="p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 flex gap-2">
            {/* Preview Toggle */}
            <button
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                showMobilePreview 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              {showMobilePreview ? 'Hide' : 'Preview'}
            </button>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-[#fcba00] text-black rounded-xl hover:bg-[#d99f00] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}

