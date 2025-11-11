/**
 * Form State Manager
 * 
 * Automatically saves and restores form state to/from localStorage
 * Helps users recover their data if they navigate away or encounter errors
 */

export class FormStateManager {
  constructor(formId, options = {}) {
    this.formId = formId;
    this.storageKey = `form_state_${formId}`;
    this.options = {
      autoSave: true,
      saveDelay: 1000, // Debounce delay in ms
      excludeFields: [], // Fields to exclude from saving (e.g., passwords)
      encryptSensitive: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      ...options
    };
    
    this.saveTimeout = null;
  }

  /**
   * Save form state to localStorage
   * @param {object} formData - Current form data
   * @param {boolean} immediate - Save immediately without debouncing
   */
  saveState(formData, immediate = false) {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const save = () => {
      try {
        // Filter out excluded fields
        const dataToSave = { ...formData };
        this.options.excludeFields.forEach(field => {
          delete dataToSave[field];
        });

        const stateData = {
          timestamp: Date.now(),
          formData: dataToSave,
          version: '1.0'
        };

        localStorage.setItem(this.storageKey, JSON.stringify(stateData));
      } catch (error) {
        console.warn('Error saving form state:', error);
      }
    };

    if (immediate) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      save();
    } else {
      // Debounce saves
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(save, this.options.saveDelay);
    }
  }

  /**
   * Restore form state from localStorage
   * @returns {object|null} Restored form data or null if not found/expired
   */
  restoreState() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return null;
      }

      const stateData = JSON.parse(stored);
      
      // Check if state is expired
      const age = Date.now() - stateData.timestamp;
      if (age > this.options.maxAge) {
        this.clearState();
        return null;
      }

      return stateData.formData;
    } catch (error) {
      console.warn('Error restoring form state:', error);
      return null;
    }
  }

  /**
   * Check if there's a saved state available
   * @returns {boolean} True if saved state exists and is not expired
   */
  hasSavedState() {
    return this.restoreState() !== null;
  }

  /**
   * Get info about saved state without loading it
   * @returns {object|null} Info about saved state (timestamp, age)
   */
  getSavedStateInfo() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return null;
      }

      const stateData = JSON.parse(stored);
      const age = Date.now() - stateData.timestamp;

      if (age > this.options.maxAge) {
        return null;
      }

      return {
        timestamp: stateData.timestamp,
        age,
        ageMinutes: Math.floor(age / 60000),
        savedAt: new Date(stateData.timestamp).toLocaleString()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear saved form state
   */
  clearState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Create a form change handler that auto-saves
   * @param {function} onChange - Original onChange handler
   * @returns {function} Wrapped onChange handler
   */
  createAutoSaveHandler(onChange) {
    return (...args) => {
      // Call original handler
      if (onChange) {
        onChange(...args);
      }

      // Auto-save if enabled
      if (this.options.autoSave) {
        // We need the form data, which should be passed as the first arg
        // or extracted from the event
        const formData = args[0];
        if (formData && typeof formData === 'object') {
          this.saveState(formData);
        }
      }
    };
  }

  /**
   * Compare current form data with saved state
   * @param {object} currentData - Current form data
   * @returns {boolean} True if there are differences
   */
  hasChanges(currentData) {
    const savedData = this.restoreState();
    if (!savedData) {
      return false;
    }

    return JSON.stringify(currentData) !== JSON.stringify(savedData);
  }
}

/**
 * React hook for form state management
 * @param {string} formId - Unique form identifier
 * @param {object} initialState - Initial form state
 * @param {object} options - FormStateManager options
 * @returns {object} State manager utilities
 */
export function useFormStateManager(formId, initialState = {}, options = {}) {
  if (typeof window === 'undefined') {
    return {
      manager: null,
      hasSavedState: false,
      restoreState: () => initialState,
      saveState: () => {},
      clearState: () => {},
      getSavedStateInfo: () => null
    };
  }

  const manager = new FormStateManager(formId, options);

  return {
    manager,
    hasSavedState: manager.hasSavedState(),
    restoreState: () => manager.restoreState() || initialState,
    saveState: (data, immediate) => manager.saveState(data, immediate),
    clearState: () => manager.clearState(),
    getSavedStateInfo: () => manager.getSavedStateInfo()
  };
}

export default FormStateManager;

