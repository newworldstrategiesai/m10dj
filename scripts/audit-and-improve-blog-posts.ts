/**
 * Audit and improve Memphis blog posts for natural, human-written content
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const AI_PATTERNS = [
  /In conclusion/gi,
  /To conclude/gi,
  /In summary/gi,
  /To summarize/gi,
  /With that said/gi,
  /That being said/gi,
  /It's worth noting/gi,
  /It's important to note/gi,
  /Whether you're/gi,
  /When it comes to/gi,
  /When planning/gi,
  /If you're looking for/gi,
  /One of the most/gi,
  /It's important to/gi,
  /It's crucial to/gi,
  /Keep in mind/gi,
  /Bear in mind/gi,
  /Make sure to/gi,
  /Be sure to/gi,
  /Here are (some|a few|several)/gi,
  /Here's (what|how|why)/gi,
  /Let's (take|look|explore)/gi,
  /Furthermore/gi,
  /Moreover/gi,
  /Additionally/gi,
  /Therefore/gi,
  /Thus/gi,
  /Happy (planning|hiring|booking)/gi,
  /Good luck/gi,
  /Best of luck/gi,
];

async function detectAIPatterns(text: string): Promise<{ issues: string[]; score: number }> {
  const issues: string[] = [];
  let matchCount = 0;
  const words = text.split(/\s+/).length;
  
  AI_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      matchCount += matches.length;
      issues.push(`Found pattern: "${matches[0]}" (${matches.length} times)`);
    }
  });
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceStarts = sentences.map(s => s.trim().substring(0, 20).toLowerCase());
  const uniqueStarts = new Set(sentenceStarts);
  if (uniqueStarts.size < sentences.length * 0.3) {
    issues.push('Repetitive sentence structures');
    matchCount += 5;
  }
  
  const bulletCount = (text.match(/[•\-\*✅]/g) || []).length;
  if (bulletCount > words / 50) {
    issues.push(`Excessive bullet points`);
    matchCount += 3;
  }
  
  const aiScore = Math.min(100, Math.round((matchCount / words) * 1000));
  return { issues, score: aiScore };
}

async function improveContent(originalText: string, context: string): Promise<string> {
  const audit = await detectAIPatterns(originalText);
  
  if (audit.score < 15) {
    return originalText;
  }
  
  console.log(`  🔍 AI Score: ${audit.score}/100`);
  
  const improvementPrompt = `Rewrite this content to sound like a knowledgeable Memphis local wrote it, not AI. 

CRITICAL:
- Remove all AI phrases: "In conclusion", "It's worth noting", "Whether you're", "When it comes to", etc.
- Vary sentence structure dramatically
- Be conversational and natural
- Add specific Memphis details (neighborhoods, venues, local culture)
- Use contractions and casual language
- Write like you're helping a friend
- Make it useful and practical

Context: ${context}

Original:
${originalText}

Rewritten (natural, human-written):`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a Memphis local expert who writes helpful, conversational content. Write naturally, like you\'re talking to a friend who needs help, not like AI or a corporate writer.',
        },
        {
          role: 'user',
          content: improvementPrompt,
        },
      ],
      temperature: 0.85,
      max_tokens: Math.min(4000, originalText.length * 2),
    });

    const improved = completion.choices[0]?.message?.content?.trim() || originalText;
    const improvedAudit = await detectAIPatterns(improved);
    
    if (improvedAudit.score < audit.score) {
      console.log(`  ✅ Improved: ${audit.score} → ${improvedAudit.score}`);
      return improved;
    }
    
    return improved;
  } catch (error) {
    console.error(`  ❌ Error:`, error);
    return originalText;
  }
}

async function auditBlogPosts() {
  console.log('🔍 Auditing Memphis blog posts...\n');

  const memphisSlugs = [
    'memphis-wedding-dj-prices-2025',
    'top-memphis-wedding-venues-2025',
    'memphis-corporate-event-dj-guide',
    'memphis-school-dance-dj-guide',
  ];

  for (const slug of memphisSlugs) {
    console.log(`\n📄 Auditing: ${slug}...`);
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !post) {
      console.log(`  ⚠️  Post not found`);
      continue;
    }

    const updates: any = {};
    let improved = false;

    // Audit content
    if (post.content) {
      console.log(`  🔎 Auditing content...`);
      const audit = await detectAIPatterns(post.content);
      
      if (audit.score > 15) {
        console.log(`  ✏️  Improving content (AI score: ${audit.score})...`);
        const improvedContent = await improveContent(post.content, `Memphis DJ blog post: ${post.title}`);
        if (improvedContent !== post.content) {
          updates.content = improvedContent;
          improved = true;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`  ✅ Content looks good (AI score: ${audit.score})`);
      }
    }

    // Audit excerpt
    if (post.excerpt) {
      const audit = await detectAIPatterns(post.excerpt);
      if (audit.score > 15) {
        console.log(`  ✏️  Improving excerpt...`);
        const improvedExcerpt = await improveContent(post.excerpt, `Blog post excerpt: ${post.title}`);
        if (improvedExcerpt !== post.excerpt) {
          updates.excerpt = improvedExcerpt;
          improved = true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (improved) {
      updates.updated_at = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', post.id);

      if (updateError) {
        console.error(`  ❌ Error updating:`, updateError);
      } else {
        console.log(`  ✅ Post updated successfully`);
      }
    } else {
      console.log(`  ✅ No improvements needed`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✨ Blog post audit complete!');
}

auditBlogPosts().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

