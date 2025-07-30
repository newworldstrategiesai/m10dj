-- Fix Blog RLS - Disable Row Level Security for blog_posts table

-- Disable RLS on blog_posts table to allow blog creation
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- Test that blog creation will now work
INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, author, is_published) 
VALUES ('Test Blog Post', 'test-blog-post', 'This is a test', 'Test content for the blog post', 'general', '{test}', 'M10 DJ Company', false)
RETURNING id, title, slug;

-- Check the status
SELECT 'Blog Posts RLS Status:' as info;
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'blog_posts'; 