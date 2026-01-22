import express, { json } from 'express'
import { mkdir, readdir, rm, writeFile } from 'fs/promises'
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
        let parentDirId = req.headers.parentdirid == "" ? directoryDB[0].id : req.headers.parentdirid
        let id = crypto.randomUUID()
        directoryDB.push({ id, dirName, files: [], directories: [], parentDirId })
        let parentDirObj = directoryDB.find((dirObj) => dirObj.id == parentDirId)
        parentDirObj.directories.push(id)
        writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        res.json('{what:dir Has been created}')
    } catch (error) {
        console.log(error);
        res.json(error.message)
    }
})

//renaming Directory
router.patch('/:dirId', async (req, res) => {
    try {
        let dirid = req.params.dirId
        let newName = req.headers.filename
        let referencedDir = directoryDB.find((dirObj) => dirObj.id == dirid)
        referencedDir.dirName = newName
        writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        res.json('{what:dir Had updated directory Name}')
    } catch (error) {
        res.json(error.message)
    }
})

//deleting Directory
router.delete("/:id", async (req, res) => {
    try {
        let dirId = req.params.id
        await recursiveDeletionDirectory(dirId)

        // console.log({ "filer": fileDB });
        // console.log({ 'directort': directoryDB });
        writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        writeFile('./fileDB.json', JSON.stringify(fileDB))


        res.json(`We deleted directory Successfully !`)

    } catch (error) {
        res.json(error.message)
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