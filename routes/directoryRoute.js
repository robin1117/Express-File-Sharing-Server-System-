import express, { json } from 'express'
import { mkdir, readdir, rm, writeFile } from 'fs/promises'
import path from 'path'
// import directoryDB from "../directoryDB.json" with {type: "json"}
import fileDB from "../fileDB.json" with {type: "json"}
import userDB from "../userDB.json" with {type: "json"}
import { Db, ObjectId } from 'mongodb'

let router = express.Router()

//That router.param() check wheather if incomming id is valid of not before before touching DataBase
router.param('id', (req, res, next, id) => {
    if (id.length !== 24) {
        return res.status(404).json({ error: "Invalid Id" })
    }
    next()
})

//creating folder
router.post(['/', '/:dirName'], async (req, res, next) => {
    try {
        let rootDirId = req.headers.parentdirid == "undefined" ? req.user.rootDirId : req.headers.parentdirid
        let dirName = req.params.dirName || 'NewFolder'
        let db = req.db
        let createdDir = await db.collection('directoryDB').insertOne({ dirName, userId: req.cookies.uid, parentDirId: new ObjectId(rootDirId) })

        return res.status(201).json({ message: "Dir Has been created" })
    } catch (error) {
        next(error)
    }
})

//serving Directory
router.get(['/', '/:id'], async (req, res) => {

    let db = req.db
    let id = req.params.id || req.user.rootDirId
    let rootDir = await db.collection('directoryDB').findOne({ _id: new ObjectId(id) })

    const directories = await db.collection('directoryDB').find(
        { parentDirId: new ObjectId(id) }
    ).toArray();

    const files = await db.collection('fileDB').find({
        parentId: new ObjectId(id)
    }).toArray()

    if (!rootDir) {
        return res.status(404).json({ error: "Directory not found" })
    }

    let directoryDB = [rootDir]
    // let files = []
    return res.status(200).json({ ...directoryDB[0], directories, files })
})

//renaming Directory
router.patch('/:id', async (req, res, next) => {
    console.log('dirid');
    let dirid = req.params.id
    let newName = req.headers.filename
    let db = req.db
    try {
        let o = await db.collection('directoryDB').updateOne({ _id: new ObjectId(dirid) }, { $set: { dirName: newName } })
        return res.status(200).json({ message: '{what:dir Had updated directory Name}' })
    } catch (error) {
        next(error)
    }
})

//deleting Directory
router.delete("/:id", async (req, res, next) => {
    try {
        let dirId = req.params.id
        await recursiveDeletionDirectory(dirId, req)
        // writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        // writeFile('./fileDB.json', JSON.stringify(fileDB))
        res.status(200).json({ message: `We deleted directory Successfully !` })
    } catch (error) {
        next(error)
    }
})

//This function recursively delete file and filers from directory
async function recursiveDeletionDirectory(id, req) {
    let dirId = id
    let db = req.db
    let data = await db.collection('directoryDB').find({ _id: new ObjectId(dirId) }).toArray()
    let data1 = await db.collection('directoryDB').find({ parentDirId: new ObjectId(dirId) }).toArray()
    console.log(data1);
    return
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