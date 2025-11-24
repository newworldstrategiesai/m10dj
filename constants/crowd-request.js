/**
 * Constants for crowd request functionality
 * Centralizes magic numbers and default values
 */

export const CROWD_REQUEST_CONSTANTS = {
  // Timing constants (in milliseconds)
  AUTO_ADVANCE_DELAY: 400,
  SONG_EXTRACTION_DELAY: 1000,
  VENMO_FALLBACK_DELAY: 2000,
  RECEIPT_SUCCESS_DELAY: 2000,
  COPY_FEEDBACK_DELAY: 2000,
  MOBILE_SCROLL_DELAY: 300,

  // Default payment values (in cents)
  DEFAULT_PRESET_AMOUNT: 500, // $5.00
  DEFAULT_MINIMUM_AMOUNT: 100, // $1.00
  DEFAULT_FAST_TRACK_FEE: 1000, // $10.00
  DEFAULT_NEXT_FEE: 2000, // $20.00
  DEFAULT_BUNDLE_DISCOUNT: 0.1, // 10%

  // Default preset amounts
  DEFAULT_PRESET_AMOUNTS: [
    { label: '$5', value: 500 },
    { label: '$10', value: 1000 },
    { label: '$20', value: 2000 },
    { label: '$50', value: 5000 }
  ],

  // Payment settings defaults
  DEFAULT_CASH_APP_TAG: '$DJbenmurray',
  DEFAULT_VENMO_USERNAME: '@djbenmurray',

  // Request types
  REQUEST_TYPES: {
    SONG_REQUEST: 'song_request',
    SHOUTOUT: 'shoutout'
  },

  // Payment method types
  PAYMENT_METHODS: {
    CARD: 'card',
    CASHAPP: 'cashapp',
    VENMO: 'venmo'
  },

  // Amount types
  AMOUNT_TYPES: {
    PRESET: 'preset',
    CUSTOM: 'custom'
  },

  // Steps
  STEPS: {
    REQUEST_DETAILS: 1,
    PAYMENT: 2
  },

  // Character limits
  PAYMENT_NOTE_MAX_LENGTH: 200,
  CASHAPP_NOTE_MAX_LENGTH: 100,
  VENMO_NOTE_MAX_LENGTH: 280
};

