
import React, { useState, useCallback, useRef } from 'react';
import Icon from './Icon';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

// File size limits and supported types
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB - Gemini 2.0 compatible
const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/webm'];

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;
    
    setError(null);
    
    // File type validation
    const isValidAudio = SUPPORTED_AUDIO_TYPES.includes(file.type);
    const isValidVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);
    
    if (!isValidAudio && !isValidVideo) {
      setError(`Invalid file type. Supported formats: Audio (MP3, WAV, M4A, AAC, OGG) and Video (MP4, AVI, MOV, WEBM)`);
      return;
    }

    // File size validation (250MB max for Gemini 2.0)
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      setError(`File size too large. Maximum size is ${maxSizeMB}MB for Gemini 2.0 compatibility.`);
      return;
    }

    try {
      setIsUploading(true);
      await onFileUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload]);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  }, [handleFile]);
  
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onDragEnter = () => setIsDragOver(true);
  const onDragLeave = () => setIsDragOver(false);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      handleFile(event.target.files[0]);
    }
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 md:p-12 text-center transition-all duration-300 backdrop-blur-sm touch-manipulation ${
          isDragOver 
            ? 'border-accent bg-accent/10 scale-[1.02] sm:scale-105 shadow-lg shadow-accent/20' 
            : 'border-base-300/50 bg-base-200/30 hover:border-accent/50 hover:bg-base-200/50 active:scale-[0.98]'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept="audio/*,video/*"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center h-full py-4 sm:py-8">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse-slow">
                <Icon name="uploadCloud" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-white">Processing Your File</p>
            <p className="text-gray-400 mt-2 text-sm sm:text-base px-4">Please wait while we prepare your file for transcription...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                <Icon name="uploadCloud" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">Upload Your File</h3>
            <p className="text-gray-300 mb-6 sm:mb-8 text-base sm:text-lg px-2 sm:px-0 leading-relaxed">
              Drag & drop your audio or video file here, or tap to browse
            </p>
            <button
              onClick={onBrowseClick}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-95 sm:hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-accent/20 text-sm sm:text-base touch-manipulation"
            >
              Choose File
            </button>
            
            {/* File Type Info */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700/20">
                <h4 className="font-semibold text-white mb-2 text-xs sm:text-sm">Audio Formats</h4>
                <p className="text-gray-400 text-xs sm:text-sm">MP3, WAV, M4A, AAC, OGG</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700/20">
                <h4 className="font-semibold text-white mb-2 text-xs sm:text-sm">Video Formats</h4>
                <p className="text-gray-400 text-xs sm:text-sm">MP4, AVI, MOV, WEBM</p>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Max 250MB</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Auto-detects</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Secure</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-error/10 border border-error/30 rounded-xl animate-slide-up">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-error rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-error text-xs sm:text-sm font-medium leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
