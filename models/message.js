import mongoose,{ Schema, Types, model } from "mongoose";




const schema = new Schema({
    attachments: [{
        fileType: String,
        public_id: String,
        url: String
    }],
    content:String,
    sender:{
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    chatId:{
        type: Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
      createdDate: [],
},{timestamps: true});

export const Message = mongoose.models.Message || model('Message',schema);