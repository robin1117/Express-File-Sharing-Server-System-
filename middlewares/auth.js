import { ObjectId } from "mongodb";
import usrModel from "../models/userModel.js";


export default async function auth(req, res, next) {
    let { uid } = req.cookies
    try {
        console.log(uid);

        let { usrId, expiryTime } = JSON.parse(Buffer.from(uid, 'base64').toString('utf8'))

        let currentTime = Math.round(Date.now() / 1000)

        if (parseInt(expiryTime, 16) < currentTime) {
            console.log('You are Logged In');
            res.clearCookie('uid')
        }

        let user = await usrModel.findOne({ _id: usrId }).lean()

        if (!user) {
            return res.status(401).json({ error: "You Not loggined" })
        }
        req.user = user
        next()

    } catch (error) {
        next(error.message)
    }
}