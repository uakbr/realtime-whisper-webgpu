import React, { useState } from 'react';
import { RECOVERY_SUGGESTIONS, ERROR_TYPES } from '../utils/errorHandler';

export function ErrorMessage({ 
  message, 
  type = ERROR_TYPES.UNKNOWN, 
  onDismiss, 
  onRetry 
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Get recovery suggestions for this error type
  const suggestions = RECOVERY_SUGGESTIONS[type] || RECOVERY_SUGGESTIONS[ERROR_TYPES.UNKNOWN];
  
  return (
    <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded-lg w-full">
      <p className="font-medium">Error: {message}</p>
      
      {suggestions && suggestions.length > 0 && (
        <div className="mt-2">
          <button
            className="text-sm underline"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            {showSuggestions ? 'Hide suggestions' : 'Show recovery suggestions'}
          </button>
          
          {showSuggestions && (
            <ul className="mt-2 ml-5 text-sm list-disc">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="mt-3 flex space-x-2">
        {onRetry && (
          <button 
            className="px-3 py-1 bg-red-200 dark:bg-red-800 rounded hover:bg-red-300 dark:hover:bg-red-700"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
        
        <button 
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
