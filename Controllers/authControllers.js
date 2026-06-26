import { startSession, Types } from "mongoose";
import OTP from "../models/otpModel.js";
import Session from "../models/sessionModel.js";
import usrModel from "../models/userModel.js";
import {
  getGitInfo,
  getGoogleInfo,
} from "../Services Auth/authCodesService.js";
import { sendOtp } from "../util/sendOtp.js";
import directoryModel from "../models/directoryModel.js";

export const sendOtpforEmailVerifiy = async (req, res, next) => {
  let { email } = req.body;
  let response = await sendOtp(email);
  res.json(response);
};

export const VerifiyOtpForEmailVerifiy = async (req, res, next) => {
  try {
    let { otp, email } = req.body;
    let otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.json({ success: false, message: "Invalid otp try again" });
    }
    await otpRecord.deleteOne();
    res.json({ success: true, message: "otp verified" });
  } catch (error) {
    console.log(error.message);
  }
};

export const loginWithAuthCode = async (req, res, next) => {
  let { code, from } = req.body;
  if (from === "Git_auth") {
    let userDataFromGit = await getGitInfo(code);

    let { email, name, id: sub, avatar_url: picture } = userDataFromGit;

    let user = await usrModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      const rootDirId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      let transistionSession = await startSession();
      try {
        transistionSession.startTransaction();
        await directoryModel.insertOne(
          {
            _id: rootDirId,
            name: `root-${email}`,
            dirName: "root",
            userId: userId,
            parentDirId: null,
          },
          { session: transistionSession },
        );

        await usrModel.insertOne(
          {
            _id: userId,
            name,
            email: email.toLowerCase(),
            password: "12345", //dummy password
            rootDirId,
            profilePic: picture,
          },
          { session: transistionSession },
        );
        transistionSession.commitTransaction();

        let session = await Session.create({ userId });

        res.cookie("sid", session._id, {
          secure: "secure",
          // secure: true,
          signed: true,
          maxAge: 1000 * 60 * 60,
          httpOnly: true,
          sameSite: "none",
        });

        return res
          .status(200)
          .json({ message: "Login Susscess", isLogin: true });
      } catch (error) {
        transistionSession.abortTransaction();
        next(error);
      }
    }
    let session = await Session.create({ userId: user._id });
    res.cookie("sid", session._id, {
      secure: "secure",
      // secure: true,
      signed: true,
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      sameSite: "none",
    });
    return res.status(200).json({ message: "Login Susscess", isLogin: true });
  }

  if (from === "Google_auth") {
    let userDataFromGoogle = await getGoogleInfo(code);
    let { email, name, sub, picture } = userDataFromGoogle;

    let user = await usrModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      const rootDirId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      let transistionSession = await startSession();
      try {
        transistionSession.startTransaction();
        await directoryModel.insertOne(
          {
            _id: rootDirId,
            name: `root-${email}`,
            dirName: "root",
            userId: userId,
            parentDirId: null,
          },
          { session: transistionSession },
        );

        await usrModel.insertOne(
          {
            _id: userId,
            name,
            email: email.toLowerCase(),
            password: "12345", //dummy password
            rootDirId,
            profilePic: picture,
          },
          { session: transistionSession },
        );
        transistionSession.commitTransaction();

        let session = await Session.create({ userId });

        res.cookie("sid", session._id, {
          secure: "secure",
          // secure: true,
          signed: true,
          maxAge: 1000 * 60 * 60,
          httpOnly: true,
          sameSite: "none",
        });

        return res
          .status(200)
          .json({ message: "Login Susscess", isLogin: true });
      } catch (error) {
        transistionSession.abortTransaction();
        console.log(error);
        // next(error);
      }
    }

    let session = await Session.create({ userId: user._id });

    res.cookie("sid", session._id, {
      secure: "secure",
      // secure: true,
      signed: true,
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      sameSite: "none",
    });
    return res.status(200).json({ message: "Login Susscess", isLogin: true });
  }
};
