import { ObjectId } from "mongodb"
import usrModel from "../models/userModel.js"
import directoryModel from "../models/directoryModel.js"
import { startSession, Types } from "mongoose"


export const userRegister = async (req, res, next) => {
    // let db = req.db
    const { name, email, password } = req.body

    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    // let userThatExist = await usrModel.findOne({ email })

    let session = await startSession()

    try {
        session.startTransaction()
        await directoryModel.insertOne({
            _id: rootDirId,
            name: `root-${email}`,
            dirName: 'root',
            userId: userId,
            parentDirId: null,
        }, { session })

        await usrModel.insertOne({
            _id: userId,
            name,
            email: email.toLowerCase(),
            password,
            rootDirId
        }, { session })
        session.commitTransaction()
        return res.status(201).json({ message: "New User Generated", status: "success" });

    } catch (error) {

        session.abortTransaction()
        if (error.code == 121) {
            return res.status(400).json({ error: 'Invalid input user already exist' })
        } else if (error.code == 11000) {
            if (error.keyValue.email) {
                return res.status(409).json({ message: "Try with different Email bro", error: 'This Email already exist' })
            }
        }
        else {
            next(error.error = "Document failed validation(Email)")
        }
    }
}

export const userLogin = async (req, res, next) => {
    // let db = req.db
    // console.log(db.namespace);

    const { email, password } = req.body

    let user = await usrModel.findOne({ email: email.toLowerCase(), password: password }).lean()
    // let user = await usrModel.find()

    console.log(user, email, password);
    if (!user) {
        return res.status(401).json({ message: "user dosen`t exist, you haven`t register yet", error: 'you are`t Neha 🤔' })
    }

    res.cookie('uid', user._id.toString() + Math.round((Date.now() / 1000) + 20).toString(16)
        , {
            secure: 'secure',
            // secure: true,
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
            sameSite: "none"
        })

    return res.status(200).json({ message: "Login Susscess" })

}

export const userGet = (req, res) => {
    res.status(200).json({ name: req.user.name, email: req.user.email })
}

export const userLogout = (req, res) => {
    console.log('Attempting logout');
    res.cookie('uid', "", {
        maxAge: 0,
        sameSite: "none",
        secure: 'secure',
    })
    res.status(200).json({ message: 'Loggedout' })
}

