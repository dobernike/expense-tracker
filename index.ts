import { appendFile, access, writeFile, readFile } from "node:fs/promises";

interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
}

const getCSVExpense = ({ id, date, description, amount }: Expense) =>
  `${id},${date},${description},${amount}\n`;

export async function addExpense(description: string, amount: number) {
  if (!description || !amount) {
    console.error("description and amount must exist to continue");
    return;
  }
  const date = new Date().toISOString().split("T")[0];

  try {
    await access("db.csv");
    const csv = await readFile("db.csv", "utf8");
    const csvArray = csv.split("\n").filter((line) => line.trim() !== "");
    const lastExpense = csvArray[csvArray.length - 2];
    const lastExpenseId = lastExpense.split(",")[0];
    const id = parseInt(lastExpenseId) + 1;
    const newExpense = getCSVExpense({ id, date, description, amount });

    await appendFile("db.csv", newExpense, "utf8");
    console.log(`Expense added successfully (ID: ${id})`);
  } catch (err) {
    const error = err as NodeJS.ErrnoException;

    if (error.code === "ENOENT") {
      const csvHeader = "ID,Date,Description,Amount\n";
      const csvExpense = getCSVExpense({ id: 1, date, description, amount });

      await writeFile("db.csv", `${csvHeader}${csvExpense}`, "utf8");
    }

    console.error("Error expense not added, because: ", error);
  }
}

/* return a list of expenses in the following format:
 * ID    Date          Description      Amount
 * 1     2024-12-19    description      $100
 * 2     2024-12-19    description 2    $200
 * */
export async function list() {
  try {
    const csv = await readFile("db.csv", "utf8");
    const csvArray = csv.split("\n").filter((line) => line.trim() !== "");
    const cvsRows = csvArray.map((line) => line.split(","));
    const columnWidths: number[] = [];

    // set column widths
    cvsRows.forEach((row) => {
      row.forEach((cell, cellIndex) => {
        columnWidths[cellIndex] = Math.max(
          columnWidths[cellIndex] ?? 0,
          cell.length,
        );
      });
    });

    const formattedRows = cvsRows.map((row, index) =>
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
    console.log("Error reading file: ", err);
  }
}

/* return the total expenses in the following format:
 * `Total expenses: $30`
 * `Total expenses for August: $20`
 * */
export async function summary(month?: number) {
  if (month && (month < 1 || month > 12)) {
    console.error("Month must be between 1 and 12");
    return;
  }

  let totalExpenses = 0;

  try {
    const csv = await readFile("db.csv", "utf8");
    const csvArray = csv.split("\n").filter((line) => line.trim() !== "");
    const cvsRows = csvArray.map((line) => line.split(","));
    const cvsRowsWithoutHeader = cvsRows.slice(1);

    let expensesRows = cvsRowsWithoutHeader;
    if (month) {
      expensesRows = cvsRowsWithoutHeader.filter((row) => {
        const expenseDate = new Date(row[1]);
        return expenseDate.getMonth() + 1 === month;
      });
    }

    expensesRows.forEach((row) => {
      const amount = Number(row.at(-1));
      totalExpenses += amount;
    });
    console.log(`Total expenses: $${totalExpenses}`);
  } catch (err) {
    console.log("Error reading file: ", err);
  }
}
// $ expense-tracker summary
//     `Total expenses: $30`
//
// $ expense-tracker summary
//     `Total expenses: $20`
//
// $ expense-tracker summary --month 8
//     `Total expenses for August: $20`

export function deleteExpense() {}
// $ expense-tracker delete --id 2
//     `Expense deleted successfully`
//
