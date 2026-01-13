import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Save, Loader2, DollarSign, Package, Plus, AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface PackageBreakdown {
  item: string;
  description: string;
  price: number;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface PricingConfig {
  id: string;
  config_type: string;
  package1_price: number;
  package1_a_la_carte_price: number;
  package2_price: number;
  package2_a_la_carte_price: number;
  package3_price: number;
  package3_a_la_carte_price: number;
  package1_breakdown: PackageBreakdown[];
  package2_breakdown: PackageBreakdown[];
  package3_breakdown: PackageBreakdown[];
  addons: Addon[];
}

export default function AdminPricing() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'packages' | 'addons' | 'summary'>('summary');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    checkAdmin();
    fetchPricing();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const adminEmails = [
          'admin@m10djcompany.com',
          'manager@m10djcompany.com',
          'djbenmurray@gmail.com'
        ];
        setIsAdmin(adminEmails.includes(user.email));
        if (!adminEmails.includes(user.email)) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/admin/pricing');
      if (response.ok) {
        const data = await response.json();
        // If breakdowns are empty, load defaults
        const configWithDefaults = loadDefaultBreakdowns(data);
        setConfig(configWithDefaults);
        setHasChanges(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load pricing configuration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pricing configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load default breakdowns if empty
  const loadDefaultBreakdowns = (data: PricingConfig): PricingConfig => {
    const defaults = {
      package1_breakdown: [
        { item: 'Up to 4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 1600 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs.', price: 250 }
      ],
      package2_breakdown: [
        { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 }
      ],
      package3_breakdown: [
        { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 },
        { item: 'Dancing on the Clouds', description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.', price: 500 }
      ],
      addons: [
        { id: 'dj_mc_4hours', name: 'Up to 4 Hours DJ/MC Services (A La Carte)', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library. Perfect for receptions.', price: 1600 },
        { id: 'dj_mc_3hours', name: 'Up to 3 Hours DJ/MC Services (A La Carte)', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and music library.', price: 1300 },
        { id: 'ceremony_audio', name: 'Ceremony Audio', description: 'Additional hour of DJ services + ceremony music programming. Perfect for couples who want professional audio for their ceremony.', price: 500 },
        { id: 'dance_floor_lighting', name: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer. Creates an energetic atmosphere.', price: 400 },
        { id: 'uplighting', name: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance. Perfect for creating a romantic or energetic atmosphere.', price: 350 },
        { id: 'monogram', name: 'Monogram Projection', description: 'A custom graphic showing the names or initials of newlyweds. The font and look is fully customizable to fit clients needs. Monograms can be projected on any floor or wall.', price: 350 },
        { id: 'speaker_rental', name: 'Speaker Rental (Basic Setup)', description: 'Professional speaker system rental with built-in mixer. Perfect for cocktail hours, ceremonies, or separate areas. Includes microphone input.', price: 250 },
        { id: 'additional_speaker', name: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 },
        { id: 'additional_hour', name: 'Additional Hour(s)', description: 'Additional DJ/MC services beyond the 4-hour package. Perfect if your event runs longer than expected.', price: 300 },
        { id: 'dancing_clouds', name: 'Dancing on the Clouds', description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.', price: 500 },
        { id: 'cold_spark', name: 'Cold Spark Fountain Effect', description: 'Dramatic indoor-safe spark effects for grand entrances or special moments. Safe for indoor use, creates stunning visual effects.', price: 600 }
      ]
    };

    return {
      ...data,
      package1_breakdown: data.package1_breakdown && data.package1_breakdown.length > 0 ? data.package1_breakdown : defaults.package1_breakdown,
      package2_breakdown: data.package2_breakdown && data.package2_breakdown.length > 0 ? data.package2_breakdown : defaults.package2_breakdown,
      package3_breakdown: data.package3_breakdown && data.package3_breakdown.length > 0 ? data.package3_breakdown : defaults.package3_breakdown,
      addons: data.addons && data.addons.length > 0 ? data.addons : defaults.addons
    };
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setHasChanges(false);
        toast({
          title: 'Success',
          description: 'Pricing configuration saved successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save pricing',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pricing configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePackagePrice = (packageNum: 1 | 2 | 3, field: 'price' | 'a_la_carte_price', value: number) => {
    if (!config) return;
    const fieldName = `package${packageNum}_${field === 'price' ? 'price' : 'a_la_carte_price'}` as keyof PricingConfig;
    setConfig({ ...config, [fieldName]: value });
    setHasChanges(true);
  };

  const updateBreakdown = (packageNum: 1 | 2 | 3, index: number, field: keyof PackageBreakdown, value: string | number) => {
    if (!config) return;
    const breakdownName = `package${packageNum}_breakdown` as keyof PricingConfig;
    const breakdown = [...(config[breakdownName] as PackageBreakdown[])] as PackageBreakdown[];
    breakdown[index] = { ...breakdown[index], [field]: value };
    setConfig({ ...config, [breakdownName]: breakdown });
    setHasChanges(true);
  };

  const addBreakdownItem = (packageNum: 1 | 2 | 3) => {
    if (!config) return;
    const breakdownName = `package${packageNum}_breakdown` as keyof PricingConfig;
    const breakdown = [...(config[breakdownName] as PackageBreakdown[])] as PackageBreakdown[];
    breakdown.push({ item: '', description: '', price: 0 });
    setConfig({ ...config, [breakdownName]: breakdown });
    setHasChanges(true);
  };

  const removeBreakdownItem = (packageNum: 1 | 2 | 3, index: number) => {
    if (!config) return;
    const breakdownName = `package${packageNum}_breakdown` as keyof PricingConfig;
    const breakdown = [...(config[breakdownName] as PackageBreakdown[])] as PackageBreakdown[];
    breakdown.splice(index, 1);
    setConfig({ ...config, [breakdownName]: breakdown });
    setHasChanges(true);
  };

  const updateAddon = (index: number, field: keyof Addon, value: string | number) => {
    if (!config) return;
    const addons = [...config.addons];
    addons[index] = { ...addons[index], [field]: value };
    setConfig({ ...config, addons });
    setHasChanges(true);
  };

  const addAddon = () => {
    if (!config) return;
    const addons = [...config.addons];
    addons.push({ id: `addon-${Date.now()}`, name: '', price: 0, description: '' });
    setConfig({ ...config, addons });
    setHasChanges(true);
  };

  const removeAddon = (index: number) => {
    if (!config) return;
    const addons = [...config.addons];
    addons.splice(index, 1);
    setConfig({ ...config, addons });
    setHasChanges(true);
  };

  const loadDefaultsForPackage = (packageNum: 1 | 2 | 3) => {
    if (!config) return;
    const defaults = {
      1: [
        { item: 'Up to 4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 1600 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs.', price: 250 }
      ],
      2: [
        { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 }
      ],
      3: [
        { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 },
        { item: 'Dancing on the Clouds', description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.', price: 500 }
      ]
    };
    const breakdownName = `package${packageNum}_breakdown` as keyof PricingConfig;
    setConfig({ ...config, [breakdownName]: defaults[packageNum] });
    setHasChanges(true);
    toast({
      title: 'Defaults Loaded',
      description: `Default breakdown loaded for Package ${packageNum}`,
    });
  };

  const calculateBreakdownTotal = (breakdown: PackageBreakdown[]): number => {
    return breakdown.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const getSavings = (packagePrice: number, aLaCartePrice: number): number => {
    return aLaCartePrice - packagePrice;
  };

  const getSavingsPercentage = (packagePrice: number, aLaCartePrice: number): number => {
    if (aLaCartePrice === 0) return 0;
    return Math.round((getSavings(packagePrice, aLaCartePrice) / aLaCartePrice) * 100);
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">No pricing configuration found</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Pricing Management | Admin</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="section-container py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-brand" />
                    Pricing Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Manage all package pricing, breakdowns, and add-ons
                  </p>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save All Changes
                    </>
                  )}
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'summary'
                      ? 'text-brand border-b-2 border-brand'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('packages')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'packages'
                      ? 'text-brand border-b-2 border-brand'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  Packages
                </button>
                <button
                  onClick={() => setActiveTab('addons')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'addons'
                      ? 'text-brand border-b-2 border-brand'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add-ons
                </button>
              </div>
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Pricing Overview
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((pkgNum) => {
                      const packagePrice = config[`package${pkgNum}_price` as keyof PricingConfig] as number;
                      const aLaCartePrice = config[`package${pkgNum}_a_la_carte_price` as keyof PricingConfig] as number;
                      const breakdown = config[`package${pkgNum}_breakdown` as keyof PricingConfig] as PackageBreakdown[] || [];
                      const breakdownTotal = calculateBreakdownTotal(breakdown);
                      const savings = getSavings(packagePrice, aLaCartePrice);
                      const savingsPercent = getSavingsPercentage(packagePrice, aLaCartePrice);
                      const breakdownMatches = Math.abs(breakdownTotal - aLaCartePrice) < 1;

                      return (
                        <div key={pkgNum} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              Package {pkgNum}
                            </h3>
                            {pkgNum === 2 && (
                              <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded">Most Popular</span>
                            )}
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Package Price:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">${packagePrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">A La Carte:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">${aLaCartePrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Savings:</span>
                              <span className="font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                ${savings.toLocaleString()} ({savingsPercent}%)
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Breakdown Total:</span>
                              <span className={`text-xs font-medium ${breakdownMatches ? 'text-green-600' : 'text-orange-600'}`}>
                                ${breakdownTotal.toLocaleString()}
                              </span>
                            </div>
                            {!breakdownMatches && (
                              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                Breakdown doesn't match a la carte price
                              </div>
                            )}
                            {breakdownMatches && (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                                <CheckCircle className="w-3 h-3" />
                                Breakdown matches
                              </div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {breakdown.length} line items
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Add-ons Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {config.addons.slice(0, 6).map((addon, idx) => (
                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{addon.name}</div>
                          <div className="text-lg font-bold text-brand mt-1">${addon.price.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    {config.addons.length > 6 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                        + {config.addons.length - 6} more add-ons
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Packages Tab */}
            {activeTab === 'packages' && (
              <div className="space-y-8">
                {[1, 2, 3].map((pkgNum) => {
                  const packagePrice = config[`package${pkgNum}_price` as keyof PricingConfig] as number;
                  const aLaCartePrice = config[`package${pkgNum}_a_la_carte_price` as keyof PricingConfig] as number;
                  const breakdown = config[`package${pkgNum}_breakdown` as keyof PricingConfig] as PackageBreakdown[] || [];

                  return (
                    <div key={pkgNum} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Package {pkgNum}
                      </h2>

                      {/* Package Prices */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Package Price
                          </label>
                          <Input
                            type="number"
                            value={packagePrice}
                            onChange={(e) => updatePackagePrice(pkgNum as 1 | 2 | 3, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            A La Carte Price
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={aLaCartePrice}
                              onChange={(e) => updatePackagePrice(pkgNum as 1 | 2 | 3, 'a_la_carte_price', parseFloat(e.target.value) || 0)}
                              className="w-full"
                              min="0"
                              step="0.01"
                            />
                            {aLaCartePrice < packagePrice && (
                              <div className="absolute -bottom-5 left-0 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                A la carte should be higher than package price
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Savings: <span className="font-semibold text-green-600 dark:text-green-400">
                              ${getSavings(packagePrice, aLaCartePrice).toLocaleString()} ({getSavingsPercentage(packagePrice, aLaCartePrice)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Package Breakdown
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Total: <span className={`font-medium ${Math.abs(calculateBreakdownTotal(breakdown) - aLaCartePrice) < 1 ? 'text-green-600' : 'text-orange-600'}`}>
                                  ${calculateBreakdownTotal(breakdown).toLocaleString()}
                                </span>
                              </span>
                              {Math.abs(calculateBreakdownTotal(breakdown) - aLaCartePrice) >= 1 && (
                                <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Should be ${aLaCartePrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {breakdown.length === 0 && (
                              <Button
                                onClick={() => loadDefaultsForPackage(pkgNum as 1 | 2 | 3)}
                                className="btn-outline text-sm"
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Load Defaults
                              </Button>
                            )}
                            <Button
                              onClick={() => addBreakdownItem(pkgNum as 1 | 2 | 3)}
                              className="btn-outline text-sm"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Item
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {breakdown.map((item, idx) => (
                            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Item Name
                                  </label>
                                  <Input
                                    value={item.item}
                                    onChange={(e) => updateBreakdown(pkgNum as 1 | 2 | 3, idx, 'item', e.target.value)}
                                    placeholder="e.g., 4 Hours DJ/MC Services"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Price
                                  </label>
                                  <Input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateBreakdown(pkgNum as 1 | 2 | 3, idx, 'price', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    onClick={() => removeBreakdownItem(pkgNum as 1 | 2 | 3, idx)}
                                    className="btn-outline text-sm w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Description
                                </label>
                                <Textarea
                                  value={item.description}
                                  onChange={(e) => updateBreakdown(pkgNum as 1 | 2 | 3, idx, 'description', e.target.value)}
                                  placeholder="Description of this item"
                                  rows={2}
                                  className="resize-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add-ons Tab */}
            {activeTab === 'addons' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Add-ons
                  </h2>
                  <Button
                    onClick={addAddon}
                    className="btn-outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Add-on
                  </Button>
                </div>

                <div className="space-y-4">
                  {config.addons.map((addon, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Name
                          </label>
                          <Input
                            value={addon.name}
                            onChange={(e) => updateAddon(idx, 'name', e.target.value)}
                            placeholder="e.g., Monogram Projection"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price
                          </label>
                          <Input
                            type="number"
                            value={addon.price}
                            onChange={(e) => updateAddon(idx, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={() => removeAddon(idx)}
                            className="btn-outline text-sm w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <Textarea
                          value={addon.description}
                          onChange={(e) => updateAddon(idx, 'description', e.target.value)}
                          placeholder="Description of this add-on"
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

