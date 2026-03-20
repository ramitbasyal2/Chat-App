import express from 'express';
import "dotenv/config.js";
import cors from 'cors';
import http from "http"
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

// 1. Socket.io CORS - fixed extra )) bracket
export const io = new Server(server, {
    cors: {
        origin: "https://chat-app-yuy8.onrender.com",
        credentials: true
    }
})

// store online users
export const userSocketMap = {};

io.on("connection", (socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User connected", userId)
    if(userId) userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})  

// 2. Express CORS - fixed URL + removed duplicate app.use(cors()) below
app.use(cors({
    origin: "https://chat-app-yuy8.onrender.com",
    credentials: true
}))

app.use(express.json({limit: "4mb"}));

app.use('/api/status', (req,res)=> res.send("server is live"))
app.use("/api/auth", userRouter);
app.use('/api/messages', messageRouter)

await connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is running on PORT:", PORT));

export default server;
