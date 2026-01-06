import { useState, useEffect } from 'react';

/**
 * Custom hook for fetching and managing payment settings
 * Centralizes payment settings logic
 */
export function usePaymentSettings(options = {}) {
  const { organizationId = null, organizationSlug = null } = options;
  const [paymentSettings, setPaymentSettings] = useState({
    cashAppTag: '$DJbenmurray',
    venmoUsername: '@djbenmurray'
  });
  const [fastTrackFee, setFastTrackFee] = useState(1000);
  const [nextFee, setNextFee] = useState(2000);
  const [minimumAmount, setMinimumAmount] = useState(1000); // Default $10.00 (1000 cents)
  const [presetAmounts, setPresetAmounts] = useState([
    { label: '$10', value: 1000 },
    { label: '$15', value: 1500 },
    { label: '$20', value: 2000 },
    { label: '$25', value: 2500 }
  ]);
  const [bundleDiscountEnabled, setBundleDiscountEnabled] = useState(true);
  const [bundleDiscount, setBundleDiscount] = useState(0.1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, organizationSlug]);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (organizationId) params.set('organizationId', organizationId);
      if (organizationSlug) params.set('organizationSlug', organizationSlug);
      const url = params.toString()
        ? `/api/crowd-request/settings?${params.toString()}`
        : '/api/crowd-request/settings';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.cashAppTag) setPaymentSettings(prev => ({ ...prev, cashAppTag: data.cashAppTag }));
        if (data.venmoUsername) setPaymentSettings(prev => ({ ...prev, venmoUsername: data.venmoUsername }));
        if (data.fastTrackFee) setFastTrackFee(data.fastTrackFee);
        if (data.nextFee) setNextFee(data.nextFee);
        if (data.minimumAmount) setMinimumAmount(data.minimumAmount);
        if (data.presetAmounts && Array.isArray(data.presetAmounts)) {
          const presets = data.presetAmounts.map((amount) => ({
            label: `$${(amount / 100).toFixed(0)}`,
            value: amount
          }));
          setPresetAmounts(presets);
        }
        if (data.bundleDiscountEnabled !== undefined) {
          setBundleDiscountEnabled(data.bundleDiscountEnabled);
        }
        if (data.bundleDiscountPercent !== undefined) {
          setBundleDiscount(data.bundleDiscountPercent / 100);
        }
        setError(null);
      } else {
        throw new Error('Failed to fetch payment settings');
      }
    } catch (err) {
      setError(err.message);
      // Use defaults if fetch fails
    } finally {
      setLoading(false);
    }
  };

  return {
    paymentSettings,
    fastTrackFee,
    nextFee,
    minimumAmount,
    presetAmounts,
    bundleDiscountEnabled,
    bundleDiscount,
    loading,
    error,
    refetch: fetchPaymentSettings
  };
}

