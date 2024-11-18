import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { tryCatch } from "../middleware/tryCatch.js";
import { Chat } from "../models/chat.js";
import { Request } from "../models/request.js";
import { emitEvent } from "../utils/emit.js";
import { errorHandler } from "../utils/handleError.js";



export const SendRequest = tryCatch(async(req,res,next) => {
    const {chatId} = req.body;

    
    const chat = await Chat.findById(chatId);

    if(!chat) return next(new errorHandler('Group not found',400));

    if(chat.members.includes(req.id)) return next(new errorHandler(`user already in group ${req.id}`,400));
    
    const request = await Request.findOne({
        $or:[
            {sender:req.id,receiver:chatId},
            {sender:chatId,receiver:req.id},
        ]
    })

    if(request) return next(new errorHandler("Request Already Exists",400));

    await Request.create({
        sender:req.id,
        receiver:chatId,
        receiverCreator:chat.creator,
    });


    emitEvent(req,NEW_REQUEST,[chat.creator]);

    return res.status(200).json({success:true,message:'Request Sent successfully'});
})


export const AcceptJoinRequest = tryCatch(async(req,res,next) => {
    const {requestId,accept} = req.body;

    const request = await Request.findById(requestId).populate("sender","name").populate("receiverCreator","name");

    if(!request) return next(new errorHandler('Request not found',400));

    if(request.receiverCreator._id.toString() !== req.id.toString()) return next(new errorHandler('You are not allowed to accept or reject this request',400));

    if(!accept){
        await request.deleteOne();
        return res.status(200).json({success:true,message: 'Request rejected'});
    }

    const chat = await Chat.findById(request.receiver);
    
    if(chat.members.includes(request.sender._id)){
        await request.deleteOne();
        return next(new errorHandler('Already members of group',400));
    }

    chat.members.push(request.sender._id);
    await chat.save();
    await request.deleteOne();




    emitEvent(req,REFETCH_CHATS,chat.members);

    return res.status(200).json({success:true,message:'Request accepted successfully',senderId:request.sender._id});
})


export const AllNotifications = tryCatch(async (req,res,next) => {
    const request = await Request.find({receiverCreator:req.id}).populate("sender","name avatar username").populate("receiver","name");
    return res.status(200).json({success:true,message:'Request fetched successfully',request:request});
})


