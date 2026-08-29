import express from "express";
import {
  deletingFileName,
  OpenDowanloadFileName,
  updadingFileName,
} from "../Controllers/fileControllers.js";
import validateMiddleware from "../middlewares/validateMiddleware.js";
import {
  chunkBasedUploading,
  decidingTheUploadApproach,
  isReqAborted_ifNot_AddChunkDataToReqBody,
  onCancelUpload,
  resumeUploading,
  saveFileMetaToDB,
} from "../middlewares/uploadingMiddleWares/UploadingMiddlewares.js";
import { multerUploadMiddleware } from "../middlewares/uploadingMiddleWares/multerMiddleware.js";
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
router.delete("/upload/revert", express.text(), onCancelUpload); // This is in under process right now🔥

//That router.param() check wheather if incomming id is valid or not before before touching DataBase
router.param("id", validateMiddleware);

//This is one the way we can Group our routes while using ExpressJS
router
  .route("/:id")
  .patch(updadingFileName)
  .delete(deletingFileName)
  .get(OpenDowanloadFileName);

export default router;
