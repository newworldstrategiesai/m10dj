import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles, Music, Calendar, Users, DollarSign, Clock, Star, HelpCircle, Heart, Rings, Mic } from 'lucide-react';

export default function PricingWalkthrough() {
  const router = useRouter();
  const { id } = router.query;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommendedPackage, setRecommendedPackage] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWedding, setIsWedding] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    try {
      // Use the correct API endpoint
      const response = await fetch(`/api/leads/get-lead?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setLeadData(data);
        // Check if it's a wedding - check both eventType and event_type fields
        const eventType = (data.eventType || data.event_type || '').toString().toLowerCase().trim();
        const isWeddingEvent = eventType === 'wedding' || 
                               eventType.includes('wedding') ||
                               eventType === 'wedding reception' ||
                               eventType === 'wedding ceremony';
        
        console.log('Walkthrough - Event type detection:', {
          eventType: data.eventType || data.event_type,
          normalized: eventType,
          isWedding: isWeddingEvent
        });
        
        setIsWedding(isWeddingEvent);
      } else {
        console.error('Failed to fetch lead data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Wedding-specific questions (tailored to close wedding deals)
  const weddingQuestions = [
    {
      id: 'guest_count',
      question: 'How many guests are you expecting at your wedding?',
      icon: Users,
      options: [
        { value: 'intimate', label: 'Under 75 guests', description: 'Intimate celebration' },
        { value: 'medium', label: '75-150 guests', description: 'Perfect size wedding' },
        { value: 'large', label: '150-250 guests', description: 'Grand celebration' },
        { value: 'xlarge', label: '250+ guests', description: 'Large wedding party' }
      ]
    },
    {
      id: 'coverage_needs',
      question: 'What parts of your wedding day do you need DJ coverage for?',
      icon: Calendar,
      multiple: true,
      options: [
        { value: 'ceremony', label: 'Ceremony', description: 'Processional, vows, recessional' },
        { value: 'cocktail', label: 'Cocktail Hour', description: 'Background music & atmosphere' },
        { value: 'reception', label: 'Reception', description: 'Dancing, announcements, party' },
        { value: 'all_day', label: 'All Day Coverage', description: 'Ceremony through reception' }
      ]
    },
    {
      id: 'special_moments',
      question: 'Which special moments matter most to you? (Select all that apply)',
      icon: Heart,
      multiple: true,
      options: [
        { value: 'first_dance', label: 'First Dance', description: 'Your perfect song' },
        { value: 'parent_dances', label: 'Parent Dances', description: 'Mother/son, father/daughter' },
        { value: 'bouquet_garter', label: 'Bouquet & Garter Toss', description: 'Fun traditions' },
        { value: 'cake_cutting', label: 'Cake Cutting', description: 'Sweet moment' },
        { value: 'grand_exit', label: 'Grand Exit', description: 'Memorable send-off' },
        { value: 'all_moments', label: 'All Special Moments', description: 'Every detail matters' }
      ]
    },
    {
      id: 'atmosphere',
      question: 'What atmosphere are you envisioning for your reception?',
      icon: Sparkles,
      options: [
        { value: 'elegant', label: 'Elegant & Sophisticated', description: 'Classic, refined ambiance' },
        { value: 'romantic', label: 'Romantic & Intimate', description: 'Soft lighting, beautiful mood' },
        { value: 'party', label: 'High Energy Party', description: 'Dance floor packed all night' },
        { value: 'balanced', label: 'Balanced Mix', description: 'Elegant dinner, fun dancing' }
      ]
    },
    {
      id: 'mc_importance',
      question: 'How important is having a professional MC to coordinate your timeline?',
      icon: Mic,
      options: [
        { value: 'essential', label: 'Absolutely Essential', description: 'Need smooth coordination' },
        { value: 'important', label: 'Very Important', description: 'Want professional announcements' },
        { value: 'nice', label: 'Nice to Have', description: 'Helpful but not critical' },
        { value: 'not_needed', label: 'Not Needed', description: 'Just music is fine' }
      ]
    },
    {
      id: 'lighting',
      question: 'How important is uplighting to create the perfect atmosphere?',
      icon: Sparkles,
      options: [
        { value: 'must_have', label: 'Must Have', description: 'Essential for the vibe' },
        { value: 'very_important', label: 'Very Important', description: 'Really want it' },
        { value: 'nice_bonus', label: 'Nice Bonus', description: 'If budget allows' },
        { value: 'not_priority', label: 'Not a Priority', description: 'Focus on music' }
      ]
    },
    {
      id: 'budget_range',
      question: 'What\'s your wedding entertainment budget?',
      icon: DollarSign,
      options: [
        { value: 'budget', label: 'Under $2,000', description: 'Basic package' },
        { value: 'standard', label: '$2,000-$2,500', description: 'Most popular choice' },
        { value: 'premium', label: '$2,500-$3,000', description: 'Premium experience' },
        { value: 'luxury', label: '$3,000+', description: 'Full-service luxury wedding' }
      ]
    }
  ];

  // General event questions (for non-weddings)
  const generalQuestions = [
    {
      id: 'event_size',
      question: 'How many guests are you expecting?',
      icon: Users,
      options: [
        { value: 'small', label: 'Under 50 guests', description: 'Intimate gathering' },
        { value: 'medium', label: '50-150 guests', description: 'Medium celebration' },
        { value: 'large', label: '150-300 guests', description: 'Large event' },
        { value: 'xlarge', label: '300+ guests', description: 'Grand celebration' }
      ]
    },
    {
      id: 'budget_range',
      question: 'What\'s your budget range?',
      icon: DollarSign,
      options: [
        { value: 'budget', label: 'Under $500', description: 'Essential package' },
        { value: 'standard', label: '$500-$1,000', description: 'Popular choice' },
        { value: 'premium', label: '$1,000-$1,500', description: 'Premium experience' },
        { value: 'luxury', label: '$1,500+', description: 'Full-service luxury' }
      ]
    },
    {
      id: 'priorities',
      question: 'What matters most to you? (Select all that apply)',
      icon: Star,
      multiple: true,
      options: [
        { value: 'sound_quality', label: 'Crystal-clear sound', description: 'Professional audio' },
        { value: 'lighting', label: 'Uplighting & atmosphere', description: 'Beautiful ambiance' },
        { value: 'mc_service', label: 'Professional MC', description: 'Smooth coordination' },
        { value: 'music_selection', label: 'Custom playlist', description: 'Your favorite songs' },
        { value: 'experience', label: '15+ years experience', description: 'Proven track record' },
        { value: 'equipment', label: 'Top-tier equipment', description: 'Best-in-class gear' }
      ]
    },
    {
      id: 'event_type',
      question: 'What type of event is this?',
      icon: Calendar,
      options: [
        { value: 'wedding', label: 'Wedding', description: 'Your special day' },
        { value: 'corporate', label: 'Corporate Event', description: 'Professional gathering' },
        { value: 'party', label: 'Private Party', description: 'Celebration' },
        { value: 'school', label: 'School Dance/Event', description: 'Student event' }
      ]
    },
    {
      id: 'timeline',
      question: 'How long do you need DJ services?',
      icon: Clock,
      options: [
        { value: 'short', label: '2-4 hours', description: 'Ceremony + reception' },
        { value: 'standard', label: '4-6 hours', description: 'Full event coverage' },
        { value: 'extended', label: '6+ hours', description: 'Extended celebration' }
      ]
    }
  ];

  // Use wedding questions if it's a wedding, otherwise general questions
  // Also check leadData directly as a fallback
  const detectedWedding = isWedding || 
    (leadData && (
      (leadData.eventType || leadData.event_type || '').toString().toLowerCase().includes('wedding')
    ));
  const questions = detectedWedding ? weddingQuestions : generalQuestions;

  const handleAnswer = (questionId, value, isMultiple = false) => {
    if (isMultiple) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: prev[questionId]?.includes(value)
          ? prev[questionId].filter(v => v !== value)
          : [...(prev[questionId] || []), value]
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
      // Auto-advance to next question
      setTimeout(() => {
        if (currentStep < questions.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          calculateRecommendation();
        }
      }, 300);
    }
  };

  const calculateRecommendation = () => {
    // Check if it's a wedding - use current state and leadData
    const isWeddingEvent = isWedding || 
      (leadData && (
        (leadData.eventType || leadData.event_type || '').toString().toLowerCase().includes('wedding')
      ));
    
    if (isWeddingEvent) {
      calculateWeddingRecommendation();
    } else {
      calculateGeneralRecommendation();
    }
  };

  const calculateWeddingRecommendation = () => {
    const guestCount = answers.guest_count;
    const coverageNeeds = answers.coverage_needs || [];
    const specialMoments = answers.special_moments || [];
    const atmosphere = answers.atmosphere;
    const mcImportance = answers.mc_importance;
    const lighting = answers.lighting;
    const budget = answers.budget_range;

    // Determine package tier based on wedding-specific factors
    // Package 1 = $2,000, Package 2 = $2,500 (most popular), Package 3 = $3,000
    let packageTier = 'package2'; // Default to Package 2 (most popular)
    
    // Package 3 (Premium - $3,000) indicators
    if (budget === 'luxury' || 
        (budget === 'premium' && (guestCount === 'xlarge' || coverageNeeds.includes('all_day'))) ||
        (coverageNeeds.includes('ceremony') && coverageNeeds.includes('reception') && coverageNeeds.includes('cocktail')) ||
        (mcImportance === 'essential' && lighting === 'must_have' && guestCount === 'large') ||
        (atmosphere === 'elegant' && guestCount === 'xlarge') ||
        (specialMoments.includes('all_moments') && lighting === 'must_have')) {
      packageTier = 'package3';
    } 
    // Package 1 (Basic - $2,000) indicators
    else if (budget === 'budget' || 
             (guestCount === 'intimate' && !coverageNeeds.includes('ceremony') && lighting !== 'must_have') ||
             (!coverageNeeds.includes('reception') && !coverageNeeds.includes('all_day'))) {
      packageTier = 'package1';
    }
    // Otherwise Package 2 (Standard - $2,500) - most popular

    // Determine add-ons based on wedding needs
    const addons = [];
    if (lighting === 'must_have' || lighting === 'very_important' || atmosphere === 'romantic' || atmosphere === 'elegant') {
      addons.push('uplighting');
    }
    if (mcImportance === 'essential' || mcImportance === 'important' || coverageNeeds.includes('reception')) {
      addons.push('mc_service');
    }
    if (coverageNeeds.includes('ceremony')) {
      addons.push('ceremony_sound');
    }
    if (guestCount === 'large' || guestCount === 'xlarge') {
      addons.push('wireless_mics');
    }
    if (specialMoments.includes('all_moments') || specialMoments.length >= 4) {
      addons.push('timeline_coordination');
    }
    if (coverageNeeds.includes('cocktail')) {
      addons.push('cocktail_hour');
    }

    setRecommendedPackage({
      tier: packageTier,
      addons,
      eventType: 'wedding',
      reasoning: generateWeddingReasoning(answers, coverageNeeds, specialMoments, atmosphere, mcImportance, lighting)
    });
  };

  const calculateGeneralRecommendation = () => {
    // Original general event logic
    const eventSize = answers.event_size;
    const budget = answers.budget_range;
    const priorities = answers.priorities || [];
    const eventType = answers.event_type || leadData?.eventType || 'event';
    const timeline = answers.timeline;

    // Determine package tier
    let packageTier = 'standard';
    if (budget === 'luxury' || eventSize === 'xlarge' || priorities.includes('lighting') && priorities.includes('mc_service')) {
      packageTier = 'premium';
    } else if (budget === 'budget' || eventSize === 'small') {
      packageTier = 'essential';
    }

    // Determine add-ons
    const addons = [];
    if (priorities.includes('lighting')) addons.push('uplighting');
    if (priorities.includes('mc_service') && eventType === 'wedding') addons.push('mc_service');
    if (eventSize === 'large' || eventSize === 'xlarge') addons.push('wireless_mics');

    setRecommendedPackage({
      tier: packageTier,
      addons,
      eventType,
      timeline,
      reasoning: generateReasoning(answers, priorities)
    });
  };

  const generateWeddingReasoning = (answers, coverageNeeds, specialMoments, atmosphere, mcImportance, lighting) => {
    const reasons = [];
    
    // Guest count reasoning
    if (answers.guest_count === 'large' || answers.guest_count === 'xlarge') {
      reasons.push('Your guest count requires professional-grade sound to ensure everyone hears every special moment');
    } else if (answers.guest_count === 'intimate') {
      reasons.push('Perfect for an intimate celebration where every detail matters');
    }

    // Coverage needs
    if (coverageNeeds.includes('all_day')) {
      reasons.push('All-day coverage ensures seamless transitions from ceremony through reception');
    } else if (coverageNeeds.includes('ceremony') && coverageNeeds.includes('reception')) {
      reasons.push('Coverage for both ceremony and reception ensures your entire day flows perfectly');
    }

    // Special moments
    if (specialMoments.includes('all_moments') || specialMoments.length >= 4) {
      reasons.push('With multiple special moments planned, professional coordination is essential');
    }

    // Atmosphere
    if (atmosphere === 'elegant' || atmosphere === 'romantic') {
      reasons.push('Uplighting will transform your venue into the elegant atmosphere you envision');
    } else if (atmosphere === 'party') {
      reasons.push('Premium sound and lighting will keep your dance floor packed all night');
    }

    // MC importance
    if (mcImportance === 'essential' || mcImportance === 'important') {
      reasons.push('Professional MC services ensure your timeline runs smoothly and all special moments are perfectly timed');
    }

    // Lighting
    if (lighting === 'must_have' || lighting === 'very_important') {
      reasons.push('Uplighting creates the beautiful ambiance that makes wedding photos stunning');
    }

    // Budget
    if (answers.budget_range === 'premium' || answers.budget_range === 'luxury') {
      reasons.push('Your budget allows for the premium experience your special day deserves');
    }

    return reasons.length > 0 ? reasons : ['This package is perfectly tailored for your wedding day'];
  };

  const generateReasoning = (answers, priorities) => {
    const reasons = [];
    if (answers.event_size === 'large' || answers.event_size === 'xlarge') {
      reasons.push('Your event size requires professional-grade sound and equipment');
    }
    if (priorities.includes('lighting')) {
      reasons.push('Uplighting will create the perfect atmosphere for your event');
    }
    if (priorities.includes('mc_service')) {
      reasons.push('Professional MC services ensure smooth coordination');
    }
    if (answers.budget_range === 'premium' || answers.budget_range === 'luxury') {
      reasons.push('Your budget allows for our premium experience');
    }
    return reasons.length > 0 ? reasons : ['Based on your event details, this package fits perfectly'];
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateRecommendation();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleViewRecommendation = () => {
    // Map package tier to actual package ID for quote page
    // The quote page uses 'package1', 'package2', 'package3' as IDs
    const packageIdMap = {
      'package1': 'package1',
      'package2': 'package2',
      'package3': 'package3',
      'premium': 'package3',
      'standard': 'package2',
      'essential': 'package1'
    };
    const packageId = packageIdMap[recommendedPackage.tier] || recommendedPackage.tier;
    router.push(`/quote/${id}?recommended=${packageId}&addons=${recommendedPackage.addons.join(',')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your personalized guide...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const canProceed = currentQuestion.multiple 
    ? (answers[currentQuestion.id]?.length > 0)
    : !!answers[currentQuestion.id];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (recommendedPackage) {
    return (
      <>
        <Head>
          <title>Your Personalized Package Recommendation | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {detectedWedding ? 'Perfect! We Found Your Wedding Package 🎵💍' : 'Perfect! We Found Your Match 🎵'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {detectedWedding 
                  ? 'Based on your wedding details, here\'s your personalized package recommendation'
                  : 'Based on your answers, here\'s your personalized recommendation'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-brand" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recommendedPackage.tier === 'package3' ? 'Package 3 - Premium Experience' : 
                     recommendedPackage.tier === 'package1' ? 'Package 1 - Reception Only' : 
                     'Package 2 - Most Popular'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {detectedWedding 
                      ? 'Perfect for your special wedding day'
                      : `Perfect for your ${leadData?.eventType || leadData?.event_type || 'event'}`}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">Why this package:</h3>
                <ul className="space-y-2">
                  {recommendedPackage.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {recommendedPackage.addons.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Recommended Add-ons:</h3>
                  <ul className="space-y-1">
                    {recommendedPackage.addons.map((addon, idx) => (
                      <li key={idx} className="text-gray-700 dark:text-gray-300">
                        • {addon.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleViewRecommendation}
                  className="flex-1 bg-brand hover:bg-brand-dark text-black font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  View Full Package Details
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Link
                  href={`/quote/${id}`}
                  className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
                >
                  See All Options
                </Link>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Still have questions? We're here to help!
              </p>
              <a
                href="tel:+19014102020"
                className="inline-flex items-center gap-2 text-brand hover:text-brand-dark font-semibold"
              >
                Call (901) 410-2020
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Find Your Perfect Package | M10 DJ Company</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href={`/quote/${id}`} className="inline-flex items-center gap-2 text-brand hover:text-brand-dark mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Quote
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {detectedWedding ? 'Let\'s Plan Your Perfect Wedding Day 🎵💍' : 'Let\'s Find Your Perfect Package'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {detectedWedding 
                ? 'Answer a few quick questions about your wedding and we\'ll recommend the perfect package to make your special day unforgettable'
                : 'Answer a few quick questions and we\'ll recommend the perfect package for your event'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-brand h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              {currentQuestion.icon && (
                <currentQuestion.icon className="w-8 h-8 text-brand" />
              )}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = currentQuestion.multiple
                  ? answers[currentQuestion.id]?.includes(option.value)
                  : answers[currentQuestion.id] === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(currentQuestion.id, option.value, currentQuestion.multiple)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/10 dark:bg-brand/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-6 h-6 text-brand flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {currentQuestion.multiple && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>Select all that apply</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-3 bg-brand hover:bg-brand-dark text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {currentStep === questions.length - 1 ? 'Get Recommendation' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

