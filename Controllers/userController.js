import { ObjectId } from "mongodb";
import usrModel from "../models/userModel.js";
import directoryModel from "../models/directoryModel.js";
import { startSession, Types } from "mongoose";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import Session from "../models/sessionModel.js";
import fleModel from "../models/fileModel.js";
import { rm } from "node:fs/promises";
import path from "node:path";
import redisClient from "../config/redisConfgControl/redis.js";
import { generateSession } from "../util/LoginSessionHandler.js";
import { loginSchema, registerShema } from "../validators/authValidators.js";
import z4 from "zod/v4";

export const userRegister = async (req, res, next) => {
  try {
    let { success, data, error } = registerShema.safeParse(req.body);
    if (!success) {
      return res.status(401).json(z4.treeifyError(error).properties);
    }
    const { name, email, password } = data;
    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    let session = await startSession();
    session.startTransaction();
    await directoryModel.insertOne(
      {
        _id: rootDirId,
        name: `root-${email}`,
        dirName: "root",
        userId: userId,
        parentDirId: null,
      },
      { session },
    );

    await usrModel.insertOne(
      {
        _id: userId,
        name,
        email: email.toLowerCase(),
        password: password,
        rootDirId,
      },
      { session },
    );

    session.commitTransaction();
    return res
      .status(201)
      .json({ message: "New User Generated", status: "success" });
  } catch (error) {
    session.abortTransaction();
    // console.log(error);
    // console.log(error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied[0]);
    // console.log(error.errInfo.details.schemaRulesNotSatisfied[0].propertiesNotSatisfied[0].details);
    if (error.code == 121) {
      return res
        .status(400)
        .json({ error: "Invalid input user already exist" });
    } else if (error.code == 11000) {
      if (error.keyValue.email) {
        return res.status(409).json({
          message: "Try with different Email bro",
          error: "This Email already exist",
        });
      }
    } else {
      next((error.error = "Document failed validation(Email)"));
    }
  }
};

export const userLogin = async (req, res, next) => {
  try {
    let { success, data, error } = loginSchema.safeParse(req.body);

    if (!success) {
      return res.status(401).json({
        message: "invalid Credentials",
        error: error.issues[0].message,
      });
    }

    const { email, password } = data;

    let user = await usrModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        message: "invalid Credentials",
        error: "user dosen`t exist, you haven`t register yet",
      });
    }

    // let isPassValid = await bcrypt.compare(password, user.password)
    let isPassValid = await user.comparePass(password);

    if (!isPassValid) {
      return res.status(401).json({
        message: "invalid Credentials",
        error: "user dosen`t exist, you haven`t register yet",
      });
    }

    let sessionId = await generateSession(user);

    res.cookie("sid", sessionId, {
      secure: "secure",
      // secure: true,
      signed: true,
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      sameSite: "none",
    });

    return res.status(200).json({ message: "Login Susscess" });
  } catch (error) {
    next(error);
  }
};

export const userGet = (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    picture: req.user.profilePic,
  });
};

export const allUsersGet = async (req, res) => {
  let allUsers = await usrModel.find({ deleted: false }).lean();
  let allSessions = await Session.find().select({ userId: 1, _id: 0 });

  let setOfUserIdArray = new Set(
    allSessions.map(({ _id, userId }) => userId.toString()),
  );

  let modifiedData = allUsers.map(({ _id, name, email, role }) => {
    return {
      id: _id,
      name,
      email,
      isLoggedIn: setOfUserIdArray.has(_id.toString()),
    };
  });

  res.status(200).json(modifiedData);
};

export const deleteUser = async (req, res) => {
  let userId = req.params.userId;
  let { deleteType } = req.body;

  if (req.user._id == userId) {
    console.log(userId, deleteType);
    res.status(403).json({
      error: "Access Denied",
      reason: "you can not delete yourself Admin Role",
    });
  }

  if (deleteType == "hard") {
    let fileArray = await fleModel
      .find({ userId })
      .select({ _id: 1, extension: 1 });
    fileArray.forEach(async ({ _id, extension }) => {
      let fullName = `${_id}${extension}`;
      await rm(path.join(import.meta.dirname, "/../storage", fullName), {
        force: true,
      });
    });
    await Session.deleteMany({ userId });
    await usrModel.findOneAndDelete({ _id: userId });
    await directoryModel.deleteMany({ userId });
    await fleModel.deleteMany({ userId });
    return res
      .status(200)
      .json({ message: `User deleted Parmanentely ${userId}` });
  }
  await Session.deleteMany({ userId });
  await usrModel.findByIdAndUpdate({ _id: userId }, { deleted: true });
  return res.status(200).json({ message: `User deleted Softly ${userId}` });
};

export const userLogout = async (req, res) => {
  console.log("Attempting logout");
  let { sid } = req.signedCookies;
  res.clearCookie("sid");
  await redisClient.del(sid);
  // await Session.findByIdAndDelete(sid);
  res.status(200).json({ message: "Loggedout" });
};

export const logoutAll = async (req, res) => {
  console.log("Attempting logout All");
  let { sid } = req.signedCookies;
  res.clearCookie("sid");
  let session = await redisClient.json.get(sid);

  if (!session) {
    return res.status(200).json({ message: "Your Session Expire" });
  }

  let allSeesion = await redisClient.ft.search(
    "session",
    `@userId:{${session.userId}}`,
  );
  let arrayOfSessionId = allSeesion.documents.map(({ id }) => id);
  if (arrayOfSessionId.length > 0) {
    await redisClient.unlink(arrayOfSessionId);
    console.log(`Successfully unlinked ${arrayOfSessionId.length} sessions.`);
  }
  res.status(200).json({ message: "Loggedout from All" });
};

export const logoutFromUserId = async (req, res, next) => {
  try {
    if (req.user.role == "manager") {
      let userWhoIWantLogout = await usrModel.findById(req.params.userId);
      if (userWhoIWantLogout.role == "admin") {
        return res.status(200).json({
          message: `You are not authorize to logout ${userWhoIWantLogout.email}`,
        });
      }
    }
    await Session.deleteMany({ userId: req.params.userId });
    res.status(200).json({ message: `user ${req.params.userId} loggedOut` });
  } catch (error) {
    next(error);
  }
};
``;
