
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import JobPage from './components/JobPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/80 shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center py-3 sm:py-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white truncate">
                  <span className="hidden sm:inline">Assamese Transcription</span>
                  <span className="sm:hidden">Assamese</span>
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 min-h-0">
          <div className="w-full max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/jobs/:jobId" element={<JobPage />} />
            </Routes>
          </div>
        </main>

        {/* Footer (snapped to bottom) */}
        <footer className="mt-auto border-t border-gray-800/50 backdrop-blur-sm bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <div className="order-2 sm:order-1">© 2025 <a href="https://samudr4.github.io/purp1eweb/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-white transition-colors duration-200 font-medium">Samudr4</a></div>
              <div className="order-1 sm:order-2 flex items-center">
                <span className="text-center">Mixed Language Support</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
