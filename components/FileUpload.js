import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Music, X } from 'lucide-react';

const FileUpload = ({ onFileSelect, currentFile }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (file) => {
    setError('');
    
    if (!file) return;
    
    // Check if file is MP3
    if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
      setError('Please select an MP3 file only');
      return;
    }
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }
    
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const clearFile = () => {
    onFileSelect(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer
          backdrop-blur-sm bg-white/5
          ${isDragOver 
            ? 'border-purple-400 bg-purple-500/10' 
            : 'border-white/20 hover:border-white/40'
          }
          ${error ? 'border-red-400 bg-red-500/10' : ''}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,audio/mpeg"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          {currentFile ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Music className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium truncate max-w-[200px]">
                    {currentFile.name}
                  </p>
                  <p className="text-white/60 text-sm">
                    {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="p-1 rounded-full hover:bg-red-500/20 transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <>
              <motion.div
                className="p-4 rounded-full bg-purple-500/20 mb-4"
                animate={{ 
                  scale: isDragOver ? 1.1 : 1,
                  rotate: isDragOver ? 5 : 0 
                }}
                transition={{ duration: 0.2 }}
              >
                <Upload className="w-8 h-8 text-purple-400" />
              </motion.div>
              
              <h3 className="text-white font-medium mb-2">
                {isDragOver ? 'Drop your MP3 file here' : 'Upload MP3 File'}
              </h3>
              
              <p className="text-white/60 text-sm mb-4">
                Drag and drop or click to browse
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-white/40">
                <span>MP3 only</span>
                <span>•</span>
                <span>Max 50MB</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <p className="text-red-400 text-sm text-center">{error}</p>
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;