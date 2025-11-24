/**
 * Centralized API client for crowd request operations
 * Replaces scattered fetch calls with consistent error handling
 */

class CrowdRequestAPIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'CrowdRequestAPIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      throw new CrowdRequestAPIError(
        'Invalid response from server',
        response.status,
        null
      );
    }

    if (!response.ok) {
      throw new CrowdRequestAPIError(
        data?.error || data?.message || `HTTP ${response.status}: Request failed`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof CrowdRequestAPIError) {
      throw error;
    }
    throw new CrowdRequestAPIError(
      error.message || 'Network error',
      null,
      null
    );
  }
}

export const crowdRequestAPI = {
  /**
   * Fetch payment settings
   */
  async getSettings() {
    return apiRequest('/api/crowd-request/settings');
  },

  /**
   * Extract song info from URL
   */
  async extractSongInfo(url) {
    return apiRequest('/api/crowd-request/extract-song-info', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  },

  /**
   * Submit crowd request
   */
  async submitRequest(requestData) {
    return apiRequest('/api/crowd-request/submit', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  },

  /**
   * Create Stripe checkout session
   */
  async createCheckout({ requestId, amount, preferredPaymentMethod }) {
    return apiRequest('/api/crowd-request/create-checkout', {
      method: 'POST',
      body: JSON.stringify({
        requestId,
        amount,
        preferredPaymentMethod
      })
    });
  },

  /**
   * Update payment method
   */
  async updatePaymentMethod({ requestId, paymentMethod }) {
    return apiRequest('/api/crowd-request/update-payment-method', {
      method: 'POST',
      body: JSON.stringify({
        requestId,
        paymentMethod
      })
    });
  },

  /**
   * Send receipt
   */
  async sendReceipt({ requestId, email, name }) {
    return apiRequest('/api/crowd-request/send-receipt', {
      method: 'POST',
      body: JSON.stringify({
        requestId,
        email,
        name
      })
    });
  }
};

export { CrowdRequestAPIError };

