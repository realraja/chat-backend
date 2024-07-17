import mongoose from "mongoose"


export const connectDB = async () =>{
    try {
        const {connection} = await mongoose.connect(process.env.MONGO_URI,{
            dbName: process.env.MONGO_DB_NAME
        });
        console.log('Database connected to', connection.name);
    } catch (error) {
        console.log('err===>',error);
        process.exit(1);
    } 
}