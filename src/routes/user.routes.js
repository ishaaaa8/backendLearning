import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controllers.js";
const router = Router();
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    //this above is middleware to handle filess
    registerUser
)

router.route("/login").post(loginUser)

//secured routes i.e  tehse routes are required when user is logged in
router.route("/logout").post(verifyJWT,logoutUser)

export default router