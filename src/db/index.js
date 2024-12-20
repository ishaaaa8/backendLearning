import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


//async because db is in differnet continent
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`);
    }catch(error){
        console.error("MONGODB connection error",error);
        process.exit(1);
    }
}

export default connectDB