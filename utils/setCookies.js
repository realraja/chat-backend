import jwt from 'jsonwebtoken'





export const sendToken = (res,user,code,message) =>{
     const CookieOptions = {
        maxAge: process.env.COOKIE_EXPIRE_DAY*24*60*60*1000,
        sameSite:"none",
        httpOnly: true,
        secure: true,
    }
    
const token = jwt.sign({id:user._id},process.env.JWT_SECRET);

return res.status(code).cookie("Chat_token",token,CookieOptions).json({success:true,message:message})
}