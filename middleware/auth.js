import { Chat_token } from "../constants/config.js";
import { User } from "../models/user.js";
import { errorHandler } from "../utils/handleError.js";
import { tryCatch } from "./tryCatch.js";
import jwt from 'jsonwebtoken';


export const isAuthenticated = tryCatch((req,res,next)=>{
    const token = req.cookies[Chat_token];
    if(!token) return next(new errorHandler('Please Login First To Access this Page',401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.id = decoded.id;
    next();
})


export const isAuthenticatedAdmin = tryCatch((req,res,next)=>{
    const token = req.cookies["Chat_Admin_token"];
    if(!token) return next(new errorHandler('Please Login First To Access this Page',401));

    const password = jwt.verify(token, process.env.JWT_SECRET)
    if(password !== process.env.ADMIN_SECRET_PASS) return next(new errorHandler('Password has been changed please login again',401));

    next();
})


export const SocketAuthenticator = async(err,socket,next) =>{
    try {
        if(err) return next(err)

        const authToken = socket.request.cookies[Chat_token];

        if(!authToken) return next(new errorHandler('Please login to access this route',401));

        const decodedData = jwt.verify(authToken,process.env.JWT_SECRET);

        const user = await User.findById(decodedData.id);

        if(!user) return next(new errorHandler('Please login to access this route',401));

        socket.user= user;

        return next();
    } catch (error) {
        console.log(error)
        return next(new errorHandler('Please login to access this route',401));
    }
};