
import React from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import { uploadFile } from '../services/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
    try {
      const { jobId } = await uploadFile(file);
      navigate(`/jobs/${jobId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] animate-fade-in px-4 sm:px-6">
      <div className="text-center mb-8 sm:mb-12 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
          Assamese Auto-Transcription
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
          Upload your audio or video files and get accurate Assamese transcriptions with English translations powered by AI
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <FileUpload onFileUpload={handleFileUpload} />
      </div>
    </div>
  );
};

export default HomePage;
