import express from "express";
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

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect Database
const db = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);
try {
  mongoose.connect(db);
  console.log("DB Connected!");
} catch (err) {
  console.log(err);
}

const app = express();

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

export default app;
