// Audio utility functions for file handling and audio processing

/**
 * Validates if a file is a valid MP3 audio file
 * @param {File} file - The file to validate
 * @returns {boolean} - True if valid MP3, false otherwise
 */
export const validateAudioFile = (file) => {
  if (!file) return false;
  
  const validTypes = ['audio/mp3', 'audio/mpeg'];
  const validExtensions = ['.mp3'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  return hasValidType || hasValidExtension;
};

/**
 * Creates an object URL for audio file playback
 * @param {File} file - The audio file
 * @returns {string} - Object URL for the file
 */
export const createAudioUrl = (file) => {
  if (!validateAudioFile(file)) {
    throw new Error('Invalid audio file format. Only MP3 files are supported.');
  }
  
  return URL.createObjectURL(file);
};

/**
 * Revokes an object URL to free up memory
 * @param {string} url - The object URL to revoke
 */
export const revokeAudioUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Formats time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Gets audio metadata from file
 * @param {File} file - The audio file
 * @returns {Promise<Object>} - Audio metadata object
 */
export const getAudioMetadata = (file) => {
  return new Promise((resolve, reject) => {
    if (!validateAudioFile(file)) {
      reject(new Error('Invalid audio file'));
      return;
    }
    
    const audio = new Audio();
    const url = createAudioUrl(file);
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata = {
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        duration: audio.duration,
        size: file.size,
        type: file.type,
        url: url
      };
      
      resolve(metadata);
    });
    
    audio.addEventListener('error', () => {
      revokeAudioUrl(url);
      reject(new Error('Failed to load audio metadata'));
    });
    
    audio.src = url;
  });
};

/**
 * Saves audio file data to localStorage
 * @param {string} key - Storage key
 * @param {Object} audioData - Audio data to store
 */
export const saveToLocalStorage = (key, audioData) => {
  try {
    const dataToStore = {
      ...audioData,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(dataToStore));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

/**
 * Loads audio file data from localStorage
 * @param {string} key - Storage key
 * @returns {Object|null} - Stored audio data or null
 */
export const loadFromLocalStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

/**
 * Removes audio file data from localStorage
 * @param {string} key - Storage key
 */
export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};

/**
 * Creates audio context for Web Audio API
 * @returns {AudioContext|null} - Audio context or null if not supported
 */
export const createAudioContext = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
  } catch (error) {
    console.error('Web Audio API not supported:', error);
    return null;
  }
};

/**
 * Connects audio element to analyser node for visualization
 * @param {HTMLAudioElement} audioElement - The audio element
 * @param {AudioContext} audioContext - The audio context
 * @returns {AnalyserNode|null} - Analyser node or null if failed
 */
export const connectAudioAnalyser = (audioElement, audioContext) => {
  try {
    if (!audioContext || !audioElement) return null;
    
    const source = audioContext.createMediaElementSource(audioElement);
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    return analyser;
  } catch (error) {
    console.error('Failed to connect audio analyser:', error);
    return null;
  }
};

/**
 * Gets frequency data from analyser node
 * @param {AnalyserNode} analyser - The analyser node
 * @returns {Uint8Array} - Frequency data array
 */
export const getFrequencyData = (analyser) => {
  if (!analyser) return new Uint8Array(0);
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  return dataArray;
};

/**
 * Calculates average frequency for simple visualization
 * @param {Uint8Array} frequencyData - Frequency data array
 * @returns {number} - Average frequency value (0-255)
 */
export const getAverageFrequency = (frequencyData) => {
  if (!frequencyData || frequencyData.length === 0) return 0;
  
  const sum = frequencyData.reduce((acc, value) => acc + value, 0);
  return sum / frequencyData.length;
};