import { join } from "node:path";
import { google } from "googleapis";
import credentials from "./credentials.json" with { type: "json" };

const TOKENS_NAME = "tokens.json";
const TOKENS_PATH = join(import.meta.dirname, TOKENS_NAME);

export const auth = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

export const generateAuthUrl = () =>
  auth.generateAuthUrl({ access_type: "offline", scope: scopes });

import fs from "fs/promises";

const saveTokens = async (tokens) => {
  try {
    await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2), "utf-8");
    console.log("Tokens saved successfully!");
  } catch (err) {
    console.log("Error saving tokens:", err.message);
  }
};

const readTokens = async () => {
  try {
    const data = await fs.readFile(TOKENS_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.log("Error reading tokens:", err.message);
    return null;
  }
};

export async function authorize(code?: string) {
  let tokens;
  if (code) {
    const authToken = await auth.getToken(code);
    tokens = authToken.tokens;

    await saveTokens(tokens);
  } else {
    tokens = await readTokens();
    if (!tokens) throw new Error("No saved tokens found!");
  }

  auth.setCredentials(tokens);
}
