import express, { json } from 'express'
import { mkdir, readdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import { Db, ObjectId } from 'mongodb'

let router = express.Router()

//That router.param() check wheather if incomming id is valid of not before before touching DataBase
router.param('id', (req, res, next, id) => {
    if (!ObjectId.isValid(id)) {
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
        let createdDir = await db.collection('directoryDB').insertOne({ _id: new ObjectId(), dirName, userId: new ObjectId(req.cookies.uid), parentDirId: new ObjectId(rootDirId) })
        console.log(createdDir);

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
    let dirid = req.params.id
    let newName = req.body.fileName
    console.log(newName);
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
        res.status(200).json({ message: `We deleted directory Successfully !` })
    } catch (error) {
        next(error)
    }
})

//This function recursively delete file and filers from directory
async function recursiveDeletionDirectory(id, req) {
    let dirId = id
    let db = req.db

    let directCollection = await db.collection('directoryDB').find({ parentDirId: new ObjectId(dirId) }).toArray()
    let fileCollection = await db.collection('fileDB').find({ parentId: new ObjectId(dirId) }).toArray()

    if (fileCollection.length) {
        for await (let fileObject of fileCollection) {
            let fileid = fileObject._id
            let fullName = `${fileid}${fileObject.extension}`
            try {
                await rm(path.join(import.meta.dirname, '/../storage', fullName))
                await db.collection('fileDB').deleteOne({ _id: new ObjectId(fileid) })
            } catch (error) {
                console.log('file Not found or deletd already');
            }
        }
    }
    if (directCollection.length) {
        for (let dirObject of directCollection) {
            console.log(dirObject._id);
            await recursiveDeletionDirectory(dirObject._id, req)
        }
    }
    await db.collection('directoryDB').deleteOne({ _id: new ObjectId(dirId) })

}


export default router