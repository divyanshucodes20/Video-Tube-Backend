import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js";
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
export default router//jab export default karte hai tab usko import router aise karte hai aur agar isko hum aise karte ki export {router} then humko isko import {router} karna padta