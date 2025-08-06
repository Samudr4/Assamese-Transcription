import React, { useState } from 'react';
import { saveTranscript } from '../services/api';
import Icon from './Icon';
import Spinner from './Spinner';

interface TranscriptEditorProps {
  initialTranscript: string;
  jobId: string;
  fileName?: string;
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({ initialTranscript, jobId, fileName }) => {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Parse the transcript to separate Assamese and English sections
  const parseTranscript = (text: string) => {
    const assameseMatch = text.match(/=== ASSAMESE TRANSCRIPTION ===\s*([\s\S]*?)(?=== ENGLISH TRANSLATION ===|$)/);
    const englishMatch = text.match(/=== ENGLISH TRANSLATION ===\s*([\s\S]*?)$/);
    
    return {
      assamese: assameseMatch ? assameseMatch[1].trim() : text,
      english: englishMatch ? englishMatch[1].trim() : '',
      fullText: text
    };
  };

  const { assamese, english, fullText } = parseTranscript(transcript);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await saveTranscript(jobId, transcript);
      setSaveMessage('Changes saved successfully!');
    } catch (error) {
      setSaveMessage('Error saving changes.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const generateSRT = (text: string): string => {
    const { assamese, english } = parseTranscript(text);
    const assameseLines = assamese.split('\n').filter(line => line.trim() !== '');
    const englishLines = english.split('\n').filter(line => line.trim() !== '');
    
    let srtContent = '';
    let startTime = 0;
  
    // Use the longer array to determine timing
    const maxLines = Math.max(assameseLines.length, englishLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const assameseLine = assameseLines[i] || '';
      const englishLine = englishLines[i] || '';
      const duration = Math.max(2, Math.max(assameseLine.length, englishLine.length) / 10);
      const endTime = startTime + duration;
      
      const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = ((seconds % 1) * 1000).toFixed(0).padStart(3, '0');
        return `${h}:${m}:${s},${ms}`;
      };
  
      srtContent += `${i + 1}\n`;
      srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      if (assameseLine) srtContent += `${assameseLine}\n`;
      if (englishLine) srtContent += `${englishLine}\n`;
      srtContent += '\n';
      
      startTime = endTime + 0.5; // 0.5s pause between lines
    }
  
    return srtContent;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">{fileName || 'Transcript'}</h3>

        </div>
        
        {/* Save Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-success to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-95 sm:hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base touch-manipulation"
          >
            {isSaving ? (
              <>
                <Spinner small />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="save" className="w-4 h-4 sm:w-5 sm:h-5"/>
                <span>Save Changes</span>
              </>
            )}
          </button>
          
          {saveMessage && (
            <div className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-center sm:text-left ${
              saveMessage.includes('Error') 
                ? 'bg-error/20 text-error border border-error/30' 
                : 'bg-success/20 text-success border border-success/30'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Display */}
      <div className="space-y-4 lg:space-y-6">
        {/* Mobile and Tablet: Stacked Layout */}
        <div className="block lg:hidden space-y-4">
          {/* Assamese Transcript */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/20 overflow-hidden">
            <div className="bg-purple-600/20 px-4 sm:px-6 py-3 border-b border-gray-700/20">
              <h4 className="text-base sm:text-lg font-semibold text-white">অসমীয়া Translation(Assamese Transcript)</h4>
            </div>
            <textarea
              value={assamese}
              onChange={(e) => {
                const newAssamese = e.target.value;
                const newTranscript = `=== ASSAMESE TRANSCRIPTION ===\n${newAssamese}\n\n=== ENGLISH TRANSLATION ===\n${english}`;
                setTranscript(newTranscript);
              }}
              className="w-full h-48 sm:h-56 md:h-64 p-4 sm:p-6 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-200 leading-relaxed resize-none font-mono text-sm sm:text-base touch-manipulation"
              placeholder="অসমীয়া লিপিত লিখা কথা ইয়াত থাকিব..."
              aria-label="Assamese transcript editor"
            />
          </div>

          {/* English Translation Below */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/20 overflow-hidden">
            <div className="bg-purple-500/20 px-4 sm:px-6 py-3 border-b border-gray-700/20">
              <h4 className="text-base sm:text-lg font-semibold text-white">English Translation</h4>
            </div>
            <textarea
              value={english}
              onChange={(e) => {
                const newEnglish = e.target.value;
                const newTranscript = `=== ASSAMESE TRANSCRIPTION ===\n${assamese}\n\n=== ENGLISH TRANSLATION ===\n${newEnglish}`;
                setTranscript(newTranscript);
              }}
              className="w-full h-48 sm:h-56 md:h-64 p-4 sm:p-6 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-200 leading-relaxed resize-none font-mono text-sm sm:text-base touch-manipulation"
              placeholder="English translation will appear here..."
              aria-label="English translation editor"
            />
          </div>
        </div>

        {/* Desktop: Side by Side Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Assamese Transcript - Left Side */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/20 overflow-hidden">
            <div className="bg-primary/20 px-6 py-3 border-b border-base-300/20">
              <h4 className="text-lg font-semibold text-white">অসমীয়া লিপি (Assamese Transcript)</h4>
            </div>
            <textarea
              value={assamese}
              onChange={(e) => {
                const newAssamese = e.target.value;
                const newTranscript = `=== ASSAMESE TRANSCRIPTION ===\n${newAssamese}\n\n=== ENGLISH TRANSLATION ===\n${english}`;
                setTranscript(newTranscript);
              }}
              className="w-full h-96 p-6 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-200 leading-relaxed resize-none font-mono text-base touch-manipulation"
              placeholder="অসমীয়া লিপিত লিখা কথা ইয়াত থাকিব..."
              aria-label="Assamese transcript editor"
            />
          </div>

          {/* English Translation - Right Side */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/20 overflow-hidden">
            <div className="bg-accent/20 px-6 py-3 border-b border-base-300/20">
              <h4 className="text-lg font-semibold text-white">English Translation</h4>
            </div>
            <textarea
              value={english}
              onChange={(e) => {
                const newEnglish = e.target.value;
                const newTranscript = `=== ASSAMESE TRANSCRIPTION ===\n${assamese}\n\n=== ENGLISH TRANSLATION ===\n${newEnglish}`;
                setTranscript(newTranscript);
              }}
              className="w-full h-96 p-6 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-200 leading-relaxed resize-none font-mono text-base touch-manipulation"
              placeholder="English translation will appear here..."
              aria-label="English translation editor"
            />
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-base-200/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-base-300/20">
        <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Export Options</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button 
            onClick={() => downloadFile('assamese_transcript.txt', assamese, 'text/plain')} 
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-primary/20 hover:bg-primary/30 active:scale-95 rounded-lg border border-primary/30 hover:border-primary/50 transition-all duration-300 group touch-manipulation"
          >
            <Icon name="fileText" className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:text-white transition-colors"/>
            <span className="font-medium text-gray-300 group-hover:text-white transition-colors text-xs sm:text-sm">Assamese</span>
          </button>
          
          <button 
            onClick={() => downloadFile('english_translation.txt', english, 'text/plain')} 
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-accent/20 hover:bg-accent/30 active:scale-95 rounded-lg border border-accent/30 hover:border-accent/50 transition-all duration-300 group touch-manipulation"
          >
            <Icon name="fileText" className="w-4 h-4 sm:w-5 sm:h-5 text-accent group-hover:text-white transition-colors"/>
            <span className="font-medium text-gray-300 group-hover:text-white transition-colors text-xs sm:text-sm">English</span>
          </button>
          
          <button 
            onClick={() => downloadFile('dual_transcript.json', JSON.stringify({ assamese, english, fullText }, null, 2), 'application/json')} 
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-base-200/50 hover:bg-base-200/70 active:scale-95 rounded-lg border border-base-300/20 hover:border-accent/30 transition-all duration-300 group touch-manipulation"
          >
            <Icon name="code" className="w-4 h-4 sm:w-5 sm:h-5 text-accent group-hover:text-white transition-colors"/>
            <span className="font-medium text-gray-300 group-hover:text-white transition-colors text-xs sm:text-sm">JSON</span>
          </button>
          
          <button 
            onClick={() => downloadFile('dual_transcript.srt', generateSRT(transcript), 'application/x-subrip')} 
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-base-200/50 hover:bg-base-200/70 active:scale-95 rounded-lg border border-base-300/20 hover:border-accent/30 transition-all duration-300 group touch-manipulation"
          >
            <Icon name="captions" className="w-4 h-4 sm:w-5 sm:h-5 text-accent group-hover:text-white transition-colors"/>
            <span className="font-medium text-gray-300 group-hover:text-white transition-colors text-xs sm:text-sm">SRT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptEditor;