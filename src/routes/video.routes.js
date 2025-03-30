import {Router} from "express"  
import {upload} from "../middlewares/multer.middleware.js"
import { uploadVideo , deleteVideo , updateVideo } from "../controllers/video.controller.js"
const router= Router()

router.route("/upload-video").post(
    upload.fields([ {name:"videoFile",maxCount:1} , {name:"thumbnail",maxCount:1} ]),
    uploadVideo
)


router.route("/delete-video/:id").delete(deleteVideo)

router.route("/update-video/:id").put(updateVideo)


export default router;