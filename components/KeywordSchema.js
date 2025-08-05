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

    // QA Schema for AI search (Google-compliant alternative to FAQPage)
    const qaSchema = {
      "@type": "QAPage",
      "mainEntity": keywords.slice(0, 3).map(keyword => ({
        "@type": "Question",
        "name": `What ${pageType.toLowerCase()} services do you offer for "${keyword}"?`,
        "answerCount": 1,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `M10 DJ Company provides professional ${pageType.toLowerCase()} services for ${keyword}. We offer comprehensive entertainment solutions with 15+ years of experience serving Memphis and surrounding areas.`,
          "author": {
            "@type": "Organization",
            "name": "M10 DJ Company"
          }
        }
      }))
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