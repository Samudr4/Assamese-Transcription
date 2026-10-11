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
  const [copiedType, setCopiedType] = useState<string | null>(null);

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

  const getStats = (text: string) => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = trimmed.length;
    return { words, chars };
  };

  const assameseStats = getStats(assamese);
  const englishStats = getStats(english);

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

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
    const { assamese: asm, english: eng } = parseTranscript(text);
    const assameseLines = asm.split('\n').filter(line => line.trim() !== '');
    const englishLines = eng.split('\n').filter(line => line.trim() !== '');
    
    let srtContent = '';
    let startTime = 0;
  
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
      
      startTime = endTime + 0.5;
    }
  
    return srtContent;
  };

  const generateVTT = (text: string): string => {
    const srt = generateSRT(text);
    const vttFormatted = srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    return `WEBVTT - Assamese Transcription & Translation\n\n${vttFormatted}`;
  };

  return (
    <div className="w-full h-full max-h-full flex flex-col justify-between min-h-0 overflow-hidden gap-2 sm:gap-2.5">
      {/* Header and Controls */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-800">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-base sm:text-lg">📄</span>
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{fileName || 'Transcript Document'}</h3>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Dual-language speech transcript with synchronised English translation.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCopy(fullText, 'all')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-700/40 text-xs font-medium transition-all"
            title="Copy full transcription and translation"
          >
            <span>{copiedType === 'all' ? '✓' : '📋'}</span>
            <span>{copiedType === 'all' ? 'Copied Full!' : 'Copy All'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-medium rounded-lg shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all duration-150 disabled:opacity-50 text-xs"
          >
            {isSaving ? (
              <>
                <Spinner small />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="save" className="w-3.5 h-3.5"/>
                <span>Save Changes</span>
              </>
            )}
          </button>
          
          {saveMessage && (
            <div className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
              saveMessage.includes('Error') 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Display: Dual Responsive Columns filling available height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Assamese Transcript Card */}
        <div className="glass-panel rounded-xl border border-gray-700/30 overflow-hidden flex flex-col shadow-lg h-full min-h-0">
          <div className="flex-none bg-purple-900/30 px-3 sm:px-4 py-1.5 border-b border-gray-700/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                অসমীয়া লিপি (Assamese Speech)
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-purple-300/80 hidden sm:inline">
                {assameseStats.words} শব্দ • {assameseStats.chars} বৰ্ণ
              </span>
              <button
                onClick={() => handleCopy(assamese, 'assamese')}
                className="text-[11px] px-2 py-0.5 rounded-md bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 transition-colors"
                title="Copy Assamese text"
              >
                {copiedType === 'assamese' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            value={assamese}
            onChange={(e) => {
              const newAssamese = e.target.value;
              const newTranscript = `=== ASSAMESE TRANSCRIPTION ===\n${newAssamese}\n\n=== ENGLISH TRANSLATION ===\n${english}`;
              setTranscript(newTranscript);
            }}
            className="flex-1 min-h-0 w-full p-3 sm:p-4 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-100 font-assamese text-sm sm:text-base leading-relaxed resize-none selection:bg-purple-500/40 overflow-y-auto"
            placeholder="অসমীয়া লিপিত লিখা কথা ইয়াত থাকিব..."
            aria-label="Assamese transcript editor"
          />
        </div>

        {/* English Translation Card */}
        <div className="glass-panel rounded-xl border border-gray-700/30 overflow-hidden flex flex-col shadow-lg h-full min-h-0">
          <div className="flex-none bg-cyan-900/30 px-3 sm:px-4 py-1.5 border-b border-gray-700/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                English Translation
              </h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-cyan-300/80 hidden sm:inline">
                {englishStats.words} words • {englishStats.chars} chars
              </span>
              <button
                onClick={() => handleCopy(english, 'english')}
                className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 transition-colors"
                title="Copy English translation"
              >
                {copiedType === 'english' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            value={english}
            onChange={(e) => {
              const newEnglish = e.target.value;
              const newTranscript = `=== ASSAMESE TRANSCRIPTION ===\n${assamese}\n\n=== ENGLISH TRANSLATION ===\n${newEnglish}`;
              setTranscript(newTranscript);
            }}
            className="flex-1 min-h-0 w-full p-3 sm:p-4 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-100 font-sans text-xs sm:text-sm leading-relaxed resize-none selection:bg-cyan-500/40 overflow-y-auto"
            placeholder="English translation will appear here..."
            aria-label="English translation editor"
          />
        </div>
      </div>

      {/* Export Section (Compact Bar) */}
      <div className="flex-none glass-card rounded-xl p-2 sm:p-2.5 border border-gray-800">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
            <span>📦</span>
            <span>Export & Download Options</span>
          </h4>
          <span className="text-[10px] text-gray-400">Click to download in desired format</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button 
            onClick={() => downloadFile('assamese_transcript.txt', assamese, 'text/plain')} 
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/60 transition-all text-center group"
          >
            <Icon name="fileText" className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0"/>
            <span className="font-semibold text-gray-200 text-[11px] truncate">TXT (Assamese)</span>
          </button>
          
          <button 
            onClick={() => downloadFile('english_translation.txt', english, 'text/plain')} 
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/60 transition-all text-center group"
          >
            <Icon name="fileText" className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0"/>
            <span className="font-semibold text-gray-200 text-[11px] truncate">TXT (English)</span>
          </button>
          
          <button 
            onClick={() => downloadFile('dual_transcript.srt', generateSRT(transcript), 'application/x-subrip')} 
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/60 transition-all text-center group"
          >
            <Icon name="captions" className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0"/>
            <span className="font-semibold text-gray-200 text-[11px] truncate">SRT Subtitles</span>
          </button>

          <button 
            onClick={() => downloadFile('dual_transcript.vtt', generateVTT(transcript), 'text/vtt')} 
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 hover:border-pink-500/60 transition-all text-center group"
          >
            <Icon name="captions" className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform flex-shrink-0"/>
            <span className="font-semibold text-gray-200 text-[11px] truncate">VTT Subtitles</span>
          </button>
          
          <button 
            onClick={() => downloadFile('dual_transcript.json', JSON.stringify({ assamese, english, fullText }, null, 2), 'application/json')} 
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 transition-all text-center group col-span-2 sm:col-span-1"
          >
            <Icon name="code" className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0"/>
            <span className="font-semibold text-gray-200 text-[11px] truncate">JSON Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptEditor;