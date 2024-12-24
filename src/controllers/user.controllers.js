import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
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
    // console.log(req.body)
    // console.log(username);
    // console.log(email);
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
    console.log(req.user);
    console.log("see above");
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200, {} , "User logged out"))

} )

//by refresh access token -> we are trying to create a function that will return access token and refresh token when an end point is hit with refresh token of current user that wants to continue using the app and not getting log out
const refreshAccessToken = asyncHandler(async (req, res) => {
    //we need to get refresh token from cookie and verify if it is same to what is stored in db for tha user ... this is useful when access session has been expired and instead of again getting login credentials ... servers tries to keep user logged in based on refresh token

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if( !incomingRefreshToken ){
        throw new ApiError(401 , "unauthorized request")
    }

    try{
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_ACCESS_TOKEN);
        //await may be used in above statement if required
        const user = await User.findOne(decodedRefreshToken._id);
        if( !user ){
            throw new ApiError(401, "Unauthorized requests");
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used");
        }
        //if user is found then it means user is authorized and so we need to re generate the access token and refresh token and store them 
        const { newAccesToken , newRefreshToken } = await generateAccessAndRefreshTokens(decodedRefreshToken._id);

        const options = {
            httpOnly:true,
            secure: true
        }

        return res.status(200).cookie("accessToken",newAccesToken,options).cookie("refreshToken", newRefreshToken,options).json(
            new ApiResponse(
                200,
                {accessToken: newAccesToken, refreshToken: newRefreshToken },
                "Access token refreshed"
            )
        )

    }catch(error){
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
}) 

const changeCurrentPassword = asyncHandler( async (req, res) => {
    //now before changing password ... we may think of veryfying if user is still logged in or not ... but need not to worry .. we have alreday created verifyJWT middleware that will take care of it.

    const {currPassword , newPassword} = req.body
    console.log(req.body);
    console.log(req.user);
    //check curr password in req body === user id vala old passwrd ... which is in req.user 
    //we can perform it by aldready created function to check password is correct from userschema
    const user = await User.findById(req.user?.id)
    const isPasswordCorrect = await  user.isPasswordCorrect(currPassword);
    if( !isPasswordCorrect){
        throw new ApiError(401, "Invalid current password... Please provide correct password")
    }
    // //now i have to do updation of password
    // req.user.password = newPassword
    // await req.user.save({validateBeforeSave: false});
    user.password = newPassword
    await user.save({validateBeforeSave: false});
    return res.status(200).json(new ApiResponse(200, {} , "Password changed successfully"))
});

const getCurrentUser = asyncHandler( async (req, res) => {
    console.log("Current user: ");
    console.log(req);
    console.log(req.user);
    return res.status(200).json(200,req.user,"User details fetched successfully")
});

const updateAccountDetails = asyncHandler( async (req, res) => {
    //this is to particular update text details and not the files like avatar and cover image because for files it good practice to have seperate end points

    const { fullname,email} = req.body
    if( !fullname || !email){
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"))
});

//files update //multer needed // check logged in
 const updateUserAvatar = asyncHandler( async (req, res) => {
    //new image 
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "error in uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"))

 });


 const updateUserCoverImage = asyncHandler( async (req, res) => {
    //new image 
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "error in uploading cover img")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImageLocalPath.url
            }
        },
        { new: true }
    ).select("-password")

    res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))

 });

 const getUserChannelProfile = asyncHandler( async (req, res) => {
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }  
    //mongoose aggregation pipeline
    const channel =await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            //to find all subscriber of above user
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            //to find all the channels above user has subscribed to 
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                subscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]}, 
                    then: true,
                    else: false
                }

            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                isSubscribed: 1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404, "No channel found")
    }
    return res.status(200).json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"));  // console.log(channel);
 });


const getWatchHistory = asyncHandler( async (req, res) => {
    //req.user?._id -> string so to convert it to object id we use mongoose.Types.ObjectId
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
});


export { registerUser, loginUser,logoutUser ,
    refreshAccessToken, changeCurrentPassword,
    getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile
}