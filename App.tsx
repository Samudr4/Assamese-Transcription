
import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import JobPage from './components/JobPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="h-screen max-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
        {/* Header */}
        <header className="flex-none border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/80 shadow-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center py-2 sm:py-2.5">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                    <span className="hidden sm:inline">Assamese Auto-Transcription</span>
                    <span className="sm:hidden">Assamese AI</span>
                  </h1>
                  <p className="text-[10px] text-gray-400 font-assamese hidden sm:block">অসমীয়া ভাষাৰ স্বয়ংক্ৰিয় লিপ্যন্তৰণ</p>
                </div>
              </Link>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  AI Powered
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/jobs/:jobId" element={<JobPage />} />
            </Routes>
          </div>
        </main>

        {/* Footer (compact, fixed height) */}
        <footer className="flex-none border-t border-gray-800/50 backdrop-blur-sm bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-400">
              <div className="order-2 sm:order-1">© 2026 <a href="https://samudr4.github.io/purp1eweb/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-white transition-colors duration-200 font-medium">Samudr4</a></div>
              <div className="order-1 sm:order-2 flex items-center">
                <span className="text-center text-xs">Mixed Language Support</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
