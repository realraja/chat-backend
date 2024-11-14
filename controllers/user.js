import { tryCatch } from "../middleware/tryCatch.js";
import { Chat } from "../models/chat.js";
import { User } from "../models/user.js";
import { uploadFiles } from "../utils/cloudinaryUpload.js";
import { errorHandler } from "../utils/handleError.js";
import { sendToken } from "../utils/setCookies.js";

let dateArray = [
  new Date().getDate(),
  new Date().getMonth() + 1,
  new Date().getFullYear(),
  new Date().getHours(),
  new Date().getMinutes(),
  new Date().getSeconds(),
];

export const Register = tryCatch(async (req, res, next) => {
  const { name, username, password } = req.body;
  const file = req.file;
  // console.log('ye data =====>',name,username,password,file);

  if (!username || !password || !name || !file)
    return next(new errorHandler("Fill all the fields"));

  // const checkUser = await User.findOne({ username });

  // if (checkUser) {
  //   return next(new errorHandler("User Already Registered", 400));
  // }

  const result = await uploadFiles([file])
  const avatar = result[0].url;

  const user = await User.create({
    name,
    username,
    password,
    avatar,
    createdDate: dateArray,
  });
  // res.json({success: true,message: 'post api success'});
  sendToken(res, user, 201, `user ${user.name} created successfully`);
});

export const Login = tryCatch(async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password)
    return next(new errorHandler("Fill all the fields"));

  const user = await User.findOne({ username }).select("+password");
  if (!user) {
    return next(new errorHandler("invalid username and password", 400));
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(new errorHandler("invalid username and password", 400));
  }

  sendToken(res, user, 200, "logged in successfully!");
});

export const Profile = tryCatch(async(req,res,next) => {
  const user = await User.findById(req.id);
  res.status(200).json({
      success: true,
      menubar:'profile is working',
      user
  })
})


export const Logout = tryCatch(async (req, res,next)=>{
  res.status(200).cookie('Chat_token','',{sameSite:"none",
    httpOnly: true,
    secure: true,maxAge:0}).json({
    success:true,
    message: 'Logged out successfully'
  })
})


export const FindUser = tryCatch(async(req,res,next)=>{
  const userId = req.params.userId;
  // const user = await User.findById(userId,"name");
  const user = await User.findById(userId);

  if(!user) next(new errorHandler('user not found',403));

  return res.json({success:true,message:'user found successfully',data:user});
})


export const Search = tryCatch(async(req,res,next)=>{
  const {name= ''} = req.query;
  // const user = await User.findById(userId,"name");
  const chat = await Chat.find({groupChat:true,name:{$regex:name,$options:'i'}}).populate("creator","name avatar");

  const findedUsers = await User.find({name:{$regex:name,$options:'i'}});


  const modifiedUsers = findedUsers.map(async({_id,name,username,avatar,updatedAt})=>{
    const userChat = await Chat.findOne({groupChat:false,
      $and:[
          {members: req.id},
          {members: _id},
      ]
    })
    // const otherMember = members.find(member=>member._id !== req.id);
    if(userChat){
      return {_id:userChat._id,name,avatar,username,updatedAt,isFriend:true}
    }else{
      // console.log(userChat,_id,name,avatar,username,updatedAt)
      return {_id,name,avatar,username,updatedAt,isFriend:false}
    }
  })

 const users = await Promise.all(modifiedUsers)

  return res.json({success:true,message:'Chat found successfully',groups:chat,users:users});
});


// const Chats = await Chat.findOne({
//   $and:[
//       {members: req.id},
//       {sender:chatId,receiver:req.id},
//   ]
// })