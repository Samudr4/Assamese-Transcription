
import { Job, JobStatusEnum } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
const API_KEY = process.env.GEMINI_API_KEY || '';
if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set. Please check your environment variables.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// In-memory "database" to store job states
const jobDatabase = new Map<string, Job>();

// File processing queue
const processingQueue: { [key: string]: NodeJS.Timeout } = {};

// File size limits - Adjusted for Gemini 2.0 API limits
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB - Safe limit for Gemini 2.0
const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/webm'];

export const uploadFile = async (file: File): Promise<{ jobId: string }> => {
  try {
    // Check API key first
    if (!API_KEY) {
      throw new Error('API key not configured. Please check your environment setup.');
    }

    // Validate file type
    const isValidAudio = SUPPORTED_AUDIO_TYPES.includes(file.type);
    const isValidVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);
    
    if (!isValidAudio && !isValidVideo) {
      throw new Error(`Invalid file type. Supported formats: Audio (MP3, WAV, M4A, AAC, OGG) and Video (MP4, AVI, MOV, WEBM)`);
    }

    // Validate file size (max 250MB for Gemini 2.0 compatibility)
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      throw new Error(`File size too large. Maximum size is ${maxSizeMB}MB for Gemini 2.0 compatibility.`);
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      status: JobStatusEnum.PENDING,
      fileName: file.name,
      createdAt: new Date(),
    };
    
    jobDatabase.set(jobId, job);
    
    // Start processing the file
    processFile(jobId, file);
    
    console.log('File uploaded and processing started:', job);
    return { jobId };
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

const processFile = async (jobId: string, file: File) => {
  try {
    const job = jobDatabase.get(jobId);
    if (!job) return;

    // Update status to processing
    job.status = JobStatusEnum.PROCESSING;
    jobDatabase.set(jobId, job);

    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    // Call Gemini API for transcription with auto-detection
    const transcript = await transcribeWithGemini(base64Data, file.type);
    
    // Update job with transcript
    job.transcript = transcript;
    job.status = JobStatusEnum.COMPLETE;
    jobDatabase.set(jobId, job);
    
    console.log('Transcription completed for job:', jobId);
  } catch (error) {
    console.error('Transcription failed for job:', jobId, error);
    
    const job = jobDatabase.get(jobId);
    if (job) {
      job.status = JobStatusEnum.FAILED;
      jobDatabase.set(jobId, job);
    }
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const transcribeWithGemini = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    // Validate API key
    if (!API_KEY) {
      throw new Error('API key not configured');
    }

    // Use Gemini 2.0 for best accuracy and advanced capabilities
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Enhanced prompt for human voice transcription only - pure Assamese-English dual-language
    const prompt = `Please transcribe ONLY HUMAN SPEECH/VOICE from the following audio/video file and provide both the original Assamese transcription and English translation.

CRITICAL VOICE-ONLY TRANSCRIPTION INSTRUCTIONS:
1. TRANSCRIBE ONLY HUMAN SPEECH - ignore all background sounds, music, sound effects, or non-human audio
2. Focus exclusively on spoken words by human voices
3. Do NOT transcribe instrumental music, sound effects, ambient noise, or mechanical sounds
4. If there are multiple speakers, transcribe all human speech
5. Skip any sections with only music or background sounds
6. Only capture actual spoken dialogue, conversations, or monologues

PURE ASSAMESE TRANSCRIPTION RULES:
1. ONLY use Assamese script (অসমীয়া লিপি) - NO Hindi, Bengali, or other scripts
2. Transcribe human speech ONLY in pure Assamese language using correct Assamese characters
3. Do NOT mix Hindi words, phrases, or Devanagari script
4. Use authentic Assamese vocabulary and expressions
5. If you encounter Hindi/other language words in speech, convert them to equivalent Assamese terms
6. Maintain proper Assamese grammar and sentence structure
7. Use correct Assamese punctuation marks
8. Preserve the exact pronunciation and tone of human speech in Assamese script only
9. Mark unclear human speech as [অস্পষ্ট] (unclear speech in Assamese)
10. DO NOT describe background sounds, music, or non-speech audio

ENGLISH TRANSLATION REQUIREMENTS:
1. Provide accurate English translation of ONLY the human speech content
2. Preserve the speaker's tone, emotion, and cultural context
3. Use proper English grammar and vocabulary
4. Handle proper nouns and technical terms appropriately
5. Ensure the translation flows naturally in English
6. Do NOT translate or describe non-speech audio elements

STRICT FORMAT REQUIREMENTS:
- Start with "=== ASSAMESE TRANSCRIPTION ==="
- Provide ONLY pure Assamese text of human speech using অসমীয়া লিপি
- Then add "=== ENGLISH TRANSLATION ==="
- Provide ONLY English translation of the human speech
- NO mixing of scripts or languages within sections
- Use clear separation between sections
- EXCLUDE all non-human audio content

IMPORTANT: Focus exclusively on human voice/speech content. Ignore and do not transcribe background music, sound effects, ambient noise, or any non-human audio elements.`;

    console.log('Sending request to Gemini 2.0 for dual-language transcription and translation...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);
    const response = await result.response;
    const transcript = response.text();
    
    console.log('Dual-language transcription and translation received from Gemini 2.0');
    return transcript || 'Transcription failed. Please try again.';
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('API quota exceeded. Please wait a few minutes and try again, or check your billing plan.');
      } else if (error.message.includes('400')) {
        throw new Error('Invalid file format or file too large. Please try with a smaller file or different format.');
      } else if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your Gemini API key configuration.');
      } else if (error.message.includes('403')) {
        throw new Error('API quota exceeded or access denied. Please check your Gemini API settings.');
      } else if (error.message.includes('500')) {
        throw new Error('Gemini API server error. Please try again later.');
      }
    }
    
    throw new Error('Failed to transcribe audio. Please check your API key and try again.');
  }
};

export const getJobStatus = async (jobId: string): Promise<{ status: JobStatusEnum; fileName?: string }> => {
  const job = jobDatabase.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  
  return { status: job.status, fileName: job.fileName };
};

export const getTranscript = async (jobId: string): Promise<{ transcript: string }> => {
  const job = jobDatabase.get(jobId);
  if (!job || job.status !== JobStatusEnum.COMPLETE) {
    throw new Error('Transcript not ready or job not found.');
  }
  
  if (!job.transcript) {
    throw new Error('Transcript not available.');
  }
  
  return { transcript: job.transcript };
};

export const saveTranscript = async (jobId: string, transcript: string): Promise<{ success: boolean }> => {
  const job = jobDatabase.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  
  job.transcript = transcript;
  jobDatabase.set(jobId, job);
  console.log(`Transcript for job ${jobId} saved.`);
  
  return { success: true };
};
