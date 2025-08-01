import React, { useState } from 'react';
import { saveTranscript } from '../services/api';
import Icon from './Icon';
import Spinner from './Spinner';

interface TranscriptEditorProps {
  initialTranscript: string;
  jobId: string;
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({ initialTranscript, jobId }) => {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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
    const lines = text.split('\n').filter(line => line.trim() !== '');
    let srtContent = '';
    let startTime = 0;
  
    lines.forEach((line, index) => {
      const duration = Math.max(2, line.length / 10); // Simple duration logic
      const endTime = startTime + duration;
      
      const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = ((seconds % 1) * 1000).toFixed(0).padStart(3, '0');
        return `${h}:${m}:${s},${ms}`;
      };
  
      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      srtContent += `${line}\n\n`;
      
      startTime = endTime + 0.5; // 0.5s pause between lines
    });
  
    return srtContent;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Edit Transcript</h3>
          <p className="text-gray-400">Review and modify your transcription before exporting</p>
        </div>
        
        {/* Save Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-success to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? (
              <>
                <Spinner small />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icon name="save" className="w-5 h-5"/>
                <span>Save Changes</span>
              </>
            )}
          </button>
          
          {saveMessage && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              saveMessage.includes('Error') 
                ? 'bg-error/20 text-error border border-error/30' 
                : 'bg-success/20 text-success border border-success/30'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-base-200/30 backdrop-blur-sm rounded-xl border border-base-300/20 overflow-hidden">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="w-full h-96 p-6 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-200 leading-relaxed resize-none font-mono text-sm"
          placeholder="Your transcription will appear here..."
          aria-label="Transcript editor"
        />
      </div>

      {/* Export Section */}
      <div className="bg-base-200/30 backdrop-blur-sm rounded-xl p-6 border border-base-300/20">
        <h4 className="text-lg font-semibold text-white mb-4">Export Options</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => downloadFile('transcript.txt', transcript, 'text/plain')} 
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-base-200/50 hover:bg-base-200/70 rounded-lg border border-base-300/20 hover:border-accent/30 transition-all duration-300 group"
          >
            <Icon name="fileText" className="w-5 h-5 text-accent group-hover:text-white transition-colors"/>
            <span className="font-medium text-gray-300 group-hover:text-white transition-colors">TXT Format</span>
          </button>
          
          <button 
            onClick={() => downloadFile('transcript.json', JSON.stringify({ transcript }, null, 2), 'application/json')} 
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-base-200/50 hover:bg-base-200/70 rounded-lg border border-base-300/20 hover:border-accent/30 transition-all duration-300 group"
          >
            <Icon name="code" className="w-5 h-5 text-accent group-hover:text-white transition-colors"/>
            <span className="font-medium text-gray-300 group-hover:text-white transition-colors">JSON Format</span>
          </button>
          
          <button 
            onClick={() => downloadFile('transcript.srt', generateSRT(transcript), 'application/x-subrip')} 
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-base-200/50 hover:bg-base-200/70 rounded-lg border border-base-300/20 hover:border-accent/30 transition-all duration-300 group"
          >
            <Icon name="captions" className="w-5 h-5 text-accent group-hover:text-white transition-colors"/>
            <span className="font-medium text-gray-300 group-hover:text-white transition-colors">SRT Format</span>
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>• TXT: Plain text format for easy reading</p>
          <p>• JSON: Structured data with metadata</p>
          <p>• SRT: Subtitle format with timing information</p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptEditor;