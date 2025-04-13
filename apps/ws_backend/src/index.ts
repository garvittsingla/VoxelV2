import { WebSocketServer,WebSocket } from "ws";

const wss = new WebSocketServer({port:8080})

interface User{
    ws:WebSocket,
    rooms : string[],
    username:string
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

                //db call


                const user = users.find(x=>x.ws === ws)
                if (!user){
                    ws.close()
                    return;
                }
                user?.rooms.push(roomslug)
                user.username = request.username

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

                for (let userinroom of usersinroom ){
                    if (userinroom !== user){
                        userinroom.ws.send(JSON.stringify({
                            type:"chat",
                            content : content,
                            username: request.username
                        }))
                    }
                }
            }












        } catch (error) {
            console.log(error)
        }
    })
})