import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "VideoId is invalid")
    }
    const userId=req.user._id;
   const existingLike=await Like.findOne({video:videoId,likedBy:userId})
   if(existingLike){
    await Like.findByIdAndDelete(existingLike._id)
    return res.status(200).json(new ApiResponse(200,"Video Unliked"))
   }
   else{
    await Like.create({
        video:videoId,
        likedBy:userId
    })
    return res
    .status(201)
    .json(new ApiResponse(201, "video liked sucessfully"))
   }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "unable to find comment")
    }
    //TODO: toggle like on comment
   const userId=req.user._id;
   const existingLike=await Like.findOne({comment:commentId,likedBy:userId})
   if(existingLike){
    await Like.findByIdAndDelete(existingLike._id);
    return res
            .status(200)
            .json(new ApiResponse(201, "comment disliked succesfully"))
   }
   else{
    await Like.create({
        comment:commentId,
        likedBy:userId
    })
    return res
    .status(200)
    .json(new ApiResponse(201, "comment liked succesfully"))
   }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "unable to find comment")
    }
    const userId=req.user._id;
    const existingLike=await Like.findOne({tweet:tweetId,likedBy:userId});
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res
            .status(200)
            .json(new ApiResponse(201, "tweet disliked succesfully"))
    }
    else{
        await Like.create({
            tweet:tweetId,
            likedBy:userId
        })
        return res
            .status(200)
            .json(new ApiResponse(201, "tweet liked succesfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId=req.user._id;
    const likedVideos=await Like.aggregate([
        {
            $match:{
              likedBy:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video"
            }
        },{$unwind:"$video"},
        {
            $project:{
                _id: 1,
                videoFile: 1,
                thumbnail: 1, 
                title: 1, 
                description: 1,
                duration: 1,
                views: 1, 
                isPublished: 1,
                owner:1
            }
        }
    ])
    res.status(200).json(new ApiResponse(200,likedVideos,"Liked Videos fetched SuccessFully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}