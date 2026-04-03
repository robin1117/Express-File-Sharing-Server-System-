import express from 'express'
import { writeFile } from 'fs/promises'
import cors from "cors";
import auth from '../middlewares/auth.js';
import { Db, ObjectId } from 'mongodb';
import { client } from '../config/db.js';
let router = express.Router()

router.post('/register', async (req, res, next) => {
    let db = req.db
    const { name, email, password } = req.body

    const rootDirId = new ObjectId()
    const userId = new ObjectId()

    let userThatExist = await db.collection('userDB').findOne({ email: email })

    if (userThatExist) {
        return res.status(409).json({ message: "Try with different Email bro", error: 'user already exist' })
    }

    let session = client.startSession()
    try {
        session.startTransaction()
        await db.collection('directoryDB').insertOne({
            _id: rootDirId,
            name: `root-${email}`,
            dirName: 'root',
            userId: userId,
            parentDirId: null,
        }, { session })

        await db.collection('userDB').insertOne({
            _id: userId,
            name,
            email: email,
            password,
            rootDirId
        }, { session })
        session.commitTransaction()

        return res.status(201).json({ message: "New User Generated", status: "success" });
    } catch (error) {
        session.abortTransaction()
        console.log(error.code);//121
        next(error.error = "Document failed validation(Email)")
    }
})

router.post('/login', async (req, res, next) => {
    let db = req.db
    console.log(db.namespace);
    const { email, password } = req.body
    let user = await db.collection('userDB').findOne({ email: email, password: password })

    if (!user) {
        return res.status(401).json({ message: "user dosen`t exist, you haven`t register yet", error: 'you are`t Neha 🤔' })
    }

    res.cookie('uid', user._id.toString(), {
        secure: 'secure',
        // secure: true,
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
        sameSite: "none"
    })

    return res.status(200).json({ message: "Login Susscess" })
})

router.get('/', auth, (req, res) => {
    res.status(200).json({ name: req.user.name, email: req.user.email })
})

router.post('/logout', (req, res) => {
    console.log('Attempting logout');
    res.cookie('uid', "", {
        maxAge: 0,
        sameSite: "none",
        secure: 'secure',
    })
    res.status(200).json({ message: 'Loggedout' })
})

export default router