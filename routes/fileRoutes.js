import express from 'express'
import { createWriteStream, unlink, WriteStream } from 'fs'
import { rename, rm, writeFile } from 'fs/promises'
import path from 'path'
import multer from "multer";
import { Db, ObjectId } from 'mongodb'
import { deletingFileName, OpenDowanloadFileName, updadingFileName } from '../Controllers/fileControllers.js';
import directoryModel from '../models/directoryModel.js';
import fleModel from '../models/fileModel.js';

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

            // let parentDir = await db.collection('directoryDB').findOne({ userId: new ObjectId(uid), })
            let parentDir = await directoryModel.findOne({ userId: new ObjectId(uid), })

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

        // await db.collection('fileDB').insertOne({ _id: new ObjectId(id), fileName, extension, parentId: new ObjectId(parentId) })
        let p = await fleModel.insertOne({ _id: new ObjectId(id), fileName, extension, parentId: new ObjectId(parentId) })
        console.log(p);

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
    .patch(updadingFileName)
    .delete(userValidator, deletingFileName)
    .get(userValidator, OpenDowanloadFileName)

export default router