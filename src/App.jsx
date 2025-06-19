import { useEffect, useState, useRef } from "react";

import { AudioVisualizer } from "./components/AudioVisualizer";
import Progress from "./components/Progress";
import { LanguageSelector } from "./components/LanguageSelector";
import { ActionButtons } from "./components/ActionButtons";
import { BrowserCheck } from "./components/BrowserCheck";
import ErrorBoundary from "./components/ErrorBoundary";
import { TranscriptionStatus } from "./components/TranscriptionStatus";
import { TranscriptionHistory } from "./components/TranscriptionHistory";
import { FileUpload } from "./components/FileUpload";
import { ErrorMessage } from "./components/ErrorMessage";
import { ModelSelector } from "./components/ModelSelector";
import { 
  saveLanguagePreference, 
  loadLanguagePreference,
  saveAutoProcessPreference,
  loadAutoProcessPreference,
  saveTranscriptionHistory,
  loadTranscriptionHistory,
  saveModelPreference,
  loadModelPreference
} from "./utils/storage";
import {
  ERROR_TYPES,
  logError,
  attemptRecovery
} from "./utils/errorHandler";

const WHISPER_SAMPLING_RATE = 16_000;
const MAX_AUDIO_LENGTH = 30; // seconds
const MAX_SAMPLES = WHISPER_SAMPLING_RATE * MAX_AUDIO_LENGTH;

