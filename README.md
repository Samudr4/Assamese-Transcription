# Assamese Auto-Transcription

An application to automatically transcribe Assamese audio and video files using Google's Gemini AI. Upload a file, monitor the transcription progress, and then edit and export the final transcript in various formats.

## Features

- 🎵 **Audio & Video Support**: Upload audio and video files for transcription
- 🔄 **Real-time Processing**: Monitor transcription progress in real-time
- ✏️ **Transcript Editor**: Edit and refine transcriptions
- 📤 **Multiple Export Formats**: Export as TXT, JSON, or SRT files
- 🌐 **Assamese Language**: Optimized for Assamese language transcription
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🚀 **High Capacity**: Supports files up to 250MB

## Prerequisites

- Node.js (v16 or higher)
- Google Gemini API key

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd assamese-auto-transcription
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get your Google Gemini API key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

4. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local and add your API key
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:5173`

## Usage

1. **Upload a file**: Drag and drop or browse for an audio/video file
2. **Monitor progress**: Watch the real-time transcription progress
3. **Edit transcript**: Modify the transcription as needed
4. **Export**: Download in your preferred format (TXT, JSON, SRT)

## File Requirements

- **Maximum file size**: 250MB
- **Supported audio formats**: MP3, WAV, M4A, AAC, OGG
- **Supported video formats**: MP4, AVI, MOV, WEBM
- **Language**: Optimized for Assamese language

## API Integration

This application uses Google's Gemini 2.0 model for transcription. The API:
- Processes audio and video files directly
- Provides accurate Assamese language transcription
- Handles various audio/video formats up to 250MB
- Returns clean, formatted text output

## Development

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI Service**: Google Generative AI (Gemini)
- **State Management**: React Hooks

## Build for Production

```bash
npm run build
```

## License

MIT License
