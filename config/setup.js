import mongoose from "mongoose";
import { connectDB } from "./db.js";

await connectDB();
const client = mongoose.connection.getClient();
const db = mongoose.connection.db;

// console.log(client);

let cmdType = "collMod";
try {
  await db.command({
    [cmdType]: "userDB",
    validator: {
      $jsonSchema: {
        required: ["_id", "name", "email", "password", "rootDirId"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          name: {
            bsonType: "string",
          },
          email: {
            bsonType: "string",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
          },
          profilePic: {
            bsonType: ["string", "null"],
          },
          role: {
            bsonType: "string",
            enum: ["user", "admin", "manager"],
          },
          password: {
            bsonType: "string",
          },
          rootDirId: {
            bsonType: "objectId",
          },
        },
        additionalProperties: true,
      },
    },
  });
  await db.command({
    [cmdType]: "fileDB",
    validator: {
      $jsonSchema: {
        required: ["_id", "fileName", "userId", "extension", "parentId"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          fileName: {
            bsonType: "string",
          },
          extension: {
            bsonType: "string",
          },
          userId: {
            bsonType: "objectId",
          },
          parentId: {
            bsonType: "objectId",
          },
        },
        additionalProperties: false,
      },
    },
  });
  await db.command({
    [cmdType]: "directoryDB",
    validator: {
      $jsonSchema: {
        required: ["_id", "dirName", "userId", "parentDirId"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          dirName: {
            bsonType: "string",
          },
          userId: {
            bsonType: "objectId",
          },
          parentDirId: {
            bsonType: ["objectId", "null"],
          },
        },
        additionalProperties: true,
      },
    },
  });
  console.log("validation is implemented Successfully");
} catch (error) {
  console.log("validation is implemented Failed", error);
} finally {
  client.close();
}
