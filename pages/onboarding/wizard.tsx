/**
 * Enhanced Onboarding Wizard
 * 
 * Multi-step setup wizard for new DJs to configure their organization
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization, createOrganization } from '@/utils/organization-context';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Building2,
  User,
  CreditCard,
  Sparkles,
  Check
} from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

export default function OnboardingWizard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
    ownerName: '',
    ownerEmail: '',
    phone: '',
    location: '',
    selectedPlan: null as string | null,
  });

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Let\'s get you set up',
      component: WelcomeStep
    },
    {
      id: 'organization',
      title: 'Organization Details',
      description: 'Tell us about your business',
      component: OrganizationStep
    },
    {
      id: 'profile',
      title: 'Your Profile',
      description: 'Set up your account',
      component: ProfileStep
    },
    {
      id: 'plan',
      title: 'Choose Plan',
      description: 'Select your subscription',
      component: PlanStep
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'You\'re all set!',
      component: CompleteStep
    }
  ];

  useEffect(() => {
    async function checkExisting() {
      // Check product context first - redirect TipJar/DJ Dash users away
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.product_context) {
          const productContext = user.user_metadata.product_context;
          
          if (productContext === 'tipjar') {
            router.push('/tipjar/dashboard');
            return;
          } else if (productContext === 'djdash') {
            router.push('/djdash/dashboard');
            return;
          }
          // m10dj users continue with onboarding
        }
      } catch (error) {
        console.error('Error checking product context:', error);
      }
      
      const org = await getCurrentOrganization(supabase);
      if (org) {
        setOrganization(org);
        // If org exists, skip to plan selection
        setCurrentStep(3);
      }
      setLoading(false);
    }
    checkExisting();
  }, [supabase, router]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // After organization step, create organization
      if (!formData.organizationName) {
        alert('Please enter your organization name');
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/signin');
          return;
        }

        // Generate slug from name
        const slug = formData.organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const org = await createOrganization(supabase, formData.organizationName, user.id);
        if (org) {
          setOrganization(org);
          updateFormData({ organizationSlug: org.slug });
          
          // Save organization slug to user metadata so we can redirect after email confirmation
          try {
            const { error: metadataError } = await supabase.auth.updateUser({
              data: {
                organization_slug: org.slug,
                organization_id: org.id
              }
            });
            if (metadataError) {
              console.error('Error saving organization slug to metadata:', metadataError);
            } else {
              console.log('✅ Organization slug saved to user metadata:', org.slug);
            }
          } catch (error) {
            console.error('Error updating user metadata:', error);
          }
          
          // Save location if provided
          if (formData.location) {
            try {
              const { error: updateError } = await supabase
                .from('organizations')
                .update({ requests_header_location: formData.location })
                .eq('id', org.id);
              
              if (updateError) {
                console.error('Error saving location:', updateError);
              } else {
                console.log('✅ Location saved:', formData.location);
                // Update local org object
                org.requests_header_location = formData.location;
                setOrganization({ ...org });
              }
            } catch (error) {
              console.error('Error saving location:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error creating organization:', error);
        alert('Failed to create organization. Please try again.');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <Head>
        <title>Setup Wizard - Get Started</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    {index <= currentStep ? (
                      <CheckCircle className="w-6 h-6 text-brand-gold" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                    <span className={`ml-2 text-sm font-medium ${
                      index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-brand-gold' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-brand-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            organization={organization}
            onNext={handleNext}
            onBack={handleBack}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
          />
        </div>
      </div>
    </>
  );
}

// Step Components
function WelcomeStep({ onNext }: any) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <Sparkles className="w-16 h-16 text-brand-gold mx-auto mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your DJ Platform!</h1>
      <p className="text-xl text-gray-600 mb-8">
        Let's get you set up in just a few steps. This will only take a few minutes.
      </p>
      <button
        onClick={onNext}
        className="bg-brand-gold text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-500 transition-colors inline-flex items-center"
      >
        Get Started <ArrowRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );
}

function OrganizationStep({ formData, updateFormData, onNext, onBack, isFirst }: any) {
  const [slugPreview, setSlugPreview] = useState('');

  useEffect(() => {
    if (formData.organizationName) {
      const slug = formData.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlugPreview(slug);
      updateFormData({ organizationSlug: slug });
    }
  }, [formData.organizationName]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center mb-6">
        <Building2 className="w-8 h-8 text-brand-gold mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Organization Details</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            value={formData.organizationName}
            onChange={(e) => updateFormData({ organizationName: e.target.value })}
            placeholder="e.g., M10 DJ Company"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            required
          />
        </div>

        {slugPreview && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your URL Slug
            </label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
              <span className="text-gray-500">yourdomain.com/</span>
              <span className="text-gray-900 font-mono">{slugPreview}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This will be your unique organization URL
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (Optional)
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateFormData({ location: e.target.value })}
            placeholder="e.g., Memphis, TN"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        {!isFirst && (
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!formData.organizationName}
          className="ml-auto bg-brand-gold text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}

function ProfileStep({ formData, updateFormData, onNext, onBack }: any) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center mb-6">
        <User className="w-8 h-8 text-brand-gold mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.ownerName}
            onChange={(e) => updateFormData({ ownerName: e.target.value })}
            placeholder="e.g., Ben Murray"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="e.g., (901) 410-2020"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!formData.ownerName || !formData.phone}
          className="ml-auto bg-brand-gold text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}

function PlanStep({ formData, updateFormData, onNext, onBack, organization }: any) {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      description: 'Perfect for DJs just getting started',
      features: ['5 events per month', 'Basic features', 'Email support', 'Platform fees: 5% + $0.50']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49,
      description: 'For established DJs who want to grow',
      features: ['Unlimited events', 'Full CRM & analytics', 'Advanced features', 'Priority support', 'Platform fees: 3.5% + $0.30'],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 149,
      description: 'For high-volume DJ companies',
      features: ['Everything in Professional', 'White-label branding', 'API access', 'Multi-user accounts', 'Platform fees: 2.5% + $0.20']
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center mb-6">
        <CreditCard className="w-8 h-8 text-brand-gold mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
      </div>

      <p className="text-gray-600 mb-8">
        All plans include a 14-day free trial. No credit card required.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => updateFormData({ selectedPlan: plan.id })}
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
              formData.selectedPlan === plan.id
                ? 'border-brand-gold bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${plan.popular ? 'ring-2 ring-brand-gold' : ''}`}
          >
            {plan.popular && (
              <div className="text-center mb-2">
                <span className="bg-brand-gold text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">
                {plan.price === 0 ? 'Free' : `$${plan.price}`}
              </span>
              {plan.price > 0 && <span className="text-gray-600">/month</span>}
            </div>
            <ul className="space-y-2 mb-4">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-sm text-gray-700">
                  <Check className="w-4 h-4 text-brand-gold mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
            {formData.selectedPlan === plan.id && (
              <div className="text-center text-brand-gold font-semibold">
                Selected ✓
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!formData.selectedPlan}
          className="ml-auto bg-brand-gold text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {formData.selectedPlan === 'starter' ? 'Continue' : 'Continue to Checkout'} <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}

function CompleteStep({ formData, organization }: any) {
  const router = useRouter();

  const handleComplete = async () => {
    if (formData.selectedPlan && organization) {
      // Handle Starter plan ($0) vs paid plans differently
      if (formData.selectedPlan === 'starter') {
        // Starter plan - activate directly without Stripe checkout
        try {
          const response = await fetch('/api/subscriptions/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              priceId: getPriceIdForPlan(formData.selectedPlan),
              organizationId: organization.id,
            }),
          });

          const data = await response.json();
          if (data.success) {
            // Starter plan activated - redirect to requests page
            if (organization?.slug) {
              router.push(`/organizations/${organization.slug}/requests`);
            } else {
              router.push('/admin/dashboard');
            }
          } else {
            console.error('Error activating Starter plan:', data);
            router.push('/onboarding/select-plan');
          }
        } catch (error) {
          console.error('Error activating Starter plan:', error);
          router.push('/onboarding/select-plan');
        }
      } else {
        // Paid plans - redirect to Stripe checkout
        try {
          const response = await fetch('/api/subscriptions/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              priceId: getPriceIdForPlan(formData.selectedPlan),
              organizationId: organization.id,
            }),
          });

          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            console.error('No checkout URL returned:', data);
            router.push('/onboarding/select-plan');
          }
        } catch (error) {
          console.error('Error creating checkout:', error);
          router.push('/onboarding/select-plan');
        }
      }
    } else {
      // No plan selected - redirect to requests page if organization exists
      if (organization?.slug) {
        router.push(`/organizations/${organization.slug}/requests`);
      } else {
        router.push('/admin/dashboard');
      }
    }
  };

  const getPriceIdForPlan = (planId: string | null) => {
    const planMap: Record<string, string> = {
      starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
      professional: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
      enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    };
    return planMap[planId || ''] || planMap.starter;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-4">You're All Set!</h1>
      <p className="text-xl text-gray-600 mb-8">
        Your organization <strong>{formData.organizationName}</strong> has been created.
      </p>
      
      {formData.selectedPlan ? (
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Ready to start your subscription?
          </p>
          <button
            onClick={handleComplete}
            className="bg-brand-gold text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-500 transition-colors inline-flex items-center"
          >
            Complete Setup <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="bg-brand-gold text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-500 transition-colors inline-flex items-center"
        >
          Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      )}
    </div>
  );
}

