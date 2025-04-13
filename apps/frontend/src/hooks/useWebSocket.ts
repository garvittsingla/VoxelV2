import { useState,useEffect,useRef } from "react";

export interface ChatMessage{
    type:'chat',
    content:string;
    username:string
}
export interface JoinMessage{
    type:'join',
    content:string;
    username:string
}
export interface LeaveMessage{
    type:'chat',
    content:string;
    username:string
}
interface WebSocketProps{
    username:string,
    roomslug:string,
    
}

// websocket server se connect karna
// room se join ho jaana with cutom username and slug
// leave 
// message bhejna lka logic
// display broadcasting message
const useWebSocket = () =>{
    const [isConnected,setisConnected] = useState(false);
    const socketref = useRef<WebSocket | null > (null)

    const connect = () =>{
        try {
            const ws = new WebSocket("ws://localhost:8080")

            ws.onopen= () =>{
                console.log("Websocket connected")
                setisConnected(true)
                

                const joinMessage:JoinMessage = {
                    type:"join",
                    username,
                    roomslug
                }
            }
        } catch (error) {
            
        }
    }
}