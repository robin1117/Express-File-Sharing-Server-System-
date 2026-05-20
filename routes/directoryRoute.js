import express, { json } from 'express'
import { mkdir, readdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import { Db, ObjectId } from 'mongodb'
import { creatingFolder, deletingDirectoryRecursively, renamingDirectory, servingDirectory } from '../Controllers/directoryController.js'

let router = express.Router()

//That router.param() check wheather if incomming id is valid of not before before touching DataBase
router.param('id', (req, res, next, id) => {
    if (!ObjectId.isValid(id)) {
        return res.status(404).json({ error: "Invalid Id" })
    }
    next()
})

//creating folder
router.post(['/', '/:dirName'], creatingFolder)

//serving Directory
router.get(['/', '/:id'], servingDirectory)


router.route("/:id").patch(renamingDirectory).delete(deletingDirectoryRecursively)

export default router