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
import { saveFileMetaToDB } from "../middlewares/uploadingMiddleWares/UploadingMiddlewares.js";
import { multerUploadMiddleware } from "../middlewares/uploadingMiddleWares/multerMiddleware.js";

let storagePath = path.join(import.meta.dirname, "/../storage");
let router = express.Router();
let isUploadingFlag = false;

//uploadings
router.post(
  "/upload",
  saveFileMetaToDB,
  multerUploadMiddleware,
  async (req, res, next) => {
    try {
      if (req.file) {
        let fileId = req.file_id;
        await fleModel.findByIdAndUpdate(fileId, {
          $set: { isbroken: false, uploadStatus: "completed" },
        });
        return res.status(200).json({
          message: `file ${req.file.originalname} upload sucessfully`,
        });
      }

      // if filePond prefer chunk based Uploading Go with this Logic
      let file_id_With_Extension = req.fileNameWith_Id_exe;
      writeFileSync(
        path.join(storagePath, file_id_With_Extension.toString()),
        "",
      );
      isUploadingFlag = false;
      return res.status(200).end(file_id_With_Extension.toString());
    } catch (error) {
      next(error);
    }
  },
);

//For Chunkbased Uploading 
router.patch(
  "/upload/:fileId",

  (req, res, next) => {
    let file_id = req.params.fileId;
    req.on("aborted", async () => {
      await fleModel.findByIdAndUpdate(file_id.split(".")[0], {
        $set: { isbroken: false, uploadStatus: "failed" },
      });
    });

    express.raw({
      type: "application/offset+octet-stream",
      limit: "10mb",
    })(req, res, async (err) => {
      if (err) {
        await fleModel.findByIdAndUpdate(file_id.split(".")[0], {
          $set: { isbroken: false, uploadStatus: "failed" },
        });
        console.log("User Might be Refreses The page (Connection Lost)");
        return;
      }
      next();
    });
  },

  async (req, res, next) => {
    try {
      let file_id = req.params.fileId;
      const uploadLength = req.headers["upload-length"];
      const uploadName = req.headers["upload-name"];
      const uploadOffset = parseInt(req.headers["upload-offset"], 10);

      let writeStream = await createWriteStream(
        path.join(storagePath, file_id),
        {
          flags: "r+",
          start: uploadOffset,
          highWaterMark: 1024 * 1024 * 11,
        },
      );

      writeStream.write(req.body, async (err) => {
        if (err) {
          return res.sendStatus(500);
        }
        const currentChunkSize = req.body.length;

        const isLastChunk =
          Number(uploadOffset + currentChunkSize) === Number(uploadLength);
        // console.log(
        //   uploadOffset + currentChunkSize,
        //   uploadLength,
        //   writeStream.bytesWritten,
        // );

        if (isLastChunk) {
          return writeStream.close();
        }
        if (!isUploadingFlag) {
          await fleModel.findByIdAndUpdate(
            file_id.split(".")[0],
            {
              $set: { isbroken: false, uploadStatus: "uploading" },
            },
            { returnDocument: "after" },
          );
          isUploadingFlag = true;
        }
        return res.sendStatus(201);
      });

      writeStream.on("finish", async (a, b) => {
        console.log("this is the finish");
        await fleModel.findByIdAndUpdate(file_id.split(".")[0], {
          $set: { isbroken: false, uploadStatus: "completed" },
        });
        return res.sendStatus(200);
      });
    } catch (error) {
      next(error);
    }
  },
);

//To resume uploading
router.head("/upload/:fileId", async (req, res) => {
  let file_id = req.params.fileId;
  const stats = await stat(path.join(storagePath, file_id));
  console.log(stats.size, file_id);
  res.set({
    "Upload-Offset": stats.size.toString(),
    "Access-Control-Expose-Headers": "Upload-Offset", // Required if frontend reads this cross-origin
  });

  res.sendStatus(200);
});

// If user cancel uploading
router.delete("/upload/revert", express.text(), async (req, res) => {
  let file_id = req.body;
  console.log(file_id);

  if (file_id) {
    await unlink(path.join(storagePath, file_id));
  }
  res.sendStatus(200);
});

//That router.param() check wheather if incomming id is valid of not before before touching DataBase
router.param("id", validateMiddleware);

//This is one the way we can Group our routes while using ExpressJS
router
  .route("/:id")
  .patch(updadingFileName)
  .delete(deletingFileName)
  .get(OpenDowanloadFileName);

export default router;
