
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
      job.errorMessage = error instanceof Error ? error.message : 'Transcription failed. Please try again.';
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

// Helper function to extract retry delay from error
const extractRetryDelay = (error: any): number => {
  try {
    // Try to extract retry delay from error message or response
    if (error?.message) {
      const retryMatch = error.message.match(/retry in ([\d.]+)s/i);
      if (retryMatch) {
        return Math.ceil(parseFloat(retryMatch[1]) * 1000);
      }
    }
    // Check for RetryInfo in error details
    if (error?.cause?.response?.data?.error?.details) {
      for (const detail of error.cause.response.data.error.details) {
        if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
          const seconds = parseFloat(detail.retryDelay.replace('s', ''));
          return Math.ceil(seconds * 1000);
        }
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  // Default retry delay: 30 seconds
  return 30000;
};

// Helper function to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const transcribeWithGemini = async (
  base64Data: string, 
  mimeType: string, 
  modelName: string = 'gemini-2.5-pro',
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<string> => {
  try {
    // Validate API key
    if (!API_KEY) {
      throw new Error('API key not configured');
    }

    // Ensure we're using a valid model - fallback to 2.5 pro if invalid
    const validModels = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp'
    ];
    
    if (!validModels.includes(modelName)) {
      console.warn(`Unknown model ${modelName}, defaulting to gemini-2.5-pro`);
      modelName = 'gemini-2.5-pro';
    }

    // Use specified model
    const model = genAI.getGenerativeModel({ model: modelName });

    // Enhanced prompt for high-quality human voice transcription - pure Assamese-English dual-language
    const prompt = `You are an expert Assamese language transcriptionist and translator. Please transcribe ONLY HUMAN SPEECH/VOICE from the following audio/video file with maximum accuracy and provide both the original Assamese transcription and English translation.

CRITICAL VOICE-ONLY TRANSCRIPTION INSTRUCTIONS:
1. TRANSCRIBE ONLY HUMAN SPEECH - completely ignore all background sounds, music, sound effects, or non-human audio
2. Focus exclusively on spoken words by human voices with high accuracy
3. Do NOT transcribe instrumental music, sound effects, ambient noise, or mechanical sounds
4. If there are multiple speakers, transcribe all human speech and maintain speaker clarity
5. Skip any sections with only music or background sounds
6. Only capture actual spoken dialogue, conversations, or monologues
7. Pay close attention to pronunciation, accents, and speech patterns for accurate transcription
8. Preserve natural speech patterns including pauses, emphasis, and intonation in the text

PURE ASSAMESE TRANSCRIPTION RULES (HIGHEST ACCURACY REQUIRED):
1. ONLY use Assamese script (অসমীয়া লিপি) - absolutely NO Hindi, Bengali, or other scripts
2. Transcribe human speech ONLY in pure Assamese language using correct Assamese characters and diacritics
3. Do NOT mix Hindi words, phrases, or Devanagari script - convert all to Assamese equivalents
4. Use authentic Assamese vocabulary, expressions, and idioms
5. If you encounter Hindi/other language words in speech, convert them to equivalent Assamese terms
6. Maintain proper Assamese grammar, sentence structure, and word order
7. Use correct Assamese punctuation marks (। for period, etc.)
8. Preserve the exact pronunciation and tone of human speech in Assamese script only
9. Mark unclear or inaudible speech as [অস্পষ্ট] (unclear speech in Assamese)
10. For partial words or uncertain transcription, use [অনির্দিষ্ট] (uncertain)
11. Maintain proper spacing between words and sentences
12. DO NOT describe background sounds, music, or non-speech audio
13. Transcribe numbers in Assamese script when appropriate, or use numerals for clarity
14. Preserve proper nouns (names, places) in their original form if commonly used, otherwise transliterate to Assamese

ENGLISH TRANSLATION REQUIREMENTS (HIGH QUALITY):
1. Provide accurate, natural English translation of ONLY the human speech content
2. Preserve the speaker's tone, emotion, cultural context, and intent
3. Use proper English grammar, vocabulary, and sentence structure
4. Handle proper nouns and technical terms appropriately (keep names/places as-is when standard)
5. Ensure the translation flows naturally in English while maintaining meaning
6. Translate idioms and expressions to their English equivalents when possible
7. Maintain the same level of formality as the original speech
8. Do NOT translate or describe non-speech audio elements
9. If cultural context is important, add brief clarifications in parentheses when needed

STRICT FORMAT REQUIREMENTS:
- Start with "=== ASSAMESE TRANSCRIPTION ==="
- Provide ONLY pure Assamese text of human speech using অসমীয়া লিপি
- Use proper line breaks for readability (new line for each sentence or natural pause)
- Then add "=== ENGLISH TRANSLATION ==="
- Provide ONLY English translation of the human speech
- Use proper line breaks matching the Assamese transcription structure
- NO mixing of scripts or languages within sections
- Use clear separation between sections (blank line)
- EXCLUDE all non-human audio content
- Maintain chronological order of speech

QUALITY STANDARDS:
- Maximum accuracy in transcription
- Natural, fluent translations
- Proper grammar and spelling in both languages
- Clear, readable formatting
- Complete transcription (do not skip words unless truly inaudible)

IMPORTANT: Focus exclusively on human voice/speech content with the highest possible accuracy. Ignore and do not transcribe background music, sound effects, ambient noise, or any non-human audio elements.`;

    const modelDisplayName = modelName === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' :
                            modelName === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' :
                            modelName === 'gemini-1.5-pro' || modelName === 'gemini-1.5-pro-latest' ? 'Gemini 1.5 Pro' : 
                            modelName === 'gemini-2.0-flash-exp' ? 'Gemini 2.0 Flash' : 
                            'Gemini 1.5 Flash';
    console.log(`Sending request to ${modelDisplayName} (${modelName}) for dual-language transcription and translation...`);
    
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
    
    console.log(`Dual-language transcription and translation received from ${modelDisplayName}`);
    return transcript || 'Transcription failed. Please try again.';
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Extract error message from various possible error structures
    let errorMessage = '';
    let errorString = '';
    let statusCode = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      // Try to get more details from error object
      const errorAny = error as any;
      
      // Check for status code in various possible locations
      if (errorAny.status) {
        statusCode = String(errorAny.status);
      } else if (errorAny.statusCode) {
        statusCode = String(errorAny.statusCode);
      } else if (errorAny.response?.status) {
        statusCode = String(errorAny.response.status);
      } else if (errorAny.cause?.response?.status) {
        statusCode = String(errorAny.cause.response.status);
      }
      
      // Get additional error details
      if (errorAny.cause) {
        const causeMsg = errorAny.cause.message || JSON.stringify(errorAny.cause);
        errorMessage += ' ' + causeMsg;
      }
      
      // Try to get response data
      if (errorAny.response?.data) {
        errorMessage += ' ' + JSON.stringify(errorAny.response.data);
      }
      if (errorAny.cause?.response?.data) {
        errorMessage += ' ' + JSON.stringify(errorAny.cause.response.data);
      }
      
      errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
    } else {
      errorMessage = String(error);
      errorString = JSON.stringify(error);
    }
    
    // Check for 404 status code or "not found" in message - handle FIRST before other checks
    // This catches model not found errors from Google's API
    const is404Error = statusCode === '404' || 
                      statusCode === 404 ||
                      errorMessage.includes('[404]') ||
                      errorMessage.includes('404') || 
                      errorMessage.toLowerCase().includes('not found') || 
                      errorMessage.includes('is not found') ||
                      errorMessage.includes('is not found for API version') ||
                      errorMessage.includes('models/') && errorMessage.includes('is not found') ||
                      errorString.includes('"status":404') ||
                      errorString.includes('"statusCode":404') ||
                      errorString.includes('"status": 404') ||
                      errorString.includes('"statusCode": 404');
    
    // Handle 404 (model not found) - try fallback models in order
    if (is404Error) {
      // Try fallback models in order of preference
      if (modelName === 'gemini-2.5-pro') {
        console.log(`Model ${modelName} not found (404). Trying Gemini 2.5 Flash...`);
        return transcribeWithGemini(base64Data, mimeType, 'gemini-2.5-flash', 0, maxRetries);
      } else if (modelName === 'gemini-2.5-flash') {
        console.log(`Model ${modelName} not found (404). Trying Gemini 1.5 Pro...`);
        return transcribeWithGemini(base64Data, mimeType, 'gemini-1.5-pro', 0, maxRetries);
      } else if (modelName !== 'gemini-1.5-flash') {
        console.log(`Model ${modelName} not found (404). Switching to Gemini 1.5 Flash...`);
        return transcribeWithGemini(base64Data, mimeType, 'gemini-1.5-flash', 0, maxRetries);
      }
      throw new Error('Model not available. Please check your API configuration.');
    }
    
    // Check for quota/quota exceeded errors - immediately fallback to free tier model
    const isQuotaError = errorMessage.toLowerCase().includes('quota') || 
                        errorMessage.includes('exceeded your current quota') ||
                        errorMessage.includes('free_tier') ||
                        errorString.toLowerCase().includes('quota') ||
                        errorString.includes('free_tier_requests') ||
                        errorString.includes('free_tier_input_token_count');
    
    // If using Pro or Experimental model and hit quota/access error, switch to free tier model
    if ((isQuotaError || errorMessage.includes('403')) && 
        (modelName === 'gemini-2.5-pro' || modelName === 'gemini-2.5-flash' ||
         modelName === 'gemini-1.5-pro' || modelName === 'gemini-1.5-pro-latest' || 
         modelName === 'gemini-2.0-flash-exp')) {
      console.log(`Quota/access issue with ${modelName}. Trying fallback models...`);
      // Try 2.5 flash first, then 1.5 flash
      if (modelName === 'gemini-2.5-pro') {
        return transcribeWithGemini(base64Data, mimeType, 'gemini-2.5-flash', 0, maxRetries);
      }
      return transcribeWithGemini(base64Data, mimeType, 'gemini-1.5-flash', 0, maxRetries);
    }
    
    // Handle 429 (rate limit) errors with retry logic
    if (errorMessage.includes('429')) {
      // If we haven't exceeded max retries, wait and retry
      if (retryCount < maxRetries) {
        const retryDelay = extractRetryDelay(error);
        console.log(`Rate limit exceeded. Retrying in ${retryDelay / 1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await sleep(retryDelay);
        return transcribeWithGemini(base64Data, mimeType, modelName, retryCount + 1, maxRetries);
      }
      
      // If we've exhausted retries and using Pro/Experimental model, try fallback
      if ((modelName === 'gemini-2.5-pro' || modelName === 'gemini-2.5-flash' ||
           modelName === 'gemini-1.5-pro' || modelName === 'gemini-1.5-pro-latest' || 
           modelName === 'gemini-2.0-flash-exp') && retryCount >= maxRetries) {
        if (modelName === 'gemini-2.5-pro') {
          console.log('Switching to Gemini 2.5 Flash...');
          return transcribeWithGemini(base64Data, mimeType, 'gemini-2.5-flash', 0, maxRetries);
        }
        console.log('Switching to Gemini 1.5 Flash (free tier compatible)...');
        return transcribeWithGemini(base64Data, mimeType, 'gemini-1.5-flash', 0, maxRetries);
      }
      
      throw new Error('API quota exceeded. Please wait a few minutes and try again, or check your billing plan.');
    }
    
    // Handle other errors
    if (error instanceof Error) {
      if (errorMessage.includes('400')) {
        throw new Error('Invalid file format or file too large. Please try with a smaller file or different format.');
      } else if (errorMessage.includes('401')) {
        throw new Error('Invalid API key. Please check your Gemini API key configuration.');
      } else if (errorMessage.includes('403')) {
        // For 403, try fallback model if using Pro or Experimental
        if (modelName === 'gemini-2.5-pro' || modelName === 'gemini-2.5-flash' ||
            modelName === 'gemini-1.5-pro' || modelName === 'gemini-1.5-pro-latest' || 
            modelName === 'gemini-2.0-flash-exp') {
          if (modelName === 'gemini-2.5-pro') {
            console.log(`Access denied for ${modelName}. Switching to Gemini 2.5 Flash...`);
            return transcribeWithGemini(base64Data, mimeType, 'gemini-2.5-flash', 0, maxRetries);
          }
          console.log(`Access denied for ${modelName}. Switching to Gemini 1.5 Flash...`);
          return transcribeWithGemini(base64Data, mimeType, 'gemini-1.5-flash', 0, maxRetries);
        }
        throw new Error('API quota exceeded or access denied. Please check your Gemini API settings.');
      } else if (errorMessage.includes('500')) {
        throw new Error('Gemini API server error. Please try again later.');
      }
    }
    
    // If quota error but not experimental model, throw error
    if (isQuotaError) {
      throw new Error('API quota exceeded. Please wait a few minutes and try again, or check your billing plan.');
    }
    
    throw new Error('Failed to transcribe audio. Please check your API key and try again.');
  }
};

export const getJobStatus = async (jobId: string): Promise<{ status: JobStatusEnum; fileName?: string; errorMessage?: string }> => {
  const job = jobDatabase.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  
  return { status: job.status, fileName: job.fileName, errorMessage: job.errorMessage };
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