function App() {
  // Create a reference to the worker object.
  const worker = useRef(null);

  const recorderRef = useRef(null);

  // Model loading and progress
  const [status, setStatus] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressItems, setProgressItems] = useState([]);

  // Inputs and outputs
  const [text, setText] = useState("");
  const [currentSegment, setCurrentSegment] = useState("");
  const [tps, setTps] = useState(null);
  const [language, setLanguage] = useState(() => loadLanguagePreference());
  const [transcriptionHistory, setTranscriptionHistory] = useState(() => loadTranscriptionHistory());

  // Processing
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [stream, setStream] = useState(null);
  const audioContextRef = useRef(null);
  
  // Error handling
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(ERROR_TYPES.UNKNOWN);
  const [infoMessage, setInfoMessage] = useState(null);

  // Auto-processing
  const [autoProcess, setAutoProcess] = useState(() => loadAutoProcessPreference());
  const processingTimeoutRef = useRef(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState("microphone"); // "microphone" or "file"
  
  // Recovery attempts
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Model selection
  const [availableModels, setAvailableModels] = useState(["tiny", "base", "small", "medium"]);
  const [currentModel, setCurrentModel] = useState(() => loadModelPreference());
  const [modelChanging, setModelChanging] = useState(false);
  
  // Mobile viewport fix
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Save preferences when they change
  useEffect(() => {
    saveLanguagePreference(language);
  }, [language]);

  useEffect(() => {
    saveAutoProcessPreference(autoProcess);
  }, [autoProcess]);

  useEffect(() => {
    saveTranscriptionHistory(transcriptionHistory);
  }, [transcriptionHistory]);
  
  useEffect(() => {
    saveModelPreference(currentModel);
  }, [currentModel]);

  // We use the `useEffect` hook to setup the worker as soon as the `App` component is mounted.
  useEffect(() => {
    if (!worker.current) {
      try {
        // Create the worker if it does not yet exist.
        worker.current = new Worker(new URL("./worker.js", import.meta.url), {
          type: "module",
        });
      } catch (err) {
        const errorDetails = logError(ERROR_TYPES.UNKNOWN, err);
        setError(errorDetails.message);
        setErrorType(ERROR_TYPES.UNKNOWN);
        return;
      }
    }

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case "loading":
          // Model file start load: add a new progress item to the list.
          setStatus("loading");
          setLoadingMessage(e.data.data);
          break;

        case "initiate":
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case "progress":
          // Model file progress: update one of the progress items.
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, ...e.data };
              }
              return item;
            }),
          );
          break;

        case "done":
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file),
          );
          break;

        case "ready":
          // Pipeline ready: the worker is ready to accept messages.
          setStatus("ready");
          setModelChanging(false);
          if (e.data.modelVersion) {
            setCurrentModel(e.data.modelVersion);
          }
          if (activeTab === "microphone") {
            recorderRef.current?.start();
          }
          break;

        case "start":
          {
            // Start generation
            setIsProcessing(true);

            // Request new data from the recorder if in microphone mode
            if (activeTab === "microphone") {
              recorderRef.current?.requestData();
            }
          }
          break;

        case "update":
          {
            // Generation update: update the output text.
            const { tps, output, currentSegment } = e.data;
            setTps(tps);
            setText(output || "");
            if (currentSegment) {
              setCurrentSegment(currentSegment);
            }
          }
          break;

        case "complete":
          // Generation complete: re-enable the "Generate" button
          setIsProcessing(false);
          setText(e.data.output || "");
          if (e.data.currentSegment) {
            setCurrentSegment(e.data.currentSegment);
          }
          if (e.data.history) {
            setTranscriptionHistory(e.data.history);
          }
          break;
          
        case "error":
          const errorMessage = e.data.message || "An error occurred during processing";
          const errorDetails = logError(ERROR_TYPES.MODEL_PROCESSING, new Error(errorMessage));
          setError(errorDetails.message);
          setErrorType(ERROR_TYPES.MODEL_PROCESSING);
          setIsProcessing(false);
          setModelChanging(false);
          break;
          
        case "info":
          setInfoMessage(e.data.message);
          if (e.data.output !== undefined) {
            setText(e.data.output);
          }
          if (e.data.history !== undefined) {
            setTranscriptionHistory(e.data.history);
          }
          // Auto-clear info messages after 3 seconds
          setTimeout(() => setInfoMessage(null), 3000);
          break;
          
        case "history":
          if (e.data.history) {
            setTranscriptionHistory(e.data.history);
          }
          if (e.data.output !== undefined) {
            setText(e.data.output);
          }
          break;
          
        case "models":
          if (e.data.models) {
            setAvailableModels(e.data.models);
          }
          if (e.data.currentModel) {
            setCurrentModel(e.data.currentModel);
          }
          break;
      }
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () => {
      worker.current.removeEventListener("message", onMessageReceived);
    };
  }, [activeTab]);

  useEffect(() => {
    if (recorderRef.current) return; // Already set

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setStream(stream);

          recorderRef.current = new MediaRecorder(stream);
          audioContextRef.current = new AudioContext({
            sampleRate: WHISPER_SAMPLING_RATE,
          });

          recorderRef.current.onstart = () => {
            setRecording(true);
            setChunks([]);
          };
          recorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) {
              setChunks((prev) => [...prev, e.data]);
            } else {
              // Empty chunk received, so we request new data after a short timeout
              setTimeout(() => {
                recorderRef.current?.requestData();
              }, 25);
            }
          };

          recorderRef.current.onstop = () => {
            setRecording(false);
          };
          
          recorderRef.current.onerror = (event) => {
            const errorDetails = logError(ERROR_TYPES.AUDIO_RECORDING, event.error || new Error("MediaRecorder error"));
            setError(errorDetails.message);
            setErrorType(ERROR_TYPES.AUDIO_RECORDING);
            setRecording(false);
          };
          
          // Start recording if we're in microphone mode and model is ready
          if (activeTab === "microphone" && status === "ready") {
            recorderRef.current.start();
          }
        })
        .catch((err) => {
          const errorDetails = logError(ERROR_TYPES.AUDIO_PERMISSION, err);
          setError(errorDetails.message);
          setErrorType(ERROR_TYPES.AUDIO_PERMISSION);
        });
    } else {
      const errorDetails = logError(ERROR_TYPES.BROWSER_SUPPORT, new Error("getUserMedia not supported"));
      setError(errorDetails.message);
      setErrorType(ERROR_TYPES.BROWSER_SUPPORT);
    }

    return () => {
      recorderRef.current?.stop();
      recorderRef.current = null;
    };
  }, [activeTab, status]);

  // Handle tab changes
  useEffect(() => {
    if (recorderRef.current) {
      if (activeTab === "microphone" && status === "ready") {
        recorderRef.current.start();
      } else {
        recorderRef.current.stop();
      }
    }
  }, [activeTab, status]);

  useEffect(() => {
    if (!recorderRef.current) return;
    if (!recording) return;
    if (isProcessing) return;
    if (status !== "ready") return;
    if (!autoProcess) return;
    if (activeTab !== "microphone") return;

    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    // Set a timeout to process audio after a short delay
    // This helps to batch audio chunks for more efficient processing
    processingTimeoutRef.current = setTimeout(() => {
      if (chunks.length > 0) {
        processAudioChunks();
      } else {
        recorderRef.current?.requestData();
      }
    }, 500); // 500ms delay for batching

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [status, recording, isProcessing, chunks, language, autoProcess, activeTab]);

  const processAudioChunks = async () => {
    if (chunks.length === 0) return;
    
    // Generate from data
    const blob = new Blob(chunks, { type: recorderRef.current.mimeType });

    const fileReader = new FileReader();

    fileReader.onloadend = async () => {
      try {
        const arrayBuffer = fileReader.result;
        const decoded = await audioContextRef.current.decodeAudioData(arrayBuffer);
        let audio = decoded.getChannelData(0);
        if (audio.length > MAX_SAMPLES) {
          // Get last MAX_SAMPLES
          audio = audio.slice(-MAX_SAMPLES);
        }

        worker.current.postMessage({
          type: "generate",
          data: { audio, language },
        });
      } catch (err) {
        const errorDetails = logError(ERROR_TYPES.AUDIO_PROCESSING, err);
        setError(errorDetails.message);
        setErrorType(ERROR_TYPES.AUDIO_PROCESSING);
      }
    };
    
    fileReader.onerror = (err) => {
      const errorDetails = logError(ERROR_TYPES.AUDIO_PROCESSING, err || new Error("Failed to read audio data"));
      setError(errorDetails.message);
      setErrorType(ERROR_TYPES.AUDIO_PROCESSING);
    };
    
    fileReader.readAsArrayBuffer(blob);
  };

  const handleReset = () => {
    setText("");
    setCurrentSegment("");
    if (worker.current) {
      worker.current.postMessage({ type: "reset" });
    }
    if (recorderRef.current && activeTab === "microphone") {
      recorderRef.current.stop();
      recorderRef.current.start();
    }
  };

  const toggleAutoProcess = () => {
    setAutoProcess(!autoProcess);
  };

  const handleManualProcess = () => {
    if (activeTab === "microphone" && chunks.length > 0) {
      processAudioChunks();
    }
  };
  
  const handleClearHistory = () => {
    setTranscriptionHistory([]);
    if (worker.current) {
      worker.current.postMessage({ type: "reset" });
    }
    setText("");
    setCurrentSegment("");
  };
  
  const handleFileSelected = async (file) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({
        sampleRate: WHISPER_SAMPLING_RATE,
      });
    }
    
    try {
      setIsProcessing(true);
      setInfoMessage("Processing audio file...");
      
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // Get the audio data
      let audio = audioBuffer.getChannelData(0);
      
      // If the audio is too long, we'll process it in chunks
      const chunkDuration = MAX_AUDIO_LENGTH; // in seconds
      const chunkSamples = chunkDuration * WHISPER_SAMPLING_RATE;
      
      // Reset transcription context
      worker.current.postMessage({ type: "reset" });
      
      if (audio.length <= chunkSamples) {
        // Process the entire file at once
        worker.current.postMessage({
          type: "generate",
          data: { audio, language },
        });
      } else {
        // Process the file in chunks
        setInfoMessage("Audio file is long, processing in chunks...");
        
        const totalChunks = Math.ceil(audio.length / chunkSamples);
        
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSamples;
          const end = Math.min(start + chunkSamples, audio.length);
          const chunk = audio.slice(start, end);
          
          setInfoMessage(`Processing chunk ${i + 1}/${totalChunks}...`);
          
          // Process this chunk
          await new Promise((resolve) => {
            const messageHandler = (e) => {
              if (e.data.status === "complete") {
                worker.current.removeEventListener("message", messageHandler);
                resolve();
              }
            };
            
            worker.current.addEventListener("message", messageHandler);
            
            worker.current.postMessage({
              type: "generate",
              data: { audio: chunk, language },
            });
          });
        }
        
        setInfoMessage("Finished processing audio file");
      }
    } catch (err) {
      const errorDetails = logError(ERROR_TYPES.FILE_UPLOAD, err);
      setError(errorDetails.message);
      setErrorType(ERROR_TYPES.FILE_UPLOAD);
      setIsProcessing(false);
    }
  };
  
  const handleRetry = async () => {
    setIsRecovering(true);
    
    // Clear error state
    setError(null);
    
    // Attempt recovery based on error type
    const recoverySuccessful = await attemptRecovery(errorType);
    
    if (recoverySuccessful) {
      // If recovery was successful, restart the appropriate processes
      if (errorType === ERROR_TYPES.MODEL_LOADING) {
        // Try loading the model again
        if (worker.current) {
          worker.current.postMessage({ 
            type: "load",
            data: { modelVersion: currentModel }
          });
          setStatus("loading");
        }
      } else if (errorType === ERROR_TYPES.AUDIO_PERMISSION || errorType === ERROR_TYPES.AUDIO_RECORDING) {
        // Try reinitializing audio
        recorderRef.current = null;
        setStream(null);
        
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setStream(newStream);
          
          recorderRef.current = new MediaRecorder(newStream);
          if (activeTab === "microphone" && status === "ready") {
            recorderRef.current.start();
          }
        } catch (err) {
          const errorDetails = logError(ERROR_TYPES.AUDIO_PERMISSION, err);
          setError(errorDetails.message);
          setErrorType(ERROR_TYPES.AUDIO_PERMISSION);
        }
      }
    } else {
      // If recovery failed, show a more specific error message
      setError(`Recovery failed. ${errorType === ERROR_TYPES.BROWSER_SUPPORT ? 
        "Please try a different browser." : 
        "Please try refreshing the page."}`);
    }
    
    setIsRecovering(false);
  };
  
  const handleModelChange = (modelVersion) => {
    if (modelVersion === currentModel) return;
    
    setModelChanging(true);
    setText("");
    setCurrentSegment("");
    setChunks([]);
    
    // Stop recording if active
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
    }
    
    // Reset transcription context
    if (worker.current) {
      worker.current.postMessage({ type: "reset" });
      worker.current.postMessage({ 
        type: "changeModel", 
        data: { modelVersion } 
      });
    }
  };

  return (
    <ErrorBoundary>
      <BrowserCheck />
      <div className="flex flex-col h-screen h-screen-dynamic mx-auto justify-end text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
        {
          <div className="h-full overflow-auto scrollbar-thin flex justify-center items-center flex-col relative">
            <div className="flex flex-col items-center mb-1 max-w-[400px] text-center px-4 sm:px-0">
              <img
                src="logo.png"
                width="50%"
                height="auto"
                className="block max-w-[150px] sm:max-w-none"
                alt="Whisper WebGPU Logo"
              ></img>
              <h1 className="text-3xl sm:text-4xl font-bold mb-1">Whisper WebGPU</h1>
              <h2 className="text-lg sm:text-xl font-semibold">
                Real-time in-browser speech recognition
              </h2>
            </div>

            <div className="flex flex-col items-center px-2 sm:px-4 w-full max-w-[600px]">
              {error && (
                <ErrorMessage 
                  message={error}
                  type={errorType}
                  onDismiss={() => setError(null)}
                  onRetry={handleRetry}
                />
              )}
              
              {infoMessage && (
                <div className="mb-4 p-3 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg w-full">
                  <p className="font-medium">{infoMessage}</p>
                </div>
              )}
              
              {isRecovering && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 rounded-lg w-full">
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-yellow-500 rounded-full border-t-transparent"></div>
                    <p className="font-medium">Attempting to recover...</p>
                  </div>
                </div>
              )}
              
              {modelChanging && (
                <div className="mb-4 p-3 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg w-full">
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    <p className="font-medium">Changing model... This may take a moment.</p>
                  </div>
                </div>
              )}
            
              {status === null && (
                <>
                  <p className="max-w-[480px] mb-4 px-4 text-sm sm:text-base">
                    <br />
                    You are about to load a Whisper speech recognition model that is
                    optimized for inference on the web. Once downloaded, the model
                    will be cached and reused when you revisit the page.
                    <br />
                    <br />
                    Choose a model size:
                    <br />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Larger models provide better accuracy but require more resources and time to load.
                    </span>
                  </p>
                  
                  <ModelSelector 
                    currentModel={currentModel}
                    availableModels={availableModels}
                    onModelChange={setCurrentModel}
                    disabled={false}
                  />

                  <button
                    className="border px-4 py-2 rounded-lg bg-blue-400 text-white hover:bg-blue-500 disabled:bg-blue-100 disabled:cursor-not-allowed select-none mt-2"
                    onClick={() => {
                      try {
                        worker.current.postMessage({ 
                          type: "load",
                          data: { modelVersion: currentModel }
                        });
                        setStatus("loading");
                      } catch (err) {
                        const errorDetails = logError(ERROR_TYPES.MODEL_LOADING, err);
                        setError(errorDetails.message);
                        setErrorType(ERROR_TYPES.MODEL_LOADING);
                      }
                    }}
                    disabled={status !== null || isRecovering}
                  >
                    Load model
                  </button>
                </>
              )}

              {status === "ready" && (
                <>
                  <div className="w-full mb-2">
                    <ModelSelector 
                      currentModel={currentModel}
                      availableModels={availableModels}
                      onModelChange={handleModelChange}
                      disabled={isProcessing || modelChanging}
                    />
                  </div>
                  
                  <div className="w-full mb-4">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                      <button
                        className={`py-2 px-4 text-sm sm:text-base ${
                          activeTab === "microphone"
                            ? "border-b-2 border-blue-500 font-medium"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setActiveTab("microphone")}
                        disabled={isProcessing || modelChanging}
                      >
                        Microphone
                      </button>
                      <button
                        className={`py-2 px-4 text-sm sm:text-base ${
                          activeTab === "file"
                            ? "border-b-2 border-blue-500 font-medium"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setActiveTab("file")}
                        disabled={isProcessing || modelChanging}
                      >
                        Upload File
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="w-full max-w-[600px] p-2">
                {activeTab === "microphone" && status === "ready" && (
                  <AudioVisualizer className="w-full rounded-lg" stream={stream} />
                )}
                
                {activeTab === "file" && status === "ready" && (
                  <FileUpload 
                    onFileSelected={handleFileSelected}
                    isProcessing={isProcessing || modelChanging}
                  />
                )}
                
                {status === "ready" && (
                  <>
                    <TranscriptionStatus 
                      isProcessing={isProcessing} 
                      recording={recording && activeTab === "microphone"} 
                      status={status} 
                    />
                    
                    <div className="relative">
                      <div className="w-full min-h-[80px] max-h-[150px] sm:max-h-[200px] overflow-y-auto overflow-wrap-anywhere border rounded-lg p-2 mb-2 text-sm sm:text-base">
                        {text}
                        {isProcessing && (
                          <span className="inline-block animate-pulse">▌</span>
                        )}
                      </div>
                      
                      {currentSegment && (
                        <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-2 mb-2">
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Current segment:</p>
                          <p className="text-xs sm:text-sm">{currentSegment}</p>
                        </div>
                      )}
                      
                      {tps && (
                        <span className="absolute bottom-0 right-0 px-1 text-xs text-gray-500">
                          {tps.toFixed(2)} tok/s
                        </span>
                      )}
                      
                      <ActionButtons 
                        text={text} 
                        onReset={handleReset} 
                        autoProcess={autoProcess}
                        onToggleAutoProcess={toggleAutoProcess}
                        onManualProcess={handleManualProcess}
                        isProcessing={isProcessing || modelChanging}
                      />
                    </div>
                  </>
                )}
              </div>
              
              {status === "ready" && (
                <div className="relative w-full max-w-[600px] flex justify-center items-center mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm">Language:</span>
                    <LanguageSelector
                      language={language}
                      setLanguage={(e) => {
                        if (activeTab === "microphone" && recorderRef.current) {
                          recorderRef.current.stop();
                        }
                        setLanguage(e);
                        if (activeTab === "microphone" && recorderRef.current) {
                          recorderRef.current.start();
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              {status === "ready" && transcriptionHistory.length > 0 && (
                <TranscriptionHistory 
                  history={transcriptionHistory}
                  onClearHistory={handleClearHistory}
                />
              )}
              
              {status === "loading" && (
                <div className="w-full max-w-[500px] text-left mx-auto p-4">
                  <p className="text-center text-sm sm:text-base">{loadingMessage}</p>
                  {progressItems.map(({ file, progress, total }, i) => (
                    <Progress
                      key={i}
                      text={file}
                      percentage={progress}
                      total={total}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      </div>
    </ErrorBoundary>
  );
}

export default App;
