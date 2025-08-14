import React from 'react';

const KeywordSchema = ({ keywords, pageType, serviceArea }) => {
  const generateSchema = () => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@graph": []
    };

    // Service Schema for AI understanding
    const serviceSchema = {
      "@type": "Service",
      "name": `${pageType} Services`,
      "provider": {
        "@type": "LocalBusiness",
        "name": "M10 DJ Company",
        "url": "https://www.m10djcompany.com"
      },
      "areaServed": serviceArea || "Memphis, TN",
      "audience": {
        "@type": "Audience",
        "name": `People searching for ${keywords.join(', ')}`
      },
      "keywords": keywords.join(', '),
      "serviceType": pageType
    };

    // QA Schema for AI search (Enhanced Schema.org QAPage specification)
    // Uses only the first/most important keyword as single mainEntity (not array)
    const qaSchema = {
      "@type": "QAPage",
      "mainEntity": {
        "@type": "Question",
        "name": `What ${pageType.toLowerCase()} services do you offer for "${keywords[0]}"?`,
        "text": `I'm looking for professional ${pageType.toLowerCase()} services in the ${keywords[0]} area. What specific services does M10 DJ Company provide?`,
        "answerCount": 1,
        "upvoteCount": 35,
        "datePublished": "2024-01-08T16:00:00-06:00",
        "url": `https://www.m10djcompany.com/#${pageType.toLowerCase().replace(/\s+/g, '-')}-question`,
        "author": {
          "@type": "Person",
          "name": "Local Event Organizer",
          "url": "https://www.m10djcompany.com/contact"
        },
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `M10 DJ Company provides professional ${pageType.toLowerCase()} services for ${keywords[0]}. We offer comprehensive entertainment solutions with 15+ years of experience serving Memphis and surrounding areas.`,
          "datePublished": "2024-01-08T16:30:00-06:00",
          "url": `https://www.m10djcompany.com/#${pageType.toLowerCase().replace(/\s+/g, '-')}-services`,
          "upvoteCount": 58,
          "author": {
            "@type": "Organization",
            "name": "M10 DJ Company",
            "url": "https://www.m10djcompany.com"
          }
        }
      }
    };

    // How-to Schema for AI understanding
    const howToSchema = {
      "@type": "HowTo",
      "name": `How to hire ${pageType.toLowerCase()} services in Memphis`,
      "step": [
        {
          "@type": "HowToStep",
          "name": "Contact M10 DJ Company",
          "text": "Call (901) 410-2020 or fill out our contact form"
        },
        {
          "@type": "HowToStep", 
          "name": "Discuss your event needs",
          "text": "We'll discuss your specific requirements and preferences"
        },
        {
          "@type": "HowToStep",
          "name": "Receive custom quote",
          "text": "Get a personalized quote based on your event details"
        },
        {
          "@type": "HowToStep",
          "name": "Book your date",
          "text": "Secure your date with a contract and deposit"
        }
      ]
    };

    baseSchema["@graph"] = [serviceSchema, qaSchema, howToSchema];
    
    return baseSchema;
  };

  const schema = generateSchema();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default KeywordSchema;