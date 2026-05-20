import { ObjectId } from "mongodb";
import usrModel from "../models/userModel.js";


export default async function auth(req, res, next) {
    let { uid } = req.cookies
    console.log({ uid });
    // let db = req.db
    let user = await usrModel.findOne({ _id: new ObjectId(uid) }).lean()
    if (!user) {
        return res.status(401).json({ error: "You Not loggined" })
    }
    req.user = user
    next()
}