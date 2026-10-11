
import React, { useState, useCallback, useRef } from 'react';
import Icon from './Icon';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

// File size limits and supported types
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB max file size
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

    // File size validation (250MB max)
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      setError(`File size too large. Maximum size is ${maxSizeMB}MB.`);
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

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 md:p-7 text-center transition-all duration-300 backdrop-blur-sm touch-manipulation ${
          isDragOver 
            ? 'border-accent bg-accent/10 scale-[1.01] shadow-lg shadow-accent/20' 
            : 'border-base-300/50 bg-base-200/30 hover:border-accent/50 hover:bg-base-200/50 active:scale-[0.99]'
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
          <div className="flex flex-col items-center justify-center h-full py-4 sm:py-6">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse-slow">
                <Icon name="uploadCloud" className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
            </div>
            <p className="mt-3 text-base sm:text-lg font-semibold text-white">Processing Your File</p>
            <p className="text-gray-400 mt-1 text-xs sm:text-sm px-4">Please wait while we prepare your file for transcription...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-2 sm:mb-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <Icon name="uploadCloud" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Upload Audio or Video</h3>
            <p className="text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm px-2 leading-relaxed">
              Drag & drop your file here, or click to browse
            </p>
            <button
              onClick={onBrowseClick}
              className="px-5 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 text-xs sm:text-sm"
            >
              Choose File
            </button>
            
            {/* File Type Info */}
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 text-xs max-w-md mx-auto">
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/20 text-center">
                <span className="font-semibold text-white block text-[11px]">Audio</span>
                <span className="text-gray-400 text-[10px]">MP3, WAV, M4A, AAC, OGG</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/20 text-center">
                <span className="font-semibold text-white block text-[11px]">Video</span>
                <span className="text-gray-400 text-[10px]">MP4, AVI, MOV, WEBM</span>
              </div>
            </div>
            
            <div className="mt-2.5 flex items-center justify-center gap-3 text-[11px] text-gray-400">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                <span>Max 250MB</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                <span>Pure Assamese</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <span>English Subtitles</span>
              </span>
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
