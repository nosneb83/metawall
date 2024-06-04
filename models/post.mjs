import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "貼文姓名未填寫"],
    },
    image: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: [true, "Content 未填寫"],
    },
    likes: {
      type: Number,
      default: 0,
    },
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

export default mongoose.model("Post", postSchema);
