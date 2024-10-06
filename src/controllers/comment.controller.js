import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    if(!videoId) {
        throw new ApiError(500, "video id is required")
    }
    const {page = 1, limit = 10} = req.query
    const comments = await Comment.find({ videoId })
    .skip((page - 1) * limit)
    .limit(limit);
    if(!comments){
        throw new ApiError(401,"Comment not added something went wrong");   
    }
    return res.status(200).json(new ApiResponse(200,comments,"Video Comments fetched successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }
    if (!content) {
        throw new ApiError(401, "Please add the comment");
    }
    const user = await User.findById(req.user._id).select("username fullname avatar");
    if (!user) {
        throw new ApiError(401, "User not found");
    }
    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: user._id
    });
    const commentWithOwner=await Comment.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(newComment._id)
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
        {$unwind:"$owner"},
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
    if (!newComment) {
        throw new ApiError(401, "Comment creation failed");
    }

    return res.status(201).json(new ApiResponse(201, commentWithOwner[0], "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {content}=req.body;
    if(!content) {
        throw new ApiError(401, "Comment not found")
    }
    const {commentId}=req.params;
    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content
            }
        },{new:true}
    );
   if(!updatedComment){
    throw new ApiError(401,"Comment not updated");
   }
   return res
   .status(200)
   .json(new ApiResponse(200,updatedComment,"comment added successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params;
    const comment=await Comment.findByIdAndDelete(commentId);
    if(!comment){
        throw new Error(401,"Comment not deleted");
    }
    return res
    .status(200)
    .json(new ApiResponse(201,"Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }