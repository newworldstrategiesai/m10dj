import React from 'react';

// AI Overview Optimization Components for Google SGE and LLM Citations

export const AIAnswerBlock = ({ question, answer, context, statistics = [] }) => (
  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-lg border border-brand/10 max-w-4xl mx-auto">
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{question}</h3>
      <div className="prose prose-lg text-gray-800 leading-relaxed">
        <p className="text-xl font-medium mb-4">
          <strong>{answer}</strong>
        </p>
        {context && (
          <p className="text-lg text-gray-700 leading-relaxed">
            {context}
          </p>
        )}
      </div>
    </div>
    
    {statistics.length > 0 && (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statistics.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-brand-gold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const AIFactBox = ({ title, facts }) => (
  <div className="bg-gradient-to-br from-brand-gold/10 to-brand-gold/5 rounded-xl p-6 mb-8">
    <h4 className="text-xl font-bold text-gray-900 mb-4">{title}</h4>
    <ul className="space-y-3">
      {facts.map((fact, index) => (
        <li key={index} className="flex items-start">
          <div className="w-2 h-2 bg-brand-gold rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <span className="text-gray-700 leading-relaxed">{fact}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const AIComparisonTable = ({ title, comparisons }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <h4 className="text-xl font-bold text-gray-900">{title}</h4>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {comparisons.headers.map((header, index) => (
              <th key={index} className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisons.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 text-sm text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const AIStepByStep = ({ title, steps }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
    <h4 className="text-2xl font-bold text-gray-900 mb-6">{title}</h4>
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-brand-gold text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">
            {index + 1}
          </div>
          <div className="flex-1">
            <h5 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h5>
            <p className="text-gray-700 leading-relaxed">{step.description}</p>
            {step.tip && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800"><strong>Pro Tip:</strong> {step.tip}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AIQuickFacts = ({ category, facts }) => (
  <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-6 mb-8">
    <h4 className="text-xl font-bold mb-4 text-brand-gold">{category} Quick Facts</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {facts.map((fact, index) => (
        <div key={index} className="flex items-center">
          <div className="w-3 h-3 bg-brand-gold rounded-full mr-3"></div>
          <span className="text-gray-200">{fact}</span>
        </div>
      ))}
    </div>
  </div>
);

// Schema for AI Overview content
export const AIContentSchema = ({ content }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": content.headline,
        "description": content.description,
        "author": {
          "@type": "Organization",
          "name": "M10 DJ Company",
          "url": "https://www.m10djcompany.com"
        },
        "publisher": {
          "@type": "Organization",
          "name": "M10 DJ Company",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.m10djcompany.com/logo-static.jpg"
          }
        },
        "datePublished": content.datePublished || new Date().toISOString(),
        "dateModified": content.dateModified || new Date().toISOString(),
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": content.url
        },
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": [".ai-answer-block", ".ai-fact-box", ".ai-quick-facts"]
        }
      })
    }}
  />
);

// Predefined AI-optimized content blocks for Memphis DJ services
export const MemphisDJAIBlocks = {
  pricing: {
    question: "How much does a Memphis wedding DJ cost?",
    answer: "Memphis wedding DJ services typically range from $799-$1899 depending on package, venue requirements, and event duration.",
    context: "M10 DJ Company offers transparent pricing with no hidden fees. Our packages include professional-grade sound systems, wireless microphones, basic uplighting, and experienced MC services. Premium packages add ceremony music, enhanced lighting, and extended coverage.",
    statistics: [
      { value: "$1,299", label: "Average Wedding Package" },
      { value: "8 Hours", label: "Typical Coverage" },
      { value: "500+", label: "Weddings Completed" }
    ]
  },
  
  experience: {
    question: "What makes M10 DJ Company the best Memphis wedding DJ?",
    answer: "M10 DJ Company stands out with 15+ years of Memphis wedding experience, 500+ successful celebrations, and exclusive partnerships with premier venues.",
    context: "Our professional-grade sound systems, elegant uplighting, and expert MC services ensure flawless wedding entertainment from ceremony to reception. We have exclusive venue knowledge at The Peabody Hotel, Memphis Botanic Garden, Graceland, and 27+ premier locations throughout Memphis.",
    statistics: [
      { value: "15+", label: "Years Experience" },
      { value: "27+", label: "Premier Venues" },
      { value: "5.0★", label: "Average Rating" }
    ]
  },
  
  booking: {
    question: "How far in advance should we book our Memphis wedding DJ?",
    answer: "We recommend booking your Memphis wedding DJ 6-12 months in advance, especially for peak wedding season (April-October) and popular venues.",
    context: "This ensures availability and allows time for detailed planning. However, we can accommodate shorter timelines based on availability. Peak season dates at premier venues like The Peabody Hotel and Memphis Botanic Garden book fastest.",
    statistics: [
      { value: "6-12", label: "Months Advance" },
      { value: "Apr-Oct", label: "Peak Season" },
      { value: "90%", label: "Booking Success Rate" }
    ]
  }
};