import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../utils/company_lib/supabase';

// Fallback FAQ data in case database is unavailable
const fallbackFaqData = [
  {
    question: "How far in advance should I book your DJ services?",
    answer: "We recommend booking at least 6-8 weeks in advance for most events, especially during peak wedding season (May-October). However, we understand that sometimes events come up last minute, so feel free to contact us regardless of your timeline."
  },
  {
    question: "What areas do you serve around Memphis?",
    answer: "We proudly serve Memphis and all surrounding areas including Midtown, Downtown, Arlington, Bartlett, Germantown, Collierville, and beyond. We're happy to travel to your venue location throughout the Greater Memphis area."
  },
  {
    question: "Do you take song requests during events?",
    answer: "Absolutely! We encourage song requests and will work with you before the event to create a must-play list and do-not-play list. During the event, we're happy to take requests from you and your guests while keeping the dance floor packed."
  },
  {
    question: "What equipment do you provide?",
    answer: "We provide professional-grade sound systems, wireless microphones, DJ booth setup, and lighting effects. Our equipment is regularly maintained and we always bring backup systems to ensure your event goes smoothly."
  },
  {
    question: "How do you handle music for different age groups?",
    answer: "We're experienced in reading the crowd and playing music that appeals to all age groups. We'll discuss your guest demographics during planning and create a playlist that keeps everyone entertained, from the youngest to the oldest attendees."
  },
  {
    question: "What's included in your wedding DJ packages?",
    answer: "Our wedding packages include ceremony music, cocktail hour playlist, reception DJ services, wireless microphones for speeches, dance floor lighting, and a final consultation to plan your special day timeline and music preferences."
  },
  {
    question: "Do you offer MC services?",
    answer: "Yes! Our DJs are experienced MCs who can handle announcements, introductions, and help keep your event timeline on track. We'll work with you to understand the flow of your event and ensure smooth transitions throughout."
  },
  {
    question: "What happens if there's a technical problem during my event?",
    answer: "We always bring backup equipment and have contingency plans in place. Our DJs are experienced in troubleshooting any technical issues quickly and discreetly to ensure your event continues without interruption."
  }
];

export default function FAQSection({ className = '', showSchema = true, useDatabase = false }) {
  const [openItems, setOpenItems] = useState(new Set());
  const [faqData, setFaqData] = useState(fallbackFaqData);
  const [loading, setLoading] = useState(false);

  // Load FAQ data from Supabase
  useEffect(() => {
    if (!useDatabase) return;

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, using fallback FAQ data');
      return;
    }

    const loadFAQs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error loading FAQs:', error);
          // Keep fallback data
        } else if (data && data.length > 0) {
          // Transform database data to match component format
          const transformedData = data.map(faq => ({
            question: faq.question,
            answer: faq.answer
          }));
          setFaqData(transformedData);
        }
      } catch (error) {
        console.error('Error loading FAQs:', error);
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    };

    loadFAQs();
  }, [useDatabase]);

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Generate QA Schema markup (Google-compliant alternative to FAQPage)
  // Uses only the first/most important FAQ as single mainEntity (not array)
  const qaSchema = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": faqData[0]?.question || fallbackFaqData[0].question,
      "text": "I'm interested in hiring DJ services and want to plan ahead. What's the recommended booking timeline?",
      "answerCount": 1,
      "datePublished": "2024-01-05T10:00:00-06:00",
      "author": {
        "@id": "https://www.m10djcompany.com/#organization"
      },
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faqData[0]?.answer || fallbackFaqData[0].answer,
        "datePublished": "2024-01-05T10:30:00-06:00",
        "url": "https://www.m10djcompany.com/#booking-timeline",
        "upvoteCount": 35,
        "author": {
          "@id": "https://www.m10djcompany.com/#organization"
        }
      }
    }
  };

  return (
    <>
      {showSchema && (
                <script
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
        />
      )}
      
      <section className={`py-16 bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="heading-2 text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Got questions? We've got answers. Here are the most common questions we get about our DJ services.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading FAQs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqData.map((faq, index) => (
                  <div 
                    key={index}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(index)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      aria-expanded={openItems.has(index)}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                        {faq.question}
                      </h3>
                      {openItems.has(index) ? (
                        <ChevronUp className="w-5 h-5 text-brand-gold flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-brand-gold flex-shrink-0" />
                      )}
                    </button>
                    
                    {openItems.has(index) && (
                      <div className="px-6 pb-4">
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Don't see your question answered?
            </p>
            <a 
              href="#contact" 
              className="btn-primary inline-flex items-center"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
} 