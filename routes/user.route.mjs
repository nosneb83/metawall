import express from "express";
import userController from "../controllers/user.controller.mjs";
import { isAuth } from "../services/auth.mjs";

const router = express.Router();

router.post("/sign-up", userController.signUp);
router.post("/sign-in", userController.signIn);
router.patch("/change-password", isAuth, userController.changePassword);
router.get("/profile", isAuth, userController.getProfile);
router.patch("/profile", isAuth, userController.updateProfile);
router.post("/:id/follow", isAuth, userController.follow);
router.delete("/:id/unfollow", isAuth, userController.unfollow);
router.get("/likes", isAuth, userController.getLikeList);
router.get("/following", isAuth, userController.getFollowingList);
router.get(`/:id/posts`, isAuth, userController.getUserPosts);

export default router;
