import express from "express";
import { createWriteStream, writeFileSync, WriteStream } from "fs";
import { rename, rm, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  deletingFileName,
  OpenDowanloadFileName,
  updadingFileName,
} from "../Controllers/fileControllers.js";
import directoryModel from "../models/directoryModel.js";
import fleModel from "../models/fileModel.js";
import validateMiddleware from "../middlewares/validateMiddleware.js";
import { start } from "repl";
import { pipeline } from "stream";
import {
  chunkBasedUploading,
  decidingTheUploadApproach,
  isReqAborted_ifNot_AddChunkDataToReqBody,
  onCancelUpload,
  resumeUploading,
  saveFileMetaToDB,
} from "../middlewares/uploadingMiddleWares/UploadingMiddlewares.js";
import { multerUploadMiddleware } from "../middlewares/uploadingMiddleWares/multerMiddleware.js";
let storagePath = path.join(import.meta.dirname, "/../storage");
let router = express.Router();


//uploadings
router.post(
  "/upload",
  saveFileMetaToDB,
  multerUploadMiddleware,
  decidingTheUploadApproach,
);

//For Chunkbased Uploading
router.patch(
  "/upload/:fileId",
  isReqAborted_ifNot_AddChunkDataToReqBody,
  chunkBasedUploading,
);

//To resume uploading
router.head("/upload/:fileId", resumeUploading);

// If user cancel uploading
router.delete("/upload/revert", express.text(), onCancelUpload);

//That router.param() check wheather if incomming id is valid or not before before touching DataBase
router.param("id", validateMiddleware);

//This is one the way we can Group our routes while using ExpressJS
router
  .route("/:id")
  .patch(updadingFileName)
  .delete(deletingFileName)
  .get(OpenDowanloadFileName);

export default router;
