import { createClient } from "redis";

let redisClient = createClient();

redisClient.on("connect", (a, b) => {
  console.log("redis is connected");
});

redisClient.on("error", (a, b) => {
  console.log("redis stuck somewhere");
});

await redisClient.connect();

process.on("SIGINT", async () => {
  await redisClient.disconnect();
  console.log("Server is Disconnected");
  process.exit();
});

export default redisClient;
