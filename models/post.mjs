import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "貼文 ID 未填寫"],
    },
    content: {
      type: String,
      required: [true, "Content 未填寫"],
    },
    image: {
      type: String,
      default: "",
    },
    likes: [
      {
        type: Schema.ObjectId,
        ref: "User",
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

export default model("Post", postSchema);
