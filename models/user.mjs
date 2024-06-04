import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "請輸入您的 Email"],
      unique: true,
      lowercase: true,
      select: false,
    },
    password: {
      type: String,
      required: [true, "請輸入密碼"],
      minlength: 8,
      select: false,
    },
    name: {
      type: String,
      required: [true, "請輸入您的名字"],
    },
    photo: {
      type: String,
      default: "",
    },
    following: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: "User" },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    followers: [
      {
        user: { type: mongoose.Schema.ObjectId, ref: "User" },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      select: false,
    },
    updatedAt: {
      type: Date,
      select: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
