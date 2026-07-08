import path from "node:path";
import { ObjectId } from "mongodb";
import fleModel from "../../models/fileModel.js";

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
