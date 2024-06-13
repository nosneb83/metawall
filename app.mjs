import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import url from "url";
import cors from "cors";
import status from "http-status";
import mongoose from "mongoose";
import "dotenv/config";

import indexRouter from "./routes/index.mjs";
import postsRouter from "./routes/post.route.mjs";
import uploadRouter from "./routes/upload.route.mjs";
import usersRouter from "./routes/user.route.mjs";

const app = express();
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 程式出現重大錯誤時
process.on("uncaughtException", (err) => {
  // 記錄錯誤下來，等到服務都處理完後，停掉該 process
  console.error("Uncaughted Exception！");
  console.error(err);
  process.exit(1);
});

// 連接資料庫
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
app.use((req, res) => {
  res.status(status.NOT_FOUND).json({
    status: "error",
    message: "無此路由資訊",
  });
});

// 錯誤處理
app.use((err, req, res, next) => {
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
      err.statusCode = status.INTERNAL_SERVER_ERROR;
      err.message = "系統錯誤，請洽系統管理員";
    }
  }

  res.status(err.statusCode || status.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    stack: err.stack,
  });
});

// 未捕捉到的 catch
process.on("unhandledRejection", (err, promise) => {
  console.error("未捕捉到的 rejection：", promise, "原因：", err);
});

export default app;
