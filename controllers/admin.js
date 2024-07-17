import { tryCatch } from "../middleware/tryCatch.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { errorHandler } from "../utils/handleError.js";
import jwt from 'jsonwebtoken'



export const verify = tryCatch(async (req,res,next) => {
    const {password} = req.body;

    const realpass = process.env.ADMIN_SECRET_PASS || 'Rajesh8875';

    const isMatch = password === realpass;

    if(!isMatch) return next(new errorHandler("Invalid password",401));

    const token = jwt.sign(password,process.env.JWT_SECRET);

    return res.status(200).cookie("Chat_Admin_token",token,{
        maxAge: process.env.COOKIE_EXPIRE_DAY*24*60*60*1000,
        sameSite:"none",
        httpOnly: true,
        secure: true,
    }).json({success:true,message:'Admin login successful'})
})

export const Logout = tryCatch(async (req,res,next) => {
   

    return res.status(200).cookie("Chat_Admin_token",'',{
        maxAge: 0,
        sameSite:"none",
        httpOnly: true,
        secure: true,
    }).json({success:true,message:'Admin Logout successful'})
})



export const allUsers = tryCatch(async(req,res,next)=>{
    const users = await User.find();

    const data = await Promise.all(
        users.map(async({_id,name,username,avatar,verified,createdDate,createdAt,phone,email})=>{
            const [groups,friends] = await Promise.all([
                Chat.countDocuments({groupChat:true,members:_id}),
                Chat.countDocuments({groupChat:false,members:_id}),
            ])

            return {_id,name,username,avatar,verified,createdDate,createdAt,phone,email,friends,groups}
        })
    )

    return res.status(200).json({success:true, message:'all users fetched successfully',data});
});


export const allChats = tryCatch(async(req,res,next)=>{
    const chats = await Chat.find().populate("creator","name avatar").populate("members","name avatar").populate("block_members","name avatar").populate("admins","name avatar");

    const data = await Promise.all(
        chats.map(async({_id,name,groupChat,creator,admins,members,block_members,imgUrl,deleted,createdDate,createdAt})=>{
            const [messages] = await Promise.all([
                Message.countDocuments({chatId:_id}),
            ])

            return {_id,name,groupChat,creator,admins,members,block_members,imgUrl,deleted,createdDate,createdAt,messages}
        })
    )

    return res.status(200).json({success:true, message:'all users fetched successfully',data});
});


export const allMessages = tryCatch(async(req,res,next)=>{
    const messages = await Message.find().populate("chatId","groupChat").populate("sender","name avatar");

    return res.status(200).json({success:true, message:'all messages fetched successfully',data:messages});
})

export const getDatshbordStats = tryCatch(async (req,res,next) => {
    
    const [usersCount,groupsCount,FriendsCount,messagesCount] = await Promise.all([
        User.countDocuments(),
        Chat.countDocuments({groupChat:true}),
        Chat.countDocuments({groupChat:false}),
        Message.countDocuments(),
    ])

    const today = new Date();
    const last7days = new Date();
    last7days.setDate(last7days.getDate() - 7);

    const last7daysMessages = await Message.find({
        createdAt:{
            $gte: last7days,
            $lte: today,
        }
    }).select("createdAt");

    const messages = new Array(7).fill(0);
    const milisecondDay = 1000*60*60*24;


    last7daysMessages.forEach(message => {
        const indexApprox = (today.getTime()-message.createdAt.getTime())/milisecondDay;

        const index = Math.floor(indexApprox);
        messages[6-index]++;
    });

    const stats = {usersCount,groupsCount,FriendsCount,messagesCount,chart:messages};


    return res.status(200).json({success: true,message: 'stats fetched successfully',stats: stats});
})
