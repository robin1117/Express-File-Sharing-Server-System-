import { ObjectId } from "mongodb";
import usrModel from "../models/userModel.js";
import crypto from "node:crypto";
import { secretKey } from "../Controllers/userController.js";
import Session from "../models/sessionModel.js";

export default async function auth(req, res, next) {
    try {
        let { sid } = req.signedCookies
        if (!sid) {
            return res.status(401).json({ error: "1You Not loggined" })
        }

        let session = await Session.findById(sid)
        if (!session) {
            return res.status(401).json({ error: "2You Not loggined" })
        }

        let user = await usrModel.findById(session.userId).lean()
        if (!user) {
            return res.status(401).json({ error: "3You Not loggined" })
        }
        req.user = user
        next()

    } catch (error) {
        console.log('Problem in auth.js');
        next(error.message)
    }
}