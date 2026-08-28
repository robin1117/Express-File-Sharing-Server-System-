import multer from "multer";
import multerS3 from "multer-s3";
import { ObjectId } from "mongodb";
import directoryModel from "../../models/directoryModel.js";
import s3Client from "../../config/s3Config.js";

const storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  metadata(req, file, cb) {
    // console.log("creating storage metadata");
    cb(null, { fieldName: file.fieldname });
  },
  key(req, file, cb) {
    // console.log("Extracting naming file");
    const fileName = req.file_id.toString();
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

      // console.log("filteringLogic");

      // ✅ Allow upload
      cb(null, true);
    } catch (err) {
      cb(err, false);
    }
  },
});

export const multerUploadMiddleware = upload.single("file");
