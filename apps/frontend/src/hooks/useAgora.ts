import { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { useParams } from 'react-router-dom';

// Agora app ID
const APP_ID = "23828ec815ef48438b31cb5bd5c7103f";

export const useAgora = (username: string) => {
    const { roomslug } = useParams();
    const [isJoined, setIsJoined] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

    // Initialize Agora client
    useEffect(() => {
        if (!clientRef.current) {
            clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        }

        return () => {
            // Cleanup on unmount
            leaveCall();
        };
    }, []);

    // Set up event listeners
    useEffect(() => {
        if (!clientRef.current) return;

        const client = clientRef.current;

        const handleUserPublished = async (user: any, mediaType: string) => {
            await client.subscribe(user, mediaType);
            if (mediaType === "audio") {
                user.audioTrack.play();
                console.log("🔊 Remote audio:", user.uid);
            }
            setRemoteUsers(prev => [...prev, user.uid]);
        };

        const handleUserUnpublished = (user: any) => {
            setRemoteUsers(prev => prev.filter(uid => uid !== user.uid));
        };

        const handleUserLeft = (user: any) => {
            setRemoteUsers(prev => prev.filter(uid => uid !== user.uid));
        };

        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-left", handleUserLeft);

        return () => {
            client.off("user-published", handleUserPublished);
            client.off("user-unpublished", handleUserUnpublished);
            client.off("user-left", handleUserLeft);
        };
    }, []);

    const joinCall = async () => {
        if (!clientRef.current || !roomslug || isJoined) return;

        try {
            // Generate a numeric UID from the username (simple hash)
            const uid = Math.abs(username.split('').reduce((acc, char) => {
                return acc + char.charCodeAt(0);
            }, 0)) % 1000000; // Keep it within a reasonable range

            // Get token from backend
            const res = await fetch(`http://localhost:5000/get-token?roomName=${roomslug}&uid=${uid}`);
            if (!res.ok) {
                throw new Error('Failed to get token');
            }

            const data = await res.json();
            const token = data.token;

            // Join the channel
            await clientRef.current.join(APP_ID, roomslug, token, uid);

            // Create and publish local audio track
            const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            localAudioTrackRef.current = localAudioTrack;
            await clientRef.current.publish([localAudioTrack]);

            setIsJoined(true);
            setIsMicMuted(false);
            setRemoteUsers(prev => [...prev, uid]);
            setError(null);

            console.log("✅ Joined voice channel:", roomslug);
        } catch (err) {
            console.error("❌ Error joining call:", err);
            setError(err instanceof Error ? err.message : 'Failed to join call');
        }
    };

    const leaveCall = async () => {
        if (!clientRef.current || !isJoined) return;

        try {
            // Stop and close local audio track
            if (localAudioTrackRef.current) {
                localAudioTrackRef.current.stop();
                localAudioTrackRef.current.close();
                localAudioTrackRef.current = null;
            }

            // Leave the channel
            await clientRef.current.leave();

            setIsJoined(false);
            setRemoteUsers([]);
            setError(null);

            console.log("✅ Left voice channel");
        } catch (err) {
            console.error("❌ Error leaving call:", err);
            setError(err instanceof Error ? err.message : 'Failed to leave call');
        }
    };

    const toggleMic = () => {
        if (!localAudioTrackRef.current) return;

        const newMicState = !isMicMuted;
        localAudioTrackRef.current.setEnabled(newMicState);
        setIsMicMuted(!newMicState);
    };

    return {
        isJoined,
        isMicMuted,
        remoteUsers,
        error,
        joinCall,
        leaveCall,
        toggleMic
    };
}; 