import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,videoFile,thumbnail} = req.body
    if ([title,description,videoFile,thumbnail].some((feild)=>
        feild?.trim()==="")
     ){
         throw new ApiError(400,"All feilds are required")
        }
    const uploadVideo=await uploadOnCloudinary(videoFile);
    if(!uploadVideo.url){
        throw new ApiError(500,"Video File Not Uploaded");
    }
    const pic=await uploadOnCloudinary(thumbnail);
    if(!pic.url){
        throw new ApiError(500,"Thumbnail not uploaded");
    }
    const video=await Video.create({
        owner:req.user?._id,
        title,
        description,
        thumbnail:pic.url,
        videoFile:uploadVideo.url,
        duration:updateVideo.duration,
    })
    return res.status(200).json(new ApiResponse(201, video, "video uploaded sucessfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}