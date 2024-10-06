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
    // TODO: add a comment to a video
    const {content}=req.body;
    const {videoId}=req.params;
    const user=await User.findById(req?.user._id)
    if(!videoId) {
        throw new ApiError(500, "video id is required")
    }

    if(!content) {
        throw new ApiError(401, "please add the comment")
    }
    const newComment=await Comment.create({
        content,
        video:videoId,
        owner:user
    })
   if(!newComment){
    throw new ApiError(401,"Comment creation failed");
   }
   return res
   .status(200)
   .json(new ApiResponse(201,newComment,"Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {comment}=req.body;
    if(!comment) {
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
   .json(new ApiResponse(201,"comment added successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params;
    const comment=await findByIdAndDelete(commentId);
    if(!comment){
        throw new Error(401,"Comment not deleted");
    }
    return res
    .status(200)
    .json(new ApiResponse(201,"Comment added successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }