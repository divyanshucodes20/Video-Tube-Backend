import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const user=await User.findById(req?.user._id).select("username,fullnanme,avatar");
    const {content}=req.body;
    if(!content){
        throw new ApiError(401,"Content of tweet not found");
    }
    const tweet=await Tweet.create({
        content,
        owner:user._id
    });
    if(!tweet){
        throw new ApiError(401,"Something went wrong while creating tweet");
    }
    const tweetWithUser=await Tweet.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(tweet._id)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $project:{
                content:1,
                video:1,
                owner:{
                    _id:1,
                    username:1,
                    fullname:1,
                    avatar:1
                },
                createdAt:1,
                updatedAt:1
            }
        }
    ]);
    if(!tweetWithUser){
        throw new ApiError(401,"tweet not created");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,tweetWithUser[0],"Tweet created successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {page=1,limit=15}=req.query;
    const {userId}=req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid videoid");  
    }
    if(!userId){
        throw new ApiError(500,"User Id is invalid");
    }
    const tweets=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"user"
            }
        },
        {$unwind:"$user"},
        {
            $project:{
                content:1,
                createdAt:1,
                updatedAt:1,
                user:{
                    _id:1,
                    username:1,
                    fullname:1,
                    avatar:1
                }
            }
        },{$skip:(page-1)*limit},{$limit:limit}
    ]);
    if(!tweets||tweets.length===0){
        throw new ApiError(401,"Tweets not found");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,tweets,"User tweets fetched successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetid");
    }
    if(!tweetId){
        throw new ApiError(500,"Tweet id not found");
    }
    const {content}=req.body;
    if(!content){
        throw new ApiError(401,"New tweet content not found");
    }
    const tweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
        $set:{
            content
            }
        },{new:true}
);
if(!tweet){
    throw new ApiError(401,"Tweet not updated");
}
return res
.status(200)
.json(new ApiResponse(200,tweet,"Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id");
    }
    if(!tweetId){
        throw new ApiError(500,"Tweet id not found");
    }
    const tweet=await Tweet.findByIdAndDelete(tweetId);
    if(!tweet){
        throw new Error(400,"Tweet not found  in database or error in tweet updation");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,"Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}