import { join } from "node:path";
import type { Expense } from "../db/types.ts";
import { access, appendFile, readFile, writeFile } from "node:fs/promises";

const DB_NAME = process.env.DB_NAME ?? "db.csv";
const DB_PATH = join(import.meta.dirname, "..", "..", "db", DB_NAME);

// support of CSV instead of database

export const getCSVExpense = ({ id, date, description, amount }: Expense) =>
  `${id},${date},${description},${amount}\n`;

export async function getRows() {
  await access(DB_PATH);
  const csv = await readFile(DB_PATH, "utf8");
  const csvArray = csv.split("\n").filter((line) => line.trim() !== "");
  return csvArray.map((line) => line.split(","));
}

export async function addExpenseCSV({
  date,
  description,
  amount,
}: Omit<Expense, "id">) {
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

export async function listCSV() {
  try {
    const rows = await getRows();
    const columnWidths: number[] = [];

    // set column widths
    rows.forEach((row) => {
      row.forEach((cell, cellIndex) => {
        columnWidths[cellIndex] = Math.max(
          columnWidths[cellIndex] ?? 0,
          cell.length,
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
          columnWidths[cellIndex] + basicPadding - cell.length,
        );

        return `${acc}${amountSign}${cell}${padding} `;
      }, ""),
    );

    formattedRows.forEach((row) => console.log(row));
  } catch (err) {
    console.log("Can't show list of expenses, because: ", err);
  }
}

export async function summaryCSV(month?: number) {
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
      `Total expenses${!month ? "" : ` for ${monthName}`}: $${totalExpenses.toFixed(2)}`,
    );
  } catch (err) {
    console.log("Can't show summary of expenses, because: ", err);
  }
}

export async function deleteExpenseCSV(id: number) {
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
