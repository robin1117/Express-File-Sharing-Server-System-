import { ObjectId } from "mongodb";
import usrModel from "../models/userModel.js";


export default async function auth(req, res, next) {
    let { uid } = req.cookies
    try {
        console.log({ uid });
        let expireTime = uid.substr(24, 9)
        let currentTime = Math.round(Date.now() / 1000)

        if (parseInt(expireTime, 16) < currentTime) {
            console.log('You are Logged In');
            res.clearCookie('uid')
        }
        
        let user = await usrModel.findOne({ _id: uid.substr(0, 24) }).lean()
        if (!user) {
            return res.status(401).json({ error: "You Not loggined" })
        }
        req.user = user
        next()

    } catch (error) {
        next(error.message)
    }
}