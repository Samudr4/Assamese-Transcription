
import React, { useState, useEffect } from 'react';
import { JobStatusEnum } from '../types';
import Spinner from './Spinner';

interface JobStatusProps {
  status: JobStatusEnum | null;
}

const statusConfig = {
  [JobStatusEnum.PENDING]: { 
    text: 'Pending in Queue', 
    color: 'bg-warning/20 text-warning border-warning/30', 
    icon: 'clock',
    spinner: true,
    description: 'Your file is queued for processing. This usually takes a few seconds.',
    gradient: 'from-warning to-orange-500'
  },
  [JobStatusEnum.PROCESSING]: { 
    text: 'Processing with Gemini 2.5...', 
    color: 'bg-accent/20 text-accent border-accent/30', 
    icon: 'cpu',
    spinner: true,
    description: 'Gemini 2.5 Pro is transcribing your audio/video file with advanced accuracy. This may take a few minutes depending on file size.',
    gradient: 'from-accent to-cyan-500'
  },
  [JobStatusEnum.COMPLETE]: { 
    text: 'Transcription Complete', 
    color: 'bg-success/20 text-success border-success/30', 
    icon: 'check-circle',
    spinner: false,
    description: 'Your transcription is ready! You can now edit and export the transcript.',
    gradient: 'from-success to-green-500'
  },
  [JobStatusEnum.FAILED]: { 
    text: 'Transcription Failed', 
    color: 'bg-error/20 text-error border-error/30', 
    icon: 'x-circle',
    spinner: false,
    description: 'The transcription process failed. Please check your file and try again.',
    gradient: 'from-error to-red-500'
  },
};

const JobStatus: React.FC<JobStatusProps> = ({ status }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === JobStatusEnum.PROCESSING) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (status === JobStatusEnum.COMPLETE) {
      setProgress(100);
    } else {
      setProgress(0);
    }
  }, [status]);

  if (!status) {
    return null;
  }

  const config = statusConfig[status];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'clock':
        return (
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cpu':
        return (
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        );
      case 'check-circle':
        return (
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'x-circle':
        return (
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center h-full py-8 sm:py-12 px-4">
      {/* Status Icon */}
      <div className="relative mb-6 sm:mb-8">
        <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r ${config.gradient} rounded-full flex items-center justify-center shadow-lg`}>
          {getIcon(config.icon)}
        </div>
        {config.spinner && (
          <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
        )}
      </div>

      {/* Status Text */}
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">{config.text}</h3>
      
      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full border ${config.color} mb-4 sm:mb-6`}>
        <div className={`w-2 h-2 rounded-full ${config.spinner ? 'bg-accent animate-pulse' : 'bg-current'} mr-2`}></div>
        <span className="text-xs sm:text-sm font-medium">
          {status === JobStatusEnum.PROCESSING ? (
            <span className="flex items-center space-x-1 sm:space-x-2">
              <span>{progress >= 100 ? 'DONE' : 'PROCESSING'}</span>
              <span className="text-accent font-bold">{Math.round(progress)}%</span>
            </span>
          ) : (
            `STATUS: ${status.toUpperCase()}`
          )}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-300 max-w-sm sm:max-w-md mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base px-2 sm:px-0">
        {config.description}
      </p>

      {/* Additional Info for Processing */}
      {status === JobStatusEnum.PROCESSING && (
        <div className="bg-base-200/50 rounded-xl p-4 sm:p-6 border border-base-300/20 max-w-sm sm:max-w-md w-full">
          <h4 className="text-xs sm:text-sm font-semibold text-white mb-3">Processing time varies based on:</h4>
          <ul className="text-xs sm:text-sm text-gray-400 space-y-2 text-left">
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>File size and duration</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>Audio quality and clarity</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>Network connection speed</span>
            </li>
          </ul>
        </div>
      )}

      {/* Progress Animation */}
      {config.spinner && (
        <div className="mt-6 sm:mt-8 w-full max-w-xs sm:max-w-sm">
          {status === JobStatusEnum.PROCESSING ? (
            <div className="w-full bg-base-200/50 rounded-full h-2 border border-base-300/20">
              <div 
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          ) : (
            <div className="flex justify-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobStatus;
