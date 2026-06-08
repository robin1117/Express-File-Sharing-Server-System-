import { ObjectId } from "mongodb"
import usrModel from "../models/userModel.js"
import directoryModel from "../models/directoryModel.js"
import { startSession, Types } from "mongoose"
import crypto from "node:crypto";
import bcrypt from 'bcrypt';
import Session from "../models/sessionModel.js";


export let secretKey = "mynameisrobin159753"

export const userRegister = async (req, res, next) => {

    const { name, email, password } = req.body

    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    // let hashedpassword = await bcrypt.hash(password, 12)

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
            password: password,
            rootDirId
        }, { session })


        session.commitTransaction()
        return res.status(201).json({ message: "New User Generated", status: "success" });

    } catch (error) {

        session.abortTransaction()
        // console.log(error);
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

    let user = await usrModel.findOne({ email: email.toLowerCase() })

    if (!user) {
        return res.status(401).json({ message: "user dosen`t exist, you haven`t register yet", error: 'invalid Credentials' })
    }


    // let isPassValid = await bcrypt.compare(password, user.password)
    let isPassValid = await user.comparePass(password)

    console.log(password);
    console.log(user.password);
    console.log(isPassValid);
    // let [savedHashedPassword, salt] = user.password.split('.')
    // let clacluatedHashPassTypeByUser = crypto.pbkdf2Sync(password, Buffer.from(salt, 'base64url'), 100000, 32, 'sha256').toString('base64url')

    if (!isPassValid) {
        return res.status(401).json({ message: "user dosen`t exist, you haven`t register yet", error: 'invalid Credentials' })
    }

    let arrayOfSession = await Session.find({ userId: user._id })
    console.log(arrayOfSession.length);

    if (arrayOfSession.length >= 3) {
        await arrayOfSession[0].deleteOne()
    }

    let session = await Session.create({ userId: user._id })

    // let cookiePayload = JSON.stringify({
    //     usrId: user._id.toString(),
    //     expiryTime: Math.round((Date.now() / 1000) + 100000),
    // })


    // let signature = crypto.createHash('sha256').update(secretKey).update(cookiePayload).update(secretKey).digest('base64url') //base64URL
    // let signedCookiePayload = `${Buffer.from(cookiePayload, 'utf8').toString('base64url')}.${signature}` //base64URL

    res.cookie('sid', session._id
        , {
            secure: 'secure',
            // secure: true,
            signed: true,
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
    res.cookie('sid', "", {
        maxAge: 0,
        sameSite: "none",
        secure: 'secure',
    })
    res.status(200).json({ message: 'Loggedout' })
}

export const logoutAll = async (req, res) => {
    console.log('Attempting logout All',);
    let { sid } = req.signedCookies
    let session = await Session.findById(sid)
    await Session.deleteMany({ userId: session.userId })
    res.clearCookie('sid')
    res.status(200).json({ message: 'Loggedout from All' })
}

