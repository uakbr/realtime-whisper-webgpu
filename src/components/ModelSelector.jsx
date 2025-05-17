import React from 'react';

// Model information with descriptions
const MODEL_INFO = {
  "tiny": {
    name: "Tiny",
    size: "~150MB",
    description: "Fastest, lowest accuracy"
  },
  "base": {
    name: "Base",
    size: "~200MB",
    description: "Good balance of speed and accuracy"
  },
  "small": {
    name: "Small",
    size: "~500MB",
    description: "Higher accuracy, slower"
  },
  "medium": {
    name: "Medium",
    size: "~1.5GB",
    description: "Highest accuracy, requires more resources"
  }
};

export function ModelSelector({ currentModel, availableModels, onModelChange, disabled }) {
  return (
    <div className="w-full mb-3">
      <div className="flex flex-col">
        <label htmlFor="model-selector" className="mb-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Model Size:
        </label>
        <div className="flex flex-wrap gap-2 justify-center">
          {availableModels.map(model => (
            <button
              key={model}
              onClick={() => onModelChange(model)}
              disabled={disabled || currentModel === model}
              className={`px-2 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                currentModel === model
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={`${MODEL_INFO[model].name} (${MODEL_INFO[model].size}): ${MODEL_INFO[model].description}`}
            >
              {MODEL_INFO[model].name}
            </button>
          ))}
        </div>
        {currentModel && (
          <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
            {MODEL_INFO[currentModel].name} ({MODEL_INFO[currentModel].size}): {MODEL_INFO[currentModel].description}
          </p>
        )}
      </div>
    </div>
  );
}
