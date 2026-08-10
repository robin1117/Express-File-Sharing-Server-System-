import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.YOUR_REGION,
  credentials: {
    accessKeyId: process.env.YOUR_ACCESS_KEY,
    secretAccessKey: process.env.YOUR_SECRET_KEY,
  },
});

async function verifyS3Connection() {
  try {
    const command = new ListBucketsCommand({});
    await s3Client.send(command);
    console.log("✅ S3 bucket has been connected successfully!");
  } catch (error) {
    console.error("❌ S3 connection failed:", error);
  }
}


verifyS3Connection();

process.on("SIGINT", () => {
  console.log("\nS3 connection closed cleanly. Shutting down server...");
  s3Client.destroy();
  process.exit(0);
});

export default s3Client;
