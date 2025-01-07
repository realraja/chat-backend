import express from "express";
import { config } from "dotenv";
import { connectDB } from "./db/ConnectDB.js";
import { errorMiddleware } from "./middleware/error.js";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import requestRoutes from "./routes/request.js";
import adminRoutes from "./routes/admin.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT, START_OR_STOP_TYPING, UPDATE_USER_STATUS, USER_CONNECTED } from "./constants/events.js";
import { v4 as uuid } from "uuid";
import { Message } from "./models/message.js";
import cors from 'cors'; 
import { v2 as cloudinary } from "cloudinary";
import { SocketAuthenticator } from "./middleware/auth.js";
import { getSockets } from "./utils/socketHelper.js";
import { Chat } from "./models/chat.js";










config({
  path: "./.env",
});


const app = express();
const server = createServer(app);
const io = new Server(server, {
  pingInterval: 10000, // Send a ping every 10 seconds
  pingTimeout: 5000,   // Disconnect if no pong within 5 seconds
  cors: {
  origin: [process.env.LOCAL_CLIENT_URL,process.env.CLIENT_URL],
  credentials: true,
}});

app.set("io",io);


connectDB();
app.use(cookieParser());
app.use(cors({
  origin: [process.env.LOCAL_CLIENT_URL,process.env.CLIENT_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
})

//api routes is here
app.get("/", (req, res) => {
  res.json({ success: true, message: "api working properly" });
});
app.use("/v1/api/user", userRoutes);
app.use("/v1/api/chat", chatRoutes);
app.use("/v1/api/request", requestRoutes);
app.use("/v1/api/admin", adminRoutes);

//socket.io is here

export const userSocketIDs = new Map();




io.use((socket,next)=>{
  cookieParser()(socket.request,socket.request.res,async(err)=>{
    await SocketAuthenticator(err,socket,next);
  })
});

let onlineUsers = {};

io.on("connection", (socket) => {
    
    
    const user = socket.user;
    // console.log(user);
    
    userSocketIDs.set(user._id.toString(), socket.id);
    // console.log(userSocketIDs);

    socket.on(USER_CONNECTED, () => {
      onlineUsers[user._id] = socket.id;
      io.emit(UPDATE_USER_STATUS, { user:user._id, status: 'online',onlineUsers });
    });

  socket.on(NEW_MESSAGE, async({ chatId, members, message }) => {
    const realTimeMessage = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chatId: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDb = {
        content: message,
        chatId: chatId,
        sender: user._id
    }
// console.log(members)

    const membersSocket = getSockets(members);
    // console.log(membersSocket)
    io.to(membersSocket).emit(NEW_MESSAGE,{chatId, message:realTimeMessage,});
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT,{chatId,message});

    // console.log("meesage realtime", realTimeMessage);
    try {
        await Message.create(messageForDb);
        const chat = await Chat.findById(chatId);
        chat.lastMsg = message;
        const updatedChat = members.map(({_id})=>{
          if(!onlineUsers[_id]){
            // console.log(chat)
            let pendingMember = chat.pendings.find(p => p.member.toString() === _id.toString());
            // console.log(pendingMember)
            if(pendingMember){
              pendingMember.count = pendingMember.count + 1;
            }else{
              chat.pendings.push({member:_id, count:1})
            }
          }
        })

        await Promise.all(updatedChat);
        // chat.pendings = [];
        await chat.save();
    } catch (error) {
        console.log(error);
    }
  });

  socket.on(START_OR_STOP_TYPING,({members,chatId,typing})=>{
    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(START_OR_STOP_TYPING,{chatId,typing,user:user._id,name:user.name});
  })

  socket.on("disconnect", async() => {
    // console.log("user disconnected");
    const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socket.id);
    if (userId) {
      delete onlineUsers[userId];
      io.emit(UPDATE_USER_STATUS, { userId, status: 'offline',onlineUsers });
    }
    userSocketIDs.delete(user._id.toString());
    user.lastSeen = new Date().toISOString();
    await user.save();
  });
});






//error handlers
app.use(errorMiddleware);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log("server listening on port " + port);
});
