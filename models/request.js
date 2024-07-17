import mongoose,{ Schema, Types, model } from "mongoose";




const schema = new Schema({
    status:{
        type: String,
        default: 'Pending',
        enum:['Pending', 'Accepted', 'Rejected']
    },
    sender:{
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver:{
        type: Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    receiverCreator:{
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
      createdDate: [],
},{timestamps: true});

export const Request = mongoose.models.Request || model('Request',schema);