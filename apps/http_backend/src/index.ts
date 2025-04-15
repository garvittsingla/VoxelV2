import express from 'express';
import cors from 'cors';
import types, { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Define interface for query parameters
interface TokenQuery {
  roomName?: string;
  uid?: string;
}
const connect =async () =>{
  await mongoose.connect("mongodb+srv://garvits093:43rDBHOUx4jmrKmU@cluster0.iokxe.mongodb.net/voxel")
  console.log("Db connected")
}
connect()
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

const APP_ID="23828ec815ef48438b31cb5bd5c7103f"
const APP_CERTIFICATE="6fed3f4ef07f4b2ca5c9b9bba101cba1"
// Get Agora credentials from environment variables


if (!APP_ID || !APP_CERTIFICATE) {
  console.error('Missing required Agora credentials in environment variables');
  process.exit(1);
}

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

app.post("/createroom",(req,res)=>{
  
})
app.listen(PORT, () => {
  console.log(`✅ Agora token server running at http://localhost:${PORT}`);
});