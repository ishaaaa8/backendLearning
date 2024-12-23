import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler"
import jwt from "jsonwebtoken"
import { User } from "../models/user.models"

export const verifyJWT = asyncHandler(async( req , _ , next) => {
    //why are we using next() here
    //req.cookies? it is used because in case of cookie based auth .... cookies are in req.cookies but when its mobile device its in req.headers
    try{
        
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        //await may be required in above statement
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if( !user){

            throw new ApiError(401, "Invalid access token")
        }
        req.user = user;
        next();
    }catch(error){
        throw new ApiError(401, error.message || "Invalid access token")
    }

})