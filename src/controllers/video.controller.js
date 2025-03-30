import { uploadCloudinary } from "../utils/cloudniary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const uploadVideo = asyncHandler(async(req,res)=>{
    const {title,description} = req.body;
    if (!title || title.trim() === "") {
        throw new ApiError(400, "Title is required");
    }
    // console.log(req.files);
    const videoFile=req.files?.videoFile?.[0]?.path;
    const thumbnail=req.files?.thumbnail?.[0]?.path;
    const owner = req.user?._id;
    if(!owner){
        throw new ApiError(401,"User is empty in auth middleware");
    }
    
    if(!videoFile){
        throw new ApiError(400,"Video file is required");
    }
    
    const videoUpload = await uploadCloudinary(videoFile,"video");
    if(!(videoUpload)){
        throw new ApiError(400,"Error while uploading video in cloudinary is required");
    }

    if(!thumbnail){
        throw new ApiError(400,"Thumbnail is required");
    }

    const thumbnailUpload = await uploadCloudinary(thumbnail,"image");
    if(!(thumbnailUpload)){
        throw new ApiError(400,"Error while uploading thumbnail in cloudinary is required");
    }

    const video = await Video.create({
        videoFile:videoUpload.url,
        thumbnail:thumbnailUpload.url,
        title,
        description,
        duration:videoUpload.duration,
        owner
    });

    return res.status(200).json(new ApiResponse({
        message:"Video uploaded successfully",
        success:true,
        data:video
    }))
})

const updateVideo = asyncHandler(async(req,res)=>{
    const {title,description} = req.body;
    const videoId = req.params.id;
    console.log(videoId);
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }

    if(!video.owner.equals(req.user?._id)){
        throw new ApiError(403,"You are not authorized to update this video");
    }

    video.title = title || video.title;
    video.description = description || video.description;
    await video.save();

    return res.status(200).json(new ApiResponse({
        message:"Video updated successfully",
        success:true,
        data:video
    }))
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const videoId = req.params.id;
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }

    if(!video.owner.equals(req.user?._id)){
        throw new ApiError(403,"You are not authorized to delete this video");
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse({
        message:"Video deleted successfully",
        success:true,
    }))
})

export {uploadVideo , updateVideo , deleteVideo}