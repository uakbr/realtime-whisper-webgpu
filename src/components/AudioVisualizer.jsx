import { useRef, useCallback, useEffect } from "react";

export function AudioVisualizer({ stream, ...props }) {
  const canvasRef = useRef(null);

  const visualize = useCallback((stream) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Make canvas responsive
    const resizeCanvas = () => {
      const parentWidth = canvas.parentElement.clientWidth;
      canvas.width = parentWidth;
      // Maintain aspect ratio
      canvas.height = Math.min(240, parentWidth * 0.5);
    };
    
    // Initial resize
    resizeCanvas();
    
    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);

    const drawVisual = () => {
      requestAnimationFrame(drawVisual);
      analyser.getByteTimeDomainData(dataArray);

      // Use theme-aware colors
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      canvasCtx.fillStyle = isDarkMode ? "rgb(31, 41, 55)" : "rgb(255, 255, 255)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = isDarkMode ? "rgb(129, 140, 248)" : "rgb(59, 130, 246)";
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;

      let x = 0;
      for (let i = 0; i < bufferLength; ++i) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    drawVisual();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      audioContext.close();
    };
  }, []);

  useEffect(() => {
    let cleanup;
    if (stream) {
      cleanup = visualize(stream);
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [visualize, stream]);
  
  return (
    <div className="w-full">
      <canvas 
        {...props} 
        height={240} 
        ref={canvasRef}
        aria-label="Audio visualization waveform"
        role="img"
      ></canvas>
    </div>
  );
}
