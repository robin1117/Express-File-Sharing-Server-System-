import express from 'express'
import { createWriteStream, unlink, WriteStream } from 'fs'
import { rename, rm, writeFile } from 'fs/promises'
import path from 'path'
import fileDB from "../fileDB.json" with {type: "json"}
import directoryDB from "../directoryDB.json" with {type: "json"}
import multer from "multer";

let storagePath = path.join(import.meta.dirname, '/../storage',)

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, storagePath);
    },
    filename(req, file, cb) {
        const id = crypto.randomUUID();
        const fileName = `${id}${path.extname(file.originalname)}`;

        req._uploadPath = path.join(storagePath, fileName);
        cb(null, fileName);
    }
});

const upload = multer({
    storage,
    // limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter(req, file, cb) {
        try {
            // ✅ 1. Validate user
            const uid = req.user?.id;
            const parentDir = directoryDB.find(dir => dir.userId == uid);

            if (!parentDir) {
                return cb(new Error("Your not real"), false);
            }

            // ✅ Allow upload
            cb(null, true);

        } catch (err) {
            cb(err, false);
        }
    }
});

const uploadMiddleware = upload.single("file");

let router = express.Router()

//uploading
router.post('/:fileName', (req, res) => {
    let uid = req.user.id
    let parentDir = directoryDB.find((directory) => directory.userId == uid)
    // if (!parentDir) {
    //     return res.json({ message: "Your not real" })
    // }

    let cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        console.log(req._uploadPath);
        if (req._uploadPath) {
            unlink(req._uploadPath, () => {
                console.log('🧹 partial file deleted');
            });
        }
    };
    req.on('aborted', () => {
        cleanup()
    });

    uploadMiddleware(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        let fileName = req.params.fileName || 'Untitled'
        let parentId = req.headers.dirid || req.user.rootDirId
        let id = path.parse(req.file.filename).name
        let extension = path.extname(req.file.originalname)

        fileDB.push({ id, fileName, extension, parentId })

        let refrenceDir = directoryDB.find((dir) => dir.id == parentId)
        refrenceDir.files.push(id)
        try {
            await writeFile('./fileDB.json', JSON.stringify(fileDB))
            await writeFile('./directoryDB.json', JSON.stringify(directoryDB))
            res.status(201).json({ message: "File uploaded successfully" });

        } catch (error) {
            return res.status(500).json({ message: "something went wrong" })
        }
    })
})

function userValidator(req, res, next) {
    let fileId = req.params.id

    let fileData = fileDB.find((fileData) => fileData.id == fileId)
    if (!fileData) return res.status(404).json({ message: "File Not Available😏" })
    let directoryData = directoryDB.find((directory) => directory.id == fileData.parentId)
    if (directoryData.userId !== req.user.id) {
        return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
    }
    next()
}

// //Read
// router.get('/:id', userValidator, (req, res, next) => {
//     let fileId = req.params.id

//     let fileData = fileDB.find((fileData) => fileData.id == fileId)
//     let directoryData = directoryDB.find((directory) => directory.id == fileData.parentId)

//     if (directoryData.userId !== req.user.id) {
//         return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
//     }

//     if (!fileData) {
//         return res.status(404).json({ message: "file Not found" })
//     }
//     let fullName = `${fileId}${fileData.extension}`
//     let fileObj = fileDB.find((fileObj) => fileObj.id == fileId)
//     let fileName = fileObj.fileName

//     if (req.query.action == 'download') {
//         res.download(path.join(import.meta.dirname, '/../storage', fullName), fileName)
//         // res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
//     }

//     res.sendFile(path.join(import.meta.dirname, '/../storage', fullName), (err) => {
//         if (err && !res.headersSent) {
//             res.status(404).send("File not found !");
//         }
//     })
// })

// //Delete file
// router.delete("/:id", userValidator, async (req, res, next) => {
//     try {
//         let fileId = req.params.id

//         let fileData = fileDB.find((fileData) => fileData.id == fileId)
//         let directoryData = directoryDB.find((directory) => directory.id == fileData.parentId)
//         if (directoryData.userId !== req.user.id) {
//             return res.status(404).json({ message: "You are trying to access someone`s other file😏 or file not exist" })
//         }

