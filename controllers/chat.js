import { ALERT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { tryCatch } from "../middleware/tryCatch.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { uploadFiles } from "../utils/cloudinaryUpload.js";
import { emitEvent } from "../utils/emit.js";
import { errorHandler } from "../utils/handleError.js";

let dateArray = [
  new Date().getDate(),
  new Date().getMonth() + 1,
  new Date().getFullYear(),
  new Date().getHours(),
  new Date().getMinutes(),
  new Date().getSeconds(),
];

export const CreateGroup = tryCatch(async (req, res, next) => {
  const { name, members } = req.body;
  
  const allMembers = [...members || '', req.id];
  
  const group = await Chat.create({
      name:name || `Group ${dateArray[0]}/${dateArray[1]}/${dateArray[2]}`,
      imgUrl:['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRog6epfJWr_aK4Q5m5o6OYOGoJAHZMpky4mA&s'],
      members: allMembers,
      creator: req.id,
      admins: [req.id],
      createdDate: dateArray,
      groupChat: true,
    });
    
    emitEvent(req, ALERT, group.members, `Welcome to ${name} group`);
    // emitEvent(req, REFETCH_CHATS, members);
    // console.log(name, allMembers);

  return res
    .status(200)
    .json({ success: true, message: "Group Created successfully" });
});
export const NewChat = tryCatch(async (req, res, next) => {
  const { member } = req.body;
  if (!member) {
    return next(new errorHandler('Please provide member',404));
  }


  const allMembers = [member, req.id];

  // console.log(allMembers)

  const newChat = await Chat.create({
      name: `Chat ${req.id}-${member}`,
    members: allMembers,
    createdDate: dateArray,
  });

  emitEvent(req, ALERT, allMembers, `Welcome to New chat`);
  emitEvent(req, REFETCH_CHATS, member);

  return res
    .status(200)
    .json({ success: true, message: "Chat Created successfully",chat:newChat });
});

export const GetMyChats = tryCatch(async(req, res, next)=>{
    const chat  = await Chat.find({members:req.id}).populate('members','name avatar');
    
    // console.log(chat)

    const modifiedChat = chat.map(({_id,name='',imgUrl,members,updatedAt,groupChat})=>{
      if(!groupChat){
        const otherMember = members.find(member=>member._id.toString() !== req.id.toString());
        // console.log(members,otherMember,req.id)
        return {_id,name:otherMember.name,imgUrl:[otherMember.avatar],members,updatedAt,groupChat}
      }else{
        return {_id,name,imgUrl,members,updatedAt,groupChat}
      }
    })

    return res.status(200).json({ success: true, message:'chat fetched successfully',chat:modifiedChat});
})

export const GetMyGroups = tryCatch(async(req, res, next)=>{
    const chat  = await Chat.find({creator:req.id}).populate('members','name avatar');

    return res.status(200).json({ success: true, message:'chat fetched successfully',chat });
})

export const AddAdmin = tryCatch(async(req, res, next)=>{
    const {chatId, member} = req.body;
    if(!member) return next(new errorHandler('Please provide member',404));

    const chat  = await Chat.findById(chatId);

    if(!chat) return next(new errorHandler('Chat not found',404));

    if(!chat.groupChat) return next(new errorHandler('add member not allowed',404));

    if(chat.creator.toString() !== req.id.toString()) return next(new errorHandler('you are not allowed to make admin'));

    if(!chat.members.includes(member)) return next(new errorHandler('he is not allowed to become admin'));


    if(!chat.admins.includes(member)){
    chat.admins.push(member);
    await chat.save();
    }else{
        return next(new errorHandler('admin is already exists'));
    }


    return res.status(200).json({ success: true, message:'chat fetched successfully',chat });
})
export const RemoveAdmin = tryCatch(async(req, res, next)=>{
    const {chatId, member} = req.body;
    if(!member) return next(new errorHandler('Please provide member',404));

    const chat  = await Chat.findById(chatId);

    if(!chat) return next(new errorHandler('Chat not found',404));

    if(!chat.groupChat) return next(new errorHandler('remove member not allowed',404));

    if(chat.creator.toString() !== req.id.toString()) return next(new errorHandler('you are not allowed to remove admin'));




    if(chat.admins.includes(member)){
    chat.admins = chat.admins.filter(i=> i.toString() !== member.toString())
    await chat.save();
    }else{
        return next(new errorHandler('admin is already removed'));
    }


    return res.status(200).json({ success: true, message:'admin removed successfully',chat });
})


export const AddMembers = tryCatch(async(req, res, next)=>{
    const {chatId, members} = req.body;
    if(!members || members.length < 1) return next(new errorHandler('Please provide members',404));

    const chat  = await Chat.findById(chatId);

    if(!chat) return next(new errorHandler('Chat not found',404));

    if(!chat.groupChat) return next(new errorHandler('add member not allowed',404));

    if(!chat.admins.includes(req.id)) return next(new errorHandler('you are not allowed to add member'));
    // if(chat.creator.toString())

    const allNewMemberPromises = members.map(i=> User.findById(i,"name"));

    const allNewMembers = await Promise.all(allNewMemberPromises);

    const uniqueMembers = allNewMembers.filter(i => !chat.members.includes(i._id.toString())).map(i => i._id);

    console.log(uniqueMembers)
    chat.members.push(...uniqueMembers);

    await chat.save();

    emitEvent(req, ALERT, chat.members, `${allNewMembers.map(i=> i.name).join(', ')} are added successfully`);
  emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({ success: true, message:'chat fetched successfully',chat });
})
export const RemoveMembers = tryCatch(async(req, res, next)=>{
    const {chatId, member} = req.body;
    if(!member) return next(new errorHandler('Please provide members',404));

    const chat  = await Chat.findById(chatId);

    if(!chat) return next(new errorHandler('Chat not found',404));

    if(!chat.groupChat) return next(new errorHandler('remove member not allowed',404));

    if(!chat.admins.includes(req.id)) return next(new errorHandler('you are not allowed to remove member'));
    // if(chat.creator.toString())

    

    
    chat.members = chat.members.filter(i => i.toString() !== member.toString());

    await chat.save();

    emitEvent(req, ALERT, chat.members, `remove successfully`);
  emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({ success: true, message:'member removed successfully',chat });
})
export const LeaveGroup = tryCatch(async(req, res, next)=>{
    const chatId = req.params.chatId;

    const chat  = await Chat.findById(chatId);

    if(!chat) return next(new errorHandler('Chat not found',404));

    if(!chat.groupChat) return next(new errorHandler('leave group not allowed',404));
    
    chat.admins = chat.admins.filter(i => i.toString() !== req.id.toString());
    chat.members = chat.members.filter(i => i.toString() !== req.id.toString());

    await chat.save();

    emitEvent(req, ALERT, chat.members, `remove successfully`);
  emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({ success: true, message:'group removed successfully',chat });
})






//here started messages


export const SendAttachment = tryCatch(async(req, res, next)=>{

  const {chatId} = req.body;
  // console.log(chatId);
  const files = req.files || [];
if (!Array.isArray(files) || files.length < 1) {
  return next(new errorHandler('Please provide files', 404));
}
// upload files here
// console.log(files);
const attachments = await uploadFiles(files);
// console.log(attachments);

  const [chat, user] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.id,"name")
  ]);  
  if (!chat) return next(new errorHandler('Chat not found', 404));
  if (!user) return next(new errorHandler('User not found', 404));
  



  const messageForRealtime = {content:'',attachments,sender:{_id:user._id,name:user.name},chatId};
  const messageForDB = {content:'',attachments,sender:user._id,chatId};
  const message = await Message.create(messageForDB);

  emitEvent(req,NEW_MESSAGE,chat.members,{message: messageForRealtime,chatId})
  emitEvent(req,NEW_MESSAGE_ALERT,chat.members,{chatId})


  res.status(200).json({ success: true, message});
})



