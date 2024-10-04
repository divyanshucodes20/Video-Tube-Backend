import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser=asyncHandler(async (req,res)=>{
    /*res.status(200).json({
        message:"ok"
    })*/
   //steps to register user 1)get user details from fontend
   //2)validation-not empty
   //3)check if user already exist by username and email
   //4)check for all required things like images,avatar
   //5)upload them to cloudinary
   //6)create user object-create entry in db
   //7)remove password and refresh token feild form response
   //8)check for user creation if yes return response else return null
   const {fullname,email,username,password} =req.body
   if ([fullname,email,username,password].some((feild)=>
   feild?.trim()==="")
){
    throw new ApiError(400,"All feilds are required")
   }
   /*if (fullname=="") {
    throw new ApiError(400,"fullname is required");
    
   }*/
  const existedUser=await User.findOne({
    $or:[{username},{email}]
  })
  if(existedUser){
    throw new ApiError(409,"User with email or username already exist");
  }
  const avatarLocalPath=req.files?.avatar[0]?.path;
  //const coverImageLocalPath=req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path
  }
  
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required") 
  }
  const avatar= await uploadOnCloudinary(avatarLocalPath)
  const coverImage=await uploadOnCloudinary(coverImageLocalPath)
  if(!avatar){
    throw new ApiError(400,"Failed to upload avatar")
  }
  const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })
  const createdUser=await User.findById(user._id).select(
    "-password-refreshToken"
  )
  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user");
  }
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully")
  ) 
})
export {registerUser}