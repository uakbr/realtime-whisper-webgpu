import {
  AutoTokenizer,
  AutoProcessor,
  WhisperForConditionalGeneration,
  TextStreamer,
  full,
} from "@huggingface/transformers";

const MAX_NEW_TOKENS = 64;
// Store previous transcription context
let previousTranscription = "";
let transcriptionHistory = [];

// Model versions available for Whisper
const MODEL_VERSIONS = {
  "tiny": "onnx-community/whisper-tiny",   // ~150MB
  "base": "onnx-community/whisper-base",   // ~200MB
  "small": "onnx-community/whisper-small", // ~500MB
  "medium": "onnx-community/whisper-medium" // ~1.5GB
};

// Default model version
let currentModelVersion = "base";

// Minimum word overlap to consider as duplicated content
const MIN_OVERLAP_WORDS = 3;
// Maximum words to check for overlap
const MAX_OVERLAP_WORDS = 8;

// Function to clean up transcription text
function cleanTranscription(text) {
  if (!text) return "";
  
  // Remove [BLANK_AUDIO] tokens and other artifacts in brackets
  let cleaned = text.replace(/\[BLANK_AUDIO\]/g, "");
  cleaned = cleaned.replace(/\[[^\]]*\]/g, ""); // Remove anything in square brackets
  
  // Remove multiple consecutive spaces
  cleaned = cleaned.replace(/\s+/g, " ");
  
  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Function to smartly merge transcription segments to avoid duplications
function mergeTranscriptions(previous, current) {
  if (!previous) return current || "";
  if (!current) return previous || "";
  
  // Clean both segments
  previous = cleanTranscription(previous);
  current = cleanTranscription(current);
  
  if (!current) return previous;
  
  // Check if current is already contained in previous
  if (previous.includes(current)) {
    return previous;
  }
  
  // Check if previous is entirely contained in current (less common but possible)
  if (current.includes(previous)) {
    return current;
  }
  
  // Check for overlap at the end of previous and start of current
  const prevWords = previous.split(" ");
  const currWords = current.split(" ");
  
  // Try different overlap lengths starting from longer to shorter
  for (let overlapLength = Math.min(MAX_OVERLAP_WORDS, Math.min(prevWords.length, currWords.length)); 
       overlapLength >= MIN_OVERLAP_WORDS; 
       overlapLength--) {
    
    const prevEnd = prevWords.slice(-overlapLength).join(" ");
    const currStart = currWords.slice(0, overlapLength).join(" ");
    
    if (prevEnd === currStart) {
      return previous + " " + currWords.slice(overlapLength).join(" ");
    }
  }
  
  // Check for similar phrases (not exact matches) that might indicate duplication
  const prevPhrase = prevWords.slice(-MIN_OVERLAP_WORDS).join(" ").toLowerCase();
  const currPhrase = currWords.slice(0, MIN_OVERLAP_WORDS).join(" ").toLowerCase();
  
  // If phrases are similar enough (85% of words match), treat as overlap
  const similarWordsCount = prevWords
    .slice(-MIN_OVERLAP_WORDS)
    .filter(word => currWords.slice(0, MIN_OVERLAP_WORDS).includes(word))
    .length;
  
  if (similarWordsCount >= MIN_OVERLAP_WORDS * 0.85) {
    return previous + " " + currWords.slice(MIN_OVERLAP_WORDS).join(" ");
  }
  
  // If no clear overlap, check if previous ends with a sentence boundary
  const lastChar = previous[previous.length - 1];
  if (['.', '!', '?'].includes(lastChar)) {
    // Previous ends with sentence end, likely a good boundary
    return previous + " " + current;
  }
  
  // Check for immediate repeated words at the boundary
  const lastWord = prevWords[prevWords.length - 1];
  const firstWord = currWords[0];
  
  if (lastWord === firstWord) {
    return previous + " " + currWords.slice(1).join(" ");
  }
  
  // Remove duplicate phrases in the combined text
  const combined = previous + " " + current;
  
  // Simple pattern to catch immediate duplications like "hello hello" or "this is this is"
  const deduped = combined.replace(/\b(\w+\s+\w+)\s+\1\b/g, '$1');
  
  return deduped;
}

/**
 * This class uses the Singleton pattern to ensure that only one instance of the model is loaded.
 */
class AutomaticSpeechRecognitionPipeline {
  static model_id = MODEL_VERSIONS[currentModelVersion];
  static tokenizer = null;
  static processor = null;
  static model = null;

