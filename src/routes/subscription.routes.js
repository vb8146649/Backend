import {Router} from "express"  
import { subscribe , unSubscribe } from "../controllers/subscription.controller.js"


const router= Router()

router.route("/subscribe/:username").post(subscribe)
router.route("/unsubscribe/:username").post(unSubscribe)

export default router;
