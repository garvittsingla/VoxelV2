// useRoomSocket.ts - Fixed to properly handle other people's messages
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
    roomSlug: string;
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
    isOwnMessage?: boolean;
}

interface UseRoomSocketReturn {
    isConnected: boolean;
    messages: BroadcastedMSG[];
    joinRoom: (username: string, roomSlug: string) => void;
    sendMessage: (msg: string, roomSlug: string, username: string) => void;
    leaveRoom: (username: string, roomSlug: string) => void;
}

export const useRoomSocket = (): UseRoomSocketReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<BroadcastedMSG[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const userRef = useRef<string | null>(null);
    
    const joinRoom = useCallback((username: string, roomSlug: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.error("WebSocket is not connected");
            return;
        }
        
        userRef.current = username; // Store the username for later reference
        
        const joinMessage: JoinMessage = {
            type: "join",
            username,
            roomSlug,
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
            username,
            roomSlug,
            content: msg,
            sentTime: new Date()
        };
        
        // Add the message to our local state immediately for instant feedback
        const messageId = Date.now().toString(); // Create a unique ID
        setMessages(prevMessages => [
            ...prevMessages,
            {
                type: "chat",
                sender: username,
                content: msg,
                time: new Date(),
                isOwnMessage: true
            }
        ]);
        
        socketRef.current.send(JSON.stringify(userMsg));
        console.log(`Message sent by ${username} in room ${roomSlug}: "${msg}"`);
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
                    try {
                        console.log("Raw received data:", e.data);
                        const parsedMessage = JSON.parse(e.data);
                        console.log("Received message:", parsedMessage);
                        
                        // Process the received message based on its type
                        if (parsedMessage.type === "chat") {
                            // Extract the username from the message, with fallbacks
                            const senderUsername = parsedMessage.username || parsedMessage.sender;
                            
                            // Determine if this is the current user's message
                            const isFromCurrentUser = senderUsername === userRef.current;
                            
                            console.log(`Message from ${senderUsername}, currentUser: ${userRef.current}, isOwn: ${isFromCurrentUser}`);
                            
                            // For other people's messages, always add them
                            if (!isFromCurrentUser) {
                                setMessages(prevMessages => [
                                    ...prevMessages,
                                    {
                                        type: "chat",
                                        sender: senderUsername,
                                        content: parsedMessage.content,
                                        time: parsedMessage.sentTime || parsedMessage.time || new Date(),
                                        isOwnMessage: false
                                    }
                                ]);
                                console.log("Added other person's message to chat");
                            } else {
                                // Don't add duplicates of our own messages that we've already displayed
                                console.log("Ignoring own message echo from server");
                            }
                        }
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                };
                
                ws.onclose = () => {
                    console.log("WebSocket disconnected");
                    setIsConnected(false);
                };
                
                ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    setIsConnected(false);
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
        messages,
        joinRoom,
        sendMessage,
        leaveRoom
    };
};