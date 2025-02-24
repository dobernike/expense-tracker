import csv
from calendar import month_name
from datetime import datetime
from os import getenv
from typing import Optional

from dotenv import load_dotenv

dotenv_path = load_dotenv()
DB_PATH = getenv("DB_EXPENSE_TRACKER", "db.csv")


def add_expense(description: str, amount: float, date: Optional[str]) -> None:
    if not description or not amount or amount <= 0:
        raise Exception("description and amount must exist to continue")

    if date is None:
        date = str(datetime.today().date())

    with open(DB_PATH) as file:
        reader = csv.reader(file)
        rows = list(reader)

    last_expense = rows[-1]

    try:
        last_expense_id = int(last_expense[0])
    except ValueError:
        last_expense_id = 0

    new_id = last_expense_id + 1
    new_expense = [new_id, date, description, amount]

    with open(DB_PATH, "a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(new_expense)
        print(f"Expense added successfully (ID: {new_id})")


# /* log a list of sorted expenses by date in the following format:
#  * ID    Date          Description      Amount
#  * 2     2024-12-19    description      $100
#  * 1     2024-12-20    description 2    $200
#  * */
def show_expenses() -> None:
    with open(DB_PATH) as file:
        reader = csv.reader(file)
        rows = list(reader)

    # set column widths
    column_width: list[int] = []
    for row in rows:
        for index, cell in enumerate(row):
            try:
                current_column_width = column_width[index]
            except IndexError:
                current_column_width = 0

            max_column_width = max(current_column_width, len(cell))
            if len(column_width) - 1 < index:
                column_width.extend([max_column_width])
            else:
                column_width[index] = max_column_width
    # sort by date
    data_rows = sorted(rows[1:], key=lambda row: datetime.fromisoformat(row[1]))
    sorted_rows = [rows[0]] + data_rows

    formatted_rows = []
    for row_index, row in enumerate(sorted_rows):
        for cell_index, cell in enumerate(row):
            is_amount_cell = cell_index == len(row) - 1
            basic_padding = 0 if is_amount_cell else 3
            amount_sign = "$" if is_amount_cell and row_index != 0 else ""
            padding = " " * (column_width[cell_index] + basic_padding - len(cell))

            text = f"{amount_sign}{cell}{padding}"
            if len(formatted_rows) - 1 < row_index:
                formatted_rows.extend([text])
            else:
                formatted_rows[row_index] += text

    for f_row in formatted_rows:
        print(f_row)


# /* log the total expenses in the following format:
#  * `Total expenses: $30`
#  * `Total expenses for August: $20`
#  * */
def summary(month: Optional[int]) -> None:
    total = 0.0

    with open(DB_PATH) as file:
        d_reader = csv.DictReader(file)
        rows = list(d_reader)

    if month:
        month_str = f"{month:02d}"
        rows = [row for row in rows if row["Date"].split("-")[1] == month_str]

    total = sum(float(row["Amount"]) for row in rows)

    month_info = f" for {month_name[month]}" if month is not None else ""
    print(f"Total expenses{month_info}: ${total}")


def delete_expense(id: int) -> None:
    with open(DB_PATH) as file:
        d_reader = csv.DictReader(file)
        d_rows = list(d_reader)
        id_found = False

        for index, row in enumerate(d_rows):
            if int(row["ID"]) == id:
                id_found = True
                del d_rows[index]
                break

        if not id_found:
            raise Exception("Expense with id not found")

    with open(DB_PATH, "w", newline="") as file:
        d_writer = csv.DictWriter(file, ["ID", "Date", "Description", "Amount"])
        d_writer.writeheader()
        d_writer.writerows(d_rows)
        print("Expense deleted successfully")


def update_expense(
    id: int, description: Optional[str], amount: Optional[float], date: Optional[str]
) -> None:
    with open(DB_PATH) as file:
        d_reader = csv.DictReader(file)
        d_rows = list(d_reader)
        id_found = False

        for row in d_rows:
            if int(row["ID"]) == id:
                id_found = True

                row["Description"] = description if description else row["Description"]
                row["Amount"] = amount if amount else row["Amount"]
                row["Date"] = date if date else row["Date"]
                break

        if not id_found:
            raise Exception("Expense not found and not updated")

    with open(DB_PATH, "w", newline="") as file:
        d_writer = csv.DictWriter(file, ["ID", "Date", "Description", "Amount"])
        d_writer.writeheader()
        d_writer.writerows(d_rows)
        print("Expense updated successfully")
