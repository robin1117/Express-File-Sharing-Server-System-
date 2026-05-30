import { ObjectId } from "mongodb";
import usrModel from "../models/userModel.js";
import crypto from "node:crypto";
import { secretKey } from "../Controllers/userController.js";

export default async function auth(req, res, next) {
    let { token } = req.cookies
    try {
        // console.log(token);

        let [payload, oldSignature] = token.split(".")
        let stringPayload = Buffer.from(payload, 'base64url').toString('utf-8')

        let newSignature = crypto.createHash('sha256').update(secretKey).update(stringPayload).update(secretKey).digest('base64url')

        if (oldSignature !== newSignature) {
            res.clearCookie('token')
            return res.status(401).json({ error: "You Not loggined" })
        }

        let { usrId, expiryTime } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
        let currentTime = Math.round(Date.now() / 1000)

        // console.log(new Date(currentTime*1000).toString());
        // console.log(new Date(parseInt(expiryTime, 16)*1000).toString());

        if (parseInt(expiryTime, 16) < currentTime) {
            console.log('You are Logged In');
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