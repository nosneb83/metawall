import express from "express";
const router = express.Router();
import finalhandler from "finalhandler";

import Post from "../models/Post.mjs";
import onSuccess from "../utils/onSuccess.mjs";
import onError from "../utils/onError.mjs";

router.get("/", async function (req, res, next) {
  const posts = await Post.find();
  onSuccess(res, posts);
});

router.post("/", async function (req, res, next) {
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

router.patch("/:id", async function (req, res, next) {
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

router.delete("/", async function (req, res, next) {
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

router.delete("/:id", async function (req, res, next) {
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
