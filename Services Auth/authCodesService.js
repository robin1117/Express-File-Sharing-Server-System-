import { OAuth2Client } from "google-auth-library";

export const getGoogleInfo = async (code) => {
  const client = new OAuth2Client(
    process.env.YOUR_GOOGLE_CLIENT_ID,
    process.env.YOUR_GOOGLE_CLIENT_SECRET,
    process.env.YOUR_GOOGLE_REDIRECT_URI,
  );

  // exchaning code with access_token
  const { tokens } = await client.getToken(code);

  // verifiying the access_token to its authenticity using public key,is it really belong to google ?
  let ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.YOUR_GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
};

export const getGitInfo = async (code) => {
  // exchaning code with access_token
  let response = await fetch(`https://github.com/login/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.git_client_id,
      client_secret: process.env.git_client_Secrete,
      code: code,
      redirect_uri: process.env.git_redirect_uri,
    }),
  });

  let { access_token, token_type, scope } = await response.json();

  // exchaning access_token with user Data
  let user = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "content-type": "application/json",
    },
  });
  let payload = await user.json();
  return payload;
};
