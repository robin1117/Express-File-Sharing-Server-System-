import express, { json } from 'express'
import { mkdir, readdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import directoryDB from "../directoryDB.json" with {type: "json"}
import fileDB from "../fileDB.json" with {type: "json"}

let router = express.Router()

//serving Directory
router.get(['/', '/:id'], async (req, res) => {

    let id = req.params.id || directoryDB[0].id

    let indexDirectory = directoryDB.findIndex((directory) => directory.id == id)
    if (indexDirectory == -1) {
        return res.status(404).json({ message: "Directoy not found" })
    }
    let files = directoryDB[indexDirectory].files.map((fileId) => fileDB.find((fileObj) => fileObj.id == fileId))
    let directories = directoryDB[indexDirectory].directories.map((dirId) => directoryDB.find((dirObj) => dirObj.id == dirId))
    return res.status(200).json({ ...directoryDB[indexDirectory], directories, files })

})

//creating folder
router.post(['/', '/:dirName'], async (req, res, next) => {
    try {
        let dirName = req.params.dirName || 'NewFolder'
        let parentDirId = req.headers.parentdirid == "" ? directoryDB[0].id : req.headers.parentdirid
        let id = crypto.randomUUID()
        directoryDB.push({ id, dirName, files: [], directories: [], parentDirId })
        let parentDirObj = directoryDB.find((dirObj) => dirObj.id == parentDirId)
        if (!parentDirObj) {
            return res.status(404).json({ message: "parentDirectory does not exist" })

        }
        parentDirObj.directories.push(id)
        writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        return res.status(201).json({ message: "Dir Has been created" })
    } catch (error) {
        next(error)
    }
})

//renaming Directory
router.patch('/:dirId', async (req, res, next) => {
    let dirid = req.params.dirId
    let newName = req.headers.filename
    let referencedDir = directoryDB.find((dirObj) => dirObj.id == dirid)
    if (!referencedDir) {
        return res.status(404).json({ message: "directory not found" })
    }
    referencedDir.dirName = newName
    try {
        await writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        return res.status(200).json({ message: '{what:dir Had updated directory Name}' })
    } catch (error) {
        next(error)
    }
})

//deleting Directory
router.delete("/:id", async (req, res, next) => {
    try {
        let dirId = req.params.id
        await recursiveDeletionDirectory(dirId)
        writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        writeFile('./fileDB.json', JSON.stringify(fileDB))
        res.status(200).json({ message: `We deleted directory Successfully !` })
    } catch (error) {
        next(error)
    }
})

//This function recursively delete file and filers from directory
async function recursiveDeletionDirectory(id) {
    let dirId = id
    let fileDataIndex = directoryDB.findIndex((fileData) => fileData.id == dirId)
    let filesArr = directoryDB[fileDataIndex].files
    let nestedDirectoriesArr = directoryDB[fileDataIndex].directories
    let patentid = directoryDB[fileDataIndex].parentDirId

    if (filesArr.length) {
        for await (let id of filesArr) {
            console.log('deletingFile', id);
            let fileid = id
            let fileDataIndex = fileDB.findIndex((fileData) => fileData.id == fileid)
            let fullName = `${fileid}${fileDB[fileDataIndex].extension}`
            try {
                await rm(path.join(import.meta.dirname, '/../storage', fullName))
                fileDB.splice(fileDataIndex, 1)
            } catch (error) {
                console.log('file Not found or deletd already');
            }
        }

    }
    if (nestedDirectoriesArr.length) {
        for (let id of nestedDirectoriesArr) {
            await recursiveDeletionDirectory(id)
        }
    }

    let parentDirObj = directoryDB.find((dirObj) => dirObj.id == patentid)
    let filterendDirectoriesArr = parentDirObj.directories.filter((directoriesId) => directoriesId !== dirId)
    parentDirObj.directories = filterendDirectoriesArr
    directoryDB.splice(fileDataIndex, 1)

    // writeFile('./directoryDB.json', JSON.stringify(directoryDB))
    // writeFile('./fileDB.json', JSON.stringify(fileDB))
}


export default router