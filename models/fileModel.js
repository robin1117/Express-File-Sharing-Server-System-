import { Schema, model, Types } from "mongoose";

let fileModel = new Schema(
  {
    fileName: {
      type: String,
    },
    extension: {
      type: String,
    },
    parentId: {
      type: Types.ObjectId,
    },
    isbroken: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Types.ObjectId,
      default: false,
    },
    uploadStatus: {
      type: String,
      enum: ["pending", "uploading", "completed", "failed", "deleted"],
      default: "pending",
    },
  },
  {
    strict: "throws",
    versionKey: false,
  },
);

let fleModel = model("fileDB", fileModel, "fileDB");

export default fleModel;
