import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ArrowLeft,
  Save,
  Eye,
  Image,
  Link as LinkIcon,
  Bold,
  Italic,
  List,
  Quote
} from 'lucide-react';

export default function NewBlogPost() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'general',
    tags: '',
    featured_image_url: '',
    seo_title: '',
    seo_description: '',
    is_published: false,
    is_featured: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
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
        seo_title: value ? `${value} | M10 DJ Company Blog` : ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert tags string to array
      const tagsArray = formData.tags 
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      const postData = {
        ...formData,
        tags: tagsArray,
        author: 'M10 DJ Company'
      };

      // Use API endpoint instead of direct database call
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create blog post');
      }
      
      // Redirect to blog management
      router.push('/admin/blog?created=true');
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert(`Failed to create blog post: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const draftData = { ...formData, is_published: false };
    setFormData(draftData);
    
    const form = document.getElementById('blog-form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const categories = [
    { value: 'wedding_tips', label: 'Wedding Tips' },
    { value: 'event_planning', label: 'Event Planning' },
    { value: 'music_trends', label: 'Music Trends' },
    { value: 'venue_spotlight', label: 'Venue Spotlight' },
    { value: 'vendor_spotlight', label: 'Vendor Spotlight' },
    { value: 'general', label: 'General' }
  ];

  return (
    <>
      <Head>
        <title>New Blog Post - M10 DJ Company Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link 
                  href="/admin/blog"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-brand-gold mr-6"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Blog Management
                </Link>
                
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    New Blog Post
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create a new blog post for M10 DJ Company
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </button>
                
                <button
                  type="submit"
                  form="blog-form"
                  disabled={saving}
                  className="bg-brand-gold hover:bg-brand-gold-dark text-black px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {formData.is_published ? 'Publish' : 'Publish Now'}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form id="blog-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Content Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                    placeholder="Enter an engaging title for your blog post..."
                  />
                </div>

                {/* Slug */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Slug
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm mr-2">
                      m10djcompany.com/blog/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="url-friendly-title"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Brief summary of your post (used in previews and SEO)..."
                  />
                </div>

                {/* Content Editor */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content *
                  </label>
                  
                  {/* Simple Formatting Toolbar */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-2">
                    <div className="flex space-x-2">
                      <button 
                        type="button" 
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                        title="List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                        title="Quote"
                      >
                        <Quote className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                        title="Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
                        title="Image"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={20}
                    className="w-full px-4 py-3 border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="Write your blog post content here. You can use HTML tags for formatting..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Tip: You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc.
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publish Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                        className="rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
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
                        className="rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Mark as featured
                      </span>
                    </label>
                  </div>
                </div>

                {/* Category & Tags */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Organization
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="wedding, memphis, tips"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Separate tags with commas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Featured Image */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Featured Image
                  </h3>
                  
                  <input
                    type="url"
                    name="featured_image_url"
                    value={formData.featured_image_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                  
                  {formData.featured_image_url && (
                    <div className="mt-3">
                      <img
                        src={formData.featured_image_url}
                        alt="Featured image preview"
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* SEO Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Brief description for search engines..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </>
  );
} 