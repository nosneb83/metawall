import status from "http-status";
import jwt from "jsonwebtoken";
import User from "../models/user.model.mjs";
import ApiError from "../utils/ApiError.mjs";
import catchAsync from "../utils/catchAsync.mjs";

export const isAuth = catchAsync(async (req, res, next) => {
  // 確認 token 是否存在
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    throw new ApiError(status.UNAUTHORIZED, "請先登入");
  }

  // 驗證 token 正確性
  const payload = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        reject(err);
      } else {
        resolve(payload);
      }
    });
  });
  req.user = await User.findById(payload.id).orFail(
    new ApiError(status.UNAUTHORIZED, "帳號不存在")
  );

  next();
});

export const generateSendJWT = (user, statusCode, res) => {
  // 產生 JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_DAY,
  });

  res.status(statusCode).json({
    status: "success",
    token: token,
    user: {
      name: user.name,
      photo: user.photo,
    },
  });
};
