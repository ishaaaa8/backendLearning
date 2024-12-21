import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema =new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,

        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //clodinary url
            required: true,

        },
        coverImage: {
            type: String,
        },
        watchHistory:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    }
,{timestamps: true})

userSchema.pre("save", async function(next) {
    if(! this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password, 10)
    next()
    //thebabove statemnet ecrypt the password every time password is created or regenerated , or changed
    // the if condtn checks... if the pswrd is modified and hence preventing the encrypt again when some other field like username is changed.

    // in case when user change their username only and password remains same ... in that we do not need ti encrypt again but if we would not have placed if condition passwrod would be encrypted again and again each time user changes their username , email etc. fields as well
}) 

//custome methods
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
    //await is used here because bcrypt use cryptography concepts  hence need some time to respond
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model(("User", userSchema));