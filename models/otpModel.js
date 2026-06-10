import mongoose, { Schema, model, Types } from "mongoose"

let otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: Number,
        required: true
    },
    frequency: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    },

}, {

});

let OTP = model("OTP", otpSchema, "OTP");



export default OTP