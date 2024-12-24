import { Router } from "express";
import { changeCurrentPassword, 
    getCurrentUser,
     getUserChannelProfile,
      getWatchHistory, 
      loginUser, 
      logoutUser, 
      refreshAccessToken, 
      registerUser, 
      updateAccountDetails, 
      updateUserAvatar, 
      updateUserCoverImage } from "../controllers/user.controllers.js";
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

//creating a api end point for refresh token 
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT,changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-user-details").patch(verifyJWT,updateAccountDetails);

router.route("/update-avatar").patch(verifyJWT, updateUserAvatar);

router.route("/update-cover-image").patch(verifyJWT, updateUserCoverImage);

//to get details from params
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);

router.route("watch-history").get(verifyJWT,getWatchHistory);


export default router