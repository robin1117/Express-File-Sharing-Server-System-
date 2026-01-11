import express from 'express'
import { createWriteStream } from 'fs'
import { rename, rm } from 'fs/promises'
import path from 'path'

let route = express.Router()

function locateToStorage(req) {
    const filePath = (req.params.fileName || []).join('/')
    return path.join(import.meta.dirname, '/../storage', filePath)
}

//Read
route.get('/*fileName', (req, res, next) => {
    try {
        if (req.query.action == 'download') res.set('Content-Disposition', 'attachment')
        res.sendFile(locateToStorage(req))
    } catch (error) {
        res.json(error.message)
    }
})

//uploading 
route.post('/*fileName', (req, res) => {
    try {
        let writeStream = createWriteStream(locateToStorage(req))
        req.pipe(writeStream)
        req.on('end', () => {
            res.json({ message: 'File has been sended' })
        })
    } catch (error) {
        res.json(error.message)
    }
})

//Delete file / folder
route.delete("/*fileName", async (req, res) => {
    try {
        await rm(locateToStorage(req), { recursive: true })
        res.json(`We deleted ${req.params.fileName} Successfully !`)
    } catch (error) {
        res.json(error.message)
    }
})

//Update
route.patch('/*fileName', async (req, res) => {
    try {
        await rename(locateToStorage(req), `./storage/${req.body.newFileName}`)
        res.json(`File Has been Renamed`)
    } catch (error) {
        res.json('sELETC ONE FILE ATLEAT')
    }
})


export default route