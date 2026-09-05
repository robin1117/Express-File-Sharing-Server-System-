import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordUrl(email, token) {
  try {
    let generatedToken = Buffer.from(JSON.stringify(token), "utf-8").toString(
      "base64url",
    );
    const domain = process.env.CLIENT_ORIGIN_URL;
    const resetUrl = `${domain}/passwordReset?token=${generatedToken}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 40px; text-align: left;">
          <!-- Header / Brand -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #eef2f5;">
              <h1 style="margin: 0; font-size: 20px; color: #1a1f36; font-weight: 700;">Free Storage Hub</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-top: 24px; color: #4f566b; font-size: 15px; line-height: 1.6;">
              <p style="margin: 0 0 16px 0;">Hello,</p>
              <p style="margin: 0 0 24px 0;">We received a request to reset the password for your Free Storage Hub account. Click the button below to proceed.</p>
              
              <!-- Call to Action -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #4F46E5;">
                    <a href=${resetUrl} target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 15px; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 6px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #697386;">This link will expire in <strong>${process.env.TTL_Time_Token / 60} minutes</strong> for your security.</p>
              <p style="margin: 0; font-size: 13px; color: #697386;">If you didn't request a password reset, you can safely ignore this email.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid #eef2f5; margin-top: 32px; font-size: 12px; color: #a3acb9; text-align: center;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Free Storage Hub by . All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    await resend.emails.send({
      from: "Loader Storage App<system@chayaindustries.in>",
      to: email,
      subject: "Storage App OTP",
      html,
    });
  } catch (error) {
    console.log(error);
  }
}
