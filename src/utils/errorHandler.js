/**
 * Error handling utilities
 */

// Error types
export const ERROR_TYPES = {
  AUDIO_PERMISSION: 'audio_permission',
  AUDIO_RECORDING: 'audio_recording',
  AUDIO_PROCESSING: 'audio_processing',
  MODEL_LOADING: 'model_loading',
  MODEL_PROCESSING: 'model_processing',
  FILE_UPLOAD: 'file_upload',
  BROWSER_SUPPORT: 'browser_support',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  UNKNOWN: 'unknown'
};

// Error messages
export const ERROR_MESSAGES = {
  [ERROR_TYPES.AUDIO_PERMISSION]: 'Could not access microphone. Please check permissions and try again.',
  [ERROR_TYPES.AUDIO_RECORDING]: 'Error with audio recording. Please try again.',
  [ERROR_TYPES.AUDIO_PROCESSING]: 'Failed to process audio. Please try again with a different audio sample.',
  [ERROR_TYPES.MODEL_LOADING]: 'Failed to load speech recognition model. Please check your connection and try again.',
  [ERROR_TYPES.MODEL_PROCESSING]: 'Error during speech recognition. Please try again.',
  [ERROR_TYPES.FILE_UPLOAD]: 'Failed to process the uploaded file. Please try a different file format.',
  [ERROR_TYPES.BROWSER_SUPPORT]: 'Your browser does not support all required features. Please try a modern browser like Chrome or Edge.',
  [ERROR_TYPES.UNAUTHORIZED_ACCESS]: 'Unauthorized access to model files. Please try a different model size or check your internet connection.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please refresh the page and try again.'
};

// Recovery suggestions
export const RECOVERY_SUGGESTIONS = {
  [ERROR_TYPES.AUDIO_PERMISSION]: [
    'Make sure your browser has permission to access your microphone',
    'Check if another application is using your microphone',
    'Try using a different microphone if available'
  ],
  [ERROR_TYPES.AUDIO_RECORDING]: [
    'Check if your microphone is properly connected',
    'Try refreshing the page',
    'Restart your browser'
  ],
  [ERROR_TYPES.AUDIO_PROCESSING]: [
    'Try speaking more clearly',
    'Reduce background noise',
    'Try a shorter audio sample'
  ],
  [ERROR_TYPES.MODEL_LOADING]: [
    'Check your internet connection',
    'Clear your browser cache and try again',
    'Try using a different browser'
  ],
  [ERROR_TYPES.MODEL_PROCESSING]: [
    'Try with a different language',
    'Speak more clearly or use a better quality recording',
    'Try processing a shorter audio segment'
  ],
  [ERROR_TYPES.FILE_UPLOAD]: [
    'Make sure the file is a valid audio format (MP3, WAV, etc.)',
    'Try converting the file to a different format',
    'Try a shorter audio file (less than 2 minutes)'
  ],
  [ERROR_TYPES.BROWSER_SUPPORT]: [
    'Update your browser to the latest version',
    'Try using Chrome (version 113+) or Edge (version 113+)',
    'Enable WebGPU in your browser settings if available'
  ],
  [ERROR_TYPES.UNAUTHORIZED_ACCESS]: [
    'Try a smaller model size (like "tiny" or "base")',
    'Check your internet connection',
    'Try disabling any content blockers or VPNs',
    'Try reloading the page'
  ],
  [ERROR_TYPES.UNKNOWN]: [
    'Refresh the page and try again',
    'Clear your browser cache',
    'Restart your browser'
  ]
};

/**
 * Get error details based on error type
 * @param {string} errorType - Type of error from ERROR_TYPES
 * @returns {Object} Error details with message and recovery suggestions
 */
export const getErrorDetails = (errorType) => {
  const type = ERROR_TYPES[errorType] ? errorType : ERROR_TYPES.UNKNOWN;
  
  return {
    message: ERROR_MESSAGES[type],
    suggestions: RECOVERY_SUGGESTIONS[type]
  };
};

/**
 * Log error to console with additional context
 * @param {string} errorType - Type of error from ERROR_TYPES
 * @param {Error} error - Original error object
 * @param {Object} context - Additional context information
 */
export const logError = (errorType, error, context = {}) => {
  // Check for specific error signatures
  if (error && error.message && error.message.includes("Unauthorized access to file")) {
    errorType = ERROR_TYPES.UNAUTHORIZED_ACCESS;
  }
  
  const errorDetails = getErrorDetails(errorType);
  
  console.error(
    `[${errorType}] ${errorDetails.message}`,
    {
      error,
      context,
      timestamp: new Date().toISOString()
    }
  );
  
  return errorDetails;
};

/**
 * Check if the browser supports all required features
 * @returns {Object} Object with support status and missing features
 */
export const checkBrowserSupport = () => {
  const features = {
    webGPU: !!navigator.gpu,
    audioContext: !!window.AudioContext,
    mediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webWorkers: !!window.Worker,
    localStorage: !!window.localStorage
  };
  
  const missingFeatures = Object.entries(features)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);
  
  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
};

/**
 * Attempt to recover from an error
 * @param {string} errorType - Type of error from ERROR_TYPES
 * @returns {Promise<boolean>} Whether recovery was successful
 */
export const attemptRecovery = async (errorType) => {
  switch (errorType) {
    case ERROR_TYPES.AUDIO_PERMISSION:
      // Try requesting permissions again
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
      } catch {
        return false;
      }
      
    case ERROR_TYPES.BROWSER_SUPPORT:
      // Can't recover from browser support issues
      return false;
      
    case ERROR_TYPES.MODEL_LOADING:
    case ERROR_TYPES.UNAUTHORIZED_ACCESS:
      // For model loading issues, we'll try again with the same model
      // The app has logic to fall back to a smaller model if needed
      return true;
      
    default:
      // For other errors, simply returning true allows the app to try again
      return true;
  }
};
