import { google } from "googleapis";
import { auth } from "../auth/auth.ts";
import { addExpense } from "../actions/actions.ts";

const EXPENSE_SYNCED_LABEL = "EXPENSE_SYNCED";
const AIRBNB_SUBJECT_FIRST_PART = "Reservation confirmed for";

const gmail = google.gmail({ version: "v1", auth });

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

async function getMessages() {
  console.log("Searching emails for sync expense");

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100,
    q: `from:automated@airbnb.com subject:"${AIRBNB_SUBJECT_FIRST_PART}" is:unread -label:${EXPENSE_SYNCED_LABEL}`,
  });

  return response.data.messages;
}

async function markMessageAsSynced(messageId: string, syncLabelId: string) {
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: [syncLabelId],
    },
  });
  console.log(`Message: ${messageId} marked as ${EXPENSE_SYNCED_LABEL}`);
}

export async function syncEmailsWithExpenses() {
  const messages = await getMessages();

  if (messages) {
    // TODO: think to move this outside of the fn
    const syncLabelId = await createLabel();

    for (const { id } of messages) {
      const message = await gmail.users.messages.get({
        userId: "me",
        id: id as string,
      });

      if (!message.data.payload?.headers) continue;

      const subject = message.data.payload.headers.find(
        (header) => header.name === "Subject"
      );

      if (!subject || !subject.value) continue;

      // get the checkin date and paid amount from message body parts
      const decodedString = atob(
        (message.data.payload?.parts?.[1].body?.data ?? "")
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

      markMessageAsSynced(id as string, syncLabelId);
    }
  } else {
    console.log("No emails found for sync expense");
  }
}
