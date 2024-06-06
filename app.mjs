import express from "express";
const app = express();
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import url from "url";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

import indexRouter from "./routes/index.mjs";
import postsRouter from "./routes/post.mjs";
import usersRouter from "./routes/user.mjs";
import uploadRouter from "./routes/upload.mjs";

// 程式出現重大錯誤時
process.on("uncaughtException", (err) => {
  // 記錄錯誤下來，等到服務都處理完後，停掉該 process
  console.error("Uncaughted Exception！");
  console.error(err);
  process.exit(1);
});

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect Database
const db = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(db)
  .then(() => console.log("DB Connected!"))
  .catch((err) => console.log(err));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.use("/", indexRouter);
app.use("/post", postsRouter);
app.use("/user", usersRouter);
app.use("/upload", uploadRouter);
// 404 錯誤
app.use(function (req, res) {
  res.status(404).json({
    status: "error",
    message: "無此路由資訊",
  });
});

// 錯誤處理
app.use(function (err, req, res, next) {
  err.statusCode = err.statusCode || 500;

  // production環境下的錯誤處理
  if (process.env.NODE_ENV !== "dev") {
    err.stack = undefined;

    switch (err.name) {
      case "ValidationError":
        err.message = "資料欄位未填寫正確，請重新輸入！";
        err.isOperational = true;
        break;
    }

    if (!err.isOperational) {
      console.error("出現重大錯誤", err);
      err.statusCode = 500;
      err.message = "系統錯誤，請洽系統管理員";
    }
  }

  res.status(err.statusCode).json({
    message: err.message,
    stack: err.stack,
  });
});

// 未捕捉到的 catch
process.on("unhandledRejection", (err, promise) => {
  console.error("未捕捉到的 rejection：", promise, "原因：", err);
});

export default app;
