import { appendFile, access, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const DB_NAME = process.env.DB_NAME ?? "db.csv";
const DB_PATH = join(import.meta.dirname, "..", "..", "db", DB_NAME);

console.log("DB_PATH", DB_PATH, "dirname", import.meta.dirname);

interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
}

const getCSVExpense = ({ id, date, description, amount }: Expense) =>
  `${id},${date},${description},${amount}\n`;

async function getRows() {
  await access(DB_PATH);
  const csv = await readFile(DB_PATH, "utf8");
  const csvArray = csv.split("\n").filter((line) => line.trim() !== "");
  return csvArray.map((line) => line.split(","));
}

export async function addExpense(
  description: string,
  amount: number,
  date?: string
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

  try {
    const rows = await getRows();
    const lastExpense = rows[rows.length - 1];
    const lastExpenseId = Number(lastExpense[0]);
    const id = isNaN(lastExpenseId) ? 1 : lastExpenseId + 1;
    const newExpense = getCSVExpense({ id, date, description, amount });

    await appendFile(DB_PATH, newExpense, "utf8");
    console.log(`Expense added successfully (ID: ${id})`);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;

    if (error.code === "ENOENT") {
      const csvHeader = "ID,Date,Description,Amount\n";
      const id = 1;
      const csvExpense = getCSVExpense({ id, date, description, amount });

      await writeFile(DB_PATH, `${csvHeader}${csvExpense}`, "utf8");
      console.log(`Expense added successfully (ID: ${id})`);
      return;
    }

    console.log("Expense not added, because: ", error);
  }
}

/* log a list of expenses in the following format:
 * ID    Date          Description      Amount
 * 1     2024-12-19    description      $100
 * 2     2024-12-19    description 2    $200
 * */
export async function list() {
  try {
    const rows = await getRows();
    const columnWidths: number[] = [];

    // set column widths
    rows.forEach((row) => {
      row.forEach((cell, cellIndex) => {
        columnWidths[cellIndex] = Math.max(
          columnWidths[cellIndex] ?? 0,
          cell.length
        );
      });
    });

    // sort rows by date
    const header = rows[0];
    const dataRows = rows
      .slice(1)
      .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());
    const sortedRows = [header, ...dataRows];

    const formattedRows = sortedRows.map((row, index) =>
      row.reduce((acc, cell, cellIndex) => {
        const isAmountCell = cellIndex === row.length - 1;
        const basicPadding = isAmountCell ? 0 : 3;
        const amountSign = isAmountCell && index !== 0 ? "$" : "";
        const padding = " ".repeat(
          columnWidths[cellIndex] + basicPadding - cell.length
        );

        return `${acc}${amountSign}${cell}${padding} `;
      }, "")
    );

    formattedRows.forEach((row) => console.log(row));
  } catch (err) {
    console.log("Can't show list of expenses, because: ", err);
  }
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

  try {
    const rows = await getRows();
    const rowsWithoutHeader = rows.slice(1);

    const filteredRows = month
      ? rowsWithoutHeader.filter((row) => {
          const expenseDate = new Date(row[1]);
          return expenseDate.getMonth() + 1 === month;
        })
      : rowsWithoutHeader;

    let totalExpenses = 0;
    filteredRows.forEach((row) => {
      const amount = Number(row.at(-1));
      totalExpenses += amount;
    });

    let monthName = "";
    if (month) {
      const currentYear = new Date().getFullYear();
      monthName = new Intl.DateTimeFormat("en", {
        month: "long",
      }).format(new Date(currentYear, month - 1));
    }

    console.log(
      `Total expenses${!month ? "" : ` for ${monthName}`}: $${totalExpenses.toFixed(2)}`
    );
  } catch (err) {
    console.log("Can't show summary of expenses, because: ", err);
  }
}

export async function deleteExpense(id: number) {
  if (!id || id < 1) {
    console.log("ID must be greater than 0");
    return;
  }

  try {
    const rows = await getRows();
    const stringId = id.toString();
    const filteredRows = rows.filter((row) => row[0] !== stringId);

    if (filteredRows.length === rows.length) {
      console.log("Expense with this ID does not exist");
      return;
    }

    const updatedCsvContent =
      filteredRows.map((row) => row.join(",")).join("\n") + "\n";

    await writeFile(DB_PATH, updatedCsvContent, "utf8");
    console.log("Expense deleted successfully");
  } catch (err) {
    console.log("Can't delete expense, because: ", err);
  }
}