  static async getInstance(progress_callback = null) {
    try {
      // Check if WebGPU is supported
      if (!navigator.gpu) {
        throw new Error("WebGPU is not supported in this browser. Please try a different browser like Chrome or Edge version 113 or later.");
      }
      
      // If model version has changed, reset everything
      if (this.model_id !== MODEL_VERSIONS[currentModelVersion]) {
        this.unload();
        this.model_id = MODEL_VERSIONS[currentModelVersion];
      }
      
      try {
        this.tokenizer ??= await AutoTokenizer.from_pretrained(this.model_id, {
          progress_callback,
        });
      } catch (tokenError) {
        console.error("Error loading tokenizer:", tokenError);
        
        // If we get an unauthorized access error with medium or small model, try base instead
        if (tokenError.message && tokenError.message.includes("Unauthorized access") && 
            (currentModelVersion === "medium" || currentModelVersion === "small")) {
          
          self.postMessage({
            status: "info",
            message: `Unauthorized access with ${currentModelVersion} model. Falling back to base model...`
          });
          
          // Fall back to base model
          currentModelVersion = "base";
          this.unload();
          this.model_id = MODEL_VERSIONS[currentModelVersion];
          
          // Try loading with base model
          this.tokenizer = await AutoTokenizer.from_pretrained(this.model_id, {
            progress_callback,
          });
        } else {
          throw new Error(`Failed to load tokenizer: ${tokenError.message}`);
        }
      }
      
      try {
        this.processor ??= await AutoProcessor.from_pretrained(this.model_id, {
          progress_callback,
        });
      } catch (processorError) {
        console.error("Error loading processor:", processorError);
        throw new Error(`Failed to load processor: ${processorError.message}`);
      }

      try {
        this.model ??= await WhisperForConditionalGeneration.from_pretrained(
          this.model_id,
          {
            dtype: {
              encoder_model: "fp32", // 'fp16' works too
              decoder_model_merged: "q4", // or 'fp32' ('fp16' is broken)
            },
            device: "webgpu",
            progress_callback,
          },
        );
      } catch (modelError) {
        console.error("Error loading model:", modelError);
        throw new Error(`Failed to load model: ${modelError.message}`);
      }

      return [this.tokenizer, this.processor, this.model];
    } catch (error) {
      console.error("Error initializing pipeline:", error);
      self.postMessage({ 
        status: "error", 
        message: `Failed to initialize speech recognition model: ${error.message}` 
      });
      throw error;
    }
  }
  
  static unload() {
    // Release resources
    this.tokenizer = null;
    this.processor = null;
    this.model = null;
  }
}

let processing = false;
async function generate({ audio, language, reset = false }) {
  if (processing) return;
  processing = true;

  // Reset transcription context if requested
  if (reset) {
    previousTranscription = "";
    transcriptionHistory = [];
    self.postMessage({ 
      status: "info", 
      message: "Transcription context reset" 
    });
  }

  // Tell the main thread we are starting
  self.postMessage({ status: "start" });

  try {
    // Retrieve the text-generation pipeline.
    const [tokenizer, processor, model] =
      await AutomaticSpeechRecognitionPipeline.getInstance();

    let startTime;
    let numTokens = 0;
    let tps;
    const token_callback_function = () => {
      startTime ??= performance.now();

      if (numTokens++ > 0) {
        tps = (numTokens / (performance.now() - startTime)) * 1000;
      }
    };
    
    let currentOutput = "";
    const callback_function = (output) => {
      currentOutput = cleanTranscription(output);
      if (currentOutput) {
        // Combine with previous transcription for continuous context
        const fullOutput = mergeTranscriptions(previousTranscription, currentOutput);
        
        self.postMessage({
          status: "update",
          output: fullOutput,
          currentSegment: currentOutput,
          tps,
          numTokens,
        });
      }
    };

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function,
      token_callback_function,
    });

    const inputs = await processor(audio);

    const outputs = await model.generate({
      ...inputs,
      max_new_tokens: MAX_NEW_TOKENS,
      language,
      streamer,
    });

    const decoded = tokenizer.batch_decode(outputs, {
      skip_special_tokens: true,
    });

    // Clean and update the transcription
    let finalSegment = "";
    if (decoded && decoded.length > 0) {
      finalSegment = cleanTranscription(decoded[0]);
      
      if (finalSegment) {
        // Store the current segment in history
        const timestamp = new Date().toISOString();
        transcriptionHistory.push({
          text: finalSegment,
          timestamp,
          language
        });
        
        // Update the continuous transcription
        previousTranscription = mergeTranscriptions(previousTranscription, finalSegment);
      }
    }

    // Send the output back to the main thread
    self.postMessage({
      status: "complete",
      output: previousTranscription,
      currentSegment: finalSegment,
      history: transcriptionHistory,
    });
  } catch (error) {
    console.error("Error during generation:", error);
    self.postMessage({ 
      status: "error", 
      message: `Failed to process speech: ${error.message}` 
    });
  } finally {
    processing = false;
  }
}

