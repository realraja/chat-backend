import { Router, json } from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { AcceptJoinRequest, AllNotifications, SendRequest } from "../controllers/reques.js";
import { tryCatch } from "../middleware/tryCatch.js";
import { Request } from "../models/request.js";


const app = Router();
app.use(json());


app.get('/getallrequests', tryCatch(async (req,res,next) => {
    const requests = await Request.find().populate("receiver");
    return res.status(200).json({success: true,message: 'All requests were successfully',data: requests});
}))

app.post('/send',isAuthenticated,SendRequest);
app.put('/accept',isAuthenticated,AcceptJoinRequest);
app.get('/notifications',isAuthenticated,AllNotifications);


export default app;