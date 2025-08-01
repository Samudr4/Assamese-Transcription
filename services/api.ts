
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

// File size limits - Reduced for better compatibility
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB - More conservative limit
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

    // Validate file size (max 100MB for better compatibility)
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      throw new Error(`File size too large. Maximum size is ${maxSizeMB}MB for better compatibility.`);
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

    // Use Gemini 1.5 Flash for better quota efficiency
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Enhanced prompt for mixed Assamese-English content with auto-detection
    const prompt = `Please transcribe the following audio/video file with maximum accuracy. The content may contain a mix of Assamese and English languages.

CRITICAL INSTRUCTIONS FOR MIXED LANGUAGE TRANSCRIPTION:
1. Listen with extreme care to every word, syllable, and sound
2. Automatically detect and transcribe both Assamese and English words
3. Use correct Assamese script (অসমীয়া লিপি) for Assamese words
4. Use English alphabet for English words and phrases
5. Maintain the exact meaning, context, and cultural nuances
6. Preserve the natural flow between languages
7. Handle code-switching between Assamese and English accurately
8. Preserve speaker's tone, emotion, and speaking style
9. If unclear parts exist, mark as [unclear] with timestamp context
10. For background sounds, indicate with [background: description]
11. Format with natural paragraph breaks and proper punctuation
12. Ensure 100% fidelity to the original mixed-language speech
13. Pay attention to pronunciation patterns in both languages
14. Handle proper nouns, names, and technical terms correctly
15. Maintain the original language switching patterns

LANGUAGE DETECTION GUIDELINES:
- If a word is clearly Assamese, transcribe it in Assamese script
- If a word is clearly English, transcribe it in English alphabet
- For mixed words or phrases, use the dominant language
- Preserve the original language mixing pattern
- Handle proper nouns and names in their original language

Please provide a highly accurate, word-perfect transcription that preserves the mixed Assamese-English content exactly as spoken.`;

    console.log('Sending request to Gemini 1.5 Flash for mixed language transcription (auto-detected)...');
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
    
    console.log('Mixed language transcription received from Gemini 1.5 Flash');
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

export const getJobStatus = async (jobId: string): Promise<{ status: JobStatusEnum }> => {
  const job = jobDatabase.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  
  return { status: job.status };
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
