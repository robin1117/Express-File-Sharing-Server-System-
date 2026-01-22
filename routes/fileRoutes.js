import express from 'express'
import { createWriteStream, WriteStream } from 'fs'
import { rename, rm, writeFile } from 'fs/promises'
import path from 'path'
import fileDB from "../fileDB.json" with {type: "json"}
import directoryDB from "../directoryDB.json" with {type: "json"}


let route = express.Router()

//Read
route.get('/:id', (req, res, next) => {
    let id = req.params.id
    let fileData = fileDB.find((fileData) => fileData.id == id)
    if (!fileData) {
        return res.status(404).json({ message: "file Not found" })
    }
    let fullName = `${id}${fileData.extension}`
    let fileObj = fileDB.find((fileObj) => fileObj.id == id)
    let fileName = fileObj.fileName

    if (req.query.action == 'download') res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
    res.sendFile(path.join(import.meta.dirname, '/../storage', fullName), (err) => {
        if (err && !res.headersSent) {
            res.status(404).send("File not found !");
        }
    })
})

//uploading
route.post('/:fileName', (req, res) => {

    let fileName = req.params.fileName || 'Untitled'

    let parentId = req.headers.dirid == undefined ? directoryDB[0].id : req.headers.dirid
    let id = crypto.randomUUID()
    let extension = path.extname(fileName)
    let fullPath = path.join(import.meta.dirname, '/../storage', id + extension)
    let writeStream = createWriteStream(fullPath)
    req.pipe(writeStream)

    req.on('end', async () => {
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

//Delete file
route.delete("/:id", async (req, res, next) => {
    try {
        let fileid = req.params.id
        let fileDataIndex = fileDB.findIndex((fileData) => fileData.id == fileid)
        if (fileDataIndex == -1) {
            return res.status(404).json({ message: "file not found" })
        }
        let fileData = fileDB[fileDataIndex]
        let fullName = `${fileid}${fileDB[fileDataIndex].extension}`
        await rm(path.join(import.meta.dirname, '/../storage', fullName))
        fileDB.splice(fileDataIndex, 1)
        let selectedDirWithReference = directoryDB.find((dir) => dir.id == fileData.parentId)
        selectedDirWithReference.files = selectedDirWithReference.files.filter((id) => id != fileid)
        await writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        await writeFile('./fileDB.json', JSON.stringify(fileDB))
        res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
        next('error')
    }
})

//Update
route.patch('/:id', async (req, res, next) => {
    try {
        let fileDataReference = fileDB.find((fileData) => req.params.id == fileData.id)
        fileDataReference.fileName = req.body.fileName
        await writeFile('./fileDB.json', JSON.stringify(fileDB))
        return res.status.josn({ message: "Renamed" })
    } catch (error) {
        error.status = 510
        next(error)
    }
})

export default route