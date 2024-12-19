# expense-tracker

## The list of commands and their expected output is shown below:

$ npm start -- add --description "Lunch" --amount 20

`Expense added successfully (ID: 1)`

$ npm start -- add --description "Dinner" --amount 10

`Expense added successfully (ID: 2)`

$ npm start -- list

`ID  Date       Description  Amount`

`1   2024-08-06  Lunch        $20`

`2   2024-08-06  Dinner       $10`

$ npm start -- summary

`Total expenses: $30`

$ npm start -- summary --month 8

`Total expenses for August: $20`

$ npm start -- delete --id 2

`Expense deleted successfully`

# For what

practice with nodejs cli

https://roadmap.sh/projects/expense-tracker

# Requirements

Application should run from the command line and should have the following features:

Users can add an expense with a description and amount.

- Users can update an expense.
- Users can delete an expense.
- Users can view all expenses.
- Users can view a summary of all expenses.
- Users can view a summary of expenses for a specific month (of current year).

Here are some additional features that you can add to the application:

- Add expense categories and allow users to filter expenses by category.
- Allow users to set a budget for each month and show a warning when the user exceeds the budget.
- Allow users to export expenses to a CSV file.
