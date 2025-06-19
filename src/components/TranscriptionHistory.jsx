import React, { useState } from 'react';

export function TranscriptionHistory({ history = [], onClearHistory }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!history || history.length === 0) {
    return null;
  }
  
  // Format timestamp to a readable format
  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString();
    } catch (e) {
      return 'Unknown time';
    }
  };
  
  return (
    <div className="w-full border rounded-lg p-2 mt-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm sm:text-base">Transcription History</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs sm:text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            aria-label={isExpanded ? "Collapse history" : "Expand history"}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button 
            onClick={onClearHistory}
            className="text-xs sm:text-sm px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded"
            aria-label="Clear transcription history"
          >
            Clear
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto">
          {history.slice().reverse().map((item, index) => (
            <div key={index} className="border-t border-gray-200 dark:border-gray-700 py-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{item.language.toUpperCase()}</span>
                <span>{formatTimestamp(item.timestamp)}</span>
              </div>
              <p className="text-xs sm:text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      )}
      
      {!isExpanded && history.length > 0 && (
        <p className="text-xs sm:text-sm text-gray-500">
          {history.length} segment{history.length !== 1 ? 's' : ''} recorded
        </p>
      )}
    </div>
  );
}
