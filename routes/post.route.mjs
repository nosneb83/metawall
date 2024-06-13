import express from "express";
import postController from "../controllers/post.controller.mjs";
import { isAuth } from "../services/auth.mjs";

const router = express.Router();

router
  .route("/")
  .get(isAuth, postController.getAllPosts)
  .post(isAuth, postController.post);
router.get("/:id", isAuth, postController.getPostById);
router.post("/:id/like", isAuth, postController.like);
router.delete("/:id/unlike", isAuth, postController.unlike);
router.post("/:id/comment", isAuth, postController.comment);

export default router;
