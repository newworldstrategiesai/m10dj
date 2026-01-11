'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Mail, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
// Note: App router pages should use the appropriate toast hook
// For now using the pages router hook as it's what batch-create uses
import { useToast } from '@/components/ui/Toasts/use-toast';

export default function ClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const token = searchParams?.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    business_name: ''
  });

  // Verify token and load organization info
  useEffect(() => {
    if (!token) {
      setError('No claim token provided. Please use the link from your email.');
      setVerifying(false);
      return;
    }

    // Fetch organization info by token
    fetch(`/api/tipjar/unclaimed-token?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error || !data.organization) {
          setError(data.error || 'Invalid or expired claim token');
          setVerifying(false);
          return;
        }

        setOrganization(data.organization);
        if (data.organization.prospect_email) {
          setFormData(prev => ({ ...prev, email: data.organization.prospect_email }));
        }
        if (data.organization.name) {
          setFormData(prev => ({ ...prev, business_name: data.organization.name }));
        }
        setVerifying(false);
      })
      .catch(err => {
        console.error('Error verifying token:', err);
        setError('Failed to verify claim token');
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Verify email matches organization
    if (organization && organization.prospect_email && 
        formData.email.toLowerCase() !== organization.prospect_email.toLowerCase()) {
      setError(`Email must match the prospect email: ${organization.prospect_email}`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tipjar/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim_token: token,
          email: formData.email.toLowerCase(),
          password: formData.password,
          business_name: formData.business_name || organization?.name || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim organization');
      }

      // Success - redirect to onboarding
      toast({
        title: 'Success!',
        description: 'Your account has been created and your page has been claimed.',
      });

      if (data.redirect_url) {
        router.push(data.redirect_url);
      } else {
        router.push('/tipjar/onboarding?claimed=true');
      }
    } catch (err: any) {
      console.error('Error claiming organization:', err);
      setError(err.message || 'Failed to claim organization. Please try again.');
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TipJarHeader />
        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex justify-center mb-4">
                <TipJarAnimatedLoader size={64} />
              </div>
              <p className="text-gray-600 dark:text-gray-400">Verifying claim token...</p>
            </CardContent>
          </Card>
        </main>
        <TipJarFooter />
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TipJarHeader />
        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Unable to Claim Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
              <div className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  The claim link may be invalid or expired. Please check your email for a valid link.
                </p>
                <Button onClick={() => router.push('/tipjar/signup')} variant="outline">
                  Create New Account Instead
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <TipJarFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TipJarHeader />
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <TipJarAnimatedLoader size={80} />
            </div>
            <CardTitle className="text-2xl">Claim Your TipJar Page</CardTitle>
            <CardDescription className="text-lg mt-2">
              {organization?.name ? (
                <>Create your account to claim <strong>{organization.name}</strong></>
              ) : (
                'Create your account to claim your TipJar page'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {organization && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Page Ready</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                      Your TipJar page <strong>{organization.slug || organization.name}</strong> is ready to be claimed.
                    </p>
                    {organization.has_pending_tips && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2 font-semibold">
                        💰 You have ${organization.pending_tips_dollars || '0.00'} in pending tips waiting for you!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!organization?.prospect_email || loading}
                  placeholder="your@email.com"
                  className="mt-1"
                />
                {organization?.prospect_email && (
                  <p className="text-xs text-gray-500 mt-1">
                    Must match: {organization.prospect_email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="business_name">Business/Artist Name *</Label>
                <Input
                  id="business_name"
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  required
                  placeholder="Your DJ or Performer Name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                  placeholder="Re-enter your password"
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    Claim My Page & Create Account
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
                {organization?.prospect_email && (
                  <> Your email must match <strong>{organization.prospect_email}</strong> to claim this page.</>
                )}
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
      <TipJarFooter />
    </div>
  );
}

