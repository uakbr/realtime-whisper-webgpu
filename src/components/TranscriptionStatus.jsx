import React from "react";

export function TranscriptionStatus({ isProcessing, recording, status }) {
  if (status !== "ready") {
    return null;
  }

  let statusText = "Ready";
  let statusClass = "text-green-500";

  if (isProcessing) {
    statusText = "Processing audio...";
    statusClass = "text-blue-500";
  } else if (recording) {
    statusText = "Listening...";
    statusClass = "text-yellow-500";
  }

  return (
    <div className="flex items-center justify-center mt-2 mb-2">
      <div className={`flex items-center ${statusClass}`} role="status" aria-live="polite">
        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${isProcessing || recording ? 'animate-pulse' : ''} ${statusClass}`}></div>
        <span className="text-xs sm:text-sm font-medium">{statusText}</span>
      </div>
    </div>
  );
}
