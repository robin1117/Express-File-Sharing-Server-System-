import express from 'express'
import { createWriteStream, unlink, WriteStream } from 'fs'
import { rename, rm, writeFile } from 'fs/promises'
import path from 'path'
import multer from "multer";
import { Db, ObjectId } from 'mongodb'

let storagePath = path.join(import.meta.dirname, '/../storage',)

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, storagePath);
    },
    filename(req, file, cb) {
        // const id = crypto.randomUUID();
        const id = new ObjectId()

        const fileName = `${id}${path.extname(file.originalname)}`;

        req._uploadPath = path.join(storagePath, fileName);
        cb(null, fileName);
    }
});

const upload = multer({
    storage,
    // limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    async fileFilter(req, file, cb) {
        try {
            // ✅ 1. Validate user
            const uid = req.user._id
            let db = req.db
            let parentDir = await db.collection('directoryDB').findOne({ userId: new ObjectId(uid), })

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
        let db = req.db
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        let fileName = req.params.fileName || 'Untitled'
        let parentId = req.headers.dirid || req.user.rootDirId
        let id = path.parse(req.file.filename).name
        let extension = path.extname(req.file.originalname)
        console.log(id);
        await db.collection('fileDB').insertOne({ _id: new ObjectId(id), fileName, extension, parentId: new ObjectId(parentId) })

        try {
            res.status(201).json({ message: "File uploaded successfully" });

        } catch (error) {
            return res.status(500).json({ message: "something went wrong" })
        }
    })
})

function userValidator(req, res, next) {
    // let fileId = req.params.id

    // let fileData = fileDB.find((fileData) => fileData.id == fileId)
    // if (!fileData) return res.status(404).json({ message: "File Not Available😏" })
    // let directoryData = directoryDB.find((directory) => directory.id == fileData.parentId)
    // if (directoryData.userId !== req.user.id) {
    //     return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
    // }
    next()
}

//That router.param() check wheather if incomming id is valid of not before before touching DataBase
router.param('id', (req, res, next, id) => {
    if (!ObjectId.isValid(id)) {
        return res.status(404).json({ error: "Invalid Id :" + id })
    }
    next()
})


//This is one the way we can Group our routes while using ExpressJS
router.route("/:id")
    .patch(async (req, res, next) => {

        try {
            let db = req.db
            let fileId = req.params.id
            let fileData = await db.collection('fileDB').findOne({ _id: new ObjectId(fileId) })
            let directoryData = await db.collection('directoryDB').findOne({ _id: new ObjectId(fileData.parentId) })


            if (directoryData.userId.toString() !== req.user._id.toString()) {
                return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
            }

            await db.collection('fileDB').updateOne({ _id: new ObjectId(fileId) }, { $set: { fileName: req.body.fileName } })
            // await writeFile('./fileDB.json', JSON.stringify(fileDB))
            return res.status(200).json({ message: "Renamed" })
        } catch (error) {
            error.status = 510
            next(error)
        }

    })
    .delete(userValidator, async (req, res, next) => {
        try {
            let fileId = req.params.id
            let db = req.db
            let fileData = await db.collection('fileDB').findOne({ _id: new ObjectId(fileId) })
            let directoryData = await db.collection('directoryDB').findOne({ _id: new ObjectId(fileData.parentId) })

            if (directoryData.userId.toString() !== req.user._id.toString()) {
                return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
            }

            let fullName = `${fileId}${fileData.extension}`
            // let fileDataIndex = fileDB.findIndex((fileData) => fileData.id == fileId)
            await rm(path.join(import.meta.dirname, '/../storage', fullName))
            // fileDB.splice(fileDataIndex, 1)
            await db.collection('fileDB').deleteOne({ _id: new ObjectId(fileId) })
            // let selectedDirWithReference = directoryDB.find((dir) => dir.id == fileData.parentId)
            // selectedDirWithReference.files = selectedDirWithReference.files.filter((id) => id != fileId)
            // await writeFile('./directoryDB.json', JSON.stringify(directoryDB))
            // await writeFile('./fileDB.json', JSON.stringify(fileDB))
            res.status(200).json({ message: "File deleted successfully" });
        } catch (error) {
            next(error)
        }
    })
    .get(userValidator, async (req, res, next) => {
        let fileId = req.params.id
        let db = req.db
        let fileData = await db.collection('fileDB').findOne({ _id: new ObjectId(fileId) })
        let directoryData = await db.collection('directoryDB').findOne({ _id: new ObjectId(fileData.parentId) })

        if (directoryData.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
        }

        if (!fileData) {
            return res.status(404).json({ message: "file Not found" })
        }

        let fullName = `${fileId}${fileData.extension}`

        if (req.query.action == 'download') {
            res.download(path.join(import.meta.dirname, '/../storage', fullName), fileData.fileName)
            // res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
        }

        res.sendFile(path.join(import.meta.dirname, '/../storage', fullName), (err) => {
            if (err && !res.headersSent) {
                res.status(404).send("File not found !");
            }
        })
    })

export default router