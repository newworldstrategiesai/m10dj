import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Calendar,
  User,
  Tag,
  ArrowRight,
  Search,
  Filter,
  Star,
  Clock
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { db } from '../../utils/company_lib/supabase';

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const [allPosts, featured] = await Promise.all([
        db.getBlogPosts(),
        db.getFeaturedBlogPosts(3)
      ]);
      
      setPosts(allPosts);
      setFeaturedPosts(featured);
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(posts.map(post => post.category))];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getReadingTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readingTime} min read`;
  };

  const BlogPostCard = ({ post, featured = false }) => (
    <article className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${featured ? 'lg:col-span-2' : ''}`}>
      {post.featured_image_url && (
        <div className={`${featured ? 'h-64' : 'h-48'} bg-gray-100 dark:bg-gray-700 overflow-hidden`}>
          <img 
            src={post.featured_image_url} 
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="bg-brand-gold text-black px-3 py-1 rounded-full text-xs font-medium">
              {getCategoryLabel(post.category)}
            </span>
            {post.is_featured && (
              <Star className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            {getReadingTime(post.content)}
          </div>
        </div>

        <h2 className={`font-bold text-gray-900 dark:text-white mb-3 hover:text-brand-gold transition-colors ${featured ? 'text-2xl' : 'text-xl'}`}>
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {post.author}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(post.published_at)}
            </div>
          </div>

          <Link 
            href={`/blog/${post.slug}`}
            className="flex items-center text-brand-gold hover:text-brand-gold-dark font-medium transition-colors"
          >
            Read More
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );

  return (
    <>
      <Head>
        <title>DJ & Event Planning Blog | M10 DJ Company Memphis</title>
        <meta 
          name="description" 
          content="Expert wedding and event planning tips from Memphis's premier DJ company. Get insights on music, venues, vendors, and creating unforgettable celebrations." 
        />
        <meta name="keywords" content="Memphis wedding blog, DJ tips, event planning Memphis, wedding advice Memphis, party planning tips, Memphis music trends" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/blog" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="DJ & Event Planning Blog | M10 DJ Company Memphis" />
        <meta property="og:description" content="Expert wedding and event planning tips from Memphis's premier DJ company." />
        <meta property="og:url" content="https://m10djcompany.com/blog" />
        <meta property="og:type" content="website" />
        
        {/* Additional SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="heading-1 mb-6">
                <span className="block">M10 DJ Company</span>
                <span className="block text-gradient">Event Planning Blog</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Expert tips, industry insights, and inspiration for creating unforgettable events in Memphis. 
                From wedding planning to corporate celebrations, we share our knowledge to help make your event perfect.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">{posts.length}+</div>
                  <div className="text-sm text-gray-300">Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">{categories.length}</div>
                  <div className="text-sm text-gray-300">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">{featuredPosts.length}</div>
                  <div className="text-sm text-gray-300">Featured</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-gold">10+</div>
                  <div className="text-sm text-gray-300">Years Experience</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-20 bg-white dark:bg-gray-900">
            <div className="section-container">
              <div className="text-center mb-12">
                <h2 className="heading-2 text-gray-900 dark:text-white mb-4">
                  Featured Articles
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Our most popular and insightful posts to help you plan the perfect event.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {featuredPosts.map((post, index) => (
                  <BlogPostCard 
                    key={post.id} 
                    post={post} 
                    featured={index === 0}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-4">
                All Articles
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Browse our complete collection of event planning tips and industry insights.
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading articles...</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {posts.length === 0 
                    ? 'No articles published yet. Check back soon for expert event planning tips!'
                    : 'No articles match your current search and filters.'
                  }
                </p>
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-16 text-center bg-white dark:bg-gray-700 rounded-2xl p-12">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Plan Your Event?
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Let our expert team help bring your vision to life. From intimate gatherings to grand celebrations, 
                we have the experience and passion to make your event unforgettable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="#contact"
                  className="btn-primary text-lg"
                >
                  Get Free Quote
                </Link>
                <Link 
                  href="/services"
                  className="btn-outline text-lg"
                >
                  View Our Services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Blog Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "M10 DJ Company Blog",
            "description": "Expert wedding and event planning tips from Memphis's premier DJ company",
            "url": "https://m10djcompany.com/blog",
            "publisher": {
              "@type": "Organization",
              "name": "M10 DJ Company",
              "logo": {
                "@type": "ImageObject",
                "url": "https://m10djcompany.com/logo-static.jpg"
              }
            },
            "blogPost": posts.map(post => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "url": `https://m10djcompany.com/blog/${post.slug}`,
              "datePublished": post.published_at,
              "dateModified": post.updated_at,
              "author": {
                "@type": "Organization",
                "name": post.author
              }
            }))
          })
        }}
      />
    </>
  );
} 