import { ObjectId } from "mongodb";
import usrModel from "../models/userModel.js";
import crypto from "node:crypto";
import { secretKey } from "../Controllers/userController.js";

export default async function auth(req, res, next) {

    let { token } = req.signedCookies
    try {
        console.log(JSON.parse(token));

        let { usrId, expiryTime } = JSON.parse(token)
        let currentTime = Math.round(Date.now() / 1000)

        // console.log(new Date(currentTime*1000).toString());
        // console.log(new Date(parseInt(expiryTime, 16)*1000).toString());

        if (expiryTime < currentTime) {
            console.log('User Logged out');
            res.clearCookie('token')
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