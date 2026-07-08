
import mongoose from "mongoose";

// export const client = new MongoClient("mongodb://127.0.0.1:27017/storageApp")
// export const client = new MongoClient("mongodb://dbAdminUser:user1@localhost:27017/storageApp") //accessing a aunthicated DB


export async function connectDB(params) {
    try {
        await mongoose.connect('mongodb://dbAdminUser:user1@localhost:27017/storageApp') //shifting to Mongoose
        console.log("MongoDb_Client Connected");
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
    //     await client.connect()
    //     let db = client.db() //todoApp
    //     return db
}

process.on("SIGINT", async () => {
    await mongoose.disconnect()
    console.log("Server is Disconnected");
    process.exit()
})