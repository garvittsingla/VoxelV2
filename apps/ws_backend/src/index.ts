import { WebSocketServer,WebSocket } from "ws";

const wss = new WebSocketServer({port:8080})

interface User{
    ws:WebSocket,
    rooms : string[],
    username:string,
    position?: { x: number; y: number; }; // Track player position
    onStage?: boolean; 
}


const users:User[] = []

wss.on("connection",(ws)=>{


    users.push({
        ws:ws,
        rooms:[],
        username:""
    })

    let request;

    ws.on("message",(message)=>{

        try {
            if (typeof message == "string"){
                request = JSON.parse(message)
            }
            else{
                request = JSON.parse(message.toString())
            }
            
            if (request.type == "join"){
                const roomslug = request.roomslug
                const username = request.username

                //db call


                const user = users.find(x=>x.ws === ws)
                if (!user){
                    ws.close()
                    return;
                }
                user?.rooms.push(roomslug)
                // user.username = request.username

                const usersinroom = users.filter(x=>x.rooms.includes(roomslug))
                // console.log(content)
                for (let userinroom of usersinroom ){
                    if (userinroom !== user){
                        userinroom.ws.send(JSON.stringify({
                            type:"chat",
                            content : `${username} joined the ${roomslug}`,
                            username: "Server"
                        }))
                    }
                }


                console.log(`${request.username} connected to a ${roomslug} `)
                
            }
            else if(request.type == "leave"){
                const roomslug = request.roomslug;
                const username = request.username


                //dbcall
                const user = users.find(x=>x.ws===ws)
                const index = user?.rooms.indexOf(roomslug)
                console.log("index",index)
                //@ts-ignore
                user?.rooms.splice(index,1)
                ws.send("left")
                console.log(`${user}`)

            }
            else if(request.type == "chat"){
                const roomslug = request.roomslug
                const content = request.content
                const username = request.username
                const user = users.find(x=>x.ws===ws)

                const usersinroom = users.filter(x=>x.rooms.includes(roomslug))
                console.log(content)
                for (let userinroom of usersinroom ){
                    if (userinroom !== user){
                        userinroom.ws.send(JSON.stringify({
                            type:"chat",
                            content : content,
                            username: username
                        }))
                    }
                }
            }
            else if (request.type == "player_move") {
                const roomslug = request.roomslug;
                const username = request.username;
                const position = request.position;
                
                // Update user position
                const user = users.find(x => x.ws === ws);
                if (user) {
                  user.position = position;
                  
                  // Broadcast position to all users in the same room
                  const usersInRoom = users.filter(x => x.rooms.includes(roomslug) && x !== user);
                  for (let userInRoom of usersInRoom) {
                    userInRoom.ws.send(JSON.stringify({
                      type: "player_move",
                      username: username,
                      position: position
                    }));
                  }
                }
              }
              else if (request.type == "player_on_stage") {
                const roomslug = request.roomslug;
                const username = request.username;
                const onStage = request.onStage;
                
                // Update user stage status
                const user = users.find(x => x.ws === ws);
                if (user) {
                  user.onStage = onStage;
                  
                  // Broadcast stage status to all users in the same room
                  const usersInRoom = users.filter(x => x.rooms.includes(roomslug) && x !== user);
                  for (let userInRoom of usersInRoom) {
                    userInRoom.ws.send(JSON.stringify({
                      type: "chat",
                      content:`${username } is on the stage`,
                      username: "Server",
                      onStage: onStage
                    }));
                  }
                }
              }












        } catch (error) {
            console.log(error)
        }
    })
})