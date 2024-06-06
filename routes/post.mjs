import { Router } from "express";
const router = Router();

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
      .sort(timeSort);

    res.json(posts);
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

    res.json({
      status: "success",
      newPost,
    });
  })
);

export default router;
