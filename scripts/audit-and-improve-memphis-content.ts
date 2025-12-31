/**
 * Content Audit and Improvement Script
 * Identifies AI-generated patterns and rewrites content to be more natural and human-written
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

// Common AI-generated phrases to detect and replace
const AI_PATTERNS = [
  // Generic transitions
  /In conclusion/gi,
  /To conclude/gi,
  /In summary/gi,
  /To summarize/gi,
  /With that said/gi,
  /That being said/gi,
  /It's worth noting/gi,
  /It's important to note/gi,
  /It should be noted/gi,
  
  // Overused phrases
  /Whether you're/gi,
  /When it comes to/gi,
  /When planning/gi,
  /When looking for/gi,
  /If you're looking for/gi,
  /If you're planning/gi,
  /One of the most/gi,
  /One thing to/gi,
  /Another thing to/gi,
  /It's also worth/gi,
  
  // Generic qualifiers
  /It's important to/gi,
  /It's crucial to/gi,
  /It's essential to/gi,
  /Keep in mind/gi,
  /Bear in mind/gi,
  /Make sure to/gi,
  /Be sure to/gi,
  
  // Repetitive structures
  /Here are (some|a few|several)/gi,
  /Here's (what|how|why)/gi,
  /Let's (take|look|explore)/gi,
  /Let me (explain|share|tell)/gi,
  
  // Overly formal
  /Furthermore/gi,
  /Moreover/gi,
  /Additionally/gi,
  /Nevertheless/gi,
  /Therefore/gi,
  /Thus/gi,
  
  // Generic questions
  /Have you ever wondered/gi,
  /Are you looking for/gi,
  /Do you need/gi,
  
  // Bullet point overuse patterns
  /✅/g,
  /•/g,
  
  // Generic endings
  /Happy (planning|hiring|booking)/gi,
  /Good luck/gi,
  /Best of luck/gi,
];

// Memphis-specific details to add for authenticity
const MEMPHIS_SPECIFICS = {
  neighborhoods: [
    'Downtown Memphis', 'Midtown Memphis', 'East Memphis', 'South Memphis', 
    'North Memphis', 'Cooper-Young', 'Central Gardens', 'Vollintine Evergreen',
    'Germantown', 'Collierville', 'Bartlett', 'Cordova', 'Hickory Hill'
  ],
  venues: [
    'The Peabody Memphis', 'Memphis Botanic Garden', 'Dixon Gallery & Gardens',
    'Woodruff-Fontaine House', 'Annesdale Mansion', 'Central Station Hotel',
    'The Cadre Building', 'Heartwood Hall', 'Cedar Hall', 'Orion Hill'
  ],
  landmarks: [
    'Beale Street', 'Graceland', 'Memphis Zoo', 'Overton Park', 'FedExForum',
    'National Civil Rights Museum', 'Sun Studio', 'Stax Museum'
  ],
  musicScene: [
    'Blues', 'Rock \'n\' Roll', 'Soul', 'Hip-Hop', 'Memphis sound',
    'Stax Records', 'Sun Records', 'Beale Street'
  ],
  localDetails: [
    'Mississippi River', 'Memphis in May', 'Memphis Grizzlies', 'Memphis Tigers',
    'BBQ culture', 'Southern hospitality', 'Mississippi Delta'
  ]
};

interface ContentAudit {
  field: string;
  original: string;
  issues: string[];
  improved: string;
  aiScore: number; // 0-100, higher = more AI-like
}

async function detectAIPatterns(text: string): Promise<{ issues: string[]; score: number }> {
  const issues: string[] = [];
  let matchCount = 0;
  const words = text.split(/\s+/).length;
  
  AI_PATTERNS.forEach((pattern, index) => {
    const matches = text.match(pattern);
    if (matches) {
      matchCount += matches.length;
      const patternName = pattern.toString().replace(/[\/\^$]/g, '');
      issues.push(`Found "${patternName}" pattern (${matches.length} times)`);
    }
  });
  
  // Check for repetitive sentence structures
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceStarts = sentences.map(s => s.trim().substring(0, 20).toLowerCase());
  const uniqueStarts = new Set(sentenceStarts);
  if (uniqueStarts.size < sentences.length * 0.3) {
    issues.push('Repetitive sentence structures detected');
    matchCount += 5;
  }
  
  // Check for bullet point overuse
  const bulletCount = (text.match(/[•\-\*✅]/g) || []).length;
  if (bulletCount > words / 50) {
    issues.push(`Excessive bullet points (${bulletCount} in ${words} words)`);
    matchCount += 3;
  }
  
  // Calculate AI score (0-100)
  const aiScore = Math.min(100, Math.round((matchCount / words) * 1000));
  
  return { issues, score: aiScore };
}

async function improveContent(
  originalText: string,
  context: { cityName: string; eventType: string; field: string }
): Promise<string> {
  const audit = await detectAIPatterns(originalText);
  
  // If AI score is low, return original
  if (audit.score < 20) {
    return originalText;
  }
  
  console.log(`  🔍 AI Score: ${audit.score}/100`);
  if (audit.issues.length > 0) {
    console.log(`  ⚠️  Issues found: ${audit.issues.slice(0, 3).join(', ')}`);
  }
  
  // Use OpenAI to rewrite with specific instructions
  const improvementPrompt = `You are an expert content writer specializing in local business content. Rewrite the following text to make it sound more natural, human-written, and less AI-generated.

CRITICAL REQUIREMENTS:
1. Remove all generic AI phrases like "In conclusion", "It's worth noting", "Whether you're", etc.
2. Vary sentence structure - mix short and long sentences
3. Use more conversational, natural language
4. Add specific Memphis details where relevant (neighborhoods: ${MEMPHIS_SPECIFICS.neighborhoods.slice(0, 5).join(', ')}, venues: ${MEMPHIS_SPECIFICS.venues.slice(0, 5).join(', ')})
5. Make it sound like a local expert wrote it, not AI
6. Keep all factual information accurate
7. Maintain SEO value but prioritize natural flow
8. Use contractions and casual language where appropriate
9. Avoid repetitive structures
10. Make it useful and practical, not generic

Context:
- City: ${context.cityName}
- Event Type: ${context.eventType}
- Content Type: ${context.field}

Original text:
${originalText}

Rewrite the text to be more natural and human-written while keeping all the important information:`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer who specializes in rewriting AI-generated content to sound natural and human-written. You focus on local business content and make it conversational, specific, and useful.',
        },
        {
          role: 'user',
          content: improvementPrompt,
        },
      ],
      temperature: 0.8, // Higher temperature for more variation
      max_tokens: Math.min(4000, originalText.length * 2),
    });

    const improved = completion.choices[0]?.message?.content?.trim() || originalText;
    
    // Verify improvement
    const improvedAudit = await detectAIPatterns(improved);
    if (improvedAudit.score < audit.score) {
      console.log(`  ✅ Improved: ${audit.score} → ${improvedAudit.score}`);
      return improved;
    } else {
      console.log(`  ⚠️  Improvement minimal, trying again with different approach...`);
      // Try once more with different temperature
      const retry = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a Memphis local expert writing helpful, conversational content about DJ services. Write naturally, like you\'re talking to a friend, not like AI.',
          },
          {
            role: 'user',
            content: `Rewrite this to sound like a Memphis local wrote it, not AI. Be specific, conversational, and natural:\n\n${originalText}`,
          },
        ],
        temperature: 0.9,
        max_tokens: Math.min(4000, originalText.length * 2),
      });
      return retry.choices[0]?.message?.content?.trim() || improved;
    }
  } catch (error) {
    console.error(`  ❌ Error improving content:`, error);
    return originalText;
  }
}

async function auditAndImproveMemphisPages() {
  console.log('🔍 Auditing and improving Memphis content...\n');

  // Get all Memphis event-type pages
  const { data: pages, error } = await supabase
    .from('city_event_pages')
    .select('*')
    .eq('city_slug', 'memphis-tn')
    .eq('product_context', 'djdash')
    .eq('is_published', true);

  if (error) {
    console.error('❌ Error fetching pages:', error);
    return;
  }

  if (!pages || pages.length === 0) {
    console.log('⚠️  No Memphis pages found');
    return;
  }

  console.log(`📊 Found ${pages.length} Memphis pages to audit\n`);

  const allAudits: ContentAudit[] = [];
  let totalImproved = 0;

  for (const page of pages) {
    console.log(`\n📄 Auditing: ${page.event_type_display} in ${page.city_name}...`);
    
    const fieldsToAudit = [
      'hero_title',
      'hero_subtitle',
      'hero_description',
      'introduction_text',
      'why_choose_section',
      'pricing_section',
      'venue_section',
      'timeline_section',
      'comprehensive_guide',
      'local_insights',
    ];

    const updates: any = {};
    let pageImproved = false;

    for (const field of fieldsToAudit) {
      const originalText = page[field];
      if (!originalText || originalText.length < 50) continue;

      console.log(`  🔎 Auditing ${field}...`);
      
      const audit = await detectAIPatterns(originalText);
      
      if (audit.score > 15) {
        console.log(`  ✏️  Improving ${field} (AI score: ${audit.score})...`);
        const improved = await improveContent(originalText, {
          cityName: page.city_name,
          eventType: page.event_type_display,
          field,
        });
        
        if (improved !== originalText) {
          updates[field] = improved;
          pageImproved = true;
          allAudits.push({
            field: `${page.event_type_slug}.${field}`,
            original: originalText.substring(0, 200),
            issues: audit.issues,
            improved: improved.substring(0, 200),
            aiScore: audit.score,
          });
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`  ✅ ${field} looks good (AI score: ${audit.score})`);
      }
    }

    // Audit FAQs
    if (page.faqs && Array.isArray(page.faqs)) {
      console.log(`  🔎 Auditing FAQs...`);
      const improvedFAQs = [];
      
      for (const faq of page.faqs) {
        if (faq.answer) {
          const audit = await detectAIPatterns(faq.answer);
          if (audit.score > 15) {
            console.log(`    ✏️  Improving FAQ: ${faq.question.substring(0, 50)}...`);
            const improved = await improveContent(faq.answer, {
              cityName: page.city_name,
              eventType: page.event_type_display,
              field: 'faq',
            });
            improvedFAQs.push({ ...faq, answer: improved });
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            improvedFAQs.push(faq);
          }
        } else {
          improvedFAQs.push(faq);
        }
      }
      
      if (JSON.stringify(improvedFAQs) !== JSON.stringify(page.faqs)) {
        updates.faqs = improvedFAQs;
        pageImproved = true;
      }
    }

    // Update page if improvements were made
    if (pageImproved) {
      updates.content_updated_at = new Date().toISOString();
      updates.content_version = (page.content_version || 1) + 1;
      
      const { error: updateError } = await supabase
        .from('city_event_pages')
        .update(updates)
        .eq('id', page.id);

      if (updateError) {
        console.error(`  ❌ Error updating page:`, updateError);
      } else {
        console.log(`  ✅ Page updated successfully`);
        totalImproved++;
      }
    } else {
      console.log(`  ✅ No improvements needed`);
    }

    // Rate limiting between pages
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Pages audited: ${pages.length}`);
  console.log(`✅ Pages improved: ${totalImproved}`);
  console.log(`✅ Total fields improved: ${allAudits.length}`);
  
  if (allAudits.length > 0) {
    const avgScore = allAudits.reduce((sum, a) => sum + a.aiScore, 0) / allAudits.length;
    console.log(`📊 Average AI score before: ${avgScore.toFixed(1)}/100`);
  }

  console.log('\n✨ Audit complete!');
}

// Run the audit
auditAndImproveMemphisPages().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

