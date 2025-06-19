import { useState, useRef } from 'react';

export function FileUpload({ onFileSelected, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };
  
  const handleChange = (e) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };
  
  const handleFiles = (file) => {
    // Check if file is audio
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file');
      return;
    }
    
    setSelectedFile(file);
    onFileSelected(file);
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <div className="w-full mt-2 sm:mt-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        tabIndex="0"
        aria-label="Drop audio file here or click to select"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleChange}
          className="hidden"
          aria-hidden="true"
        />
        
        {selectedFile ? (
          <div className="py-2">
            <p className="text-xs sm:text-sm font-medium mb-2">Selected file:</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px]">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          </div>
        ) : (
          <div className="py-4 sm:py-6">
            <p className="mb-2 text-xs sm:text-sm">Drag and drop an audio file here, or</p>
            <button
              onClick={handleButtonClick}
              disabled={isProcessing}
              className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              Select File
            </button>
          </div>
        )}
      </div>
      
      {selectedFile && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => {
              setSelectedFile(null);
              fileInputRef.current.value = "";
            }}
            className="text-xs sm:text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            aria-label="Clear file selection"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}
