'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createOrganization } from '@/utils/organization-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Music, CheckCircle, ArrowRight, Building2, User, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function RequestPageOnboarding() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Step 1: Account
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2: Business Details
    businessName: '',
    artistName: '',
    phone: '',
    location: '',
    // Step 3: Optional
    website: '',
    instagram: '',
    facebook: '',
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            organization_name: formData.businessName || undefined,
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data.user) {
        console.log('✅ User account created:', {
          userId: data.user.id,
          email: data.user.email,
          hasSession: !!data.session,
          emailConfirmed: data.user.email_confirmed_at !== null
        });
        
        // User created, proceed to next step
        // Note: Since email confirmations are disabled, user should have a session
        // If they don't, they'll need to sign in manually
        setStep(2);
      } else {
        throw new Error('Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return;
    }

    if (!formData.artistName.trim()) {
      setError('Artist/DJ name is required');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Please complete step 1 first');
      }

      // Create organization
      const org = await createOrganization(supabase, formData.businessName.trim(), user.id);
      
      if (!org) {
        throw new Error('Failed to create your organization');
      }

      // Helper function to normalize URLs - auto-adds https:// if missing
      const normalizeUrl = (url: string): string => {
        if (!url || !url.trim()) return '';
        let normalized = url.trim();
        
        // If it doesn't start with http:// or https://, add https://
        if (normalized && !normalized.match(/^https?:\/\//i)) {
          normalized = `https://${normalized}`;
        }
        
        return normalized;
      };

      // Helper function to normalize Instagram handle
      const normalizeInstagram = (handle: string): string => {
        if (!handle || !handle.trim()) return '';
        let normalized = handle.trim();
        
        // Remove @ if present
        if (normalized.startsWith('@')) {
          normalized = normalized.substring(1);
        }
        
        // If it's a full URL, extract the handle
        if (normalized.includes('instagram.com/')) {
          const match = normalized.match(/instagram\.com\/([^\/\?]+)/i);
          if (match) {
            normalized = match[1];
          }
        }
        
        // Return as full URL
        return normalized ? `https://instagram.com/${normalized}` : '';
      };

      // Helper function to normalize Facebook URL
      const normalizeFacebook = (url: string): string => {
        if (!url || !url.trim()) return '';
        let normalized = url.trim();
        
        // If it's just a page name, convert to full URL
        if (normalized && !normalized.includes('facebook.com') && !normalized.includes('http')) {
          normalized = `https://facebook.com/${normalized}`;
        } else if (normalized && !normalized.match(/^https?:\/\//i)) {
          normalized = `https://${normalized}`;
        }
        
        return normalized;
      };

      // Update organization with additional details
      // Note: Only update fields that exist in the organizations table
      const updateData: any = {
        requests_header_artist_name: formData.artistName.trim(),
      };

      // Add optional fields if they exist in the schema
      if (formData.phone) {
        updateData.contact_phone = formData.phone.trim();
      }
      if (formData.location) {
        updateData.address = formData.location.trim();
        updateData.requests_header_location = formData.location.trim();
      }
      if (formData.website) {
        updateData.website = normalizeUrl(formData.website);
      }
      
      // Social links - format as array (expected by Header and requests page)
      const socialLinksArray: any[] = [];
      if (formData.instagram) {
        const instagramUrl = normalizeInstagram(formData.instagram);
        if (instagramUrl) {
          socialLinksArray.push({
            platform: 'instagram',
            url: instagramUrl,
            enabled: true,
            order: 0
          });
        }
      }
      if (formData.facebook) {
        const facebookUrl = normalizeFacebook(formData.facebook);
        if (facebookUrl) {
          socialLinksArray.push({
            platform: 'facebook',
            url: facebookUrl,
            enabled: true,
            order: 1
          });
        }
      }
      
      if (socialLinksArray.length > 0) {
        updateData.social_links = socialLinksArray;
      }

      console.log('💾 Updating organization with data:', updateData);
      
      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', org.id);

      if (updateError) {
        console.error('❌ Error updating organization details:', updateError);
        // Don't fail - org was created, details can be updated later
      } else {
        console.log('✅ Organization updated successfully:', {
          id: org.id,
          slug: org.slug,
          artistName: updateData.requests_header_artist_name,
          socialLinks: updateData.social_links
        });
      }

      // Success! Redirect to their request page with a small delay to ensure DB propagation
      setTimeout(() => {
        router.push(`/organizations/${org.slug}/requests`);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to create your request page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Your Request Page | M10 DJ</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-2xl">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                {step > 1 ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 mr-2 ${step === 1 ? 'border-purple-600' : 'border-gray-400'}`} />
                )}
                <span className="text-sm font-medium">Account</span>
              </div>
              <div className="flex-1 h-0.5 mx-4 bg-gray-200 dark:bg-gray-700">
                <div className={`h-full transition-all ${step >= 2 ? 'bg-purple-600 w-full' : 'bg-transparent w-0'}`} />
              </div>
              <div className={`flex items-center ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                {step > 2 ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 mr-2 ${step === 2 ? 'border-purple-600' : 'border-gray-400'}`} />
                )}
                <span className="text-sm font-medium">Details</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Account Creation */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-6">
              <div className="text-center mb-6">
                <Music className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Your Request Page
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Get started in minutes. No credit card required.
                </p>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          )}

          {/* Step 2: Business Details */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-6">
              <div className="text-center mb-6">
                <Building2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Tell Us About Your Business
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This information will appear on your request page
                </p>
              </div>

              <div>
                <Label htmlFor="businessName" className="text-gray-700 dark:text-gray-300">
                  Business/DJ Company Name *
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateFormData('businessName', e.target.value)}
                  placeholder="e.g., Elite DJ Services"
                  required
                  className="mt-1"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be your page URL: yourname.m10djcompany.com
                </p>
              </div>

              <div>
                <Label htmlFor="artistName" className="text-gray-700 dark:text-gray-300">
                  Artist/DJ Name *
                </Label>
                <Input
                  id="artistName"
                  type="text"
                  value={formData.artistName}
                  onChange={(e) => updateFormData('artistName', e.target.value)}
                  placeholder="e.g., DJ John"
                  required
                  className="mt-1"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will appear as the header on your request page
                </p>
              </div>

              <div>
                <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-gray-700 dark:text-gray-300">
                  Location/City
                </Label>
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="e.g., Memphis, TN"
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Optional - Social Links
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="website" className="text-gray-600 dark:text-gray-400 text-sm">
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="text"
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                      placeholder="yourwebsite.com or https://yourwebsite.com"
                      className="mt-1"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      We'll add https:// automatically if needed
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="instagram" className="text-gray-600 dark:text-gray-400 text-sm">
                      Instagram Handle
                    </Label>
                    <Input
                      id="instagram"
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => {
                        let value = e.target.value.trim();
                        // Remove @ if user adds it, we'll add it back if needed
                        if (value.startsWith('@')) {
                          value = value.substring(1);
                        }
                        updateFormData('instagram', value);
                      }}
                      placeholder="yourhandle (without @)"
                      className="mt-1"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Just your handle, we'll format it automatically
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="facebook" className="text-gray-600 dark:text-gray-400 text-sm">
                      Facebook Page
                    </Label>
                    <Input
                      id="facebook"
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => updateFormData('facebook', e.target.value)}
                      placeholder="facebook.com/yourpage or https://facebook.com/yourpage"
                      className="mt-1"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      We'll add https:// automatically if needed
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create My Page <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

