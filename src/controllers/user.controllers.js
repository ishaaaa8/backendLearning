import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    //for registering user we need to get the user detail from req body
    //validation required .. for username , password , email
    //check if user name already exist: username , email
    //files : cover image , avatar 
    //upload them to cloudinary 
    //create user object  - create entry in db of the object 
    //db will return sthe  created object and rmeove password abd refresh token field from response
    //check for user creation
    //return res


    //get user detail from fontend: req.body

    const { fullname , username , email , password } = req.body
     console.log("email:s ", email);

    //  if( fullname === ""){
    //     throw new ApiError(400 , " fullname is required")
    //  }

    if(
        [ fullname , email, username, password ].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required");
    }

    //check if user aldready exist
    //wheneever extracting , checking or using any db query ensure to use await as db is in other continent

   const existedUser =await User.findOne({
    $or: [{ username }, { email }]
   })

   if(existedUser){
    throw new ApiError(409 ,  "User with email or username already")
   }

   //req.files -> access given by multer
   //req.files?this is used because we might have or might not have files .. so use it optionally
   console.log(username);
   console.log(username.toLowerCase());
   const avatarLOcalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;
   if(!avatarLOcalPath){
    throw new ApiError(400,"Avatar file is required");
   }
   //upload this local file on cloudinary
   const avatar = await uploadOnCloudinary(avatarLOcalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400, "Avatar file is")
   }

   // now if file has been successfully uploaded on cloudinary then update them in database

   const user = await User.create({
    fullname ,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
   })

   console.log(user);

   const checkIfUserIsCreated = await User.findById(user._id).select(
    "-password -refreshToken"
   );
   if(!checkIfUserIsCreated){
    throw new ApiError(500, "Something went wrong while registering user")
   }

   //return response 
   //properly structured respnonse -> ApiResponse   
   return res.status(201).json(
    new ApiResponse(200,checkIfUserIsCreated,"USer registeered successfully")
   )

})
export { registerUser }