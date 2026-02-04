import express from 'express'
let app = express()
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from 'cors';

app.use(express.json())
app.use(cors())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
})

app.use('/directory', directoryRoutes)
app.use('/file', fileRoutes)
app.use('/user', userRoutes)

// app.use((err, req, res, next) => {
//     res.status(err.status || 500).json({ message: "something went wrong !" })
// })

let ser = app.listen(5000, '0.0.0.0', () => {
    console.log(ser.address())
})
