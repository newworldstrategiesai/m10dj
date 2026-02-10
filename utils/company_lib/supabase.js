import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton instance to prevent multiple client instances
let supabaseInstance = null;

// Create a dummy client if environment variables are missing (for build time)
let supabase;

if (supabaseUrl && supabaseAnonKey) {
  // Use singleton pattern to prevent multiple instances
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  supabase = supabaseInstance;
} else {
  // Create a dummy client for build time
  console.warn('Supabase environment variables not found. Using dummy client for build.');
  supabase = {
    from: () => ({
      insert: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
      select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) }),
      update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) })}),
    })
  };
}

export { supabase };

// Database helper functions
export const db = {
  // Contact submissions
  async createContactSubmission(data) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const insertData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      event_type: data.eventType,
      event_date: data.eventDate,
      location: data.location,
      message: data.message
    };
    if (data.organization_id) {
      insertData.organization_id = data.organization_id;
    }
    if (data.ctaSource && typeof data.ctaSource === 'string') {
      insertData.cta_source = data.ctaSource.trim().slice(0, 200);
    }
    if (data.sourcePage && typeof data.sourcePage === 'string') {
      insertData.source_page = data.sourcePage.replace(/[#?].*$/, '').trim().slice(0, 500);
    }

    const { data: result, error } = await supabase
      .from('contact_submissions')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Error creating contact submission:', error);
      throw error;
    }

    return result[0];
  },

  // Get all contact submissions (for admin)
  async getContactSubmissions(limit = 50) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching contact submissions:', error);
      throw error;
    }

    return data;
  },

  // Update submission status
  async updateSubmissionStatus(id, status) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating submission status:', error);
      throw error;
    }

    return data[0];
  },

  // Get submissions by status
  async getSubmissionsByStatus(status) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions by status:', error);
      throw error;
    }

    return data;
  },

  // Analytics - get submission counts by event type
  async getSubmissionAnalytics() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('contact_submissions')
      .select('event_type, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }

    // Process data for analytics
    const eventTypeCounts = data.reduce((acc, submission) => {
      acc[submission.event_type] = (acc[submission.event_type] || 0) + 1;
      return acc;
    }, {});

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthSubmissions = data.filter(
      submission => new Date(submission.created_at) >= thisMonth
    ).length;

    return {
      totalSubmissions: data.length,
      thisMonthSubmissions,
      eventTypeCounts,
      recentSubmissions: data.slice(0, 5)
    };
  },

  // Preferred Vendors
  async getPreferredVendors(businessType = null, limit = null) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    let query = supabase
      .from('preferred_vendors')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('business_name');

    if (businessType) {
      query = query.eq('business_type', businessType);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching preferred vendors:', error);
      return [];
    }

    return data || [];
  },

  async getFeaturedVendors(limit = 6) {
    return this.getPreferredVendors(null, limit);
  },

  // Preferred Venues
  async getPreferredVenues(venueType = null, limit = null) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    let query = supabase
      .from('preferred_venues')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('venue_name');

    if (venueType) {
      query = query.eq('venue_type', venueType);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching preferred venues:', error);
      return [];
    }

    return data || [];
  },

  async getFeaturedVenues(limit = 6) {
    return this.getPreferredVenues(null, limit);
  },

  // Services
  async getServices(category = null, limit = null) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .order('service_name');

    if (category) {
      query = query.eq('category', category);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return [];
    }

    return data || [];
  },

  async getFeaturedServices(limit = 6) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('display_order')
      .limit(limit);

    if (error) {
      console.error('Error fetching featured services:', error);
      return [];
    }

    return data || [];
  },

  // Blog Posts
  async getBlogPosts(category = null, limit = null) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }

    return data || [];
  },

  async getBlogPostBySlug(slug) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }

    return data;
  },

  async getRelatedBlogPosts(postId, limit = 3) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    // First, get the current post to find its category and tags
    const { data: currentPost, error: postError } = await supabase
      .from('blog_posts')
      .select('category, tags')
      .eq('id', postId)
      .single();

    if (postError || !currentPost) {
      console.error('Error fetching current post for related posts:', postError);
      return [];
    }

    // Get related posts from the same category, excluding the current post
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .neq('id', postId)
      .order('published_at', { ascending: false })
      .limit(limit);

    // Filter by category if available
    if (currentPost.category) {
      query = query.eq('category', currentPost.category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching related blog posts:', error);
      return [];
    }

    return data || [];
  },

  async getFeaturedBlogPosts(limit = 3) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured blog posts:', error);
      return [];
    }

    return data || [];
  },

  // Admin Blog Post Management
  async getAllBlogPosts(limit = 50) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching all blog posts:', error);
      throw error;
    }

    return data || [];
  },

  async createBlogPost(postData) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    // Generate slug from title if not provided
    if (!postData.slug) {
      postData.slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Set published_at if publishing
    if (postData.is_published && !postData.published_at) {
      postData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        ...postData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }

    return data[0];
  },

  async updateBlogPost(id, postData) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    // Set published_at if publishing for the first time
    if (postData.is_published && !postData.published_at) {
      postData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        ...postData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }

    return data[0];
  },

  async deleteBlogPost(id) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }

    return true;
  },

  async getBlogPostById(id) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching blog post by ID:', error);
      throw error;
    }

    return data;
  },

  // Gallery Images
  async getGalleryImages(eventType = null, limit = null) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    let query = supabase
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('display_order')
      .order('created_at', { ascending: false });

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching gallery images:', error);
      return [];
    }

    return data || [];
  },

  async getFeaturedGalleryImages(limit = 9) {
    return this.getGalleryImages(null, limit);
  },

  // Project/Event Management
  // submissionId = contact_submissions.id; contactId = contacts.id (so project shows in contacts section)
  async createProject(contactData, submissionId, contactId = null) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    // Generate project name from available data
    const generateProjectName = (contact) => {
      const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
      const eventType = contact.event_type || 'Event';
      const eventDate = contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) : '';
      const venue = contact.venue_name ? ` - ${contact.venue_name}` : '';
      
      return `${clientName} - ${eventType}${eventDate ? ` - ${eventDate}` : ''}${venue}`;
    };

    // Map contact data to project data (submission_id + contact_id so project appears under contact)
    const projectData = {
      submission_id: submissionId, // Link to the original submission
      ...(contactId && { contact_id: contactId }), // Link to contact so customer shows in contacts section
      event_name: generateProjectName(contactData), // Use the generated name as event_name
      client_name: `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() || 'Client',
      client_email: contactData.email_address,
      client_phone: contactData.phone || null,
      event_type: contactData.event_type || 'other',
      event_date: contactData.event_date || new Date().toISOString().split('T')[0], // Use today's date if no event date provided
      start_time: contactData.event_time || null,
      venue_name: contactData.venue_name || null,
      venue_address: contactData.venue_address || null,
      number_of_guests: contactData.guest_count || null,
      special_requests: contactData.special_requests || null,
      status: 'confirmed', // Default status for new projects (changed from 'pending' to match schema)
      timeline_notes: `Auto-generated project from contact form submission. Created on ${new Date().toLocaleDateString()}.`,
      playlist_notes: null
    };

    console.log('Creating project with data:', projectData);

    const { data, error } = await supabase
      .from('events')
      .insert(projectData)
      .select();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    console.log('Project created successfully:', data[0].id);
    return data[0];
  },

  // Get projects for a contact
  async getProjectsByContact(contactId) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects for contact:', error);
      throw error;
    }

    return data;
  },

  // Case Studies (for showcasing past events)
  async getCaseStudies(venue = null, eventType = null, limit = null) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    let query = supabase
      .from('case_studies')
      .select('*')
      .eq('is_published', true)
      .order('event_date', { ascending: false });

    if (venue) {
      query = query.eq('venue_name', venue);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching case studies:', error);
      return [];
    }

    return data || [];
  },

  async getCaseStudyBySlug(slug) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error fetching case study:', error);
      return null;
    }

    return data;
  },

  async getRelatedCaseStudies(excludeId, venueName, eventType, limit = 3) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    // Try to find related by venue first, then event type
    let query = supabase
      .from('case_studies')
      .select('*')
      .eq('is_published', true)
      .neq('id', excludeId);

    if (venueName) {
      query = query.eq('venue_name', venueName);
    } else if (eventType) {
      query = query.eq('event_type', eventType);
    }

    query = query.order('event_date', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching related case studies:', error);
      return [];
    }

    return data || [];
  },

  async getFeaturedCaseStudies(limit = 3) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }

    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('event_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured case studies:', error);
      return [];
    }

    return data || [];
  }
}; 