import dotenv from "dotenv";
import mongoose from "mongoose";
// import express from "express";
import {DB_NAME} from "./constants.js";
import connectDB from "./db/index.js";
import app from "./app.js";


dotenv.config({path:'./.env'});
// const app=express();

connectDB()
.then(()=>{
    const server= app.listen(process.env.PORT,()=>{
        console.log("Server is running on port",server.address().port);
    })
})
.catch((error)=>{
    console.error("Error",error);
})


// "You are NOT an NPC. You are NOT just a player waiting for better circumstances. You are the main character of your story, and you can take action now. Stop waiting for money to change your life. Change your mindset, and money will follow. Stop believing that people can’t connect across social levels. The strongest bonds come from shared values, not bank balances. The sooner you free yourself from these illusions, the sooner you’ll actually start living."


// ( async ()=>{ 
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//         app.on("Error",(error)=>{
//             console.error("Error",error);
//             throw error;
//         })

//         app.listen(process.env.PORT,()=>console.log("Server is running on port",process.env.PORT));
//     }catch(error){
//         console.error("Error",error);
//         throw error;
//     }
// })()