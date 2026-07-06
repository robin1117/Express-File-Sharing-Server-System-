import express from "express";
import { createWriteStream, writeFileSync, WriteStream } from "fs";
import { rename, rm, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import multer from "multer";
import { Db, ObjectId } from "mongodb";
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

let storagePath = path.join(import.meta.dirname, "/../storage");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, storagePath);
  },
  filename(req, file, cb) {
    const id = new ObjectId();
    const fileName = `${id}${path.extname(file.originalname)}`;
    req._uploadPath = path.join(storagePath, fileName);
    req.fileId = id;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  // preservePath(req, file) {
  //   console.log(file);
  // },
  // limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  async fileFilter(req, file, cb) {
    try {
      // // ✅ 1. Validate user
      // const uid = req.user._id;

      // let parentDir = await directoryModel.findOne({
      //   userId: new ObjectId(uid),
      // });

      // if (!parentDir) {
      //   return cb(new Error("Your not real"), false);
      // }

      // ✅ Allow upload
      cb(null, true);
    } catch (err) {
      cb(err, false);
    }
  },
});

const uploadMiddleware = upload.single("file");
let router = express.Router();

//uploadings
router.post("/upload", async (req, res, next) => {
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    console.log(req._uploadPath);

    if (req._uploadPath) {
      unlink(req._uploadPath, () => {
        console.log("🧹 partial file deleted");
      });
    }
  };
  req.on("aborted", () => {
    cleanup();
  });

  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    try {
      if (!req.file) {
        const uploadLength = req.headers["upload-length"];
        let file_id = new ObjectId();
        writeFileSync(path.join(storagePath, file_id.toString()), "");
        return res.status(200).end(file_id.toString());
      }
      res.status(201).end(req.fileId.toString());
    } catch (error) {
      return res.status(500).json({ message: "something went wrong", error });
    }
  });
});

router.patch(
  "/upload/:fileId",

  (req, res, next) => {
    req.on("aborted", async () => {
      let file_id = req.params.fileId;
      if (file_id) {
        await unlink(path.join(storagePath, file_id));
      }
    });
    next();
  },

  express.raw({
    type: "application/offset+octet-stream",
    limit: "10mb",
  }),

  async (req, res, next) => {
    try {
      let file_id = req.params.fileId;
      const uploadLength = req.headers["upload-length"];
      const uploadName = req.headers["upload-name"];
      const uploadOffset = parseInt(req.headers["upload-offset"], 10);
      const extension = path.extname(uploadName);

      let writeStream = await createWriteStream(
        path.join(storagePath, file_id),
        {
          flags: "r+",
          start: uploadOffset,
          highWaterMark: 1024 * 1024 * 11,
        },
      );

      let canIWrite = writeStream.write(req.body, (err) => {
        if (err) {
          return res.sendStatus(500);
        }
        const currentChunkSize = req.body.length;
        const isLastChunk =
          Number(uploadOffset + currentChunkSize) === Number(uploadLength);

        console.log(
          uploadOffset + currentChunkSize,
          uploadLength,
          writeStream.bytesWritten,
        );
        if (isLastChunk) {
          return writeStream.close();
        }
        return res.sendStatus(200);
      });

      writeStream.on("drain", async (a, b) => {
        console.log("Drain fire ho rah he yrr");
      });

      writeStream.on("finish", async (a, b) => {
        await rename(
          path.join(storagePath, file_id),
          path.join(storagePath, `${file_id}${extension}`),
        );
        console.log("this is the finish");
        return res.sendStatus(200);
      });
    } catch (error) {
      console.log({ error });
    }
  },
);

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
