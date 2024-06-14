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

  // 加密密碼並創建帳號
  const passwordHash = await bcrypt.hash(password, saltLength);
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
  const verified = await bcrypt.compare(password, user.password);
  if (!verified) {
    throw new ApiError(status.BAD_REQUEST, "密碼錯誤");
  }

  generateSendJWT(user, status.OK, res);
});

// 修改密碼
controller.changePassword = catchAsync(async (req, res) => {
  const oldPassword = req.body.oldPassword?.trim();
  const newPassword = req.body.newPassword?.trim();
  const confirmNewPassword = req.body.confirmNewPassword?.trim();

  // 檢查必填內容是否為空
  if (!oldPassword) {
    throw new ApiError(status.BAD_REQUEST, "請填寫舊密碼");
  }
  if (!newPassword) {
    throw new ApiError(status.BAD_REQUEST, "請填寫新密碼");
  }
  if (!confirmNewPassword) {
    throw new ApiError(status.BAD_REQUEST, "請重複確認新密碼");
  }
  // 檢查新密碼是否與舊密碼相同
  if (oldPassword === newPassword) {
    throw new ApiError(status.BAD_REQUEST, "新密碼不可與舊密碼相同");
  }
  // 檢查密碼長度
  if (!validator.isLength(newPassword, { min: 8 })) {
    throw new ApiError(status.BAD_REQUEST, "密碼長度最低為8");
  }
  // 檢查確認密碼是否一致
  if (newPassword !== confirmNewPassword) {
    throw new ApiError(status.BAD_REQUEST, "密碼與確認密碼不一致");
  }

  // 取出舊密碼並比對
  const user = await User.findById(req.user._id, "+password");
  const verified = await bcrypt.compare(oldPassword, user.password);
  if (!verified) {
    throw new ApiError(status.BAD_REQUEST, "舊密碼錯誤");
  }

  // 設定加密後的新密碼
  const newPasswordHash = await bcrypt.hash(newPassword, saltLength);
  user.password = newPasswordHash;
  await user.save();

  generateSendJWT(user, status.OK, res);
});

// 取得使用者資料
controller.getProfile = catchAsync(async (req, res) => {
  res.json({
    status: "success",
    // user: { ...req.user._doc, _id: undefined },
    user: req.user,
  });
});

// 更新使用者資料
controller.updateProfile = catchAsync(async (req, res) => {
  const name = req.body.name?.trim();
  const photo = req.body.photo?.trim();

  // 檢查必填內容是否為空
  if (!name) {
    throw new ApiError(status.BAD_REQUEST, "請填寫名稱");
  }

  // 設定資料
  req.user.name = name;
  if (photo) {
    req.user.photo = photo;
  }
  await req.user.save();

  res.json({
    status: "success",
    user: {
      name: req.user.name,
      photo: req.user.photo,
    },
  });
});

// 追蹤
controller.follow = catchAsync(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(status.BAD_REQUEST, "您無法追蹤自己");
  }

  // 檢查對方是否存在
  const targetUser = await User.findById(req.params.id).orFail(
    new ApiError(status.BAD_REQUEST, "找不到使用者")
  );

  // 追蹤對方
  if (!req.user.following.some((following) => following.user.toString() === targetUser.id)) {
    req.user.following.push({ user: targetUser.id });
  }
  // 對方被追蹤
  if (!targetUser.followers.some((follower) => follower.user.toString() === req.user.id)) {
    targetUser.followers.push({ user: req.user.id });
  }
  await Promise.all([req.user.save(), targetUser.save()]);

  res.json({
    status: "success",
    message: "您已成功追蹤",
  });
});

// 取消追蹤
controller.unfollow = catchAsync(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(status.BAD_REQUEST, "您無法取消追蹤自己");
  }

  // 檢查對方是否存在
  const targetUser = await User.findById(req.params.id).orFail(
    new ApiError(status.BAD_REQUEST, "找不到使用者")
  );

  // 退追對方
  req.user.following = req.user.following.filter(
    (following) => following.user.toString() !== targetUser.id
  );
  // 對方被退追
  targetUser.followers = targetUser.followers.filter(
    (follower) => follower.user.toString() !== req.user.id
  );
  await Promise.all([req.user.save(), targetUser.save()]);

  res.json({
    status: "success",
    message: "您已成功取消追蹤",
  });
});

// 取得按讚列表
controller.getLikeList = catchAsync(async (req, res) => {
  // 關聯按讚者資料
  const likePosts = await Post.find({
    likes: req.user.id
  }).populate({
    path: "user",
    select: "name photo"
  });

  res.json({
    status: "success",
    likes: likePosts.map(post => post._doc),
  });
});

// 取得追蹤列表
controller.getFollowingList = catchAsync(async (req, res) => {
  // 關聯追蹤者資料
  const user = await req.user.populate({
    path: "following.user",
    select: "name photo",
  });

  res.json({
    status: "success",
    following: user.following,
  });
});

// 取得個人所有貼文列表
controller.getUserPosts = catchAsync(async (req, res) => {
  // 檢查使用者是否存在
  await User.findById(req.params.id).orFail(
    new ApiError(status.BAD_REQUEST, "找不到使用者")
  );

  // 取得使用者所有貼文
  const posts = await Post.find({ user: req.params.id });

  res.json({
    status: "success",
    posts: posts,
  });
});

export default controller;
