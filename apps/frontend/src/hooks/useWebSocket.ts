import { useState, useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
    type: 'chat';
    username: string;
    roomSlug: string;
    content: string;
    sentTime: Date;
}

export interface JoinMessage {
    type: 'join';
    username: string;
    roomslug: string;
}

export interface LeaveMessage {
    type: 'leave';
    roomSlug: string;
    username: string;
}

export interface BroadcastedMSG {
    type: "chat";
    sender: string;
    content: string;
    time: Date;
}

interface UseRoomSocketReturn {
    isConnected: boolean;
    message: string;
    joinRoom: (username: string, roomSlug: string) => void;
    sendMessage: (msg: string, roomSlug: string, username: string) => void;
    leaveRoom: (username: string, roomSlug: string) => void;
}

export const useRoomSocket = (): UseRoomSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [message, setMessage] = useState("");
    const socketRef = useRef<WebSocket | null>(null);
    
    const joinRoom = useCallback((username: string, roomSlug: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.error("WebSocket is not connected");
            return;
        }
        
        const joinMessage: JoinMessage = {
            type: "join",
            username,
            roomslug: roomSlug,
        };
        
        socketRef.current.send(JSON.stringify(joinMessage));
        console.log(`User ${username} joined room ${roomSlug}`);
    }, []);
    
    const sendMessage = useCallback((msg: string, roomSlug: string, username: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.error("WebSocket is not connected");
            return;
        }
        
        const userMsg: ChatMessage = {
            type: 'chat',
            username: username,
            roomSlug: roomSlug,
            content: msg,
            sentTime: new Date()
        };
        
        socketRef.current.send(JSON.stringify(userMsg));
        console.log(`Message sent by ${username}`);
    }, []);
    
    const leaveRoom = useCallback((username: string, roomSlug: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.error("WebSocket is not connected");
            return;
        }
        
        const leaveMsg: LeaveMessage = {
            type: 'leave',
            roomSlug,
            username
        };
        
        socketRef.current.send(JSON.stringify(leaveMsg));
        console.log(`User ${username} left room ${roomSlug}`);
    }, []);
    
    useEffect(() => {
        const connect = () => {
            try {
                const ws = new WebSocket("ws://localhost:8080");
                socketRef.current = ws;
                
                ws.onopen = () => {
                    console.log("WebSocket connected");
                    setIsConnected(true);
                };
                
                ws.onmessage = (e) => {
                    setMessage(e.data);
                };
                
                ws.onclose = () => {
                    console.log("WebSocket disconnected");
                    setIsConnected(false);
                };
                
                ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    setIsConnected(false);
                };
                
                return () => {
                    ws.close();
                };
            } catch (error) {
                console.error("Failed to connect:", error);
            }
        };
        
        connect();
        
        // Clean up function
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);
    
    return {
        isConnected,
        message,
        joinRoom,
        sendMessage,
        leaveRoom
    };
};