export const GetChatDetails = tryCatch(async (req,res,next) => {
  if(req.query.populate==='true'){
    const chat = await Chat.findById(req.params.id).populate("members", "name avatar username");
    if(!chat) return next(new errorHandler('chat not found',403));

    return res.status(200).json({
      success: true,
      message:'success',
      chat
    })
  }else{
    const chat = await Chat.findById(req.params.id);
    if(!chat) return next(new errorHandler('chat not found',403));

    return res.status(200).json({
      success: true,
      message:'success',
      chat
    })
  }
})


export const RenameGroup = tryCatch(async(req,res,next)=>{
  const chatId = req.params.id;
  const name = req.body.name;
  const chat = await Chat.findById(chatId);

  if(!chat) return next(new errorHandler('chat not found',403));
  if(!chat.groupChat) return next(new errorHandler('this is not a group chat',403));
  if(!chat.admins.includes(req.id.toString())) return next(new errorHandler('you are not allowed to rename group',403));

  chat.name = name;
  await chat.save();

  return res.status(200).json({success: true, message:'Group name was updated successfully',chat:chat});
}) 

export const DeleteGroup = tryCatch(async(req,res,next)=>{
  const chatId = req.params.id;
  const chat = await Chat.findById(chatId);

  if(!chat) return next(new errorHandler('chat not found',403));
  if(!chat.groupChat) return next(new errorHandler('this is not a group chat',403));
  if(!chat.admins.includes(req.id.toString())) return next(new errorHandler('you are not allowed to rename group',403));

  chat.deleted = true;
  await chat.save();

  return res.status(200).json({success: true, message:'Group name was updated successfully',chat:chat});
}) 



export const getMessage = tryCatch(async(req, res, next)=>{
  const chatId = req.params.id;
  const {page = 1} = req.query;

  const limit = process.env.MESSAGE_LIMIT;
  const skip = (page-1)*limit;

  const [Messages , totalMessagesCount] = await Promise.all([
    Message.find({chatId}).sort({createdAt: -1}).skip(skip).limit(limit).populate("sender", "name avatar").lean(),
    Message.countDocuments({chatId})
  ])

  const totalPages = Math.ceil(totalMessagesCount/limit);


  return res.status(200).json({success: true, message:Messages.reverse(),totalPages,totalMessages:Messages.length,page})


})