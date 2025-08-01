
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Assamese Auto-Transcription</h1>
      <FileUpload onFileUpload={handleFileUpload} />
    </div>
  );
};

export default HomePage;
