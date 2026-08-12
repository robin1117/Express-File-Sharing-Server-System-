import express from "express";
import path from "node:path";
import { ObjectId } from "mongodb";
import fleModel from "../../models/fileModel.js";
import s3Client from "../../config/s3Config.js";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
let uploadParts = new Map();
let uploadOffsets = new Map();

export const saveFileMetaToDB = async (req, res, next) => {
  try {
    const content_length = req.headers["content-length"];
    const upload_Length = req.headers["upload-length"];
    const Original_file_Name = req.headers["file-name"];
    const parent_id =
      req.headers["parent-id"] == "root"
        ? req.user.rootDirId
        : req.headers["parent-id"];

    let file_id = new ObjectId();
    let extension = path.extname(Original_file_Name);
    let fileName = path.parse(Original_file_Name).name;

    const createCommand = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file_id.toString(),
    });
    const s3Response = await s3Client.send(createCommand);
    const uploadId = s3Response.UploadId;

    await fleModel.insertOne({
      _id: file_id,
      uploadId,
      extension,
      fileName: decodeURIComponent(fileName),
      userId: req.user._id,
      parentId: parent_id,
      isbroken: false,
      uploadStatus: "pending",
    });

    req.fileNameWith_Id_exe = `${file_id}${extension}`;
    req.file_id = file_id;
    req.s3_UploadId = uploadId;
    next();
  } catch (error) {
    next(error);
  }
};

export const decidingTheUploadApproach = async (req, res, next) => {
  try {
    if (req.file) {
      let fileId = req.file_id;
      await fleModel.findByIdAndUpdate(fileId, {
        $set: { isbroken: false, uploadStatus: "completed" },
      });
      return res.status(200).end(req.fileNameWith_Id_exe.toString());
    }

    // if filePond prefer chunk based Uploading Go with this Logic
    return res.status(200).end(req.file_id.toString());
  } catch (error) {
    next(error);
  }
};

export const isReqAborted_ifNot_AddChunkDataToReqBody = async (
  req,
  res,
  next,
) => {
  let file_id = req.params.fileId;
  req.on("aborted", async () => {
    await fleModel.findByIdAndUpdate(file_id, {
      $set: { isbroken: true, uploadStatus: "failed" },
    });
  });

  express.raw({
    type: "application/offset+octet-stream",
    limit: "10mb",
  })(req, res, async (err) => {
    if (err) {
      await fleModel.findByIdAndUpdate(file_id, {
        $set: { isbroken: true, uploadStatus: "failed" },
      });
      console.log("User Might be Refreses The page (Connection Lost)");
      return;
    }
    next();
  });
};

export const chunkBasedUploading = async (req, res, next) => {
  try {
    let file_id = req.params.fileId;
    const fileMeta = await fleModel.findById(file_id);

    if (!fileMeta?.uploadId) {
      return res.status(404).send("Upload metadata not found");
    }

    const uploadLength = parseInt(req.headers["upload-length"], 10);
    const uploadOffset = parseInt(req.headers["upload-offset"], 10);
    const currentChunkSize = req.body.length;

    const isLastChunk =
      Number(uploadOffset + currentChunkSize) === Number(uploadLength);

    const parts = uploadParts.get(file_id) ?? [];
    const calculatedPartNumber = parts.length + 1;

    const uploadPartCommand = new UploadPartCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file_id,
      UploadId: fileMeta.uploadId,
      PartNumber: calculatedPartNumber,
      Body: req.body,
    });

    const s3Response = await s3Client.send(uploadPartCommand);
    parts.push({
      PartNumber: calculatedPartNumber,
      ETag: s3Response.ETag,
    });

    uploadParts.set(file_id, parts);
    uploadOffsets.set(file_id, uploadOffset + currentChunkSize);

    await fleModel.findByIdAndUpdate(file_id, {
      $set: { isbroken: false, uploadStatus: "uploading" },
    });

    if (isLastChunk) {
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file_id,
        UploadId: fileMeta.uploadId,
        MultipartUpload: {
          Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
        },
      });

      await s3Client.send(completeCommand);
      await fleModel.findByIdAndUpdate(file_id, {
        $set: { isbroken: false, uploadStatus: "completed" },
      });
      uploadParts.delete(file_id);
      uploadOffsets.delete(file_id);
      
      return res.sendStatus(200);
    }

    res.set({
      "Upload-Offset": (uploadOffset + currentChunkSize).toString(),
      "Access-Control-Expose-Headers": "Upload-Offset",
    });
    return res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};

export const resumeUploading = async (req, res) => {
  let file_id = req.params.fileId;
  const offset = uploadOffsets.get(file_id) ?? 0;
  console.log(offset, file_id);
  res.set({
    "Upload-Offset": offset.toString(),
    "Access-Control-Expose-Headers": "Upload-Offset", // Required if frontend wants to reads this cross-origin
  });

  res.sendStatus(200);
};

export const onCancelUpload = async (req, res, next) => {
  try {
    let file_id = req.body;
    const fileMeta = await fleModel.findById(file_id);

    if (fileMeta?.uploadId) {
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file_id,
        UploadId: fileMeta.uploadId,
      });

      await s3Client.send(abortCommand);
      await fleModel.findByIdAndUpdate(file_id, {
        $set: { isbroken: true, uploadStatus: "failed" },
      });
    }

    uploadParts.delete(file_id);
    uploadOffsets.delete(file_id);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
