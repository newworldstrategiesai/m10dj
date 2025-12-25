'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ArrowLeft,
  Save,
  Eye,
  Image,
  Calendar,
  MapPin,
  Users,
  Music,
  Star,
  FileText
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    event_date: '',
    event_type: '',
    venue_name: '',
    venue_address: '',
    number_of_guests: '',
    featured_image_url: '',
    gallery_images: '',
    highlights: '',
    testimonial_text: '',
    testimonial_client_name: '',
    testimonial_rating: '5',
    testimonial_event_date: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    is_published: false,
    is_featured: false,
    display_order: '0'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value, type } = target;
    const checked = 'checked' in target ? target.checked : false;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug from title
    if (name === 'title' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }

    // Auto-generate SEO title from title
    if (name === 'title' && !formData.seo_title) {
      setFormData(prev => ({ 
        ...prev, 
        seo_title: value ? `${value} | M10 DJ Company Case Study` : ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const eventData = {
        ...formData,
        number_of_guests: formData.number_of_guests ? parseInt(formData.number_of_guests) : null,
        display_order: formData.display_order ? parseInt(formData.display_order) : 0,
        testimonial_rating: formData.testimonial_rating ? parseInt(formData.testimonial_rating) : 5
      };

      const response = await fetch('/api/admin/event-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event page');
      }
      
      // Redirect to events management or view the new page
      router.push(`/admin/events?created=true&slug=${result.eventPage.slug}`);
    } catch (error) {
      console.error('Error creating event page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create event page: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const draftData = { ...formData, is_published: false };
    setFormData(draftData);
    
    const form = document.getElementById('event-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  const eventTypes = [
    { value: 'Wedding', label: 'Wedding' },
    { value: 'Corporate Event', label: 'Corporate Event' },
    { value: 'Birthday Party', label: 'Birthday Party' },
    { value: 'Anniversary', label: 'Anniversary' },
    { value: 'Graduation', label: 'Graduation' },
    { value: 'Holiday Party', label: 'Holiday Party' },
    { value: 'Fundraiser', label: 'Fundraiser' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <AdminLayout title="New Event Page" description="Create a new event case study page">
      <Head>
        <title>New Event Page - M10 DJ Company Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-black">
        {/* Header */}
        <header className="bg-white dark:bg-black shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link 
                  href="/admin/events"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-[#fcba00] mr-6"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Events
                </Link>
                
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    New Event Page
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create a new case study page for a past event
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, is_published: true }));
                    const form = document.getElementById('event-form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-[#fcba00] hover:bg-yellow-500 text-black rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form id="event-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white text-xl font-semibold"
                  placeholder="Amazing Wedding at The Peabody"
                />
              </div>

              {/* URL Slug */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm mr-2">
                    m10djcompany.com/events/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                    placeholder="amazing-wedding-peabody"
                  />
                </div>
              </div>

              {/* Event Details */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Event Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Music className="w-4 h-4 mr-1" />
                      Event Type
                    </label>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                    >
                      <option value="">Select event type...</option>
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Venue Name
                    </label>
                    <input
                      type="text"
                      name="venue_name"
                      value={formData.venue_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      placeholder="The Peabody Hotel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      name="number_of_guests"
                      value={formData.number_of_guests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      placeholder="150"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue Address
                  </label>
                  <input
                    type="text"
                    name="venue_address"
                    value={formData.venue_address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                    placeholder="149 Union Ave, Memphis, TN 38103"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                  placeholder="Brief summary of the event (used in previews and SEO)..."
                />
              </div>

              {/* Content Editor */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Write your event case study content here. You can use HTML tags for formatting..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Tip: You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc.
                </p>
              </div>

              {/* Highlights */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Key Highlights
                </label>
                <textarea
                  name="highlights"
                  value={formData.highlights}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                  placeholder="Enter each highlight on a new line:&#10;Custom lighting design&#10;Live saxophone performance&#10;Interactive photo booth"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Enter each highlight on a separate line
                </p>
              </div>

              {/* Testimonial */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Client Testimonial (Optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Client Name
                    </label>
                    <input
                      type="text"
                      name="testimonial_client_name"
                      value={formData.testimonial_client_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      placeholder="John & Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Testimonial Text
                    </label>
                    <textarea
                      name="testimonial_text"
                      value={formData.testimonial_text}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      placeholder="The DJ made our wedding absolutely perfect..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rating (1-5)
                      </label>
                      <select
                        name="testimonial_rating"
                        value={formData.testimonial_rating}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      >
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Testimonial Date
                      </label>
                      <input
                        type="date"
                        name="testimonial_event_date"
                        value={formData.testimonial_event_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Settings */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Publish Settings
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-[#fcba00] focus:ring-[#fcba00]"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Publish immediately
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-[#fcba00] focus:ring-[#fcba00]"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mark as featured
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      name="display_order"
                      value={formData.display_order}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Lower numbers appear first
                    </p>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  Featured Image
                </h3>
                
                <input
                  type="url"
                  name="featured_image_url"
                  value={formData.featured_image_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white mb-3"
                  placeholder="https://example.com/image.jpg"
                />
                
                {formData.featured_image_url && (
                  <div className="mt-3">
                    <img
                      src={formData.featured_image_url}
                      alt="Featured image preview"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Gallery Images
                </h3>
                
                <textarea
                  name="gallery_images"
                  value={formData.gallery_images}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                  placeholder="Enter each image URL on a new line:&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Enter each image URL on a separate line
                </p>
              </div>

              {/* SEO Settings */}
              <div className="bg-white dark:bg-black rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  SEO Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      name="seo_title"
                      value={formData.seo_title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      placeholder="SEO optimized title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="seo_description"
                      value={formData.seo_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      placeholder="Brief description for search engines..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      name="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
                      placeholder="wedding dj, memphis, peabody hotel"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Separate keywords with commas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </AdminLayout>
  );
}

