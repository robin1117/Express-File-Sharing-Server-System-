import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1:27017/todoApp")


export async function connectDB(params) {
    await client.connect()
    let db = client.db() //todoApp
    return db
}

process.on("SIGINT", async () => {
    await client.close()
    console.log("Server is Disconnected");
    process.exit()
})