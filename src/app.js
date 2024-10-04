import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from './routes/user.routes.js'
app.use("/api/v1/users",userRouter)//because we have seperated everything like router controller and all middlewares so we want this syntax that from app we use middleware to handle it thats why we are using app.use() and this middleware go to userRouter function in user.route.js
//http:localhost:8000/api/v1/users/register remember register route from user routes
export { app }