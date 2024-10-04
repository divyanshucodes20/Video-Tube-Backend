import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
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
export default router//jab export default karte hai tab usko import router aise karte hai aur agar isko hum aise karte ki export {router} then humko isko import {router} karna padta