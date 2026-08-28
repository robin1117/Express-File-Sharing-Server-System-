import mongoose, { Schema, model, Types } from "mongoose";
import { type } from "node:os";

let paswordResetToken = new Schema({
  userId: {
    type: Types.ObjectId,
    unique: true,
    default: null,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: process.env.TTL_Time_Token,
  },
});

let pasResetToken = model("tokenDB", paswordResetToken, "tokenDB");

export default pasResetToken;
