import { useState, useEffect } from 'react';
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
  Quote,
  AlertCircle
} from 'lucide-react';
import { db } from '../../../../utils/company_lib/supabase';

export default function EditBlogPost() {
  const router = useRouter();
  const { id } = router.query;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const post = await db.getBlogPostById(id);
      if (!post) {
        setError('Blog post not found');
        return;
      }
      
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        category: post.category || 'general',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
        featured_image_url: post.featured_image_url || '',
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        is_published: post.is_published || false,
        is_featured: post.is_featured || false
      });
    } catch (err) {
      console.error('Error loading blog post:', err);
      setError('Failed to load blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug from title if slug is empty
    if (name === 'title' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }

    // Auto-generate SEO title from title if SEO title is empty
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

      // Use API endpoint for updating
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update blog post');
      }
      
      // Redirect to blog management with success message
      router.push('/admin/blog?updated=true');
    } catch (error) {
      console.error('Error updating blog post:', error);
      alert(`Failed to update blog post: ${error.message}`);
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

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Blog Post - M10 DJ Company Admin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading blog post...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Error - M10 DJ Company Admin</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Post</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Link
              href="/admin/blog"
              className="btn-primary"
            >
              Back to Blog Management
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Blog Post - M10 DJ Company Admin</title>
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
                
                <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center mr-3">
                  <Bold className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Edit Blog Post
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update your blog post content and settings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form id="blog-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-medium"
                    placeholder="Enter your blog post title..."
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
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    {/* Editor Toolbar */}
                    <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 px-4 py-2 flex items-center space-x-2">
                      <button type="button" className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button type="button" className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button type="button" className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <List className="w-4 h-4" />
                      </button>
                      <button type="button" className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Quote className="w-4 h-4" />
                      </button>
                      <button type="button" className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button type="button" className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <Image className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Content Textarea */}
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                      rows={20}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none border-0 focus:ring-0"
                      placeholder="Write your blog post content here... You can use Markdown formatting."
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Supports Markdown formatting. Use **bold**, *italic*, # headings, - lists, etc.
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publish Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Publish</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_published"
                        name="is_published"
                        checked={formData.is_published}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                      />
                      <label htmlFor="is_published" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Published
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_featured"
                        name="is_featured"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                      />
                      <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Featured Post
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col space-y-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Post
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="w-full bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save as Draft
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="wedding, planning, music (comma separated)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Separate tags with commas
                  </p>
                </div>

                {/* Featured Image */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    name="featured_image_url"
                    value={formData.featured_image_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* SEO Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">SEO Settings</h3>
                  
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="SEO optimized title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SEO Description
                      </label>
                      <textarea
                        name="seo_description"
                        value={formData.seo_description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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