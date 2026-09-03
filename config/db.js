import mongoose from "mongoose";
import dns from "dns";

// Force Node.js to use IPv4 DNS resolution first (Fixes ENOTFOUND)
dns.setDefaultResultOrder("ipv4first");

export async function connectDB(params) {
  try {
    // Added a timeout option so your app doesn't hang indefinitely if DNS fails
    await mongoose.connect(process.env.MONGO_DB_URL, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDb_Client Connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("Server is Disconnected");
  process.exit(0);
});
