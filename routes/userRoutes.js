import express from 'express'
import { writeFile } from 'fs/promises'
import directoryDB from "../directoryDB.json" with {type: "json"}
import userDB from "../userDB.json" with {type: "json"}
import cors from "cors";
import auth from '../middlewares/auth.js';
import { Db } from 'mongodb';

let router = express.Router()


router.post('/register', async (req, res, next) => {
    let db = req.db
    const { name, email, password } = req.body
    const rootDirId = crypto.randomUUID()
    // const userId = crypto.randomUUID()

    let userThatExist = await db.collection('userDB').findOne({ email: email })

    if (userThatExist) {
        return res.status(409).json({ message: "Try with different Email bro", error: 'user already exist' })
    }

    let userId = await db.collection('userDB').insertOne({
        name,
        email: email,
        password,
        rootDirId
    })

    let insertedUserID = userId.insertedId

    let directoryId = await db.collection('directoryDB').insertOne({
        name: `root-${email}`,
        dirName: 'root',
        userId: insertedUserID,
        parentDirId: null,
    })

    let insertedDirectoryID = directoryId.insertedId

    db.collection("userDB").updateOne({ _id: insertedUserID }, { $set: { rootDirId: insertedDirectoryID } })


    // console.log(directoryId);


    try {
        return res.status(201).json({ message: "New User Generated", status: "success" });
    } catch (error) {
        next(error)
    }
})

router.post('/login', async (req, res, next) => {
    let db = req.db
    console.log(db.namespace);

    const { email, password } = req.body

    let user = await db.collection('userDB').findOne({ email: email, password: password })
    console.log();

 
    if (!user) {
        return res.status(401).json({ message: "user dosen`t exist, you haven`t register yet", error: 'user dosen`t exist' })
    }


    res.cookie('uid', user._id.toString(), {
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