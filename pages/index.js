import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Play, Pause, Volume2, Music } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function Home() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useState([]);
  const [audioData, setAudioData] = useState(new Uint8Array(128));
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);

  // Load playlist from localStorage on mount
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('musicPlayerPlaylist');
    if (savedPlaylist) {
      setPlaylist(JSON.parse(savedPlaylist));
    }
  }, []);

  // Save playlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('musicPlayerPlaylist', JSON.stringify(playlist));
  }, [playlist]);

  // Initialize audio context and analyser
  const initializeAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }
  };

  // Audio visualization loop
  const updateVisualization = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      setAudioData(new Uint8Array(dataArrayRef.current));
    }
    animationRef.current = requestAnimationFrame(updateVisualization);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const mp3Files = files.filter(file => file.type === 'audio/mpeg');
    
    mp3Files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newTrack = {
          id: Date.now() + Math.random(),
          name: file.name.replace('.mp3', ''),
          url: e.target.result,
          file: file
        };
        setPlaylist(prev => [...prev, newTrack]);
        if (!currentTrack) {
          setCurrentTrack(newTrack);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Play/Pause functionality
  const togglePlayPause = async () => {
    if (!currentTrack || !audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      } else {
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        initializeAudioContext();
        await audioRef.current.play();
        updateVisualization();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Audio event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Music Player</h1>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,audio/mpeg"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white backdrop-blur-sm"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload MP3 Files
            </Button>
          </div>

          {/* Audio Visualizer */}
          <div className="mb-6 h-24 bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/10">
            <div className="flex items-end justify-center h-full gap-1">
              {Array.from({ length: 32 }).map((_, index) => {
                const height = audioData[index] ? (audioData[index] / 255) * 100 : 0;
                return (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-t from-purple-400 to-blue-400 rounded-sm flex-1 max-w-1"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    animate={{ height: `${Math.max(height, 2)}%` }}
                    transition={{ duration: 0.1 }}
                  />
                );
              })}
            </div>
          </div>

          {/* Current Track Display */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <Music className="w-5 h-5 text-white/70 mr-2" />
              <span className="text-white font-medium">
                {currentTrack ? currentTrack.name : 'No track selected'}
              </span>
            </div>
            <div className="text-white/70 text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              onClick={togglePlayPause}
              disabled={!currentTrack}
              className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-sm"
              variant="outline"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-white/70" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Playlist */}
          <AnimatePresence>
            {playlist.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 max-h-32 overflow-y-auto"
              >
                <h3 className="text-white/70 text-sm font-medium mb-2">Playlist</h3>
                <div className="space-y-1">
                  {playlist.map((track) => (
                    <motion.div
                      key={track.id}
                      onClick={() => setCurrentTrack(track)}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        currentTrack?.id === track.id
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm truncate">{track.name}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentTrack?.url}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            preload="metadata"
          />
        </Card>
      </motion.div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #a855f7, #3b82f6);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #a855f7, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  );
}