
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
    text: 'Processing Audio...', 
    color: 'bg-accent/20 text-accent border-accent/30', 
    icon: 'cpu',
    spinner: true,
    description: 'Our AI engine is transcribing your audio/video file with high accuracy. This may take a few moments depending on file size.',
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
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    if (status === JobStatusEnum.PROCESSING) {
      setProgress(prev => (prev < 12 ? 15 : prev));
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return 95;
          const remaining = 95 - prev;
          // Smooth progressive increment that asymptotically approaches 95%
          const step = Math.max(0.4, Math.random() * Math.min(5, remaining * 0.25));
          const next = Math.min(95, prev + step);
          return Math.round(next);
        });
      }, 750);
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
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cpu':
        return (
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        );
      case 'check-circle':
        return (
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'x-circle':
        return (
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const clampedProgress = status === JobStatusEnum.COMPLETE ? 100 : Math.min(95, Math.max(1, Math.round(progress)));

  return (
    <div className="flex flex-col items-center justify-center text-center w-full py-2 sm:py-3 px-3">
      {/* Status Icon */}
      <div className="relative mb-3 sm:mb-4">
        <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${config.gradient} rounded-full flex items-center justify-center shadow-lg`}>
          {getIcon(config.icon)}
        </div>
        {config.spinner && (
          <div className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
        )}
      </div>

      {/* Status Text */}
      <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 leading-tight">{config.text}</h3>
      
      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full border ${config.color} mb-3`}>
        <div className={`w-2 h-2 rounded-full ${config.spinner ? 'bg-accent animate-pulse' : 'bg-current'} mr-2`}></div>
        <span className="text-xs sm:text-sm font-medium">
          {status === JobStatusEnum.PROCESSING ? (
            <span className="flex items-center space-x-1.5 sm:space-x-2">
              <span>PROCESSING</span>
              <span className="text-accent font-bold">{clampedProgress}%</span>
            </span>
          ) : (
            `STATUS: ${status.toUpperCase()}`
          )}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-300 max-w-sm sm:max-w-md mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm px-2">
        {config.description}
      </p>

      {/* Additional Info for Processing */}
      {status === JobStatusEnum.PROCESSING && (
        <div className="bg-base-200/50 rounded-xl p-3 sm:p-3.5 border border-base-300/20 max-w-sm sm:max-w-md w-full mb-3 text-left">
          <h4 className="text-xs font-semibold text-white mb-1.5">Processing factors:</h4>
          <ul className="text-[11px] sm:text-xs text-gray-400 space-y-1">
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>File size and audio duration</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span>Speech clarity and background noise</span>
            </li>
          </ul>
        </div>
      )}

      {/* Progress Animation */}
      {config.spinner && (
        <div className="w-full max-w-xs sm:max-w-sm mt-1">
          {status === JobStatusEnum.PROCESSING ? (
            <div className="w-full bg-base-200/50 rounded-full h-2 border border-base-300/20 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${clampedProgress}%` }}
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
