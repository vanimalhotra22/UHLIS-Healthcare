import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { Camera, Activity } from 'lucide-react';

const RPPGScanner = ({ onBpmUpdate }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Signal processing refs
  const data = useRef({
    times: [],
    greenSignals: [],
  });

  useEffect(() => {
    let isMounted = true;
    let landmarker;
    let animationId;
    let stream;

    const init = async () => {
      try {
        // 1. Setup Camera
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (!isMounted) {
           mediaStream.getTracks().forEach(t => t.stop());
           return;
        }
        stream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
             playPromise.catch(e => console.log("Video play interrupted:", e));
          }
        }

        // 2. Setup MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1
        });
        
        if (!isMounted) {
            landmarker.close();
            return;
        }

        setIsReady(true);
        processFrame();
      } catch (err) {
        if (isMounted) {
            console.error(err);
            setError("Camera access denied or WebGL unsupported.");
        }
      }
    };

    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !landmarker) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState >= 2) {
        // Run inference
        const results = landmarker.detectForVideo(video, performance.now());
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];
          
          // Forehead roughly between landmarks 10 (top) and 9 (bottom of forehead), 107, 336 (sides)
          // We'll just grab a simple bounding box around the forehead area
          const xs = [landmarks[10].x, landmarks[107].x, landmarks[336].x, landmarks[9].x].map(x => x * video.videoWidth);
          const ys = [landmarks[10].y, landmarks[107].y, landmarks[336].y, landmarks[9].y].map(y => y * video.videoHeight);
          
          const minX = Math.max(0, Math.min(...xs));
          const maxX = Math.min(video.videoWidth, Math.max(...xs));
          const minY = Math.max(0, Math.min(...ys));
          const maxY = Math.min(video.videoHeight, Math.max(...ys));
          
          const width = maxX - minX;
          const height = maxY - minY;

          if (width > 0 && height > 0) {
            // Draw just the forehead to canvas to read pixels
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video, minX, minY, width, height, 0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, width, height).data;
            let sumGreen = 0;
            let count = 0;
            for (let i = 1; i < imageData.length; i += 4) { // Green channel
              sumGreen += imageData[i];
              count++;
            }
            const avgGreen = sumGreen / count;

            // Signal Processing
            const now = performance.now();
            data.current.times.push(now);
            data.current.greenSignals.push(avgGreen);

            // Keep last 150 frames (approx 5 seconds at 30fps)
            if (data.current.times.length > 150) {
              data.current.times.shift();
              data.current.greenSignals.shift();
              calculateBPM();
            }
          }
        }
      }
      animationId = requestAnimationFrame(processFrame);
    };

    const calculateBPM = () => {
      const times = data.current.times;
      const signals = data.current.greenSignals;
      
      // Detrending (Moving Average)
      const windowSize = 15;
      let detrended = [];
      for (let i = 0; i < signals.length; i++) {
        let start = Math.max(0, i - windowSize);
        let end = Math.min(signals.length, i + windowSize);
        let sum = 0;
        for (let j = start; j < end; j++) sum += signals[j];
        detrended.push(signals[i] - (sum / (end - start)));
      }

      // Peak Detection
      let peaks = 0;
      for (let i = 1; i < detrended.length - 1; i++) {
        if (detrended[i] > detrended[i-1] && detrended[i] > detrended[i+1] && detrended[i] > 0.2) {
          peaks++;
        }
      }

      // Calculate BPM
      const durationMins = (times[times.length - 1] - times[0]) / 60000;
      if (durationMins > 0) {
        let bpm = Math.round(peaks / durationMins);
        // Constrain to humanly possible rates to avoid noise spikes
        if (bpm > 50 && bpm < 150) {
          onBpmUpdate(bpm);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (landmarker) landmarker.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [onBpmUpdate]);

  if (error) {
    return (
      <div className="w-full h-full bg-slate-950/80 rounded-2xl flex items-center justify-center p-4 text-center border border-red-500/20">
        <p className="text-red-400 text-xs font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10 group">
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover opacity-60 mix-blend-screen"
        playsInline 
        muted 
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
            <Camera size={12} /> rPPG Active
          </div>
          {!isReady && (
            <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          )}
        </div>
        
        {isReady && (
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-green-400 animate-pulse" />
            <span className="text-xs font-bold text-white shadow-black drop-shadow-md">Tracking Forehead ROI</span>
          </div>
        )}
      </div>
      
      {/* Scanline effect */}
      {isReady && (
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 blur-[2px] opacity-50 animate-[scan_2s_ease-in-out_infinite]"></div>
      )}

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(150px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RPPGScanner;
