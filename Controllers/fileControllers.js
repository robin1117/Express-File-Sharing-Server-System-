import { ObjectId } from "mongodb"
import { rm } from "fs/promises"
import path from "path"
import usrModel from "../models/userModel.js"
import fleModel from "../models/fileModel.js"
import directoryModel from "../models/directoryModel.js"



export const updadingFileName = async (req, res, next) => {
    try {
        let db = req.db
        let fileId = req.params.id
        let fileData = await fleModel.findOne({ _id: new ObjectId(fileId) })
        let directoryData = await directoryModel.findOne({ _id: new ObjectId(fileData.parentId) })
        if (directoryData.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
        }
        await fleModel.updateOne({ _id: new ObjectId(fileId) }, { $set: { fileName: req.body.fileName } })
        return res.status(200).json({ message: "Renamed" })
    } catch (error) {
        error.status = 510
        next(error)
    }
}
export const deletingFileName = async (req, res, next) => {
    try {

        let fileId = req.params.id
        let fileData = await fleModel.findOne({ _id: new ObjectId(fileId) })
        let directoryData = await directoryModel.findOne({ _id: new ObjectId(fileData.parentId) })

        if (directoryData.userId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "You are trying to access someone`s other file😏" })
        }

        let fullName = `${fileId}${fileData.extension}`
        // let fileDataIndex = fileDB.findIndex((fileData) => fileData.id == fileId)
        await rm(path.join(import.meta.dirname, '/../storage', fullName))
        // fileDB.splice(fileDataIndex, 1)
        // let p = await db.collection('fileDB').deleteOne({ _id: new ObjectId(fileId) })
        await fleModel.deleteOne({ _id: new ObjectId(fileId) })

        // let selectedDirWithReference = directoryDB.find((dir) => dir.id == fileData.parentId)
        // selectedDirWithReference.files = selectedDirWithReference.files.filter((id) => id != fileId)
        // await writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        // await writeFile('./fileDB.json', JSON.stringify(fileDB))
        res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        next(error)
    }
}
export const OpenDowanloadFileName = async (req, res, next) => {
    let fileId = req.params.id
    let fileData = await fleModel.findById(fileId)

    let directoryData = await directoryModel.findById(fileData.parentId)

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
}