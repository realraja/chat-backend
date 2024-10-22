import { Router, json } from "express";
import { Chat } from "../models/chat.js";
import {
  AddAdmin,
  AddMembers,
  CreateGroup,
  DeleteGroup,
  GetChatDetails,
  GetMyChats,
  GetMyGroups,
  LeaveGroup,
  NewChat,
  RemoveAdmin,
  RemoveMembers,
  RenameGroup,
  SendAttachment,
  getMessage,
} from "../controllers/chat.js";
import { isAuthenticated } from "../middleware/auth.js";
import { attachmentMulter, singleAvatar } from "../middleware/multer.js";
import { tryCatch } from "../middleware/tryCatch.js";
import { Message } from "../models/message.js";

const app = Router();

app.use(json());

app.get("/getallchats", async (req, res) => {
  try {
    const allchats = await Chat.find();
    return res
      .status(200)
      .json({
        success: true,
        message: "All data fetched successfully",
        data: allchats,
        date: new Date(Date.now()),
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "error fetching getalldatabasedata" });
  }
});

app.use(singleAvatar)

app.post("/new", isAuthenticated, CreateGroup);
app.post("/new/chat", isAuthenticated, NewChat);
app.get("/my", isAuthenticated, GetMyChats);
app.get("/my/group", isAuthenticated, GetMyGroups);
app.put("/admin/add", isAuthenticated, AddAdmin);
app.put("/admin/remove", isAuthenticated, RemoveAdmin);
app.put("/add", isAuthenticated, AddMembers);
app.put("/remove", isAuthenticated, RemoveMembers);
app.delete("/leave/:chatId", isAuthenticated, LeaveGroup);






//get messages
app.get("/getallmessages",tryCatch(async (req, res, next) => {
    const allMessage = await Message.find();
    return res
    .status(200)
    .json({
        success: true,
        message: "All data fetched successfully",
        data: allMessage,
        date: new Date(Date.now()),
    });
})
);



app.use(isAuthenticated);
app.post("/message", attachmentMulter, SendAttachment); // send attachment test it after okay

app.get("/message/:id", getMessage);

//get chat details ,rename,delete
app.route("/:id").get(GetChatDetails).put(RenameGroup).delete(DeleteGroup);

export default app;
