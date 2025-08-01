
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import JobPage from './components/JobPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-base-100 via-base-200 to-base-100">
        {/* Header */}
        <header className="border-b border-base-300/20 backdrop-blur-sm bg-base-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-white">Assamese Transcription</h1>
              </div>
              <div className="text-sm text-gray-400">
                Powered by Gemini AI
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl mx-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/jobs/:jobId" element={<JobPage />} />
            </Routes>
          </div>
        </main>

        {/* Footer (snapped to bottom) */}
        <footer className="mt-auto border-t border-base-300/20 backdrop-blur-sm bg-base-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div>© 2024 Assamese Auto-Transcription</div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>AI Powered</span>
                </span>
                <span>•</span>
                <span>Mixed Language Support</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
