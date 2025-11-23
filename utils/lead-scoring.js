/**
 * Lead Scoring System
 * Calculates a score (0-100) for each lead based on multiple factors
 * Higher scores indicate higher priority/urgency
 */

/**
 * Calculate lead score based on multiple factors
 * @param {Object} contact - Contact/lead object
 * @param {Object} additionalData - Additional data like quote views, response times, etc.
 * @returns {Object} - { score: number (0-100), breakdown: Object, priority: 'High' | 'Medium' | 'Low' }
 */
export function calculateLeadScore(contact, additionalData = {}) {
  let score = 0;
  const breakdown = {
    eventDateUrgency: 0,
    budgetValue: 0,
    eventType: 0,
    leadStatus: 0,
    temperature: 0,
    paymentStatus: 0,
    engagement: 0,
    responseTime: 0
  };

  // 1. Event Date Urgency (0-25 points)
  // More urgent = higher score (events within 30 days are urgent)
  if (contact.event_date) {
    const eventDate = new Date(contact.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilEvent < 0) {
      // Past event - low priority
      breakdown.eventDateUrgency = 0;
    } else if (daysUntilEvent <= 7) {
      // Very urgent - within a week
      breakdown.eventDateUrgency = 25;
    } else if (daysUntilEvent <= 14) {
      // Urgent - within 2 weeks
      breakdown.eventDateUrgency = 20;
    } else if (daysUntilEvent <= 30) {
      // High urgency - within a month
      breakdown.eventDateUrgency = 15;
    } else if (daysUntilEvent <= 60) {
      // Medium urgency - within 2 months
      breakdown.eventDateUrgency = 10;
    } else if (daysUntilEvent <= 90) {
      // Low urgency - within 3 months
      breakdown.eventDateUrgency = 5;
    } else {
      // Future event - minimal urgency
      breakdown.eventDateUrgency = 2;
    }
  }
  score += breakdown.eventDateUrgency;

  // 2. Budget Value (0-20 points)
  // Higher budget = higher score
  if (contact.quoted_price || contact.final_price) {
    const price = contact.final_price || contact.quoted_price || 0;
    if (price >= 2000) {
      breakdown.budgetValue = 20;
    } else if (price >= 1500) {
      breakdown.budgetValue = 15;
    } else if (price >= 1000) {
      breakdown.budgetValue = 12;
    } else if (price >= 500) {
      breakdown.budgetValue = 8;
    } else if (price > 0) {
      breakdown.budgetValue = 5;
    }
  } else if (contact.budget_range) {
    // Parse budget range string
    const budgetStr = contact.budget_range.toLowerCase();
    if (budgetStr.includes('2000') || budgetStr.includes('2000+') || budgetStr.includes('$2000')) {
      breakdown.budgetValue = 20;
    } else if (budgetStr.includes('1500') || budgetStr.includes('1500-2000')) {
      breakdown.budgetValue = 15;
    } else if (budgetStr.includes('1000') || budgetStr.includes('1000-1500')) {
      breakdown.budgetValue = 12;
    } else if (budgetStr.includes('500') || budgetStr.includes('500-1000')) {
      breakdown.budgetValue = 8;
    } else if (budgetStr.includes('under') || budgetStr.includes('<')) {
      breakdown.budgetValue = 3;
    }
  }
  score += breakdown.budgetValue;

  // 3. Event Type (0-10 points)
  // Weddings are typically higher value
  if (contact.event_type) {
    const eventType = contact.event_type.toLowerCase();
    if (eventType.includes('wedding')) {
      breakdown.eventType = 10;
    } else if (eventType.includes('corporate') || eventType.includes('business')) {
      breakdown.eventType = 8;
    } else if (eventType.includes('party') || eventType.includes('celebration')) {
      breakdown.eventType = 6;
    } else {
      breakdown.eventType = 4;
    }
  }
  score += breakdown.eventType;

  // 4. Lead Status (0-15 points)
  // Further in pipeline = higher score
  const status = contact.lead_status || '';
  if (status === 'Booked' || status === 'Completed') {
    breakdown.leadStatus = 15;
  } else if (status === 'Negotiating' || status === 'Proposal Sent') {
    breakdown.leadStatus = 12;
  } else if (status === 'Qualified') {
    breakdown.leadStatus = 8;
  } else if (status === 'Contacted') {
    breakdown.leadStatus = 5;
  } else if (status === 'New') {
    breakdown.leadStatus = 2;
  } else if (status === 'Lost') {
    breakdown.leadStatus = 0;
  }
  score += breakdown.leadStatus;

  // 5. Temperature (0-10 points)
  const temperature = contact.lead_temperature || '';
  if (temperature === 'Hot') {
    breakdown.temperature = 10;
  } else if (temperature === 'Warm') {
    breakdown.temperature = 5;
  } else if (temperature === 'Cold') {
    breakdown.temperature = 2;
  }
  score += breakdown.temperature;

  // 6. Payment Status (0-10 points)
  // Paid = highest priority
  if (contact.payment_status === 'paid' || contact.deposit_paid) {
    breakdown.paymentStatus = 10;
  } else if (contact.payment_status === 'partial') {
    breakdown.paymentStatus = 7;
  } else if (contact.payment_status === 'pending') {
    breakdown.paymentStatus = 3;
  }
  score += breakdown.paymentStatus;

  // 7. Engagement (0-5 points)
  // Based on quote page views, responses, etc.
  if (additionalData.quotePageViews) {
    if (additionalData.quotePageViews >= 5) {
      breakdown.engagement = 5;
    } else if (additionalData.quotePageViews >= 3) {
      breakdown.engagement = 4;
    } else if (additionalData.quotePageViews >= 2) {
      breakdown.engagement = 3;
    } else if (additionalData.quotePageViews >= 1) {
      breakdown.engagement = 2;
    }
  }
  
  // Add points for responses
  if (additionalData.hasResponded) {
    breakdown.engagement += 2;
  }
  
  // Cap engagement at 5
  breakdown.engagement = Math.min(breakdown.engagement, 5);
  score += breakdown.engagement;

  // 8. Response Time (0-5 points)
  // Faster response = more engaged
  if (additionalData.responseTimeHours !== undefined) {
    if (additionalData.responseTimeHours <= 1) {
      breakdown.responseTime = 5;
    } else if (additionalData.responseTimeHours <= 4) {
      breakdown.responseTime = 4;
    } else if (additionalData.responseTimeHours <= 24) {
      breakdown.responseTime = 3;
    } else if (additionalData.responseTimeHours <= 48) {
      breakdown.responseTime = 2;
    } else if (additionalData.responseTimeHours <= 72) {
      breakdown.responseTime = 1;
    }
  }
  score += breakdown.responseTime;

  // Ensure score is between 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine priority level
  let priority = 'Low';
  if (score >= 70) {
    priority = 'High';
  } else if (score >= 40) {
    priority = 'Medium';
  }

  return {
    score: Math.round(score),
    breakdown,
    priority,
    factors: {
      urgent: breakdown.eventDateUrgency >= 15,
      highValue: breakdown.budgetValue >= 15,
      engaged: breakdown.engagement >= 3,
      inPipeline: breakdown.leadStatus >= 8
    }
  };
}

/**
 * Calculate scores for multiple contacts
 * @param {Array} contacts - Array of contact objects
 * @param {Object} additionalDataMap - Map of contact ID to additional data
 * @returns {Array} - Array of contacts with score added
 */
export function calculateScoresForContacts(contacts, additionalDataMap = {}) {
  return contacts.map(contact => {
    const additionalData = additionalDataMap[contact.id] || {};
    const scoreData = calculateLeadScore(contact, additionalData);
    return {
      ...contact,
      lead_score: scoreData.score,
      lead_priority: scoreData.priority,
      score_breakdown: scoreData.breakdown,
      score_factors: scoreData.factors
    };
  });
}

/**
 * Get score color for display
 * @param {number} score - Score (0-100)
 * @returns {string} - Tailwind color classes
 */
export function getScoreColor(score) {
  if (score >= 70) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  } else if (score >= 50) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
  } else if (score >= 30) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  } else {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  }
}

/**
 * Get priority badge color
 * @param {string} priority - 'High' | 'Medium' | 'Low'
 * @returns {string} - Tailwind color classes
 */
export function getPriorityColor(priority) {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'Medium':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    case 'Low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

