import userDB from "../userDB.json" with {type: "json"}
export default function auth(req, res, next) {
    let { uid } = req.cookies
    let user = userDB.find(({ id }) => id == uid)
    if (!uid || !user) {
        return res.status(401).json({ error: "You Not loggined" })
    }
    req.user = user
    next()
}