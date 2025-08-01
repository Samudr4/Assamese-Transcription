
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useJobPolling } from '../hooks/useJobPolling';
import JobStatus from './JobStatus';
import TranscriptEditor from './TranscriptEditor';
import Spinner from './Spinner';

const JobPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { status, transcript, isLoading, error } = useJobPolling(jobId);

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Transcription Failed</h3>
          <p className="text-error mb-6">{error}</p>
          <Link 
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
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
      return <TranscriptEditor initialTranscript={transcript} jobId={jobId!} />;
    }
    
    if (isLoading && !status) {
      return (
        <div className="flex flex-col items-center justify-center text-gray-400 h-64">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center animate-pulse-slow">
              <Spinner />
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-lg font-semibold text-white">Initializing Job</p>
          <p className="text-gray-400 mt-2">Setting up your transcription...</p>
        </div>
      );
    }

    return <JobStatus status={status} />;
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link 
              to="/"
              className="p-2 bg-base-200/50 rounded-lg hover:bg-base-200/70 transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-white">Transcription Job</h2>
              <p className="text-gray-400">Job ID: {jobId}</p>
            </div>
          </div>
          
          {status && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                status === 'Complete' ? 'bg-success animate-pulse' :
                status === 'Failed' ? 'bg-error' :
                'bg-accent animate-pulse'
              }`}></div>
              <span className="text-sm text-gray-400 capitalize">{status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-base-200/30 backdrop-blur-sm rounded-2xl shadow-xl border border-base-300/20 p-8">
        {renderContent()}
      </div>

      {/* Progress Info */}
      {status && status !== 'Complete' && status !== 'Failed' && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-base-200/30 backdrop-blur-sm rounded-full px-4 py-2 border border-base-300/20">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Processing in progress...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPage;
