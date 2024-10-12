import mongoose,{ Schema, Types, model } from "mongoose";



const chatSchema = new Schema({
    name:{
        type: String,
        required: true,
    },
    imgUrl: [String],
    groupChat:{
        type: Boolean,
        default: false,
    },
    deleted:{
        type: Boolean,
        default: false,
    },
    creator:{
        type: Types.ObjectId,
        ref: "User"
    },
    admins:[{
        type: Types.ObjectId,
        ref: "User"
    }],
    members:[{
        type: Types.ObjectId,
        ref: "User",
        unique: true
    }],
    block_members:[{
        type: Types.ObjectId,
        ref: "User"
    }],
    dummy_data: [],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdDate: [],

},{timestamps: true});


export const Chat = mongoose.models.chatSchema || model('Chat',chatSchema);