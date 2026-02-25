import express from 'express'
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from 'cors';
import cookieParser from "cookie-parser";
import auth from './middlewares/auth.js';

let app = express()

app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Methods', '*');
//     res.setHeader('Access-Control-Allow-Headers', '*');
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     next()
// })

app.use('/directory', auth, directoryRoutes)
app.use('/file', auth, fileRoutes)
app.use('/user', userRoutes)

// app.use((err, req, res, next) => {
//     res.status(err.status || 500).json({ message: "something went wrong !" })
// })

let ser = app.listen(5000, '0.0.0.0', () => {
    console.log(ser.address())
})
