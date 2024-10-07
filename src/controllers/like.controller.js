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
    await Like.findByIdAndDelete(existinglike._id)
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
   const existingLike=await Comment.findOne({comment:commentId,likedBy:userId})
   if(existingLike){
    await Comment.findByIdAndDelete(existingLike._id);
    return res
            .status(200)
            .json(new ApiResponse(201, "comment disliked succesfully"))
   }
   else{
    await Like.create({
        comment:commendId,
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
    const existingLike=Tweet.findOne({tweet:tweetId,likedBy:userId});
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res
            .status(200)
            .json(new ApiResponse(201, "comment disliked succesfully"))
    }
    else{
        await Like.create({
            tweet:tweetId,
            likedBy:userId
        })
        return res
            .status(200)
            .json(new ApiResponse(201, "comment liked succesfully"))
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
                _id: "$video._id", // Video ID
                videoFile: "$video.videoFile", // Include the video file path
                thumbnail: "$video.thumbnail", // Include the thumbnail
                title: "$video.title", // Include the title
                description: "$video.description", // Include the description
                duration: "$video.duration", // Include the duration
                views: "$video.views", // Include views count
                isPublished: "$video.isPublished", // Include publication status
                owner: "$video.owner", // Include owner ID
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