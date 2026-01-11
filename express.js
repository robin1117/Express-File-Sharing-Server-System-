import express from 'express'
let app = express()
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoutes.js";

app.use(express.json())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
})

app.use('/directory', directoryRoutes)
app.use('/file', fileRoutes)

let ser = app.listen(5000, '0.0.0.0', () => {
    console.log(ser.address())
})
