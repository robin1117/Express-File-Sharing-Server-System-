import express from "express";
import path from "node:path";
import { ObjectId } from "mongodb";
import fleModel from "../../models/fileModel.js";
import { createWriteStream, writeFileSync } from "node:fs";

let storagePath = path.join(import.meta.dirname, "/../../storage");
let isUploadingFlag = false;
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

    await fleModel.insertOne({
      _id: file_id,
      extension,
      fileName: decodeURIComponent(fileName),
      userId: req.user._id,
      parentId: parent_id,
      isbroken: false,
      uploadStatus: "pending",
    });

    req.fileNameWith_Id_exe = `${file_id}${extension}`;
    req.file_id = file_id;
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
};

export const isReqAborted_ifNot_AddChunkDataToReqBody = async (
  req,
  res,
  next,
) => {
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
};

export const chunkBasedUploading = async (req, res, next) => {
  try {
    let file_id = req.params.fileId;
    const uploadLength = req.headers["upload-length"];
    const uploadName = req.headers["upload-name"];
    const uploadOffset = parseInt(req.headers["upload-offset"], 10);

    let writeStream = await createWriteStream(path.join(storagePath, file_id), {
      flags: "r+",
      start: uploadOffset,
      highWaterMark: 1024 * 1024 * 11,
    });

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
};

export const resumeUploading = async (req, res) => {
  let file_id = req.params.fileId;
  const stats = await stat(path.join(storagePath, file_id));
  console.log(stats.size, file_id);
  res.set({
    "Upload-Offset": stats.size.toString(),
    "Access-Control-Expose-Headers": "Upload-Offset", // Required if frontend wants to reads this cross-origin
  });

  res.sendStatus(200);
};

export const onCancelUpload = async (req, res) => {
  let file_id = req.body;
  if (file_id) {
    await unlink(path.join(storagePath, file_id));
  }
  res.sendStatus(200);
};