//         let fullName = `${fileId}${fileData.extension}`
//         let fileDataIndex = fileDB.findIndex((fileData) => fileData.id == fileId)
//         await rm(path.join(import.meta.dirname, '/../storage', fullName))
//         fileDB.splice(fileDataIndex, 1)

//         let selectedDirWithReference = directoryDB.find((dir) => dir.id == fileData.parentId)
//         selectedDirWithReference.files = selectedDirWithReference.files.filter((id) => id != fileId)
//         await writeFile('./directoryDB.json', JSON.stringify(directoryDB))
//         await writeFile('./fileDB.json', JSON.stringify(fileDB))
//         res.status(200).json({ message: "File deleted successfully" });
//     } catch (error) {
//         next(error)
//     }
// })

// //Update
// router.patch('/:id', userValidator, async (req, res, next) => {
//     try {
//         let fileId = req.params.id
//         let fileData = fileDB.find((fileData) => fileData.id == fileId)
//         let directoryData = directoryDB.find((directory) => directory.id == fileData.parentId)

//         if (directoryData.userId !== req.user.id) {
//             return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
//         }

//         // let fileDataReference = fileDB.find((fileData) => req.params.id == fileData.id)
//         fileData.fileName = req.body.fileName
//         await writeFile('./fileDB.json', JSON.stringify(fileDB))
//         return res.status(200).json({ message: "Renamed" })
//     } catch (error) {
//         error.status = 510
//         next(error)
//     }
// })

//This is one the way we can Group our routes while using ExpressJS
router.route("/:id")
    .patch(userValidator, async (req, res, next) => {
        try {
            let fileId = req.params.id
            let fileData = fileDB.find((fileData) => fileData.id == fileId)
            let directoryData = directoryDB.find((directory) => directory.id == fileData.parentId)

            if (directoryData.userId !== req.user.id) {
                return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
            }

            // let fileDataReference = fileDB.find((fileData) => req.params.id == fileData.id)
            fileData.fileName = req.body.fileName
            await writeFile('./fileDB.json', JSON.stringify(fileDB))
            return res.status(200).json({ message: "Renamed" })
        } catch (error) {
            error.status = 510
            next(error)
        }
    })
    .delete(userValidator, async (req, res, next) => {
        try {
            let fileId = req.params.id

            let fileData = fileDB.find((fileData) => fileData.id == fileId)
            let directoryData = directoryDB.find((directory) => directory.id == fileData.parentId)
            if (directoryData.userId !== req.user.id) {
                return res.status(404).json({ message: "You are trying to access someone`s other file😏 or file not exist" })
            }

            let fullName = `${fileId}${fileData.extension}`
            let fileDataIndex = fileDB.findIndex((fileData) => fileData.id == fileId)
            await rm(path.join(import.meta.dirname, '/../storage', fullName))
            fileDB.splice(fileDataIndex, 1)

            let selectedDirWithReference = directoryDB.find((dir) => dir.id == fileData.parentId)
            selectedDirWithReference.files = selectedDirWithReference.files.filter((id) => id != fileId)
            await writeFile('./directoryDB.json', JSON.stringify(directoryDB))
            await writeFile('./fileDB.json', JSON.stringify(fileDB))
            res.status(200).json({ message: "File deleted successfully" });
        } catch (error) {
            next(error)
        }
    })
    .get(userValidator, (req, res, next) => {
        let fileId = req.params.id

        let fileData = fileDB.find((fileData) => fileData.id == fileId)
        let directoryData = directoryDB.find((directory) => directory.id == fileData.parentId)

        if (directoryData.userId !== req.user.id) {
            return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
        }

        if (!fileData) {
            return res.status(404).json({ message: "file Not found" })
        }
        let fullName = `${fileId}${fileData.extension}`
        let fileObj = fileDB.find((fileObj) => fileObj.id == fileId)
        let fileName = fileObj.fileName

        if (req.query.action == 'download') {
            res.download(path.join(import.meta.dirname, '/../storage', fullName), fileName)
            // res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
        }

        res.sendFile(path.join(import.meta.dirname, '/../storage', fullName), (err) => {
            if (err && !res.headersSent) {
                res.status(404).send("File not found !");
            }
        })
    })


export default router