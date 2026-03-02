import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async () => {
    try{

        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`); 

        console.log(`\n MongoDB Connected !! DB HOST : ${connectionInstance.connection.host} \n`);




    }
    catch(err){
        console.log("MONGODB CONNECTION ERROR: ", err);
        throw err;
        // process.exit(1); // exit the process with failure
    }
}
export default connectDB;                             