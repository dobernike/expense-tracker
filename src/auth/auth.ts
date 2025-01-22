import { join } from "node:path";
import { google } from "googleapis";
import credentials from "./credentials.json" with { type: "json" };

const TOKENS_NAME = "tokens.json";
const TOKENS_PATH = join(import.meta.dirname, TOKENS_NAME);

export const auth = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0],
);

const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

export const generateAuthUrl = () =>
  auth.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

import fs from "fs/promises";

const getAccessToken = async () => {
  try {
    const token = JSON.parse(await fs.readFile(TOKENS_PATH, "utf-8"));

    const currentTime = new Date().getTime();
    if (token.expiry_date && token.expiry_date > currentTime) {
      console.log("Access token is still valid");
      return token;
    }

    if (!token.refresh_token) {
      throw new Error("No refresh token is set.");
    }

    auth.setCredentials({ refresh_token: token.refresh_token });
    const newToken = (await auth.refreshAccessToken()).credentials;
    await fs.writeFile(TOKENS_PATH, JSON.stringify(newToken));
    console.log("Access token refreshed successfully");
    return newToken;
  } catch (error) {
    if (error?.response?.data?.error === "invalid_grant") {
      console.log("Refresh token is invalid or expired. Re-authenticating...");
      const authUrl = generateAuthUrl();
      // After user re-authenticates, will get a new refresh token
      console.log("Authorize this app by visiting this url:", authUrl);
    } else {
      console.error("Error refreshing access token:", error);
    }
  }
};

export async function authorize(code?: string) {
  let token;
  if (code) {
    const authToken = await auth.getToken(code);
    token = authToken.tokens;
    await fs.writeFile(TOKENS_PATH, JSON.stringify(token));
    console.log("Token saved successfully!");
  } else {
    token = await getAccessToken();
    if (!token) throw new Error("No saved token found!");
  }

  auth.setCredentials(token);
}
