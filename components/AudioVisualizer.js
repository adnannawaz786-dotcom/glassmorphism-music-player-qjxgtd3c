import React, { useEffect, useRef, useState } from 'react';

const AudioVisualizer = ({ audioElement, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    const initializeAudioContext = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);

          if (!sourceRef.current) {
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
          }
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing audio context:', error);
      }
    };

    initializeAudioContext();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement]);

  useEffect(() => {
    if (!isInitialized || !isPlaying || !canvasRef.current || !analyserRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;

    const draw = () => {
      if (!isPlaying) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArrayRef.current[i] / 255) * canvas.height;

        const r = barHeight + 25 * (i / bufferLength);
        const g = 250 * (i / bufferLength);
        const b = 50;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isInitialized]);

  return (
    <div className="w-full h-32 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={400}
        height={128}
        className="w-full h-full"
        style={{ filter: 'blur(0.5px)' }}
      />
    </div>
  );
};

export default AudioVisualizer;