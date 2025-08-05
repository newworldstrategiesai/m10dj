import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  Calendar,
  User,
  Tag,
  ArrowLeft,
  ArrowRight,
  Clock,
  Share2,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { db } from '../../utils/company_lib/supabase';

export default function BlogPost({ post: initialPost, relatedPosts: initialRelatedPosts }) {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(initialPost || null);
  const [relatedPosts, setRelatedPosts] = useState(initialRelatedPosts || []);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug && !initialPost) {
      loadPost();
    }
  }, [slug, initialPost]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const postData = await db.getBlogPostBySlug(slug);
      
      if (!postData) {
        setError('Post not found');
        return;
      }
      
      setPost(postData);
      
      // Load related posts from the same category
      const related = await db.getBlogPosts(postData.category, 3);
      setRelatedPosts(related.filter(p => p.id !== postData.id).slice(0, 2));
      
    } catch (err) {
      console.error('Error loading blog post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading article...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/blog"
              className="btn-primary"
            >
              Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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

  const shareUrl = `https://m10djcompany.com/blog/${post.slug}`;
  const shareTitle = encodeURIComponent(post.title);
  const shareText = encodeURIComponent(post.excerpt || post.title);

  return (
    <>
      <Head>
        <title>{post.seo_title || `${post.title} | M10 DJ Company Blog`}</title>
        <meta 
          name="description" 
          content={post.seo_description || post.excerpt || `${post.title} - Expert advice from M10 DJ Company, Memphis's premier event entertainment service.`}
        />
        <meta name="keywords" content={post.tags ? post.tags.join(', ') : 'Memphis DJ, event planning, wedding tips'} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={shareUrl} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        <meta property="article:author" content={post.author} />
        <meta property="article:section" content={getCategoryLabel(post.category)} />
        {post.tags && post.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {post.featured_image_url && (
          <>
            <meta property="og:image" content={post.featured_image_url} />
            <meta property="og:image:alt" content={post.title} />
          </>
        )}
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt || post.title} />
        {post.featured_image_url && (
          <meta name="twitter:image" content={post.featured_image_url} />
        )}
        
        {/* Additional SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
      </Head>

      <Header />

      <main>
        {/* Article Header */}
        <section className="py-24 bg-white dark:bg-gray-900 pt-32">
          <div className="section-container max-w-4xl">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <Link href="/" className="hover:text-brand-gold transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-brand-gold transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">{post.title}</span>
            </nav>

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="bg-brand-gold text-black px-3 py-1 rounded-full text-sm font-medium">
                {getCategoryLabel(post.category)}
              </span>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <User className="w-4 h-4 mr-1" />
                {post.author}
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(post.published_at)}
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {getReadingTime(post.content)}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                {post.excerpt}
              </p>
            )}

            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="relative mb-8 rounded-xl overflow-hidden h-96">
                <Image 
                  src={post.featured_image_url} 
                  alt={`${post.title} - Memphis DJ Blog Featured Image`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  priority
                />
              </div>
            )}
          </div>
        </section>

        {/* Article Content */}
        <section className="py-12 bg-white dark:bg-gray-900">
          <div className="section-container max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none
                    prose-headings:text-gray-900 dark:prose-headings:text-white
                    prose-a:text-brand-gold prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 dark:prose-strong:text-white
                    prose-code:text-brand-gold prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                    prose-blockquote:border-brand-gold prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800
                    prose-img:rounded-lg prose-img:shadow-lg"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-brand-gold hover:text-black transition-colors cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share This Article
                  </h3>
                  <div className="flex space-x-4">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </a>
                    
                    <a
                      href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Twitter</span>
                    </a>
                    
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Related Articles
                    </h3>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link 
                          key={relatedPost.id}
                          href={`/blog/${relatedPost.slug}`}
                          className="block group"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors mb-2">
                            {relatedPost.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(relatedPost.published_at)}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="bg-brand-gold rounded-xl p-6 text-black">
                  <h3 className="text-lg font-bold mb-4">
                    Ready to Plan Your Event?
                  </h3>
                  <p className="text-sm mb-4 opacity-90">
                    Let M10 DJ Company help make your celebration unforgettable with professional entertainment and expert planning.
                  </p>
                  <Link 
                    href="#contact"
                    className="block text-center bg-black text-brand-gold py-2 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors"
                  >
                    Get Free Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="py-12 bg-gray-50 dark:bg-gray-800">
          <div className="section-container max-w-4xl">
            <div className="flex justify-between items-center">
              <Link 
                href="/blog"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-brand-gold transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Articles
              </Link>
              
              {relatedPosts.length > 0 && (
                <Link 
                  href={`/blog/${relatedPosts[0].slug}`}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-brand-gold transition-colors"
                >
                  Next Article
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt || post.title,
            "image": post.featured_image_url || "https://m10djcompany.com/logo-static.jpg",
            "url": shareUrl,
            "datePublished": post.published_at,
            "dateModified": post.updated_at,
            "author": {
              "@type": "Organization",
              "name": post.author,
              "url": "https://m10djcompany.com"
            },
            "publisher": {
              "@type": "Organization",
              "name": "M10 DJ Company",
              "logo": {
                "@type": "ImageObject",
                "url": "https://m10djcompany.com/logo-static.jpg"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": shareUrl
            },
            "keywords": post.tags ? post.tags.join(', ') : undefined
          })
        }}
      />
    </>
  );
}

// Generate static paths for all blog posts
export async function getStaticPaths() {
  try {
    const posts = await db.getBlogPosts();
    
    const paths = posts.map(post => ({
      params: { slug: post.slug }
    }));

    return {
      paths,
      fallback: 'blocking' // Enable ISR for new posts
    };
  } catch (error) {
    console.error('Error in getStaticPaths for blog posts:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

// Generate static props for each blog post
export async function getStaticProps({ params }) {
  try {
    const post = await db.getBlogPostBySlug(params.slug);
    
    if (!post) {
      return {
        notFound: true
      };
    }

    // Get related posts based on tags or category
    const relatedPosts = await db.getRelatedBlogPosts(post.id, 3);

    return {
      props: {
        post,
        relatedPosts: relatedPosts || []
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error in getStaticProps for blog post:', error);
    return {
      notFound: true
    };
  }
} 