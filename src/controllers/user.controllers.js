import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken =
        user.generateRefreshToken()
        console.log("We are in generate Acces as well as refresh token");
        console.log(accessToken);
        console.log(refreshToken);

        //store refresh token in db
        user.refreshToken = refreshToken
        //now save the new user in db but here we are just have refresh token field in user ... password and other mandatory user details are not included so to avoid error we set validateBeforeSave as False
        await user.save({validateBeforeSave : false});

        return { accessToken , refreshToken}

    }catch(error){
        throw new ApiError(500 , "Something went wrong while generating refresh and access token");
    }
}

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

const loginUser = asyncHandler( async (req,res) => {
    //req body -> take username/email , password from user 
    //use findone to find if their is some user with same username , then
    //password check using bcrypt lib
    //is password is current , then generate access token and refresh token both .
    //refresh token to be stored in db
    //send cookie (secure) to send tokens

    const { email , username , password } = req.body

    if( !username && !email ){
        throw new ApiError(400, "Username or email is required");
    }
    //find user by username or email

    // User.findOne({username})
    const user = await User.findOne({
        $or: [{username} , { email }]
    })
    if( !user ){
        //no user found
        throw new ApiError(404, " No user found.. Please register first!! ");
    }


    //password check
    // User.isPasswordCorrect is wrong  as isPassword correct is methon in user and not User -> User is SChema
    console.log("we are in login fn");
    console.log(user);
    const isPasswordValid = await user.isPasswordCorrect(password)

    if( !isPasswordValid ){
        //no user found
        throw new ApiError(401, " Invalid user credentials ");
    }
    const {accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true,
        secure: true
    } //only server can modify cookies

    return res.status(200).cookie("accessToken" , accessToken , options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{
            user: loggedInUser , accessToken,refreshToken
        },
        "User logged in successfully"
    )
    )
})
const logoutUser = asyncHandler( async(req,res) => {
    //in login and register functions ... we were having the details of user from req.body but here we need an extra middleware to get user detail and verify its authorization so we create an additional middleware auth.mddlewares.js that verify JWT
    // we also need to get refresh token from cookie and remove it from db
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly : true,
        secure: true
    } //only server can modify cookies

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200, {} , "User logged out"))

} )
export { registerUser, loginUser,logoutUser }