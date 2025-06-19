import { useState } from "react";

export function ActionButtons({ 
  text, 
  onReset, 
  autoProcess = true, 
  onToggleAutoProcess, 
  onManualProcess,
  isProcessing
}) {
  const [copyStatus, setCopyStatus] = useState("");
  
  const handleCopy = async () => {
    if (!text.trim()) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopyStatus("Copy failed");
    }
  };
  
  const handleExport = () => {
    if (!text.trim()) return;
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    const timestamp = new Date().toISOString().replace(/:/g, "-").substring(0, 19);
    a.download = `whisper-transcription-${timestamp}.txt`;
    a.href = url;
    a.style.display = "none";
    
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <button
        className="border rounded-lg px-3 py-1 sm:px-4 sm:py-1 text-xs sm:text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
        onClick={handleCopy}
        disabled={!text.trim()}
        aria-label="Copy transcription to clipboard"
      >
        {copyStatus || "Copy"}
      </button>
      <button
        className="border rounded-lg px-3 py-1 sm:px-4 sm:py-1 text-xs sm:text-sm bg-green-500 text-white hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition"
        onClick={handleExport}
        disabled={!text.trim()}
        aria-label="Export transcription as text file"
      >
        Export
      </button>
      <button
        className="border rounded-lg px-3 py-1 sm:px-4 sm:py-1 text-xs sm:text-sm bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
        onClick={onReset}
        aria-label="Reset transcription"
      >
        Reset
      </button>
      
      <div className="flex ml-auto">
        <button
          className={`border rounded-lg px-3 py-1 sm:px-4 sm:py-1 text-xs sm:text-sm ${
            autoProcess 
              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          } transition mr-2`}
          onClick={onToggleAutoProcess}
          aria-label={autoProcess ? "Turn off automatic processing" : "Turn on automatic processing"}
        >
          {autoProcess ? "Auto: On" : "Auto: Off"}
        </button>
        
        {!autoProcess && (
          <button
            className="border rounded-lg px-3 py-1 sm:px-4 sm:py-1 text-xs sm:text-sm bg-purple-500 text-white hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed transition"
            onClick={onManualProcess}
            disabled={isProcessing}
            aria-label="Process audio manually"
          >
            Process
          </button>
        )}
      </div>
    </div>
  );
}
