import { ObjectId } from "mongodb";
import usrModel from "../models/userModel.js";
import crypto from "node:crypto";
import Session from "../models/sessionModel.js";

export default async function (req, res, next) {
  try {
    let { sid } = req.signedCookies;
    if (!sid) {
      return res.status(401).json({ error: "1You Not loggined" });
    }

    let session = await Session.findById(sid);
    if (!session) {
      return res.status(401).json({ error: "2You Not loggined" });
    }

    let user = await usrModel.findById(session.userId).lean();
    if (!user) {
      return res.status(401).json({ error: "3You Not loggined" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log("Problem in auth.js");
    next(error.message);
  }
}

export async function ifUserNotNormal(req, res, next) {
  if (req.user.role !== "user") return next();
  return res.status(403).json({
    message: "yor are not allowed to access this page",
    err: "Unauthorize",
  });
}

export async function ifUserDeleted(req, res, next) {
  if (!req.user.deleted) return next();
  return res.status(403).json({
    message: "Your Account has been deleted please contact admin",
    err: "Unauthorize",
  });
}
