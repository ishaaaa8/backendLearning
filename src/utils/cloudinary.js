//will give the path to local file
//file will be uploaded from user using multer which will then be temporarily saved on our server than sent to cloudinary to store on cloud

import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

//fs -> librray that comes inbuilt with nodejs used for file handling to manage file system

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    console.log(localFilePath)
    try{
        if( !localFilePath ) return null
        //upload the file on cloudinary
        const response =await cloudinary.uploader
        .upload(localFilePath, {
            resource_type: "auto"
        })
    ////file has been uploaded successfully on cloudinary
        console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }catch(error){
        console.log("got an error in upload cloundinary fn");
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload got failed
        return null;
    }
}
export { uploadOnCloudinary }