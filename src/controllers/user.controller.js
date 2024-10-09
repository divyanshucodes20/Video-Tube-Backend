import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary,deletefromCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
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
      $unset:{
        refreshToken:1//this remove the feild from the document
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
const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken//as we setted tokens in cookie we can use req.cookie but for that user who is using mobile app then req.body
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
  }
try {
  const decodedToken=jwt.verify(//.verify is used because the toooken stored in database is encrypted and we want to comapre it with raw token here thats why verify came and convert means decode it
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  )
  const user=await User.findById(decodedToken?._id)//we have acess to user here because in user model when we are generating refresh token where it have user id so we when decode refresh token we have user id access
  if(!user){
    throw new ApiError(401,"Invalid refresh token"); 
  }
  if(incomingRefreshToken!==user?.refreshToken){
    throw new ApiError(401,"Refresh Token is expired or used"); 
  }
  //saare verification ho gaya yaha tak then ab usko naya banake dedo
  const options={
    httpOnly:true,
    secure:true
  }
  const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",newRefreshToken,options)
  .json(
    new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},
      "Access token refreshed"
    )
  )
} catch (error) {
  throw new ApiError(401,error?.message||"Invalid refresh token");
}
})
const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
  //as user changing password means he/she is loggeddin if loggedin  auth middleware came in existent we have set req.user=user mans now we can access user 
  /*if(!(newPassword===confPassword)){this is used when we want user to enter new password twice and one change also above in object we also take cnfpassword(like this oldPassword,newPassword,cnfpassword)
    throw new ApiError(400,"new Password and confirm do not match")
  }*/
  const user=await User.findById(req.user?._id)
  const ispasswordCorrect=await user.isPasswordCorrect(oldPassword)
  if(!ispasswordCorrect){
    throw new ApiError(400,"Invalid oldPassword")
  }
  user.password=newPassword
  await user.save({validateBeforeSave:false})
  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password Changed Successfully"))
})
const getCurrentUser=asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"Current User fetched Successfully"))
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullname,email}=req.body
  if(!fullname||!email){
    throw new ApiError(400,"All feilds are  required");
  }
  const user=await User.findByIdAndUpdate(
    req.user?._id,
   {
    $set:{
      fullname,//also write as fullname:fullname
      email//also write as emial:email
    }
   },
   {new:true}
  ).select("-password")
  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})
// Now we want to add an updateFiles function where 2 middleware are needed:
// 1. Multer: This middleware is used for handling multipart/form-data, which is primarily used for uploading files.
// 2. User Logged In or Not: This middleware checks if the user is authenticated and logged in. However, for updating account details and changes, we don't need to check if the user is logged in because the update operation itself will be restricted to authenticated users only.
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
  }

  // Upload the new avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar || !avatar.url) {
      throw new ApiError(400, "Error while uploading the avatar");
  }

  // Fetch the user from the database
  const user = await User.findById(req.user?._id);
  if (!user) {
      throw new ApiError(400, "User not found");
  }

  // Check if the user has an existing avatar
  const oldAvatar = user?.avatar; // Store the old avatar URL
  if (oldAvatar) {
      // Delete the old avatar from Cloudinary
      const deleteFromCloudinary = await deletefromCloudinary(oldAvatar);
      if (!deleteFromCloudinary || deleteFromCloudinary.result !== 'ok') {
          console.error("Error while deleting the old avatar from Cloudinary");
          // Continue even if the deletion fails; the user still gets the new avatar
      }
  }

  // Update the user's avatar with the new URL
  const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set: {
              avatar: avatar.url
          }
      },
      { new: true }
  ).select("-password");

  // Send a success response with the updated user data
  return res.status(200).json(
      new ApiResponse(200, updatedUser, "Avatar image updated successfully")
  );
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Ensure that the cover image file path is present
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is missing");
  }

  // Fetch the user from the database
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  // Check if there's an existing cover image URL
  const oldCoverImageUrl = user.coverImage; // Adjust this if the old cover image is stored differently

  // Upload the new cover image to Cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  // Update the user's cover image with the new URL
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(400, "Error updating cover image in the database");
  }

  // Delete the old cover image from Cloudinary (if it exists)
  if (oldCoverImageUrl) {
    const deleteResult = await deleteImagefromCloudinary(oldCoverImageUrl);
    console.log("Delete result:", deleteResult);
    if (!deleteResult || deleteResult.result !== 'ok') {
      throw new ApiError(400, "Error while deleting old cover image");
    }
  }

  // Return a successful response with the updated user data
  return res.status(200).json(
    new ApiResponse(200, updatedUser, "Cover image updated successfully")
  );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
      throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
      {
          $match: {
              username: username?.toLowerCase()
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers"
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTo"
          }
      },
      {
          $addFields: {
              subscribersCount: {
                  $size: "$subscribers"
              },
              channelsSubscribedToCount: {
                  $size: "$subscribedTo"
              },
              isSubscribed: {
                  $cond: {
                      if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                      then: true,
                      else: false
                  }
              }
          }
      },
      {
          $project: {
              fullName: 1,
              username: 1,
              subscribersCount: 1,
              channelsSubscribedToCount: 1,
              isSubscribed: 1,
              avatar: 1,
              coverImage: 1,
              email: 1
          }
      }
  ]);

  if (!channel?.length) {
      throw new ApiError(404, "channel does not exists");
  }

  return res
      .status(200)
      .json(
          new ApiResponse(200, channel[0], "User channel fetched successfully")
      );
});

const getWatchHistory=asyncHandler(async(req,res)=>{
  const user=await User.aggregate([
    {
    $match:{
      _id:new mongoose.Types.ObjectId(req.user._id)//as we done it earlier that in agrregate function mongoose do not word thats why we are getting exported model name in plural and here id stored in mongodb databse in string but it is converted to id by mongoose as here mongoose do not word we need to explicitely convert it
    }
  },
  {
    $lookup:{
      from:"videos",
      localField:"watchHistory",
      foreignField:"_id",
      as:"watchHistory",
      pipeline:[
        {
          $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
              {
                $project:{
                  fullname:1,
                  username:1,
                  avatar:1
                }
              }
            ]
          }
        },
        {
          $addFields:{
            owner:{
              $first:"$owner"
            }
          }
        }
      ]
    }
  }
])
if (!user.length || !user[0].watchHistory) {
  throw new ApiError(404, "Watch history not found");
}
return res
.status(200)
.json(
  new ApiResponse(200,user[0].watchHistory,"Watch History Fetched SuccessFully")
)
})
export {registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
updateUserCoverImage,
getUserChannelProfile,getWatchHistory}