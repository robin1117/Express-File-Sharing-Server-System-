import multer from "multer";
import path from "path";
import { ObjectId } from "mongodb";
import directoryModel from "../../models/directoryModel.js";

let storagePath = path.join(import.meta.dirname, "/../../storage");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    console.log("creating storage");
    cb(null, storagePath);
  },
  filename(req, file, cb) {
    console.log("Extracting naming file");
    const fileName = req.fileNameWith_Id_exe;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  // limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  async fileFilter(req, file, cb) {
    try {
      // // ✅ 1. Validate user
      const uid = req.user._id;
      let parentDir = await directoryModel.findOne({
        userId: new ObjectId(uid),
      });
      if (!parentDir) {
        return cb(new Error("Your not real"), false);
      }

      console.log("filteringLogic");

      // ✅ Allow upload
      cb(null, true);
    } catch (err) {
      cb(err, false);
    }
  },
});

export const multerUploadMiddleware = upload.single("file");
