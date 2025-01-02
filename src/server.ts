import http from "node:http";
import url from "node:url";
import { google } from "googleapis";
import credentials from "../credentials.json" with { type: "json" };
import { addExpense } from "./actions/index.ts";
import { scheduler } from "./utils/index.ts";

const PORT = 3000;
const EXPENSE_SYNCED_LABEL = "EXPENSE_SYNCED";
const AIRBNB_SUBJECT_FIRST_PART = "Reservation confirmed for";

const auth = new google.auth.OAuth2(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0]
);

const gmail = google.gmail({ version: "v1", auth });

const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url ?? "", true);
  const query = parsedUrl.query;

  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "content-type": "text/html" });
    const url = auth.generateAuthUrl({ access_type: "offline", scope: scopes });
    res.end(`<a href="${url}">Login with Google</a>`);
  } else if (parsedUrl.pathname === "/google-callback") {
    const code = query.code as string;
    if (!code) {
      console.error("Missing code parameter");
      res.writeHead(400, { "content-type": "text/plain" });
      res.end("Missing code parameter");
      return;
    }

    auth.getToken(code, async (err, tokens) => {
      if (err || !tokens) {
        res.writeHead(500, { "content-type": "text/plain" });
        res.end("Error retrieving access token");
        return;
      }
      auth.setCredentials(tokens);
      readEmails();
      scheduler.schedule(readEmails);
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("Sync expense is running");
    });
  } else if (parsedUrl.pathname === "/stop_sync") {
    scheduler.unschedule();
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("Sync expense is stopped");
  } else {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
});

async function createLabel(): Promise<string> {
  try {
    const response = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: EXPENSE_SYNCED_LABEL,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });
    console.log(`Label created: ${response.data.name}`);
    return response.data.id as string;
  } catch (err) {
    if (err.code === 409) {
      console.log("Label already exists.");
      const existingLabels = await gmail.users.labels.list({ userId: "me" });
      const label = existingLabels.data.labels?.find(
        (label) => label.name === EXPENSE_SYNCED_LABEL
      )!;
      return label.id as string;
    } else {
      console.error("Error creating label:", err);
      throw err;
    }
  }
}

async function readEmails() {
  console.log("Searching emails for sync expense");

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100,
    q: `from:automated@airbnb.com subject:"${AIRBNB_SUBJECT_FIRST_PART}" is:unread -label:${EXPENSE_SYNCED_LABEL}`,
  });

  const messages = response.data.messages;

  if (messages) {
    // TODO: think to move this outside of the fn
    const syncLabelId = await createLabel();

    for (const message of messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: message.id as string,
      });

      if (!msg.data.payload?.headers) continue;

      const subject = msg.data.payload.headers.find(
        (header) => header.name === "Subject"
      );

      if (!subject || !subject.value) continue;

      // get the checkin date and paid amount from message body parts
      const decodedString = atob(
        (msg.data.payload?.parts?.[1].body?.data ?? "")
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      );

      const checkinDate = decodedString.match(/"checkinDate":"([^"]+)"/)?.[1];
      // const checkoutDate = decodedString.match(/"checkoutDate":"([^"]+)"/)?.[1];
      const amountPaid = decodedString.match(
        /Amount paid \(USD\).*?\$([\d.]+)/
      )?.[1];
      const description = subject.value.replace(
        AIRBNB_SUBJECT_FIRST_PART,
        "rent"
      );

      await addExpense(description, Number(amountPaid), checkinDate);
      console.log(
        `Added expense for ${description} on ${checkinDate} with amount ${amountPaid}`
      );

      // Mark the message as synced
      await gmail.users.messages.modify({
        userId: "me",
        id: message.id as string,
        requestBody: {
          addLabelIds: [syncLabelId],
        },
      });
      console.log(`Message: ${message.id} marked as ${EXPENSE_SYNCED_LABEL}`);
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
