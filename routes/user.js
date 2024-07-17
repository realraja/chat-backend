import { Router, json } from "express";
import { FindUser, Login, Logout, Profile, Register, Search } from "../controllers/user.js";
import { User } from "../models/user.js";
import { singleAvatar } from "../middleware/multer.js";
import { isAuthenticated } from "../middleware/auth.js";
import { loginValidator, registerValidator, validateHandler } from "../middleware/validator.js";


const app = Router();

app.use(json());

app.get('/getallusers', async(req,res)=>{
    try {
        const allusers = await User.find().select('+password')
        return res.status(200).json({success:true, message:"All data fetched successfully", data:allusers,date:new Date(Date.now())})
    } catch (error) {
        return res.status(500).json({success:false, message:"error fetching getalldatabasedata"});
    }
});

app.post('/register',singleAvatar,registerValidator(),validateHandler, Register);
app.post('/login',singleAvatar,loginValidator(),validateHandler,Login);

app.get('/profile',isAuthenticated,Profile);
app.get('/logout',isAuthenticated,Logout);

app.get('/search',isAuthenticated,Search);


app.get('/getuser/:userId',FindUser);




//only for test okay

app.post('/getuserdata', async(req,res)=>{
    try {
        const users = req.body.users;
        const userDataPromise = users.map(i => User.findById(i,"name"));
        const usersData = await Promise.all(userDataPromise);

        return res.status(200).json({success:true, message:"All data fetched successfully", data:usersData,})
    } catch (error) {
        return res.status(500).json({success:false, message:"error fetching getalldatabasedata"});
    }
});
export default app;