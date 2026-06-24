import express from "express";

import {
  loginWithAuthCode,
  sendOtpforEmailVerifiy,
  VerifiyOtpForEmailVerifiy,
} from "../Controllers/authControllers.js";

let router = express.Router();

router.post("/sent-otp", sendOtpforEmailVerifiy);

router.post("/verify-otp", VerifiyOtpForEmailVerifiy);

router.post("/auth-code", loginWithAuthCode);

export default router;
