import express from "express";
import {
  generatingTokenForRessetingPass,
  loginWithAuthCode,
  passwordResettingUsingToken,
  sendOtpforEmailVerifiy,
  VerifiyOtpForEmailVerifiy,
} from "../Controllers/authControllers.js";

let router = express.Router();

router.post("/sent-otp", sendOtpforEmailVerifiy);

router.post("/verify-otp", VerifiyOtpForEmailVerifiy);

router.post("/auth-code", loginWithAuthCode);

router.post("/forgot-password", generatingTokenForRessetingPass);

router.post("/reset-password", passwordResettingUsingToken);

export default router;
