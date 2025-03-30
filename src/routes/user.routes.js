import {Router} from "express"  
import {loginUser , refreshAccessToken, logoutUser, registerUser, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import videoRouter from "./video.routes.js"
import subscriptionRouter from "./subscription.routes.js"

const router= Router()

router.route("/register").post(
    upload.fields([ {name:"avatar",maxCount:1} , {name:"coverImage",maxCount:1} ]),
    registerUser
)

router.route("/login").post( loginUser )
router.route("/")

// secured
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/get-current-user").get(verifyJWT,getCurrentUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/update-account-details").post(verifyJWT,updateAccountDetails)
router.route("/update-avatar").post(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-cover-image").post(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/get-user-channel-profile/:username").get(getUserChannelProfile);
router.route("/get-watch-history").post(verifyJWT,getWatchHistory)
// videos
router.use("/videos",verifyJWT,videoRouter)

// subscription
router.use("/subscriptions",verifyJWT,subscriptionRouter)

export default router