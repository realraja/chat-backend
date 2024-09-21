import multer from 'multer';


const multerUpload = multer({
    limits:{
        fileSize: 1024 * 1024 * 100,
    }
});
// console.log('id',process.env.FILE_SIZE_LIMIT_MB,process.env.MONGO_URI)
export const singleAvatar = multerUpload.single("file");

export const attachmentMulter = multerUpload.array("files",5);

