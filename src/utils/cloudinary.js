import {v2 as cloudinary} from "cloudinary"
import { log } from "console";
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});                                 

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;

        // upload the image to cloudinary
        const response =await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        })

        // file has been uploaded to cloudinary so we can remove it from the server
        console.log("file has been uploaded to cloudinary" ,
            response.url
        );

        return response.url;

    }
    catch(error){

        fs.unlinkSync(localFilePath); /* to remove the file from the server after it has been uploaded to Cloudinary. This is done to free up storage space on the server and ensure that temporary files do not accumulate over time. */

    }
}

export {uploadOnCloudinary} ;