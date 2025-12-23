/**
 * Bidding Dummy Data Configuration
 * 
 * Provides utilities for managing dummy data generation based on admin settings
 * and real-time activity context.
 */

/**
 * Get dummy data configuration based on organization settings and current activity
 * 
 * @param {Object} organization - Organization object with bidding dummy data settings
 * @param {Object} context - Current bidding context (real bids, requests, etc.)
 * @returns {Object} Configuration object for dummy data generation
 */
export function getDummyDataConfig(organization, context = {}) {
  const {
    bidding_dummy_data_enabled = true,
    bidding_dummy_data_aggressiveness = 'medium',
    bidding_dummy_data_max_bid_multiplier = 1.5,
    bidding_dummy_data_frequency_multiplier = 1.0,
    bidding_dummy_data_scale_with_real_activity = true
  } = organization || {};

  // If disabled, return no-op config
  if (!bidding_dummy_data_enabled || bidding_dummy_data_aggressiveness === 'none') {
    return {
      enabled: false,
      aggressiveness: 'none',
      maxBidMultiplier: 1.0,
      frequencyMultiplier: 0,
      scaleWithActivity: false
    };
  }

  // Calculate activity scaling factor
  let activityScale = 1.0;
  if (bidding_dummy_data_scale_with_real_activity) {
    const realBidCount = context.realBidCount || 0;
    const realRequestCount = context.realRequestCount || 0;
    const currentWinningBid = context.currentWinningBid || 0;
    
    // Scale down dummy data based on real activity
    // More real bids = less dummy data
    if (realBidCount > 0) {
      // Exponential decay: 1 bid = 0.8x, 2 bids = 0.6x, 3+ bids = 0.4x
      activityScale = Math.max(0.2, 1.0 - (realBidCount * 0.2));
    }
    
    // If there are real requests, reduce fake requests
    if (realRequestCount > 0) {
      activityScale = Math.min(activityScale, Math.max(0.3, 1.0 - (realRequestCount * 0.15)));
    }
    
    // If winning bid is high, be more conservative with dummy bids
    if (currentWinningBid > 5000) { // $50+
      activityScale *= 0.7; // Reduce by 30%
    }
    if (currentWinningBid > 10000) { // $100+
      activityScale *= 0.5; // Reduce by another 50%
    }
  }

  // Aggressiveness presets
  const aggressivenessConfig = {
    low: {
      maxBidMultiplier: 1.2, // Only 20% above current
      frequencyMultiplier: 0.5, // Half frequency
      viewerCountRange: [5, 12], // Lower viewer count
      activityInterval: [15000, 25000], // Less frequent activity
      feedInterval: [8000, 12000] // Less frequent feed updates
    },
    medium: {
      maxBidMultiplier: 1.5, // 50% above current
      frequencyMultiplier: 1.0, // Normal frequency
      viewerCountRange: [8, 25], // Moderate viewer count
      activityInterval: [8000, 15000], // Moderate activity
      feedInterval: [3000, 7000] // Moderate feed updates
    },
    high: {
      maxBidMultiplier: 2.0, // Double current bid
      frequencyMultiplier: 1.5, // 50% more frequent
      viewerCountRange: [15, 40], // Higher viewer count
      activityInterval: [5000, 10000], // More frequent activity
      feedInterval: [2000, 5000] // More frequent feed updates
    }
  };

  const baseConfig = aggressivenessConfig[bidding_dummy_data_aggressiveness] || aggressivenessConfig.medium;

  // Apply organization multipliers and activity scaling
  return {
    enabled: true,
    aggressiveness: bidding_dummy_data_aggressiveness,
    maxBidMultiplier: Math.min(
      parseFloat(bidding_dummy_data_max_bid_multiplier) * activityScale,
      5.0 // Cap at 5x
    ),
    frequencyMultiplier: parseFloat(bidding_dummy_data_frequency_multiplier) * activityScale,
    scaleWithActivity: bidding_dummy_data_scale_with_real_activity,
    viewerCountRange: baseConfig.viewerCountRange,
    activityInterval: baseConfig.activityInterval.map(ms => 
      Math.round(ms / (parseFloat(bidding_dummy_data_frequency_multiplier) * activityScale))
    ),
    feedInterval: baseConfig.feedInterval.map(ms => 
      Math.round(ms / (parseFloat(bidding_dummy_data_frequency_multiplier) * activityScale))
    ),
    activityScale // For debugging/logging
  };
}

/**
 * Calculate maximum dummy bid amount based on current winning bid and config
 * 
 * @param {number} currentWinningBid - Current winning bid in cents
 * @param {Object} config - Dummy data configuration
 * @returns {number} Maximum dummy bid amount in cents
 */
export function getMaxDummyBidAmount(currentWinningBid, config) {
  if (!config.enabled) return 0;
  
  const baseAmount = Math.max(currentWinningBid, 500); // Minimum $5
  const maxAmount = Math.round(baseAmount * config.maxBidMultiplier);
  
  // Cap at reasonable maximums based on aggressiveness
  const maxCaps = {
    low: 2000, // $20 max
    medium: 5000, // $50 max
    high: 10000 // $100 max
  };
  
  return Math.min(maxAmount, maxCaps[config.aggressiveness] || maxCaps.medium);
}

/**
 * Calculate number of dummy bids to generate
 * 
 * @param {Object} config - Dummy data configuration
 * @param {number} realBidCount - Number of real bids
 * @returns {number} Number of dummy bids to generate
 */
export function getDummyBidCount(config, realBidCount = 0) {
  if (!config.enabled) return 0;
  
  const baseCount = {
    low: 1,
    medium: 2,
    high: 3
  }[config.aggressiveness] || 2;
  
  // Scale down if there are real bids
  const scaledCount = Math.max(0, Math.round(baseCount * config.activityScale));
  
  return scaledCount;
}

/**
 * Calculate number of fake requests to generate
 * 
 * @param {Object} config - Dummy data configuration
 * @param {number} realRequestCount - Number of real requests
 * @returns {number} Number of fake requests to generate
 */
export function getFakeRequestCount(config, realRequestCount = 0) {
  if (!config.enabled) return 0;
  
  const baseCount = {
    low: 2,
    medium: 5,
    high: 8
  }[config.aggressiveness] || 5;
  
  // Scale down if there are real requests
  const scaledCount = Math.max(0, Math.round(baseCount * config.activityScale));
  
  return scaledCount;
}

