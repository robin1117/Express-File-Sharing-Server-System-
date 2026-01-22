import express from 'express'
import { createWriteStream, WriteStream } from 'fs'
import { rename, rm, writeFile } from 'fs/promises'
import path from 'path'
import fileDB from "../fileDB.json" with {type: "json"}
import directoryDB from "../directoryDB.json" with {type: "json"}


let route = express.Router()

//Read
route.get('/:id', (req, res, next) => {
    try {
        let id = req.params.id
        let fileData = fileDB.find((fileData) => fileData.id == id)
        let fullName = `${id}${fileData.extension}`
        let fileObj = fileDB.find((fileObj) => fileObj.id == id)
        let fileName = fileObj.fileName
        if (req.query.action == 'download') res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
        res.sendFile(path.join(import.meta.dirname, '/../storage', fullName), (err) => {
            if (err && !res.headersSent) {
                res.status(404).send("File not found");
            }
        })
    } catch (error) {
        res.json(error.message)
    }
})

//uploading
route.post('/:fileName', (req, res) => {
    try {
        let fileName = req.params.fileName

        let parentId = req.headers.dirid == undefined ? directoryDB[0].id : req.headers.dirid
        let id = crypto.randomUUID()
        let extension = path.extname(fileName)
        let fullPath = path.join(import.meta.dirname, '/../storage', id + extension)
        let writeStream = createWriteStream(fullPath)
        req.pipe(writeStream)

        console.log({ id, fileName, extension, parentId });
        req.on('end', () => {
            fileDB.push({ id, fileName, extension, parentId })
            writeFile('./fileDB.json', JSON.stringify(fileDB))
            res.json({ message: 'File has been sended' })
            let refrenceDir = directoryDB.find((dir) => dir.id == parentId)
            refrenceDir.files.push(id)
            writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        })

    } catch (error) {
        res.json(error.message)
    }
})

//Delete file
route.delete("/:id", async (req, res) => {
    try {
        let fileid = req.params.id
        let fileDataIndex = fileDB.findIndex((fileData) => fileData.id == fileid)
        let fileData = fileDB[fileDataIndex]
        let fullName = `${fileid}${fileDB[fileDataIndex].extension}`
        await rm(path.join(import.meta.dirname, '/../storage', fullName))
        fileDB.splice(fileDataIndex, 1)
        let selectedDirWithReference = directoryDB.find((dir) => dir.id == fileData.parentId)
        selectedDirWithReference.files = selectedDirWithReference.files.filter((id) => id != fileid)

        writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        writeFile('./fileDB.json', JSON.stringify(fileDB))

        res.json(`We deleted ${req.params.fileName} Successfully !`)

    } catch (error) {
        res.json(error.message)
    }
})

//Update
route.patch('/:id', async (req, res) => {
    try {
        let fileDataReference = fileDB.find((fileData) => req.params.id == fileData.id)
        fileDataReference.fileName = req.body.fileName
        writeFile('./fileDB.json', JSON.stringify(fileDB))
        res.json(`File Has been Renamed`)
    } catch (error) {
        res.json('SELETC ONE FILE ATLEAT')
    }
})

export default route