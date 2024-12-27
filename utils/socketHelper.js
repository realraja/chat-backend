// import { userSocketIDs } from "../app"

import { userSocketIDs } from "../app.js";


// const userSocketIDs = new Map();
export const getSockets = (users = []) =>{
    // console.log(users[2]._id);
    const sockets = users.map((user)=> userSocketIDs.get(user._id.toString()))
  
    return sockets;
  }