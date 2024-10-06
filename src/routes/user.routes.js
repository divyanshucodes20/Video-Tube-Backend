import {Router} from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {loginUser,logoutUser,refreshAccessToken} from "..//controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router =Router()
router.route("/register").post(
upload.fields([{
name:"avatar",
maxCount:1
},
{
    name:"coverImage",
    maxCount:1
}
]),  
    registerUser
)
router.route("/login").post(loginUser)
//secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)//here patch because we dont want to update all details here
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)//here .single means in usercontroller we use req.file not files
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)//as we are taking req.paarams thats why here route is diff aur yaha user kuchh bhej nahi raha toh hum get use karee hai
router.route("/history").get(verifyJWT,getWatchHistory)
export default router//jab export default karte hai tab usko import router aise karte hai aur agar isko hum aise karte ki export {router} then humko isko import {router} karna padta