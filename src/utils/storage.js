/**
 * Utility functions for local storage operations
 */

const STORAGE_KEYS = {
  LANGUAGE: 'whisper-webgpu-language',
  AUTO_PROCESS: 'whisper-webgpu-auto-process',
  TRANSCRIPTION_HISTORY: 'whisper-webgpu-history',
  MODEL_PREFERENCE: 'whisper-webgpu-model',
};

/**
 * Save a value to local storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 */
export const saveToStorage = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
    return false;
  }
};

/**
 * Load a value from local storage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} The stored value or defaultValue
 */
export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return defaultValue;
    }
    return JSON.parse(serializedValue);
  } catch (error) {
    console.error(`Error loading from storage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Save language preference
 * @param {string} language - Language code
 */
export const saveLanguagePreference = (language) => {
  return saveToStorage(STORAGE_KEYS.LANGUAGE, language);
};

/**
 * Load language preference
 * @returns {string} Language code or default 'en'
 */
export const loadLanguagePreference = () => {
  return loadFromStorage(STORAGE_KEYS.LANGUAGE, 'en');
};

/**
 * Save auto-process preference
 * @param {boolean} autoProcess - Whether auto-processing is enabled
 */
export const saveAutoProcessPreference = (autoProcess) => {
  return saveToStorage(STORAGE_KEYS.AUTO_PROCESS, autoProcess);
};

/**
 * Load auto-process preference
 * @returns {boolean} Auto-process setting or default true
 */
export const loadAutoProcessPreference = () => {
  return loadFromStorage(STORAGE_KEYS.AUTO_PROCESS, true);
};

/**
 * Save transcription history
 * @param {Array} history - Array of transcription segments
 */
export const saveTranscriptionHistory = (history) => {
  // Limit history size to prevent storage issues
  const limitedHistory = history.slice(-100);
  return saveToStorage(STORAGE_KEYS.TRANSCRIPTION_HISTORY, limitedHistory);
};

/**
 * Load transcription history
 * @returns {Array} Transcription history or empty array
 */
export const loadTranscriptionHistory = () => {
  return loadFromStorage(STORAGE_KEYS.TRANSCRIPTION_HISTORY, []);
};

/**
 * Save model preference
 * @param {string} model - Model version (tiny, base, small, medium)
 */
export const saveModelPreference = (model) => {
  return saveToStorage(STORAGE_KEYS.MODEL_PREFERENCE, model);
};

/**
 * Load model preference
 * @returns {string} Model version or default 'base'
 */
export const loadModelPreference = () => {
  return loadFromStorage(STORAGE_KEYS.MODEL_PREFERENCE, 'base');
};

/**
 * Clear all application storage
 */
export const clearAllStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};
