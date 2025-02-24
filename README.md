# expense-tracker

# cli

- clone the repo
- install python3 and pipx
- open in root project folder
- run in terminal - `echo "DB_EXPENSE_TRACKER=$(realpath db/db.csv)" > .env`
- and - `pipx install .`


After that, the CLI will be added globally, and can be run as `etrack` from the fish terminal.
Also it will add CLI tool sync with GMAIL - check header `sync with GMAIL`

## The list of commands and their expected output is shown below:

$ etrack add --description "Lunch" --amount 20

`Expense added successfully (ID: 1)`

$ etrack add --description "Dinner" --amount 10

`Expense added successfully (ID: 2)`

$ etrack list

`ID  Date       Description  Amount`

`1   2024-08-06  Lunch        $20`

`2   2024-09-06  Dinner       $10`

$ etrack summary

`Total expenses: $30`

$ etrack summary --month 8

`Total expenses for August: $20`

$ etrack delete --id 2

`Expense deleted successfully`

## Description of CLI

Application run from the command line and have the following features:

Users can add an expense with a description and amount.

- Users can update an expense
- Users can delete an expense.
- Users can view all expenses.
- Users can view a summary of all expenses.
- Users can view a summary of expenses for a specific month (of current year). Now w/o year option
- Users can export/download expenses as CSV file.

## additional requirements

Here are some additional features that could be add to the aplication:

- Add expense categories and allow users to filter expenses by category.
- Allow users to set a budget for each month and show a warning when the user exceeds the budget.

# sync with GMAIL

Service for read messages from your gmail, search mail to find airbnb confirm mail and add info to `db.csv`. For get information about expense and rented dates

## prerequest

- clone the repo
- Create credentials in Google Cloud Console:
  - Go to the Google Cloud Console and create a project.
  - Navigate to "API & Services" > "Dashboard" > "Enable APIs and Services".
  - Search for "Gmail API" and enable it.
  - Create credentials (OAuth client ID), and download the JSON file.
  - Rename it to credentials.json and put it in the current directory of the project.
  - Add permissions for `gmail.readonly`, and `gmail.modify`

For now:
service will connect to your gmail by OAuth and read messages from sender `AirBnB` to get information about confirmation (dates, city, price)

## how to use it:

- For sync with GMAIL manually run `gmailsync` everytime when you want to check new expenses from gmail

### Automatic sync

For macOS, it could be done with `launchctl`:
in root folder, run follow commands:
  - `cp com.etrack.gmailsync.plist ~/Library/LaunchAgents/`
  - `launchctl load ~/Library/LaunchAgents/com.etrack.gmailsync.plist`
It will start automatically every day at 22:00 PM
