import express from 'express'
import { mkdir, readdir } from 'fs/promises'
import path from 'path'

let router = express.Router()

function locateToStorage(req) {
    const filePath = (req.params.directURL || []).join('/')
    return path.join(import.meta.dirname, '/../storage', filePath)
}

//serving Directory
router.get(['/', '/*directURL'], async (req, res) => {
    let fileNamesArr = await readdir(locateToStorage(req))
    let newArr = await Promise.all(fileNamesArr.map(async (filename) => {
        let status = await stat(`${locateToStorage(req)}/${filename}`)
        let isdir = status.isDirectory()
        let naam = filename
        return { naam, isdir }
    }))

    res.json(newArr)
})

//creating folder
router.post(['/', '/*directURL'], async (req, res) => {
    try {
        console.log('serving Directory');
        await mkdir(`${locateToStorage(req)}/NewFolder`)
        res.json('{what:dir Has been created}')
    } catch (error) {
        res.json(error.message)
    }
})


export default router