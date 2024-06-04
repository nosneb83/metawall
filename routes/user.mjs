import express from "express";
import bcrypt from "bcryptjs";
import validator from "validator";

import User from "../models/user.mjs";
import appError from "../utils/appError.mjs";
import handleErrorAsync from "../utils/handleErrorAsync.mjs";
import auth from "../services/auth.mjs";
const { isAuth, generateSendJWT } = auth;

const router = express.Router();

router.post(
  "/sign-up",
  handleErrorAsync(async (req, res, next) => {
    let { email, password, confirmPassword, name } = req.body;
    email = email?.trim();
    password = password?.trim();
    confirmPassword = confirmPassword?.trim();
    name = name?.trim();

    // 檢查內容是否為空
    if (!email || !password || !confirmPassword || !name) {
      return next(appError("400", "欄位未填寫正確！", next));
    }
    // 檢查是否為Email
    if (!validator.isEmail(email)) {
      return next(appError("400", "Email 格式不正確", next));
    }
    // 檢查密碼是否8碼以上
    if (!validator.isLength(password, { min: 8 })) {
      return next(appError("400", "密碼字數低於 8 碼", next));
    }
    // 檢查確認密碼是否一致
    if (password !== confirmPassword) {
      return next(appError("400", "密碼不一致！", next));
    }

    // 加密密碼
    password = await bcrypt.hash(req.body.password, 12);
    const newUser = await User.create({
      email: email,
      password: password,
      name: name,
    });
    generateSendJWT(newUser, 201, res);
  })
);

router.post(
  "/sign-in",
  handleErrorAsync(async (req, res, next) => {
    let { email, password } = req.body;
    email = email?.trim();
    password = password?.trim();

    if (!email || !password) {
      return next(appError(400, "帳號密碼不可為空", next));
    }

    const user = await User.findOne({ email }, "+password");
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return next(appError(400, "您的密碼不正確", next));
    }
    generateSendJWT(user, 200, res);
  })
);

export default router;