async function load(modelVersion = "base", retryCount = 0) {
  try {
    // Update the current model version
    if (modelVersion in MODEL_VERSIONS) {
      currentModelVersion = modelVersion;
    } else {
      // If an invalid model version is specified, fall back to base
      currentModelVersion = "base";
    }
    
    self.postMessage({
      status: "loading",
      data: `Loading ${currentModelVersion} model...`,
    });

    // Load the pipeline and save it for future use.
    const [tokenizer, processor, model] =
      await AutomaticSpeechRecognitionPipeline.getInstance((x) => {
        // We also add a progress callback to the pipeline so that we can
        // track model loading.
        self.postMessage(x);
      });

    self.postMessage({
      status: "loading",
      data: "Compiling shaders and warming up model...",
    });

    // Run model with dummy input to compile shaders
    try {
      await model.generate({
        input_features: full([1, 80, 3000], 0.0),
        max_new_tokens: 1,
      });
      self.postMessage({ 
        status: "ready",
        modelVersion: currentModelVersion
      });
    } catch (warmupError) {
      console.error("Error during model warmup:", warmupError);
      throw new Error(`Model warmup failed: ${warmupError.message}`);
    }
  } catch (error) {
    console.error("Error during model load:", error);
    
    // If we're already using base model and still having issues, or if we've retried too many times
    if ((currentModelVersion === "base" && retryCount >= 2) || retryCount >= 3) {
      self.postMessage({ 
        status: "error", 
        message: `Failed to load speech recognition model: ${error.message}` 
      });
      return;
    }
    
    // If we encounter an unauthorized access error with a larger model, try a smaller one
    if (error.message && error.message.includes("Unauthorized access") && 
        (currentModelVersion === "medium" || currentModelVersion === "small")) {
      
      const nextModel = currentModelVersion === "medium" ? "small" : "base";
      self.postMessage({
        status: "loading",
        data: `Unauthorized access with ${currentModelVersion} model. Trying ${nextModel} model instead...`,
      });
      
      // No delay needed for model downgrade
      load(nextModel, retryCount);
      return;
    }
    
    // Otherwise retry with increasing delay
    if (retryCount < 2) {
      const retryDelay = (retryCount + 1) * 1500; // 1.5s, then 3s
      self.postMessage({ 
        status: "loading",
        data: `Load failed, retrying in ${retryDelay/1000} seconds...`,
      });
      
      setTimeout(() => {
        load(currentModelVersion, retryCount + 1);
      }, retryDelay);
      return;
    }
    
    // If we've tried enough times with the current model, try a smaller one
    if (currentModelVersion !== "base" && currentModelVersion !== "tiny") {
      const nextModel = currentModelVersion === "medium" ? "small" : "base";
      self.postMessage({
        status: "loading",
        data: `Failed to load ${currentModelVersion} model after multiple attempts. Trying ${nextModel} model instead...`,
      });
      
      setTimeout(() => {
        load(nextModel, 0); // Reset retry count for the new model
      }, 1500);
      return;
    }
    
    // If all else fails
    self.postMessage({ 
      status: "error", 
      message: `Failed to load speech recognition model: ${error.message}` 
    });
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (e) => {
  try {
    const { type, data } = e.data;

    switch (type) {
      case "load":
        load(data?.modelVersion);
        break;

      case "generate":
        generate(data);
        break;
        
      case "reset":
        previousTranscription = "";
        transcriptionHistory = [];
        self.postMessage({ 
          status: "info", 
          message: "Transcription context reset",
          output: "",
          history: []
        });
        break;
        
      case "getHistory":
        self.postMessage({
          status: "history",
          history: transcriptionHistory,
          output: previousTranscription
        });
        break;
        
      case "changeModel":
        if (data?.modelVersion && MODEL_VERSIONS[data.modelVersion]) {
          self.postMessage({
            status: "info",
            message: `Switching to ${data.modelVersion} model...`
          });
          load(data.modelVersion);
        } else {
          self.postMessage({
            status: "error",
            message: "Invalid model version specified"
          });
        }
        break;
        
      case "getAvailableModels":
        self.postMessage({
          status: "models",
          models: Object.keys(MODEL_VERSIONS),
          currentModel: currentModelVersion
        });
        break;
        
      default:
        console.warn("Unknown message type:", type);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    self.postMessage({ 
      status: "error", 
      message: `An unexpected error occurred: ${error.message}` 
    });
  }
});
