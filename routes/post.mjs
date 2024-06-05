import { Router } from "express";
const router = Router();
import finalhandler from "finalhandler";

import Post from "../models/post.mjs";
import onSuccess from "../services/onSuccess.mjs";
import onError from "../services/onError.mjs";
import auth from "../services/auth.mjs";
const { isAuth } = auth;

// 取得所有貼文
router.get("/", isAuth, async function (req, res) {
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
});

// 新增貼文
router.post("/", isAuth, async function (req, res) {
  try {
    const data = req.body;
    const invalidKeys = findInvalidBodyKeys(data);
    if (invalidKeys.length) {
      throw new Error(`Invalid key(s): ${invalidKeys.join(", ")}`);
    }

    data.content = data.content?.trim();
    if (!data.content) {
      throw new Error("Content 未填寫");
    }
    data.image = data.image?.trim();

    const newPost = await Post.create({
      user: req.user.id,
      content: data.content,
      image: data.image,
    });
    onSuccess(res, newPost);
  } catch (err) {
    onError(res, err);
  }
});

// 修改貼文
router.patch("/:id", isAuth, async function (req, res) {
  try {
    const data = req.body;
    const invalidKeys = findInvalidBodyKeys(data);
    if (invalidKeys.length) {
      throw new Error(`Invalid key(s): ${invalidKeys.join(", ")}`);
    }

    data.content = data.content?.trim();
    if (!data.content) {
      throw new Error("Content 未填寫");
    }
    data.image = data.image?.trim();

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        content: data.content,
        image: data.image,
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
router.delete("/", isAuth, async function (req, res) {
  if (req.originalUrl === "/post") {
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
router.delete("/:id", isAuth, async function (req, res) {
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
