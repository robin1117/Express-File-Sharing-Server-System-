import { createClient, SCHEMA_FIELD_TYPE } from "redis";

let redisClient = createClient();

async function creatingIndexForSesssion() {
  await redisClient.connect();
  try {
    await redisClient.ft.create(
      "session",
      {
        "$.userId": {
          type: SCHEMA_FIELD_TYPE.TAG,
          AS: "userId",
        },
      },
      { PREFIX: "session:", ON: "JSON" },
    );
    console.log("Index created successfully!");
    console.log(await redisClient.ft._list());
  } catch (error) {
    console.log(await redisClient.ft._list());
    console.log(error.message);
  } finally {
    await redisClient.disconnect();
  }
}

creatingIndexForSesssion();
