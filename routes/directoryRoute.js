import express, { json } from 'express'
import { mkdir, readdir, writeFile } from 'fs/promises'
import path from 'path'
import directoryDB from "../directoryDB.json" with {type: "json"}
import fileDB from "../fileDB.json" with {type: "json"}

let router = express.Router()
function locateToStorage(req) {
    const filePath = (req.params.directURL || []).join('/')
    return path.join(import.meta.dirname, '/../storage', filePath)
}

//serving Directory
router.get(['/', '/*id'], async (req, res) => {
    try {
        let id = req.params.id
        if (!id) {
            let files = directoryDB[0].files.map((fileId) => fileDB.find((fileObj) => fileObj.id == fileId))
            let directories = directoryDB[0].directories.map((dirId) => directoryDB.find((dirObj) => dirObj.id == dirId))
            return res.json({ ...directoryDB[0], directories, files })
        }
        else {
            let indexDirectory = directoryDB.findIndex((directory) => directory.id == id)
            let files = directoryDB[indexDirectory].files.map((fileId) => fileDB.find((fileObj) => fileObj.id == fileId))
            let directories = directoryDB[indexDirectory].directories.map((dirId) => directoryDB.find((dirObj) => dirObj.id == dirId))
            return res.json({ ...directoryDB[indexDirectory], directories, files })
        }
    } catch (error) {
        res.json(error.message)
    }
})

//creating folder
router.post(['/', '/:dirName'], async (req, res) => {
    try {
        let dirName = req.params.dirName || 'NewFolder'
        let parentDirId = req.headers.parentdirid == "undefined" ? directoryDB[0].id : req.headers.parentdirid
        let id = crypto.randomUUID()
        directoryDB.push({ id, dirName, files: [], directories: [], parentDirId })
        let parentDirObj = directoryDB.find((dirObj) => dirObj.id == parentDirId)
        parentDirObj.directories.push(id)
        writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        res.json('{what:dir Has been created}')
    } catch (error) {
        res.json(error.message)
    }
})



export default router