import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    post: {
      type: Schema.ObjectId,
      ref: "Post",
      require: ["true", "post id required"],
    },
    user: {
      type: Schema.ObjectId,
      ref: "User",
      require: ["true", "user id required"],
    },
    content: {
      type: String,
      required: [true, "content cannot be empty"],
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

commentSchema.pre(/^find/, (next) => {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

export default model("Comment", commentSchema);
