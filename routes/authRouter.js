import express from "express";
import crypto from "node:crypto";
import {
  generatingTokenForRessetingPass,
  loginWithAuthCode,
  sendOtpforEmailVerifiy,
  VerifiyOtpForEmailVerifiy,
} from "../Controllers/authControllers.js";

import usrModel from "../models/userModel.js";
import pasResetToken from "../models/passwordResetTokenModel.js";
import {
  emailSchema,
  resetPasswordSchema,
} from "../validators/authValidators.js";

let router = express.Router();

router.post("/sent-otp", sendOtpforEmailVerifiy);

router.post("/verify-otp", VerifiyOtpForEmailVerifiy);

router.post("/auth-code", loginWithAuthCode);

router.post("/forgot-password", generatingTokenForRessetingPass);

router.post("/reset-password", async (req, res, next) => {
  let { success, data, error } = resetPasswordSchema.safeParse(req.body);
  if (!success) {
    return res.status(401).json(z4.treeifyError(error).properties);
  }
  let { token, password } = data;
  try {
    let generatedToken = Buffer.from(token, "base64url").toString("utf-8");
    let tokenObject = JSON.parse(generatedToken);
    let isTokenInDbExist = await pasResetToken.findById(tokenObject._id);

    if (!isTokenInDbExist) {
      return res.status(401).json({ msg: "Link is not valid anymore" });
    }

    let user = await usrModel.findById(isTokenInDbExist.userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.password = password; //resetting Pass

    await user.save();

    await pasResetToken.findByIdAndDelete(isTokenInDbExist._id);

    return res.status(200).json({ msg: "Password reset successful!" });
  } catch (error) {
    return res.status(500).json({ msg: "Internal server error" });
  }
});

export default router;
