import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
const generateAccessAndRefreshToken=async(userId)=>{
  try {
    const user=await User.findById(userId)
   const refreshToken= user.generateRefreshToken()
    const accessToken=user.generateAccessToken()
    user.refreshToken=refreshToken//as we do not want user to enter password everytime thats why we are storing refresh token in our database user model so here we put that generated refresh token value in to user object model 
    await user.save({validateBeforeSave:false})//save this user
    //yaha hum logo ne ek hi feild ne login karaya hai matlab bina password ke thats why we use validateBeforeSa ve:false to not to validate
    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating refresh and access token");
    
  }
}
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
const loginUser=asyncHandler(async(req,res)=>{
  //req_body se data le aoo
  //username or email se login karwao
  //find the user
  //password check
  //access and refresh token
  //send tokens in cookies
  const {email,username,password}=req.body
  if(!(username||email)){
    throw new ApiError(400,"username or email is required")
  }
  const user= await User.findOne({
    $or:[{username},{email}]
  })
  if(!user){
    throw new ApiError(404,"User does not exist");
  }
  const isPasswordValid=await user.isPasswordCorrect(password)//here we are user not User because User hum logo ka database me store hai but jo user hai woh jo lgin karne ka try kar raha hai woh hai toh uska password check karna hai naaki jo already saved hai uska
  if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials");
  }
  const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
  //humne pehle jo user liya hai uske pass refresh token feild empty hai kyuki hum logo ne baad me generate kiye tokens and baad me user ke database me save kiya isliye ya to tum usme update kardo refresh token ya to doobara databse call karke poora model doobara lelo agar poora databse se user lena expensive hai tmhare database aur peoject k hisaab se tab direct update karo but here nahi hai to hum log database se hi call krk updated lere h
 const loggedInUser=await User.findById(user._id).select("-password-refreshToken")// loggedin user leke usme se refresh token aur password chuupa diya
 const options={
  httpOnly:true,
  secure:true
 }//yeh karne ke baad cokkie kabhi frontend se modify nahi hongi server se hongi
 return res.status(200).cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
  new ApiResponse(
    200,
    {
      user:loggedInUser,accessToken,refreshToken//as we set access and refresh token in cookie and here we again sending tokens in response because when user try to explicitily trying to save tokens then wo cookie me to jayege nahi isliye yeh edge case handle karne ke liye kare hai
    },
    "User loggedin Successfully"
  )
 )
})
const logoutUser=asyncHandler(async(req,res)=>{  //cookie se user ka data jo set kiya tha usko hatado aur refresh token database se hatado
  //iss function  ko likhne se pehle authmiddleware banao jaha se humlogo ko user ka access milega phir uska userroute me route set karo then isme likho
 await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true//return me jo response milega uski new value mil jayegi matlab agar purana aata to refresh token milta but naya lo taaki wo undefind mile
    }
  )
  const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out"))
})

export {registerUser,loginUser,logoutUser}