import { Router, json } from "express";
import { Logout, allChats, allMessages, allUsers, getDatshbordStats, verify } from "../controllers/admin.js";
import { isAuthenticatedAdmin } from "../middleware/auth.js";


const app = Router();
app.use(json());

app.post('/verify',verify);
app.get('/logout',Logout);

app.use(isAuthenticatedAdmin);
app.get('/');
app.get('/users',allUsers);
app.get('/chats',allChats);
app.get('/messages',allMessages);
app.get('/stats',getDatshbordStats);

export default app;