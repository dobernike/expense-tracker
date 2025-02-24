import base64
import json

from bs4 import BeautifulSoup
from googleapiclient.errors import HttpError

from ..actions import actions
from ..auth.auth import service

EXPENSE_SYNCED_LABEL = "EXPENSE_SYNCED"
AIRBNB_SUBJECT_FIRST_PART = "Reservation confirmed for"


def create_label(service):
    try:
        response = (
            service.users()
            .labels()
            .create(
                userId="me",
                body={
                    "name": EXPENSE_SYNCED_LABEL,
                    "labelListVisibility": "labelShow",
                    "messageListVisibility": "show",
                },
            )
            .execute()
        )
        print(f"Label created: ${response.get('name')}")
        return response.get("id")
    except HttpError as err:
        if err.resp.status == 409:
            print("Label already exists.")
            existing_labels = service.users().labels().list(userId="me").execute()
            labels = existing_labels.get("labels", [])

            label = next(
                (l for l in labels if l.get("name") == EXPENSE_SYNCED_LABEL), None
            )
            if label:
                return label["id"]
        else:
            print("Error creating label:", err)
            raise err


# https://thepythoncode.com/article/use-gmail-api-in-python
def search_messages(service, query):
    result = service.users().messages().list(userId="me", q=query).execute()
    messages = []
    if "messages" in result:
        messages.extend(result["messages"])
    while "nextPageToken" in result:
        page_token = result["nextPageToken"]
        result = (
            service.users()
            .messages()
            .list(userId="me", q=query, pageToken=page_token)
            .execute()
        )
        if "messages" in result:
            messages.extend(result["messages"])
    return messages


def mark_message_as_synced(messages_to_mark, label_id):
    return (
        service.users()
        .messages()
        .batchModify(
            userId="me",
            body={
                "ids": [msg["id"] for msg in messages_to_mark],
                "addLabelIds": [label_id],
            },
        )
        .execute()
    )


def sync_email_with_expenses() -> None:
    query = f"from:automated@airbnb.com subject:'{AIRBNB_SUBJECT_FIRST_PART}' is:unread -label:{EXPENSE_SYNCED_LABEL}"
    results = search_messages(
        service,
        query,
    )
    if len(results) == 0:
        print("No emails found for sync expense")
        return

    sync_label_id = create_label(service)
    if sync_label_id is None:
        return

    messages_to_mark = []
    for message in results:
        print("message", message)
        msg = (
            service.users()
            .messages()
            .get(userId="me", id=message["id"], format="full")
            .execute()
        )
        payload = msg["payload"]

        headers = payload.get("headers")

        subject = None
        for header in headers:
            if header["name"] != "Subject":
                continue
            subject = header["value"]
            break

        if subject is None:
            continue

        print("headers name", subject)
        encoded_html = (
            payload.get("parts")[1]
            .get("body")
            .get("data")
            .replace("-", "+")
            .replace("_", "/")
        )

        html_string = base64.b64decode(encoded_html).decode("utf-8")
        soup = BeautifulSoup(html_string, "html.parser")
        script_tag = soup.find("script", {"data-testid": "siri-markup"})

        if script_tag is None:
            continue

        script_tag.get_text()
        json_text = script_tag.text.strip()
        data = json.loads(json_text)
        checkin_date = data.get("checkinDate")[:10]  # 2025-03-03
        # checkout_date = data.get("checkoutDate")[:10]

        amount_paid_element = soup.select(".right.heading3")
        if amount_paid_element[-1] is None:
            continue
        amount_str = amount_paid_element[-1].get_text()
        amount_clean_str = amount_str.replace("$", "").replace(",", "")
        amount = float(amount_clean_str)

        description = subject.replace(
            AIRBNB_SUBJECT_FIRST_PART,
            "rent",
        )

        print(
            f"Trying to add expense for {description} on {checkin_date} with amount {amount}"
        )
        actions.add_expense(description=description, amount=amount, date=checkin_date)
        messages_to_mark.append(message)

    len_messages = len(messages_to_mark)
    if len_messages > 0:
        print(f"Added {len_messages} expense{'s' if len_messages > 1 else ''}")
        mark_message_as_synced(messages_to_mark, sync_label_id)
        print("Marked messages as synced")
    else:
        print("Error adding expense")


def main():
    sync_email_with_expenses()


if __name__ == "__main__":
    main()
