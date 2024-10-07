import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const {channelId}=req.user?._id; 
        const totalVideoViews = await Video.aggregate([
            { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);

        // Get total subscribers
        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

        // Get total videos
        const totalVideos = await Video.countDocuments({ channel: channelId });

        // Get total likes on videos
        const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ channel: channelId }).distinct('_id') } });

        // Prepare response
        const channelStats = {
            totalVideoViews: totalVideoViews.length > 0 ? totalVideoViews[0].totalViews : 0,
            totalSubscribers: totalSubscribers,
            totalVideos: totalVideos,
            totalLikes: totalLikes
        };

        // Send response
        return res.status(200).json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelId}=req.user?._id;
    const videos=await Video.find({channel:channelId});
    return res
    .status(200)
    .json(new ApiResponse(200,videos,"Channel Videos Fetched SuccessFully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }