import { Router } from "express";
const router = Router();
import bcrypt from "bcryptjs";
import validator from "validator";

import User from "../models/user.mjs";
import auth from "../services/auth.mjs";
const { isAuth, generateSendJWT } = auth;
import ApiError from "../utils/ApiError.mjs";
import catchAsync from "../utils/catchAsync.mjs";

const saltLength = 12;

// 註冊
router.post(
  "/sign-up",
  catchAsync(async (req, res) => {
    let { email, password, confirmPassword, name } = req.body;
    email = email?.trim();
    password = password?.trim();
    confirmPassword = confirmPassword?.trim();
    name = name?.trim();

    // 檢查內容是否為空
    if (!email || !password || !confirmPassword || !name) {
      throw new ApiError("400", "欄位未填寫正確！");
    }
    // 檢查email格式
    if (!validator.isEmail(email)) {
      throw new ApiError("400", "Email 格式不正確");
    }
    // 檢查密碼長度
    if (!validator.isLength(password, { min: 8 })) {
      throw new ApiError("400", "密碼字數低於 8 碼");
    }
    // 檢查確認密碼是否一致
    if (password !== confirmPassword) {
      throw new ApiError("400", "密碼不一致！");
    }
    // 檢查email是否已被註冊
    if (await User.exists({ email })) {
      throw new ApiError("400", "此 Email 已被註冊");
    }

    // 加密密碼
    const passwordHash = await bcrypt.hash(password, saltLength);
    const newUser = await User.create({
      email: email,
      password: passwordHash,
      name: name,
    });

    generateSendJWT(newUser, 201, res);
  })
);

// 登入
router.post(
  "/sign-in",
  catchAsync(async (req, res) => {
    let { email, password } = req.body;
    email = email?.trim();
    password = password?.trim();

    if (!email || !password) {
      throw new ApiError(400, "帳號密碼不可為空");
    }

    const user = await User.findOne({ email }, "+password");
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      throw new ApiError(400, "您的密碼不正確");
    }

    generateSendJWT(user, 200, res);
  })
);

// 取得使用者資料
router.get(
  "/profile",
  isAuth,
  catchAsync(async (req, res) => {
    res.json({
      status: "success",
      user: req.user,
    });
  })
);

// 修改使用者資料
router.patch(
  "/profile",
  isAuth,
  catchAsync(async (req, res) => {
    let { name } = req.body;
    name = name?.trim();

    // 檢查內容是否為空
    if (!name) {
      throw new ApiError("400", "欄位未填寫正確！");
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: name,
      },
      { new: true, runValidators: true }
    );

    res.json({
      status: "success",
      user: user,
    });
  })
);

// 修改密碼
router.patch(
  "/change-password",
  isAuth,
  catchAsync(async (req, res) => {
    let { password, confirmPassword } = req.body;
    password = password?.trim();
    confirmPassword = confirmPassword?.trim();

    // 檢查內容是否為空
    if (!password || !confirmPassword) {
      throw new ApiError("400", "欄位未填寫正確！");
    }
    // 檢查密碼是否8碼以上
    if (!validator.isLength(password, { min: 8 })) {
      throw new ApiError("400", "密碼字數低於 8 碼");
    }
    // 檢查確認密碼是否一致
    if (password !== confirmPassword) {
      throw new ApiError("400", "密碼不一致！");
    }

    const newPasswordHash = await bcrypt.hash(password, saltLength);
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        password: newPasswordHash,
      },
      { new: true, runValidators: true }
    );

    generateSendJWT(user, 200, res);
  })
);

// 追蹤
router.post(
  "/:id/follow",
  isAuth,
  catchAsync(async (req, res) => {
    if (req.params.id === req.user.id) {
      throw new ApiError(401, "您無法追蹤自己");
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
  })
);

// 取消追蹤
router.delete(
  "/:id/unfollow",
  isAuth,
  catchAsync(async (req, res) => {
    if (req.params.id === req.user.id) {
      throw new ApiError(401, "您無法取消追蹤自己");
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
  })
);

export default router;
