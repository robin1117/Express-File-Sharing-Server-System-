import { Resend } from "resend";
import OTP from "../models/otpModel.js";

const resend = new Resend("re_jVdt3gWF_M5J533HQh6WKTYpb8UMYdkDA");

export async function sendOtp(email) {
  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let otpRec = await OTP.findOneAndUpdate(
      { email },
      {
        $set: {
          otp,
          createdAt: new Date(),
        },
        $inc: {
          frequency: 1,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    console.log(otpRec.frequency);
    if (otpRec.frequency > 10) {
      return {
        success: false,
        message: "You corsses the today`s limit for otp try after 24hr",
      };
    }

    const html = `
  <div style="font-family:sans-serif;">
  <h2>Your OTP is: ${otp}</h2>
  <p>This OTP is valid for 10 minutes.</p>
  </div>
  `;

    // let result = await resend.emails.send({
    //   from: "Free Storage Hub<otp@chayaindustries.in>",
    //   to: email,
    //   subject: "Storage App OTP",
    //   html,
    // });

    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.log(error);
  }
}
