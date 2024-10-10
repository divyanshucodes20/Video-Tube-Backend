import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(toggleSubscription)){
        throw new Error(400,"Invalid channel Id");
    }
    const existingSubscription=await Subscription.findOne({
        channel:channelId,
        subscriber:req.user?._id
    })
    if(existingSubscription){
        const unsubscribeResult=await existingSubscription.deleteOne()
        if(!unsubscribeResult){
            throw new ApiError(500,"Subscription removal failed");
        }
        return res
        .status(200)
        .json(new ApiResponse(200,{},"Unsubscribed Successfully"));
    }
    else{
        const newSubscription=await Subscription.create({
            subscriber:req.user?._id,
            channel:channelId
        })
        if(!newSubscription){
            throw new ApiError(500,"Channel not subscribed");
        }
        return res
        .status(200)
        .json(new ApiResponse(200,newSubscription,"Channel Subscribed Successfully")) 
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}