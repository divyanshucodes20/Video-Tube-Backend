import connectDB from "./db/index.js";
import dotenv from "dotenv";
import {app} from "./app.js";
dotenv.config({
    path:'./env'
})
app.on("error",(error)=>{
    console.log("Error",error);
    throw error
})
connectDB()
.then(()=>{
    app.listen(process.env.Port||8000,()=>{
        console.log(`Server is running on port ${process.env.Port||8000}`);
    })
})
.catch((error)=>{
    console.log("Mongo db connection failed!!!",error);
})
/*
import express from "express"
import mongoose from "mongoose"
import {DB_NAME} from "./constants.js";
const app=express()

;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error",error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT} `);
        })
    } catch (error) {
        console.error(error)
        throw error
    }
})()*/