import status from "http-status";
import bcrypt from "bcryptjs";
import validator from "validator";
import Post from "../models/post.model.mjs";
import User from "../models/user.model.mjs";
import { generateSendJWT } from "../services/auth.mjs";
import ApiError from "../utils/ApiError.mjs";
import catchAsync from "../utils/catchAsync.mjs";

const controller = {};
const saltLength = 12;

// 註冊
controller.signUp = catchAsync(async (req, res) => {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();
  const confirmPassword = req.body.confirmPassword?.trim();
  const name = req.body.name?.trim();
  const photo = req.body.photo?.trim();

  // 檢查必填內容是否為空
  if (!email) {
    throw new ApiError(status.BAD_REQUEST, "請填寫 Email");
  }
  if (!password) {
    throw new ApiError(status.BAD_REQUEST, "請填寫密碼");
  }
  if (!confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "請重複確認密碼");
  }
  if (!name) {
    throw new ApiError(status.BAD_REQUEST, "請填寫名稱");
  }
  // 檢查email格式
  if (!validator.isEmail(email)) {
    throw new ApiError(status.BAD_REQUEST, "請填寫正確 Email 格式");
  }
  // 檢查密碼長度
  if (!validator.isLength(password, { min: 8 })) {
    throw new ApiError(status.BAD_REQUEST, "密碼長度最低為8");
  }
  // 檢查確認密碼是否一致
  if (password !== confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "密碼與確認密碼不一致");
  }
  // 檢查email是否已被註冊
  if (await User.exists({ email: email })) {
    throw new ApiError(status.BAD_REQUEST, "此 Email 已被註冊");
  }

  // 加密密碼
  const passwordHash = await bcrypt.hash(password, saltLength);
  // 創建帳號
  const newUser = await User.create({
    email: email,
    password: passwordHash,
    name: name,
    photo: photo,
  });

  generateSendJWT(newUser, status.CREATED, res);
});

// 登入
controller.signIn = catchAsync(async (req, res) => {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  // 檢查必填內容是否為空
  if (!email) {
    throw new ApiError(status.BAD_REQUEST, "請填寫 Email");
  }
  if (!password) {
    throw new ApiError(status.BAD_REQUEST, "請填寫密碼");
  }

  // 取出密碼並比對
  const user = await User.findOne({ email: email }, "+password").orFail(
    new ApiError(status.BAD_REQUEST, "此 Email 未註冊")
  );
  const auth = await bcrypt.compare(password, user.password);
  if (!auth) {
    throw new ApiError(status.BAD_REQUEST, "密碼錯誤");
  }

  generateSendJWT(user, status.OK, res);
});

// 修改密碼
controller.changePassword = catchAsync(async (req, res) => {
  const password = req.body.password?.trim();
  const confirmPassword = req.body.confirmPassword?.trim();

  // 檢查必填內容是否為空
  if (!password) {
    throw new ApiError(status.BAD_REQUEST, "請填寫新密碼");
  }
  if (!confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "請重複確認新密碼");
  }
  // 檢查密碼長度
  if (!validator.isLength(password, { min: 8 })) {
    throw new ApiError(status.BAD_REQUEST, "密碼長度最低為8");
  }
  // 檢查確認密碼是否一致
  if (password !== confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "密碼與確認密碼不一致");
  }

  const newPasswordHash = await bcrypt.hash(password, saltLength);
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      password: newPasswordHash,
    },
    { new: true, runValidators: true }
  );

  generateSendJWT(user, status.OK, res);
});

// 取得使用者資料
controller.getProfile = catchAsync(async (req, res) => {
  res.json({
    status: "success",
    user: req.user,
  });
});

// 更新使用者資料
controller.updateProfile = catchAsync(async (req, res) => {
  const name = req.body.name?.trim();
  const photo = req.body.photo?.trim();
  if (!name && !photo) {
    return res.send("資料無異動");
  }

  let user = await User.findById(req.user.id);
  if (name) {
    user.name = name;
  }
  if (photo) {
    user.photo = photo;
  }
  await user.save();

  res.json({
    status: "success",
    user: {
      name: user.name,
      photo: user.photo,
    },
  });
});

// 追蹤
controller.follow = catchAsync(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(status.BAD_REQUEST, "您無法追蹤自己");
  }

  await User.updateOne(
    {
      _id: req.user.id,
      "following.user": { $ne: req.params.id },
    },
    {
      $addToSet: { following: { user: req.params.id } },
    }
  );
  await User.updateOne(
    {
      _id: req.params.id,
      "followers.user": { $ne: req.user.id },
    },
    {
      $addToSet: { followers: { user: req.user.id } },
    }
  );

  res.json({
    status: "success",
    message: "您已成功追蹤！",
  });
});

// 取消追蹤
controller.unfollow = catchAsync(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(status.BAD_REQUEST, "您無法取消追蹤自己");
  }

  await User.updateOne(
    {
      _id: req.user.id,
    },
    {
      $pull: { following: { user: req.params.id } },
    }
  );
  await User.updateOne(
    {
      _id: req.params.id,
    },
    {
      $pull: { followers: { user: req.user.id } },
    }
  );

  res.json({
    status: "success",
    message: "您已成功取消追蹤！",
  });
});

// 取得按讚列表
controller.getLikeList = catchAsync(async (req, res) => {
  const likes = await Post.find({
    likes: req.user.id,
  }).populate({
    path: "user",
    select: "name",
  });
  res.json({
    status: "success",
    likes,
  });
});

// 取得追蹤列表
controller.getFollowingList = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id, "-_id following").populate({
    path: "following.user",
    select: "-_id name photo",
  });
  res.json({
    status: "success",
    following: user.following,
  });
});

// 取得個人所有貼文列表
controller.getUserPosts = catchAsync(async (req, res) => {
  const posts = await Post.find({ user: req.user.id });
  res.json({
    status: "success",
    posts,
  });
});

export default controller;
