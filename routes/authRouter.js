import express from 'express'
import { sendOtp } from '../util/sendOtp.js';
import OTP from '../models/otpModel.js';
let router = express.Router()

router.post('/sent-otp', async (req, res, next) => {
    let { email } = req.body
    let response = await sendOtp(email)
    res.json(response)
})

router.post('/verify-otp', async (req, res, next) => {
    let { otp, email } = req.body
    let otpRecord = await OTP.findOne({ email, otp })
    if (!otpRecord) {
        return res.json({ success: false, message: 'Invalid otp try again' })
    }
    await otpRecord.deleteOne()
    res.json({ success: true, message: 'otp verified' })
})

export default router