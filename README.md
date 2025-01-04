# expense-tracker

# cli

- clone the repo
- install Node.js v22+
- run `npm link`

After that, the CLI will be added globally, and can be run as `etrack` from the terminal.

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

# Requirements

Application should run from the command line and should have the following features:

Users can add an expense with a description and amount.

- Users can update an expense
- Users can delete an expense.
- Users can view all expenses.
- Users can view a summary of all expenses.
- Users can view a summary of expenses for a specific month (of current year).

Here are some additional features that you can add to the application:

- Add expense categories and allow users to filter expenses by category.
- Allow users to set a budget for each month and show a warning when the user exceeds the budget.
- Allow users to export expenses to a CSV file.

# sync with GMAIL

Service for read messages from your gmail, search mail to find airbnb confirm mail and add info to `db.csv`. For get information about expense and rented dates

## prerequest

- clone the repo
- download node.js 22+
- install all dependencies by put the code in console - `npm install`
- Create credentials in Google Cloud Console:
  - Go to the Google Cloud Console and create a project.
  - Navigate to "API & Services" > "Dashboard" > "Enable APIs and Services".
  - Search for "Gmail API" and enable it.
  - Create credentials (OAuth client ID), and download the JSON file.
  - Add permissions for `gmail.readonly`, and `gmail.modify`
- Change `.env` based on your downloaded JSON data

For now:
service will connect to your gmail by OAuth and read messages from sender `AirBnB` to get information about confirmation (dates, city, price)

## how to use it:

start service - `npm start` and follow the console command

# Docker

- Install docker
- `docker build -t expense-tracker .`
- `docker run -d --restart unless-stopped -p 3000:3000 -v ~/db/db.csv:/app/db/db.csv expense-tracker`
- `docker run -d --restart unless-stopped -p 3000 -v $(pwd)/db/db.csv:/app/db/db.csv expense-tracker`
- `open localhost:3000 and sign-in into google account`
