import { rm } from "node:fs/promises";
import directoryModel from "../models/directoryModel.js";
import fileModel from "../models/fileModel.js";
import { ObjectId } from "mongodb";
import path from "node:path";
import { AbortMultipartUploadCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3Config.js";

//This function recursively delete file and filers from directory
export async function recursiveDeletionDirectory(id, req) {
  let dirId = id;

  let directCollection = await directoryModel
    .find({ parentDirId: new ObjectId(dirId) })
    .lean();

  let fileCollection = await fileModel
    .find({ parentId: new ObjectId(dirId) })
    .lean();

  if (fileCollection.length) {
    for await (let fileObject of fileCollection) {
      let fileid = fileObject._id;
      try {
        if (fileObject.uploadStatus !== "completed") {
          const abortingIncompleteFile = new AbortMultipartUploadCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileid.toString(),
            UploadId: fileObject.uploadId,
          });
          await s3Client.send(abortingIncompleteFile);
        } else {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileid.toString(),
          });
          await s3Client.send(deleteCommand);
        }
        await fileModel.deleteOne({ _id: new ObjectId(fileid) });
      } catch (error) {
        console.log("file Not found or deleted already", error);
      }
    }
  }

  if (directCollection.length) {
    for (let dirObject of directCollection) {
      await recursiveDeletionDirectory(dirObject._id, req);
    }
  }
  await directoryModel.deleteOne({ _id: new ObjectId(dirId) });
}

//Recursion Logic fro finding Crumb
export async function findingCrumb(id) {
  let result = [];
  let depth = 0;

  async function helper(currentId) {
    depth++;
    if (depth > 50) {
      throw new Error("Directory Hierachy breaked");
    }
    const dir = await directoryModel
      .findById(currentId)
      .select({ dirName: 1, parentDirId: 1, _id: 1 });

    if (!dir) return;

    if (dir.parentDirId) {
      await helper(dir.parentDirId);
    }

    result.push(dir); // push in correct order
  }
  await helper(id);
  result.shift();
  return result;
}
