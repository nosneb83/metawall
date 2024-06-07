import { Router } from "express";
const router = Router();

import Comment from "../models/comment.mjs";
import Post from "../models/post.mjs";
import auth from "../services/auth.mjs";
const { isAuth } = auth;
import ApiError from "../utils/ApiError.mjs";
import catchAsync from "../utils/catchAsync.mjs";
import checkInvalidKeys from "../utils/checkInvalidKeys.mjs";

// 取得所有貼文
router.get(
  "/",
  isAuth,
  catchAsync(async function (req, res) {
    const q =
      req.query.q !== undefined ? { content: new RegExp(req.query.q) } : {};
    const timeSort = req.query.timeSort === "asc" ? "createdAt" : "-createdAt";
    const posts = await Post.find(q)
      .populate({
        path: "user",
        select: "name photo",
      })
      .populate({
        path: "comments",
        select: "user content",
      })
      .sort(timeSort);

    res.json(posts);
  })
);

// 取得特定貼文
router.get(
  "/:id",
  isAuth,
  catchAsync(async function (req, res) {
    const post = await Post.findById(req.params.id)
      .populate({
        path: "user",
        select: "name photo",
      })
      .populate({
        path: "comments",
        select: "user content",
      })
      .orFail(new ApiError(400, "找不到該貼文"));

    res.json(post);
  })
);

// 新增貼文
router.post(
  "/",
  isAuth,
  catchAsync(async function (req, res) {
    const data = req.body;
    checkInvalidKeys(data, Post);

    data.content = data.content?.trim();
    if (!data.content) {
      throw new ApiError(400, "你沒有填寫 content 資料");
    }
    data.image = data.image?.trim();

    const newPost = await Post.create({
      user: req.user.id,
      content: data.content,
      image: data.image,
    });

    res.status(201).json({
      status: "success",
      newPost,
    });
  })
);

// 按讚
router.post(
  "/:id/like",
  isAuth,
  catchAsync(async function (req, res) {
    const _id = req.params.id;
    await Post.findOneAndUpdate({ _id }, { $addToSet: { likes: req.user.id } });
    res.json({ status: "success" });
  })
);

// 收回讚
router.delete(
  "/:id/unlike",
  isAuth,
  catchAsync(async (req, res) => {
    const _id = req.params.id;
    await Post.findOneAndUpdate({ _id }, { $pull: { likes: req.user.id } });
    res.json({ status: "success" });
  })
);

// 新增留言
router.post(
  "/:id/comment",
  isAuth,
  catchAsync(async (req, res) => {
    const postID = req.params.id;
    const { content } = req.body;
    const newComment = await Comment.create({
      post: postID,
      user: req.user.id,
      content,
    });
    res.status(201).json({
      status: "success",
      newComment,
    });
  })
);

export default router;
