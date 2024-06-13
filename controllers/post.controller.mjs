import status from "http-status";
import Comment from "../models/comment.model.mjs";
import Post from "../models/post.model.mjs";
import ApiError from "../utils/ApiError.mjs";
import catchAsync from "../utils/catchAsync.mjs";

const controller = {};

// 取得所有貼文
controller.getAllPosts = catchAsync(async (req, res) => {
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
});

// 取得特定貼文
controller.getPostById = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate({
      path: "user",
      select: "name photo",
    })
    .populate({
      path: "comments",
      select: "user content",
    })
    .orFail(new ApiError(status.BAD_REQUEST, "找不到該貼文"));

  res.json(post);
});

// 新增貼文
controller.post = catchAsync(async (req, res) => {
  const data = req.body;

  data.content = data.content?.trim();
  if (!data.content) {
    throw new ApiError(status.BAD_REQUEST, "你沒有填寫 content 資料");
  }
  data.image = data.image?.trim();

  const newPost = await Post.create({
    user: req.user.id,
    content: data.content,
    image: data.image,
  });

  res.status(status.CREATED).json({
    status: "success",
    newPost,
  });
});

// 按讚
controller.like = catchAsync(async (req, res) => {
  const _id = req.params.id;
  await Post.findOneAndUpdate({ _id }, { $addToSet: { likes: req.user.id } });
  res.json({ status: "success" });
});

// 收回讚
controller.unlike = catchAsync(async (req, res) => {
  const _id = req.params.id;
  await Post.findOneAndUpdate({ _id }, { $pull: { likes: req.user.id } });
  res.json({ status: "success" });
});

// 新增留言
controller.comment = catchAsync(async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  const newComment = await Comment.create({
    post: postId,
    user: req.user.id,
    content,
  });
  res.status(status.CREATED).json({
    status: "success",
    newComment,
  });
});

export default controller;
