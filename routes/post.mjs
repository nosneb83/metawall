import { Router } from "express";
const router = Router();
import finalhandler from "finalhandler";

import Post from "../models/post.mjs";
import onSuccess from "../services/onSuccess.mjs";
import onError from "../services/onError.mjs";
import auth from "../services/auth.mjs";
const { isAuth, generateSendJWT } = auth;

// 取得所有貼文
router.get("/", isAuth, async function (req, res, next) {
  const q =
    req.query.q !== undefined ? { content: new RegExp(req.query.q) } : {};
  const timeSort = req.query.timeSort === "asc" ? "createdAt" : "-createdAt";
  const posts = await Post.find(q).sort(timeSort);
  res.json(posts);
});

// 新增貼文
router.post("/", isAuth, async function (req, res, next) {
  try {
    const data = req.body;
    const invalidKeys = findInvalidBodyKeys(data);
    if (invalidKeys.length) {
      throw new Error(`Invalid key(s): ${invalidKeys.join(", ")}`);
    }
    const newPost = await Post.create({
      name: data.name?.trim() ?? "",
      content: data.content?.trim() ?? "",
    });
    onSuccess(res, newPost);
  } catch (err) {
    onError(res, err);
  }
});

// 修改貼文
router.patch("/:id", isAuth, async function (req, res, next) {
  try {
    const data = req.body;
    const invalidKeys = findInvalidBodyKeys(data);
    if (invalidKeys.length) {
      throw new Error(`Invalid key(s): ${invalidKeys.join(", ")}`);
    }
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        name: data.name?.trim() ?? "",
        content: data.content?.trim() ?? "",
      },
      {
        new: true,
        runValidators: true,
      }
    ).orFail();
    onSuccess(res, updatedPost);
  } catch (err) {
    onError(res, err);
  }
});

// 刪除貼文
router.delete("/", isAuth, async function (req, res, next) {
  if (req.originalUrl === "/posts") {
    try {
      await Post.deleteMany();
      onSuccess(res);
    } catch (err) {
      onError(res, err);
    }
  } else {
    finalhandler(req, res)();
  }
});

// 刪除特定貼文
router.delete("/:id", isAuth, async function (req, res, next) {
  try {
    await Post.findByIdAndDelete(req.params.id).orFail();
    onSuccess(res);
  } catch (err) {
    onError(res, err);
  }
});

function findInvalidBodyKeys(body) {
  const bodyKeys = Object.keys(body);
  const schemaKeys = Object.keys(Post.schema.obj);
  return bodyKeys.filter((key) => !schemaKeys.includes(key));
}

export default router;
