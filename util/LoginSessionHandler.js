import { ObjectId } from "mongodb";
import redisClient from "../config/redisConfgControl/redis.js";

export async function generateSession(user) {
  let totalNumberOfSession = await redisClient.ft.search(
    "session",
    `@userId:{${user.id}}`,
  );

  if (totalNumberOfSession.total >= 3) {
    let targetKey = totalNumberOfSession.documents[0].id;
    await redisClient.del(targetKey);
  }

  let sessionId = `session:${new ObjectId().toString()}`;
  let sessionData = { userId: user._id, rootDirId: user.rootDirId };
  await redisClient.json.set(sessionId, "$", sessionData);
  await redisClient.expire(sessionId, 60*60);

  return sessionId;
}

