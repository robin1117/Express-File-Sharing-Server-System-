import express from 'express'
import { createWriteStream, fstat } from 'fs'
import { mkdir, readdir, rename, rm, stat } from 'fs/promises'
let app = express()

app.use(express.json())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
})

//Read
app.get('/file/*fileName', (req, res, next) => {
    try {
        const filePath = (req.params.fileName || []).join('/')
        if (req.query.action == 'download') res.set('Content-Disposition', 'attachment')
        res.sendFile(`${import.meta.dirname}/storage/${filePath}`)
    } catch (error) {
        res.json(error.message)
    }
})

//serving Directory
app.get(['/directory', '/directory/*directURL'], async (req, res) => {
    let dirPath = (req.params.directURL || []).join('/')
    let fileNamesArr = await readdir(`./storage/${dirPath}`)
    let newArr = await Promise.all(fileNamesArr.map(async (filename) => {
        let status = await stat(`./storage/${dirPath}/${filename}`)
        let isdir = status.isDirectory()
        let naam = filename
        return { naam, isdir }
    }))

    res.json(newArr)
})

//uploading 
app.post('/file/*fileName', (req, res) => {
    try {
        const filePath = (req.params.fileName || []).join('/')
        console.log('fjhgsdjhkfgsdjhkfg');
        let writeStream = createWriteStream(`./storage/${filePath}`)
        req.pipe(writeStream)
        req.on('end', () => {
            res.json({ message: 'File has been sended' })
        })
    } catch (error) {
        res.json(error.message)
    }
})

//creating folder
app.post(['/directory/*directURL', '/directory'], async (req, res) => {
    try {
        let dirPath = (req.params.directURL || []).join('/')
        await mkdir(`./storage/${dirPath}/NewFolder`)
        res.json('{what:dir Has been created}')
    } catch (error) {
        res.json(error.message)
    }
})

//Delete file /folder
app.delete("/file/*fileName", async (req, res) => {
    try {
        const filePath = (req.params.fileName || []).join('/')
        await rm(`storage/${filePath}`, { recursive: true })
        res.json(`We deleted ${req.params.fileName} Successfully !`)
    } catch (error) {
        res.json(error.message)
    }
})

//Update
app.patch('/file/*fileName', async (req, res) => {
    try {
        const filePath = (req.params.fileName || []).join('/')
        await rename(`./storage/${filePath}`, `./storage/${req.body.newFileName}`)
        console.log(req.body.newFileName);
        res.json(`File Has been Renamed`)
    } catch (error) {
        res.json('sELETC ONE FILE ATLEAT')
    }
})



let ser = app.listen(5000, '0.0.0.0', () => {
    console.log(ser.address())
})
