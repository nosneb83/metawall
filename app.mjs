import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import url from "url";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import indexRouter from "./routes/index.mjs";
import postsRouter from "./routes/posts.mjs";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect Database
dotenv.config({ path: ".env/config.env" });
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
app.use("/posts", postsRouter);

export default app;
