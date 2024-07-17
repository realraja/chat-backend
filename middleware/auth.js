import { errorHandler } from "../utils/handleError.js";
import { tryCatch } from "./tryCatch.js";
import jwt from 'jsonwebtoken';


export const isAuthenticated = tryCatch((req,res,next)=>{
    const token = req.cookies["Chat_token"];
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