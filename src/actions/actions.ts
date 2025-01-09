import {
  addExpenseDB,
  deleteExpenseDB,
  getListDB,
  getSummary,
  updateExpenseDB,
} from "../db/db.ts";
import type { Expense } from "../db/types.ts";
import {
  addExpenseCSV,
  deleteExpenseCSV,
  listCSV,
  summaryCSV,
} from "../csv/csv.ts";

export async function addExpense(
  description: string,
  amount: number,
  date?: string,
) {
  if (!description || !amount || amount <= 0) {
    console.log("description and amount must exist to continue");
    return;
  }

  if (!date) {
    date = new Date().toISOString().split("T")[0];
  } else {
    // YYYY-MM-DD or YYYY-MM-DDTHH:MM
    if (!date.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/)) {
      console.log("Date must be in the format YYYY-MM-DD or YYYY-MM-DDTHH:MM");
      return;
    }

    try {
      date = new Date(date).toISOString().split("T")[0];
    } catch {
      console.error("Invalid date");
      return;
    }
  }

  const isExpenseAdded = await addExpenseDB({ date, description, amount });
  if (isExpenseAdded) {
    console.log(`Expense added successfully`);
    return;
  }

  await addExpenseCSV({ date, description, amount });
}

/* log a list of expenses in the following format:
 * ID    Date          Description      Amount
 * 1     2024-12-19    description      $100
 * 2     2024-12-19    description 2    $200
 * */
export async function list() {
  const expenses = await getListDB();

  if (expenses) {
    const columnWidths: number[] = [];
    const header = {
      id: "ID",
      date: "Date",
      description: "Description",
      amount: "Amount",
    } as unknown as Expense;

    expenses.unshift(header);

    // set column widths
    expenses.forEach((row) => {
      columnWidths[0] = Math.max(columnWidths[0] ?? 0, String(row.id).length);
      columnWidths[1] = Math.max(columnWidths[1] ?? 0, String(row.date).length);
      columnWidths[2] = Math.max(
        columnWidths[2] ?? 0,
        String(row.description).length,
      );
      columnWidths[3] = Math.max(
        columnWidths[3] ?? 0,
        String(row.amount).length,
      );
    });

    expenses.forEach((expense, index) => {
      const isHeader = index === 0;
      const basicPadding = 3;

      /*
      ID    Date          Description              Amount
      1     2024-12-02    Argentina car tickets    $837
      */
      console.log(
        String(expense.id).padEnd(columnWidths[0] + basicPadding),
        expense.date.padEnd(columnWidths[1] + basicPadding),
        expense.description.padEnd(columnWidths[2] + basicPadding),
        (!isHeader ? "$" : "") +
          String(expense.amount).padEnd(columnWidths[3] + basicPadding),
      );
    });

    return;
  }

  await listCSV();
}

/* log the total expenses in the following format:
 * `Total expenses: $30`
 * `Total expenses for August: $20`
 * */
export async function summary(month?: number) {
  if (month && (month < 1 || month > 12)) {
    console.log("Month must be between 1 and 12");
    return;
  }

  const totalAmount = await getSummary(month);
  console.log("total", totalAmount);

  if (totalAmount) {
    let monthName = "";
    if (month) {
      const currentYear = new Date().getFullYear();
      monthName = new Intl.DateTimeFormat("en", {
        month: "long",
      }).format(new Date(currentYear, month - 1));
    }

    console.log(
      `Total expenses${!month ? "" : ` for ${monthName}`}: $${totalAmount}`,
    );
    return;
  }

  await summaryCSV(month);
}

export async function deleteExpense(id: number) {
  if (!id || id < 1) {
    console.log("ID must be greater than 0");
    return;
  }

  const isExpenseDeleted = await deleteExpenseDB(id);
  if (isExpenseDeleted) {
    console.log("Expense deleted successfully");
    return;
  }

  await deleteExpenseCSV(id);
}

export async function updateExpense(expense: Expense) {
  if (!expense.id || expense.id < 1) {
    console.log("ID must be greater than 0");
    return;
  }

  const isExpenseUpdated = await updateExpenseDB(expense);
  if (isExpenseUpdated) {
    console.log("Expense updated successfully");
    return;
  }

  console.log("Expense not found and not updated");
}
