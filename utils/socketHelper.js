import { userSocketIDs } from "../app"



export const getSockets = (users = []) =>{
    const sockets = users.map((user)=> userSocketIDs.get(user._id.toString()))

    return sockets;
}