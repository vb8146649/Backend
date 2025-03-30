// const asyncHandler =(func)=>{
//     return (req,res,next)=>{
//         Promise.resolve(func(req,res,next)).catch((err)=>next(err));
//     }
// }

const asyncHandler = (fn)=>{
    return async (req,res,next)=>{
        try{
            await fn(req,res,next);
        }catch(err){
            
            res.status(((err.code<600 && err.code>=100) && err.code) || 500).json({message:err.message , success:false});
        }
    }
}

export {asyncHandler}