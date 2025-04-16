import express from 'express';
import cors from 'cors';
import types, { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Define interface for query parameters
interface TokenQuery {
  roomName?: string;
  uid?: string;
}
const connect = async () => {
  await mongoose.connect("mongodb+srv://garvits093:43rDBHOUx4jmrKmU@cluster0.iokxe.mongodb.net/voxel")
  console.log("Db connected")
}
connect()
const app = express();
const PORT = process.env.PORT || 5000;
const ASSEMBLY_AI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

// Log API key status (without exposing the actual key)
console.log(`AssemblyAI API Key ${ASSEMBLY_AI_API_KEY ? 'is configured' : 'is missing'}`);

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/');
}

// AssemblyAI API client
const assemblyAI = axios.create({
  baseURL: 'https://api.assemblyai.com/v2',
  headers: {
    authorization: ASSEMBLY_AI_API_KEY,
    'content-type': 'application/json'
  }
});



const APP_ID = "23828ec815ef48438b31cb5bd5c7103f"
const APP_CERTIFICATE = "6fed3f4ef07f4b2ca5c9b9bba101cba1"
// Get Agora credentials from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable');
  process.exit(1);
} else {
  // Log the first few characters of the API key to verify it's loaded
  console.log(`GEMINI_API_KEY is configured: ${GEMINI_API_KEY.substring(0, 5)}...`);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

if (!APP_ID || !APP_CERTIFICATE) {
  console.error('Missing required Agora credentials in environment variables');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

//@ts-ignore
app.post('/summarize', async (req, res) => {
  try {
    const { transcription } = req.body;

    if (!transcription) {
      return res.status(400).json({ error: 'No transcription provided' });
    }

    // Create prompt for meeting summarization
    const prompt = `
You are an expert meeting summarizer. I'll provide a transcript from a meeting, and I need you to:

1. Create a concise summary, of the key points discussed
2. Identify and list all action items with assigned owners (if mentioned)
3. Note any important decisions that were made (if mentioned)
4. List any deadlines or follow-up meetings mentioned (if mentioned)
5. Create a heading based on the meeting transcript for the summary which should be sent in the response also.
Format your response in a clear, organized way. Focus only on extracting the most important information.

Here is the meeting transcript:
${transcription}
`;

    try {
      // Call Gemini API for summarization
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const summary = result.response.text();
      console.log("gemini gave the summary");

      // Return summarized text
      return res.json({
        summary,
        originalLength: transcription.length,
        summaryLength: summary.length
      });
    } catch (geminiError) {
      console.error('Error with Gemini API:', geminiError);

      // Create a simple fallback summary if the Gemini API fails
      const fallbackSummary = `Summary of the transcription:\n\n${transcription.substring(0, 500)}...`;

      return res.json({
        summary: fallbackSummary,
        originalLength: transcription.length,
        summaryLength: fallbackSummary.length,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Error processing request:', error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }

    // Return error response with more details
    return res.status(500).json({
      error: 'Failed to summarize transcription',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : typeof error
    });
  }
});

// Endpoint to transcribe audio
//@ts-ignore
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  console.log("User hit transcribe endpoint");
  try {
    if (!req.file) {
      console.log("No file provided in request");
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`File received: ${req.file.originalname}, size: ${req.file.size} bytes, path: ${req.file.path}`);

    // Check if ASSEMBLY_AI_API_KEY is available
    if (!ASSEMBLY_AI_API_KEY) {
      console.error("AssemblyAI API key is missing");
      return res.status(500).json({ error: 'Transcription service configuration error' });
    }

    // Upload the audio file to AssemblyAI
    console.log("Uploading file to AssemblyAI...");
    const uploadResponse = await assemblyAI.post('/upload',
      fs.createReadStream(req.file.path)
    );
    const audioUrl = uploadResponse.data.upload_url;
    console.log(`File uploaded successfully, URL: ${audioUrl}`);

    // Start transcription job
    console.log("Starting transcription job...");
    const transcriptResponse = await assemblyAI.post('/transcript', {
      audio_url: audioUrl,
      language_code: req.body.language || 'en',
      punctuate: true,
      format_text: true
    });

    const transcriptId = transcriptResponse.data.id;
    console.log(`Transcription job started with ID: ${transcriptId}`);

    // Polling for transcription completion
    console.log("Polling for transcription completion...");
    let transcriptResult = await assemblyAI.get(`/transcript/${transcriptId}`);

    while (transcriptResult.data.status !== 'completed' &&
      transcriptResult.data.status !== 'error') {
      console.log(`Transcription status: ${transcriptResult.data.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      transcriptResult = await assemblyAI.get(`/transcript/${transcriptId}`);
    }

    // Clean up the uploaded file
    console.log("Cleaning up uploaded file...");
    fs.unlinkSync(req.file.path);

    if (transcriptResult.data.status === 'error') {
      console.error("Transcription failed:", transcriptResult.data.error);
      return res.status(500).json({
        error: 'Transcription failed',
        details: transcriptResult.data.error
      });
    }

    console.log("Transcription completed successfully");
    return res.json({
      transcriptId: transcriptId,
      text: transcriptResult.data.text,
      confidence: transcriptResult.data.confidence
    });

  } catch (error: any) {
    console.error('Transcription error:', error);
    // Log more details about the error
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }

    // Clean up the uploaded file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Cleaned up uploaded file after error");
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    return res.status(500).json({
      error: 'Transcription service error',
      details: error?.message || 'Unknown error occurred'
    });
  }
});

// Get a specific transcript by ID
//@ts-ignore
app.get('/transcript/:id', async (req, res) => {
  try {
    const transcriptId = req.params.id;
    const transcriptResult = await assemblyAI.get(`/transcript/${transcriptId}`);

    return res.json({
      status: transcriptResult.data.status,
      text: transcriptResult.data.text,
      confidence: transcriptResult.data.confidence
    });
  } catch (error: any) {
    console.error('Error retrieving transcript:', error);
    return res.status(500).json({
      error: 'Failed to retrieve transcript',
      details: error?.message || 'Unknown error occurred'
    });
  }
});
//@ts-ignore
app.get('/get-token', (req, res) => {
  const { roomName, uid } = req.query as { roomName: string; uid: string };
  console.log(roomName, uid);

  if (!roomName || !uid) {
    return res.status(400).json({ error: 'Missing roomName or uid parameter' });
  }

  // Convert string UID to a numeric value using a hash function
  const numericUid = Math.abs(uid.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0)) % 1000000; // Keep UID within a reasonable range (0 to 999999)

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    roomName,
    numericUid,
    RtcRole.PUBLISHER,
    Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
  );
  console.log(token);


  res.json({
    token,
    channelName: roomName,
    uid: numericUid
  });
});

app.post("/createroom", (req, res) => {

})

// Test endpoint for Gemini API
//@ts-ignore
app.get('/test-gemini', async (req, res) => {
  try {
    console.log('Testing Gemini API connection...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello, this is a test message.');
    const response = result.response.text();
    console.log('Gemini API test successful');
    return res.json({ success: true, response });
  } catch (error) {
    console.error('Gemini API test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Agora token server running at http://localhost:${PORT}`);
});