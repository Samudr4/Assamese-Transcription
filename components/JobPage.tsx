
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useJobPolling } from '../hooks/useJobPolling';
import JobStatus from './JobStatus';
import TranscriptEditor from './TranscriptEditor';
import Spinner from './Spinner';

const JobPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { status, transcript, fileName, isLoading, error } = useJobPolling(jobId);

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Transcription Failed</h3>
          <p className="text-red-400 mb-6">{error}</p>
          <Link 
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Try Again
          </Link>
        </div>
      );
    }

    if (status === 'Complete' && transcript) {
      return <TranscriptEditor initialTranscript={transcript} jobId={jobId!} fileName={fileName} />;
    }
    
    if (isLoading && !status) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-500 h-64">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center animate-pulse-slow">
              <Spinner />
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-semibold text-white">Initializing Job</p>
          <p className="text-gray-500 mt-2">Setting up your transcription...</p>
        </div>
      );
    }

    return <JobStatus status={status} />;
  };

  return (
    <div className="w-full h-full max-h-full flex flex-col min-h-0 animate-fade-in">
      {/* Header */}
      <div className="flex-none mb-2 sm:mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <Link 
              to="/"
              className="p-2 bg-gray-800/80 rounded-xl hover:bg-purple-600/30 text-gray-300 hover:text-white border border-gray-700/50 active:scale-95 transition-all duration-200 touch-manipulation flex-shrink-0"
              title="Return to Home"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-white leading-tight">Transcription Job</h2>
              <div className="text-gray-300 text-xs mt-0.5">
                {fileName ? (
                  <span className="flex items-center space-x-1.5 truncate">
                    <span className="text-purple-400">📁</span>
                    <span className="font-medium text-gray-200 truncate max-w-[200px] sm:max-w-xs lg:max-w-md">{fileName}</span>
                  </span>
                ) : (
                  status === 'Complete' && transcript ? 'File processed successfully' : 'Processing your file...'
                )}
              </div>
            </div>
          </div>
          
          {status && (
            <div className="flex items-center space-x-2 flex-shrink-0 px-2.5 py-1 rounded-full bg-gray-800/60 border border-gray-700/40">
              <div className={`w-2 h-2 rounded-full ${
                status === 'Complete' ? 'bg-green-500 animate-pulse' :
                status === 'Failed' ? 'bg-red-500' :
                'bg-purple-500 animate-pulse'
              }`}></div>
              <span className="text-xs text-gray-200 font-medium capitalize">{status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 bg-gray-800/30 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-gray-700/20 p-3 sm:p-5 flex flex-col justify-center items-center overflow-hidden w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default JobPage;
