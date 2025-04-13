import { useState, useEffect, useRef, useCallback } from "react";

// Message types for type safety
export interface ChatMessage {
  type: 'chat';
  username: string;
  roomslug: string;
  content: string;
  sentTime?: Date;
}

export interface JoinMessage {
  type: 'join';
  username: string;
  roomslug: string;
}

export interface LeaveMessage {
  type: 'leave';
  roomslug: string;
  username: string;
}

export interface PlayerMoveMessage {
  type: 'player_move';
  username: string;
  roomslug: string;
  position: { x: number, y: number };
}

export interface PlayerOnStageMessage {
  type: 'player_on_stage';
  username: string;
  roomslug: string;
  onStage: boolean;
}

export interface BroadcastedMSG {
  type: "chat";
  sender: string;
  content: string;
  time: Date;
  isOwnMessage?: boolean;
}

export interface PlayerData {
  username: string;
  position: { x: number, y: number };
  onStage?: boolean;
}

interface UseRoomSocketReturn {
  isConnected: boolean;
  messages: BroadcastedMSG[];
  players: Map<string, PlayerData>;
  joinRoom: (username: string, roomslug: string) => void;
  sendMessage: (msg: string, roomslug: string, username: string) => void;
  sendPlayerMove: (position: { x: number, y: number }, roomslug: string, username: string) => void;
  sendPlayerOnStage: (onStage: boolean, roomslug: string, username: string) => void;
  leaveRoom: (username: string, roomslug: string) => void;
}

export const useRoomSocket = (): UseRoomSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<BroadcastedMSG[]>([]);
  const [players, setPlayers] = useState<Map<string, PlayerData>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);
  const userRef = useRef<string | null>(null);
  
  const joinRoom = useCallback((username: string, roomslug: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }
    
    userRef.current = username;
    
    const joinMessage: JoinMessage = {
      type: "join",
      username,
      roomslug,
    };
    
    socketRef.current.send(JSON.stringify(joinMessage));
    console.log(`User ${username} joined room ${roomslug}`);
  }, []);
  
  const sendMessage = useCallback((msg: string, roomslug: string, username: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }
    
    const userMsg: ChatMessage = {
      type: 'chat',
      username,
      roomslug,
      content: msg,
      sentTime: new Date()
    };
    
    // Add message to local state for immediate feedback
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
    console.log(`Message sent by ${username} in room ${roomslug}: "${msg}"`);
  }, []);
  
  // Send player position update
  const sendPlayerMove = useCallback((position: { x: number, y: number }, roomslug: string, username: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }
    
    const moveMsg: PlayerMoveMessage = {
      type: 'player_move',
      username,
      roomslug,
      position
    };
    
    socketRef.current.send(JSON.stringify(moveMsg));
    
    // Update local player data too
    setPlayers(prev => {
      const newMap = new Map(prev);
      const currentData = newMap.get(username) || { username, position: { x: 0, y: 0 } };
      newMap.set(username, { ...currentData, position });
      return newMap;
    });
  }, []);
  
  // Send player stage status update
  const sendPlayerOnStage = useCallback((onStage: boolean, roomslug: string, username: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }
    
    const stageMsg: PlayerOnStageMessage = {
      type: 'player_on_stage',
      username,
      roomslug,
      onStage
    };
    
    socketRef.current.send(JSON.stringify(stageMsg));
    
    // Update local player data too
    setPlayers(prev => {
      const newMap = new Map(prev);
      const currentData = newMap.get(username) || { 
        username, 
        position: { x: 0, y: 0 } 
      };
      newMap.set(username, { ...currentData, onStage });
      return newMap;
    });
  }, []);
  
  const leaveRoom = useCallback((username: string, roomslug: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }
    
    const leaveMsg: LeaveMessage = {
      type: 'leave',
      roomslug,
      username
    };
    
    socketRef.current.send(JSON.stringify(leaveMsg));
    console.log(`User ${username} left room ${roomslug}`);
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
            
            // Process message based on type
            switch (parsedMessage.type) {
              case "chat":
                // Extract sender username and handle chat message
                const senderUsername = parsedMessage.username || parsedMessage.sender;
                const isFromCurrentUser = senderUsername === userRef.current;
                
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
                }
                break;
              
              case "player_move":
                // Update player position in our map
                const { username: moveUsername, position } = parsedMessage;
                
                setPlayers(prev => {
                  const newMap = new Map(prev);
                  const currentData = newMap.get(moveUsername) || { 
                    username: moveUsername, 
                    position: { x: 0, y: 0 } 
                  };
                  newMap.set(moveUsername, { ...currentData, position });
                  return newMap;
                });
                break;
                
              case "player_on_stage":
                // Update player stage status
                const { username: stageUsername, onStage } = parsedMessage;
                
                setPlayers(prev => {
                  const newMap = new Map(prev);
                  const currentData = newMap.get(stageUsername) || { 
                    username: stageUsername, 
                    position: { x: 0, y: 0 } 
                  };
                  newMap.set(stageUsername, { ...currentData, onStage });
                  return newMap;
                });
                break;
                
              case "player_joined":
                // Add new player to our map
                const { username: joinUsername } = parsedMessage;
                const initialPosition = parsedMessage.position || { x: 0, y: 0 };
                
                setPlayers(prev => {
                  const newMap = new Map(prev);
                  newMap.set(joinUsername, { 
                    username: joinUsername, 
                    position: initialPosition
                  });
                  return newMap;
                });
                break;
                
              case "player_left":
                // Remove player from our map
                const { username: leftUsername } = parsedMessage;
                
                setPlayers(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(leftUsername);
                  return newMap;
                });
                break;
                
              case "existing_players":
                // Initialize map with existing players
                const existingPlayers = parsedMessage.players || [];
                
                setPlayers(prev => {
                  const newMap = new Map(prev);
                  existingPlayers.forEach((player: PlayerData) => {
                    newMap.set(player.username, player);
                  });
                  return newMap;
                });
                break;
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
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);
  
  return {
    isConnected,
    messages,
    players,
    joinRoom,
    sendMessage,
    sendPlayerMove,
    sendPlayerOnStage,
    leaveRoom
  };
};