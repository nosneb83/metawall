import status from "http-status";
import Comment from "../models/comment.model.mjs";
import Post from "../models/post.model.mjs";
import ApiError from "../utils/ApiError.mjs";
import catchAsync from "../utils/catchAsync.mjs";

const controller = {};

// 取得所有貼文
controller.getAllPosts = catchAsync(async (req, res) => {
  // 搜尋條件及排序
  const q =
    req.query.q !== undefined ? { content: new RegExp(req.query.q) } : {};
  const timeSort = req.query.timeSort === "asc" ? "createdAt" : "-createdAt";

  // 取得貼文
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

  res.json({
    status: "success",
    posts: posts,
  });
});

// 取得特定貼文
controller.getPostById = catchAsync(async (req, res) => {
  // 取得貼文
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

  res.json({
    status: "success",
    post: post,
  });
});

// 新增貼文
controller.post = catchAsync(async (req, res) => {
  const content = req.body.content?.trim();
  const image = req.body.image?.trim();

  // 檢查必填內容是否為空
  if (!content) {
    throw new ApiError(status.BAD_REQUEST, "請填寫貼文內容");
  }

  // 新增貼文
  const newPost = await Post.create({
    user: req.user.id,
    content: content,
    image: image,
  });

  res.status(status.CREATED).json({
    status: "success",
    newPost: newPost,
  });
});

// 按讚
controller.like = catchAsync(async (req, res) => {
  // 檢查貼文是否存在
  const post = await Post.findById(req.params.id).orFail(
    new ApiError(status.BAD_REQUEST, "找不到該貼文")
  );

  // 檢查是否已按讚
  if (post.likes.includes(req.user.id)) {
    throw new ApiError(status.BAD_REQUEST, "您已經按過讚了");
  }

  // 新增按讚
  post.likes.push(req.user.id);
  await post.save();

  res.json({
    status: "success",
    message: "您已成功按讚",
  });
});

// 收回讚
controller.unlike = catchAsync(async (req, res) => {
  // 檢查貼文是否存在
  const post = await Post.findById(req.params.id).orFail(
    new ApiError(status.BAD_REQUEST, "找不到該貼文")
  );

  // 檢查是否已按讚
  if (!post.likes.includes(req.user.id)) {
    throw new ApiError(status.BAD_REQUEST, "您尚未按過讚");
  }

  // 移除按讚
  post.likes = post.likes.filter((like) => like.toString() !== req.user.id);
  await post.save();

  res.json({
    status: "success",
    message: "您已成功收回讚",
  });
});

// 新增留言
controller.comment = catchAsync(async (req, res) => {
  const content = req.body.content?.trim();

  // 檢查必填內容是否為空
  if (!content) {
    throw new ApiError(status.BAD_REQUEST, "請填寫留言內容");
  }

  // 檢查貼文是否存在
  await Post.findById(req.params.id).orFail(
    new ApiError(status.BAD_REQUEST, "找不到該貼文")
  );

  // 新增留言
  const newComment = await Comment.create({
    post: req.params.id,
    user: req.user.id,
    content: content,
  });

  res.status(status.CREATED).json({
    status: "success",
    newComment: newComment,
  });
});

export default controller;
