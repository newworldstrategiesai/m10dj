import { useState, useEffect } from 'react';

/**
 * Custom hook for fetching and managing payment settings
 * Centralizes payment settings logic
 */
export function usePaymentSettings(options = {}) {
  const { organizationId = null, organizationSlug = null } = options;
  // Default to null - each organization should set their own payment usernames
  // We don't want to show personal defaults on TipJar SaaS pages
  const [paymentSettings, setPaymentSettings] = useState({
    cashAppTag: null,
    venmoUsername: null
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
  const [defaultPresetAmount, setDefaultPresetAmount] = useState(null);
  const [amountsSortOrder, setAmountsSortOrder] = useState('desc');
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
        // Always update payment settings, even if null or empty string
        // This ensures the UI reflects what's saved in the database
        setPaymentSettings(prev => ({
          ...prev,
          cashAppTag: data.cashAppTag || null,
          venmoUsername: data.venmoUsername || null
        }));
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
        if (data.defaultPresetAmount !== undefined) {
          setDefaultPresetAmount(data.defaultPresetAmount);
        }
        if (data.amountsSortOrder !== undefined) {
          setAmountsSortOrder(data.amountsSortOrder);
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
    defaultPresetAmount,
    amountsSortOrder,
    bundleDiscountEnabled,
    bundleDiscount,
    loading,
    error,
    refetch: fetchPaymentSettings
  };
}

