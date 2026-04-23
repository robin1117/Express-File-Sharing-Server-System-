import express from 'express'
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from 'cors';
import cookieParser from "cookie-parser";
import auth from './middlewares/auth.js';
import { connectDB } from './config/db.js';

try {
    let db = await connectDB()
    // console.log(await db.listCollections().toArray()); //for listing all collections in my db

    let app = express()
    app.use((req, res, next) => {
        req.db = db
        next()
    })

    app.use(express.json())
    app.use(cookieParser())

    app.use(cors({
        origin: "http://localhost:5173",
        // origin: "http://192.168.1.10:5173",
        // origin: "https://devindrive.netlify.app",
        credentials: true
    }))

    // app.use((req, res, next) => {
    // res.setHeader('Access-Control-Allow-Methods', '*');
    // res.setHeader('Access-Control-Allow-Headers', '*');
    // res.setHeader('Access-Control-Allow-Origin', '*')
    //     next()
    // })

    app.use('/directory', auth, directoryRoutes)
    app.use('/file', auth, fileRoutes)
    app.use('/user', userRoutes)

    app.use((error, req, res, next) => {
        res.status(error.status || 500).json({ message: "something went wrong !", error })
    })

    let ser = app.listen(5000, '0.0.0.0', () => {
        console.log(ser.address())
    })

} catch (error) {
    console.log(error);
}