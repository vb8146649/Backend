import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import {DB_NAME} from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({path:'./env'});

connectDB();

// const app=express();
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