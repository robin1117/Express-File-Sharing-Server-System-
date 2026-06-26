import express from "express";
import multer, { MulterError } from "multer";
import path from "path";
import crypto from "crypto";

const app = express();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads");
    },
    filename(req, file, cb) {
        const id = crypto.randomUUID();
        const fileName = `${id}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

const upload = multer({
    storage,
    // limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const uploadMiddleware = upload.array("profilePic");

app.post("/upload", (req, res) => {

    uploadMiddleware(req, res, (err) => {

        // 🔴 Multer-specific errors
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({
                    error: "File too large (max 2MB)"
                });
            }
            return res.status(400).json({ error: err.message });
        }

        // 🔴 Custom fileFilter errors
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        // ✅ SUCCESS — Multer is done
        // Files → req.files
        // Fields → req.body

        res.status(201).json({
            message: "Upload successful",
            files: req.files,
            body: req.body
        });


    })

    // upload.array("profilePic", 2)(req, res, (err) => {

    //     // 🔴 Multer errors
    //     if (err instanceof multer.MulterError) {
    //         if (err.code === "LIMIT_FILE_SIZE") {
    //             return res.status(413).json({
    //                 error: "File too large. Max size is 2MB"
    //             });
    //         }
    //         return res.status(400).json({ error: err.message });
    //     }

    //     // 🔴 Other errors
    //     if (err) {
    //         return res.status(500).json({ error: "Something went wrong" });
    //     }

    //     // ✅ Success
    //     res.status(201).json({
    //         message: "Upload successful",
    //         files: req.files
    //     });
    // });
});

const server = app.listen(4000, "0.0.0.0", () => {
    console.log(server.address());
});
