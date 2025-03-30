import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudniary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"

const generateAccessAnsRefreshTokens = async function(userId){
    try{
        const user = await User.findById(userId)
        const accessToken= user.generateAccessToken();
        const refreshToken= user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken,refreshToken}
    }catch(err){
        throw new ApiError(500,err.message)
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const {fullname , email, username , password }= req.body;
    if([fullname,email,username].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"fullname/email/username/password is required")
    }
    
    if(password===""){
        throw new ApiError(400,"Password is required")
    }

    const existedUser=await User.findOne({$or:[{username},{email}]})
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists in usercontroller")
    }
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    // if(!avatarLocalPath){
    //     throw new ApiError(400,"Avatar file is required")
    // }
    let avatar;
    if(avatarLocalPath){
        avatar = await uploadCloudinary(avatarLocalPath,"image")
    }
    let coverImage;
    if(coverImageLocalPath){
        coverImage = await uploadCloudinary(coverImageLocalPath,"image")
    }

    // if(!avatar){
    //     throw new ApiError(400,"Avatar file is required")
    // }

    const user = await User.create({
        fullname:fullname,
        avatar:avatar?.url||"",
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"Something went wrong creating the user and we dont know what")
    }

    return res.status(201).json(new ApiResponse(200,createdUser,"User registered successfully in usercontroller"))

})


const loginUser = asyncHandler(async (req, res) => {
    const {email,username,password}=req.body;
    if(!username && !email){
        throw new ApiError(400,"Email or username is required in usercontroller")
    }

    const user= await User.findOne({$or:[{username},{email}]})

    if(!user){
        throw new ApiError(404,"User not exists in the database")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid password , comeon man what you doing!")
    }

    const {accessToken,refreshToken} = await generateAccessAnsRefreshTokens(user._id)
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options).json(new ApiResponse(200,{user,refreshToken,accessToken},"User logged in successfully"))

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshToken: 1
        }
    },{
        new:true
    })

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options).json(new ApiResponse(200,null,"User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorised Request no refresh token in usercontroller")
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
    )
    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"Invalid refresh token in usercontroller")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is used or expired in usercontroller")
    }

    const options={
        httpOnly:true,
        secure:true,
    }

    const {accessToken, newRefreshToken} = await generateAccessAnsRefreshTokens(user._id)

    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options).json(new ApiResponse(200,{accessToken,newRefreshToken},"Access token refreshed successfully"))

})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user._id)
    const isPasswordCorrect  = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Old password is incorrect")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,user,"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"User found successfully"))
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullname , email}= req.body;
    if(!fullname && !email){
        throw new ApiError(400,"Fullname or email is required")
    }

    const existingUser = await User.findOne({
        email:email
    })

    console.log(existingUser);
    if(existingUser){
        throw new ApiError(400,"Email already in use by another user")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            fullname:fullname||req.user.fullname,
            email: email||req.user.email
        }
    },{
        new:true
    }).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){    
        throw new ApiError(400,"Avatar is required")
    }

    const avatar = await uploadCloudinary(avatarLocalPath,"image");
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            avatar:avatar.url
        }
    },{
        new:true
    }).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){    
        throw new ApiError(400,"Cover Image is required")
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath,"image");
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(req.user._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{
        new:true
    }).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    console.log(username);
    if(!(username)){
        throw new ApiError(400,"username is missing")
    }
    const channel = await User.aggregate([{
        $match:{
            username:username?.toLowerCase()
        }
    },{
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers",
        }
    },{
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo",
        }
    },{
        $addFields:{
            subscribersCount:{$size:"$subscribers"},
            subscribedToCount:{$size:"$subscribedTo"},
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false,
                }
            }
        }
    },{
        $project:{
            fullname:1,
            username:1,
            subscribersCount:1,
            subscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            // email:0,
            _id:0
        }
    }])

    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    }

    return res.status(200).json(new ApiResponse(200,channel[0],"Channel found successfully"))

})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                        _id: 0
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


export {loginUser , getWatchHistory , getUserChannelProfile , updateAccountDetails ,updateUserAvatar, updateUserCoverImage , getCurrentUser , changeCurrentPassword , refreshAccessToken , logoutUser, registerUser}