
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FileUpload from './FileUpload';
import { uploadFile, getAllJobs, deleteJob, clearAllJobs } from '../services/api';
import { Job, JobStatusEnum } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    setRecentJobs(getAllJobs());
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      const { jobId } = await uploadFile(file);
      navigate(`/jobs/${jobId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleDeleteJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (deleteJob(id)) {
      setRecentJobs(getAllJobs());
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your transcription history?')) {
      clearAllJobs();
      setRecentJobs([]);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col justify-between items-center h-full max-h-full w-full py-1 sm:py-2 px-2 sm:px-4 animate-fade-in overflow-hidden">
      {/* Title & Badge */}
      <div className="text-center flex-none mb-1 sm:mb-2 max-w-3xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium mb-1.5 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
          <span>অসমীয়া ভাষাৰ বাবে বিশেষভাৱে প্ৰস্তুত AI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1 tracking-tight">
          Assamese <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Auto-Transcription</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
          Upload any Assamese audio or video file to extract pure Assamese speech and get simultaneous English translation powered by advanced AI.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center my-auto">
        {recentJobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 w-full max-w-5xl items-stretch">
            {/* Upload Box Column */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <FileUpload onFileUpload={handleFileUpload} />
            </div>

            {/* Recent Transcriptions Column */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-3 sm:p-4 flex flex-col shadow-xl border border-gray-700/30 max-h-[280px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 flex-none">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🕒</span>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Recent Jobs ({recentJobs.length})</h3>
                </div>
                <button
                  onClick={handleClearAll}
                  className="text-[11px] text-gray-400 hover:text-red-400 transition-colors duration-150 px-2 py-0.5 rounded-md hover:bg-red-500/10"
                  title="Clear all stored jobs"
                >
                  Clear All
                </button>
              </div>

              <div className="divide-y divide-gray-800/60 overflow-y-auto flex-1 min-h-0 pr-1">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="group flex items-center justify-between py-2 px-2 rounded-xl hover:bg-gray-800/40 transition-all duration-150"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-gray-800/80 border border-gray-700/50 flex items-center justify-center flex-shrink-0 text-xs">
                        {job.fileName?.endsWith('.mp4') || job.fileName?.endsWith('.webm') ? '🎬' : '🎙️'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-200 group-hover:text-purple-400 transition-colors truncate">
                          {job.fileName || 'Untitled Audio'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatDate(job.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        job.status === JobStatusEnum.COMPLETE
                          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : job.status === JobStatusEnum.PROCESSING
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse'
                          : job.status === JobStatusEnum.FAILED
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {job.status}
                      </span>

                      <button
                        onClick={(e) => handleDeleteJob(job.id, e)}
                        className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Delete item"
                        aria-label="Delete transcription"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}
      </div>

      {/* Feature Highlights Strip (Compact) */}
      <div className="flex-none w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-left mt-1">
        <div className="glass-card rounded-xl p-2.5 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm flex-shrink-0">
            🗣️
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">Human Voice Filter</h4>
            <p className="text-[10px] text-gray-400 truncate">Isolates pure spoken Assamese</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-2.5 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm flex-shrink-0">
            🌐
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">Dual-Language</h4>
            <p className="text-[10px] text-gray-400 truncate">Assamese script + English</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-2.5 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm flex-shrink-0">
            📥
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">Multi-Format Export</h4>
            <p className="text-[10px] text-gray-400 truncate">SRT, WebVTT, JSON, TXT</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
