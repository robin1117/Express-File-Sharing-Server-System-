import { ObjectId } from "mongodb";
import { rm } from "fs/promises";
import path from "path";
import usrModel from "../models/userModel.js";
import fleModel from "../models/fileModel.js";
import directoryModel from "../models/directoryModel.js";
import { renameSchema } from "../validators/nameValidator.js";
import {
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import s3Client from "../config/s3Config.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const updadingFileName = async (req, res, next) => {
  try {
    let { data, error, success } = renameSchema.safeParse(req.body.fileName);
    if (!success) {
      if (!success) {
        return res.status(401).json(z4.treeifyError(error).properties);
      }
    }

    let fileId = req.params.id;
    let fileData = await fleModel.findOne({ _id: new ObjectId(fileId) });
    let directoryData = await directoryModel.findOne({
      _id: new ObjectId(fileData.parentId),
    });
    if (directoryData.userId.toString() !== req.user._id.toString()) {
      return res
        .status(404)
        .json({ message: "You are trying to access someone`s other file😏" });
    }
    await fleModel.updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { fileName: data } },
    );
    return res.status(200).json({ message: "Renamed" });
  } catch (error) {
    error.status = 510;
    next(error);
  }
};

export const deletingFileName = async (req, res, next) => {
  try {
    let fileId = req.params.id;
    let fileData = await fleModel.findOne({ _id: new ObjectId(fileId) });
    let directoryData = await directoryModel.findOne({
      _id: new ObjectId(fileData.parentId),
    });

    if (directoryData.userId.toString() !== req.user._id.toString()) {
      return res
        .status(404)
        .json({ message: "You are trying to access someone`s other file😏" });
    }
    if (fileData.uploadStatus !== "completed") {
      const abortingIncompleteFile = new AbortMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileData._id.toString(),
        UploadId: fileData.uploadId,
      });
      let o1 = await s3Client.send(abortingIncompleteFile);
    } else {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileData._id.toString(),
      });
      let o = await s3Client.send(deleteCommand);
    }
    await fleModel.deleteOne({ _id: new ObjectId(fileId) });

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const OpenDowanloadFileName = async (req, res, next) => {
  let fileId = req.params.id;
  let fileData = await fleModel.findById(fileId);

  let directoryData = await directoryModel.findById(fileData.parentId);

  if (directoryData.userId.toString() !== req.user._id.toString()) {
    return res
      .status(404)
      .json({ message: "You are trying to access someone`s other file😏" });
  }

  if (!fileData) {
    return res.status(404).json({ message: "file Not found" });
  }

  let contentType = "application/octet-stream";
  if (fileData.extension === ".mp4") {
    contentType = "video/mp4";
  } else if (fileData.extension === ".png") {
    contentType = "image/png";
  } else if (fileData.extension === ".jpg" || fileData.extension === ".jpeg") {
    contentType = "image/jpeg";
  } else if (fileData.extension === ".pdf") {
    contentType = "application/pdf";
  }
  let isDownload = req.query?.action == "download";

  const getCommand = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileId,
    ResponseContentType: contentType,
    ...(isDownload && {
      ResponseContentDisposition: `attachment; filename="${fileData.fileName}${fileData.extension}"`,
    }),
  });

  const signedUrl = await getSignedUrl(s3Client, getCommand, {
    expiresIn: 300,
  });

  let fullName = `${fileId}${fileData.extension}`;

  res.redirect(signedUrl);
};
