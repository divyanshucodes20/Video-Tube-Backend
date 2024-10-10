import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if([name,description].some((feild)=>feild?.trim()==="")){
      throw new ApiError(400,"All feilds are required");
    }
    const playlist=await Playlist.create({
        name,
        description,
        owner:req.user?._id
    })
    if(!playlist){
        throw new ApiError(500,"Playlist not created");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist Created Successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"User Id is invalid");  
    }
    const playlists=await Playlist.find({owner:userId});
    if(!playlists){
        throw new ApiError(400,"No playlist found");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,playlists,"Playlists fetched Successfully"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id");
    }
    const playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new Error(400,"Playlist not found");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist fetched succcessfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistId")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }
    const addedVideo=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos:videoId,
            }
        },{new:true}
    );
    if(!addedVideo){
    throw new ApiError(500,"Error while adding video");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,addedVideo,"Video added successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid playlistId or videoId")
    }
    const playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"No playlist found")
    }
    if(!playlist.videos.includes(videoId)){
        throw new ApiError(404,"Video not found in playlist")
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"You are not allowed to remove video from this playlist")
    }
    playlist.videos.pull(videoId);
    const checkSaved=await playlist.save();
    if(!checkSaved){
        throw new ApiError(500,"Failed to remove video from playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Video removed from playlist"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId){
        throw new ApiError(400,"Invalid playlist id");
    }
    const playlist=await Playlist.findById(playlistId);
    if(!playlist.owner.equals(req.user?._id)){
        throw new Error("You are not allow to delete another user playlist");
    }
    const deleteResult=await Playlist.findByIdAndDelete(playlistId);
    if(!deleteResult){
        throw new ApiError(500,"Fail to delete playlist");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,"Playlist deleted successfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlistID")
    }
    const {name, description} = req.body
    //TODO: update playlist
    if(!name||!description){
     throw new Error(400,"All feilds are required");
    }
    const playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,"Playlist not found");
    }
    if(!playlist.owner.equals(req.user?._id)){
        throw new ApiError(400,"You are not authorize to update this playlist");
    }
    playlist.description=description;
    playlist.name=name;
    const checkUpdation=await playlist.save();
    if(!checkUpdation){
        throw new ApiError(500,"Video not updated");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist updated successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}