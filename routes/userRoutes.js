import express from 'express'
import { writeFile } from 'fs/promises'
import directoryDB from "../directoryDB.json" with {type: "json"}
import userDB from "../userDB.json" with {type: "json"}
import cors from "cors";
import auth from '../middlewares/auth.js';

let router = express.Router()


router.post('/register', async (req, res, next) => {

    const { name, email, password } = req.body
    const rootDirId = crypto.randomUUID()
    const userId = crypto.randomUUID()

    let userThatExist = userDB.find((user) => user.email == email)

    if (userThatExist) {
        return res.status(409).json({ message: "Try with different Email bro", error: 'user already exist' })
    }

    userDB.push({
        id: userId,
        name,
        email: email,
        password,
        rootDirId
    })

    directoryDB.push({
        id: rootDirId,
        name: `root-${email}`,
        dirName: 'root',
        userId,
        parentDirId: null,
        files: [],
        directories: []
    })
    try {
        await writeFile('./userDB.json', JSON.stringify(userDB))
        await writeFile('./directoryDB.json', JSON.stringify(directoryDB))
        return res.status(201).json({ message: "New User Generated", status: "success" });
    } catch (error) {
        next(error)
    }
})

router.post('/login', async (req, res, next) => {
    let db = req.db
    console.log(db.namespace);

    const { email, password } = req.body
    console.log(req.body);
    let user = userDB.find((user) => user.email === email)

    if (!user) {
        return res.status(401).json({ message: "user dosen`t exist, you haven`t register yet", error: 'user dosen`t exist' })
    }
    if (user.password !== password) {
        return res.status(401).json({ message: "", error: 'Invalid Credientials' })
    }

    res.cookie('uid', user.id, {
        secure: 'secure',
        maxAge: 1000 * 60 * 60,
        httpOnly: true
    })

    return res.status(200).json({ message: "Login Susscess" })

})

router.get('/', auth, (req, res) => {
    res.status(200).json({ name: req.user.name, email: req.user.email })
})

router.post('/logout', (req, res) => {
    res.cookie('uid', "", {
        maxAge: 0
    })
    res.status(200).json({ message: 'Loggedout' })
})

export default router