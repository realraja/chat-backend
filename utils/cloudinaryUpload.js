import { v4 as uuid } from "uuid"
import { v2 as cloudinary } from "cloudinary"

const getBase64 = (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadFiles = async(files=[]) =>{
    const uploadPromises = files.map(file =>{
        return new Promise((resolve, reject) =>{
            cloudinary.uploader.upload(getBase64(file),{
                resource_type: "auto",
                public_id:uuid()
            },(error,result)=>{
                if(error) return reject(error);
                resolve(result);
            })
        })
    })

    try {
        const results = await Promise.all(uploadPromises);
        const formattedResults = results.map(result => ({
            id: result.public_id,
            url: result.secure_url
        }))
        return formattedResults
    } catch(err)  {
        throw new Error("Error uploading files to cloudinary",err);
    }
}