import { getSockets } from "./socketHelper.js";



export const emitEvent = (req,event,users,data) => {
    const io = req.app.get("io");
    const usersSocket = getSockets(users);
    io.to(usersSocket).emit(event,data);

    // console.log('Emmiting event',event,data);
}