import { Router } from "express";
import {
  avatarUpdate,
  changeCurrentPassword,
  coverUpdate,
  getCurrentUser,
  getUserChannelProfile,
  getWatchedHistory,
  loginUser,
  logoutUser,
  registerUser,
  updateAccountDetails,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAcessToken } from "../controllers/user.controllers.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAcessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/update-Account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),avatarUpdate)

router
.route("/cover-image")
.patch(verifyJWT,upload.single("coverImage"),coverUpdate)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchedHistory)
export default router;
