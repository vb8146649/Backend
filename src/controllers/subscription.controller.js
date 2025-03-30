import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";


const subscribe = asyncHandler(async(req,res)=>{
    const username = req.params.username;
    console.log(username);
    const channel = await User.findOne({username:username?.toLowerCase()});
    if(!channel){
        throw new ApiError(404,"Channel not found");
    }

    const subscriber = req.user?._id;
    if(!subscriber){
        throw new ApiError(401,"User is empty in auth middleware");
    }

    const subscriberExists = await User.findById(subscriber);
    if(!subscriberExists){
        throw new ApiError(404,"Subscriber not found");
    }

    if(subscriberExists._id.equals(channel._id)){
        throw new ApiError(400,"You cannot subscribe to yourself");
    }

    const subscription=await Subscription.create({
        subscriber,
        channel
    });

    res.status(200).json(new ApiResponse({
        message:"Subscribed successfully",
        success:true,
        data:subscription
    }))
});

const unSubscribe=asyncHandler(async(req,res)=>{
    const username = req.params.username;
    const channel = await User.findOne({username:username?.toLowerCase()});
    if(!channel){
        throw new ApiError(404,"Channel not found");
    }
    console.log(username);

    const subscriber = req.user?._id;
    if(!subscriber){
        throw new ApiError(401,"User is empty in auth middleware");
    }

    const subscriberExists = await User.findById(subscriber);
    if(!subscriberExists){
        throw new ApiError(404,"Subscriber not found");
    }

    await Subscription.findOneAndDelete({
        subscriber,
        channel
    });

    res.status(200).json(new ApiResponse({
        message:"Unsubscribed successfully",
        success:true,
    }))
})

export {unSubscribe,subscribe}