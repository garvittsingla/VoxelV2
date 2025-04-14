import express from 'express';
import cors from 'cors';
import types, { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

// Define interface for query parameters
interface TokenQuery {
  roomName?: string;
  uid?: string;
}

const app = express();
const PORT = 5000; // You can change this port

app.use(cors());

// Your Agora credentials
const APP_ID = "23828ec815ef48438b31cb5bd5c7103f";
const APP_CERTIFICATE = "6fed3f4ef07f4b2ca5c9b9bba101cba1";

//@ts-ignore
app.get('/get-token', (req: Request, res: Response) => {
  const channelName = req.query.roomName as string;
  const uidParam = req.query.uid as string;

  if (!channelName || !uidParam) {
    return res.status(400).json({
      error: "Missing 'roomName' or 'uid' query parameter",
    });
  }

  const uid = parseInt(uidParam);
  if (isNaN(uid)) {
    return res.status(400).json({
      error: "'uid' must be a valid number",
    });
  }

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  return res.json({
    token,
    channelName,
    uid,
  });
});


app.listen(PORT, () => {
  console.log(`✅ Agora token server running at http://localhost:${PORT}`);
});