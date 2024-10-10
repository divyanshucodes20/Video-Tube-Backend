import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deletefromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { populate } from "dotenv"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    const matchStage = {};

    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }

    if (userId) {
        matchStage.owner = mongoose.Types.ObjectId(userId); // Ensure userId is an ObjectId
    }

    const sortStage = {
        [sortBy]: sortType === 'desc' ? -1 : 1
    };

    // Aggregation pipeline
    const aggregatePipeline = [
        { $match: matchStage },
        { $sort: sortStage },
        {
            $lookup: {
                from: 'users', // Collection name in MongoDB
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        },
        { $unwind: '$owner' },
        { $project: { 
            'owner.email': 0, 
            'owner.password': 0, 
            'owner.watchHistory': 0, 
            'owner.createdAt': 0, 
            'owner.updatedAt': 0, 
            'owner.refreshToken': 0,
            'owner.coverImage': 0
        }}
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const videos = await Video.aggregatePaginate(Video.aggregate(aggregatePipeline), options);

    res.json(videos);
});



const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const videoFile = req.files['videoFile'] ? req.files['videoFile'][0].path : null;
    const thumbnail = req.files['thumbnail'] ? req.files['thumbnail'][0].path : null;
    if ([title,description,videoFile,thumbnail].some((feild)=>
        feild?.trim()==="")
     ){
         throw new ApiError(400,"All feilds are required")
        }
    const uploadVideo=await uploadOnCloudinary(videoFile);
    if (!uploadVideo || !uploadVideo.url) {
        throw new ApiError(500, "Video File Not Uploaded");
    }

    // Upload the thumbnail
    const uploadThumbnail = await uploadOnCloudinary(thumbnail);
    if (!uploadThumbnail || !uploadThumbnail.url) {
        throw new ApiError(500, "Thumbnail Not Uploaded");
    }
    const videoDuration = await uploadVideo.duration;
    const video=await Video.create({
        owner:req.user?._id,
        title,
        description,
        thumbnail:uploadThumbnail.url,
        videoFile:uploadVideo.url,
        duration:videoDuration,
        isPublished:true
    })
    return res.status(200).json(new ApiResponse(201, video, "video uploaded sucessfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video  not found");
    }
    return res.status(200)
    .json(new ApiResponse(201,video,"Video fetched successfully"));
})
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new ApiError(400, "Invalid title");
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
        throw new ApiError(400, "Invalid description");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const oldVideo = await Video.findById(videoId);
    if (!oldVideo) {
        throw new ApiError(404, "Video not found");
    }

    const oldThumbnailUrl = oldVideo.thumbnail;
    if (!oldThumbnailUrl || typeof oldThumbnailUrl !== 'string') {
        throw new ApiError(404, "Old thumbnail URL not found");
    }

    const thumbnailOnCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailOnCloudinary || !thumbnailOnCloudinary.url) {
        throw new ApiError(500, "Thumbnail not uploaded");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            title,
            description,
            thumbnail: thumbnailOnCloudinary.url,
            owner: req.user?._id,
        },
        { new: true }
    );

    if (!video) {
        throw new ApiError(500, "Video not updating");
    }

    const deleteResult = await deletefromCloudinary(oldThumbnailUrl);
    if (!deleteResult || deleteResult.result !== "ok") {
        throw new ApiError(500, "Not deleting from Cloudinary");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video=await Video.findById(videoId);
    const videoUrl=await video.videoFile;
    const thumbnailUrl=await video.thumbnail;
    if(!video||!videoUrl){
        throw new ApiError(400,"No video found");
    }
    if(!thumbnailUrl){
        throw new ApiError(400,"Thumbnail not found"); 
    }
    const deleteResult=await deletefromCloudinary(videoUrl);
    const deleteThumbnail=await deletefromCloudinary(thumbnailUrl);
    if(!deleteResult||deleteResult.result!=="ok"){
        console.error("error while deleting video from clodinary");
    }
    if(!deleteThumbnail||deleteThumbnail.result!=="ok"){
        console.error("error while deleting thumbnail from clodinary");
    }
    const deleteVideo=await Video.deleteOne({_id:videoId});
    if(!deleteVideo){
        throw new ApiError(400,"Video not deleted");
    }
    return res.status(200)
    .json(new ApiResponse(200,"","Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Retrieve the current video document
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Toggle the isPublished status
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(400, "Publish status not updated");
    }

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Publish status toggled"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}