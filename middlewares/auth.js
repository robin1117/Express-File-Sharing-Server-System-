import { ObjectId } from "mongodb";
import userDB from "../userDB.json" with {type: "json"}

export default async function auth(req, res, next) {
    let { uid } = req.cookies
    let db = req.db
    let user = await db.collection('userDB').findOne({ _id: new ObjectId(uid) })
    if (!user) {
        return res.status(401).json({ error: "You Not loggined" })
    }
    req.user = user
    next()
}