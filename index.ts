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
  if (!description || !amount || amount <= 0) {
    console.log("description and amount must exist to continue");
    return;
  }
  const date = new Date().toISOString().split("T")[0];

  try {
    await access("db.csv");
    const csv = await readFile("db.csv", "utf8");
    const csvArray = csv.split("\n").filter((line) => line.trim() !== "");
    const lastExpense = csvArray.at(-1)!;
    const lastExpenseId = Number(lastExpense.split(",")[0]);
    const id = isNaN(lastExpenseId) ? 1 : lastExpenseId + 1;
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

  let totalExpenses = 0;

  try {
    const csv = await readFile("db.csv", "utf8");
    const csvArray = csv.split("\n").filter((line) => line.trim() !== "");
    const cvsRows = csvArray.map((line) => line.split(","));
    const cvsRowsWithoutHeader = cvsRows.slice(1);

    if (month) {
      const expensesMonthRows = cvsRowsWithoutHeader.filter((row) => {
        const expenseDate = new Date(row[1]);
        return expenseDate.getMonth() + 1 === month;
      });

      expensesMonthRows.forEach((row) => {
        const amount = Number(row.at(-1));
        totalExpenses += amount;
      });

      const monthName = new Intl.DateTimeFormat("en", {
        month: "long",
      }).format(new Date(2024, month - 1));

      console.log(`Total expenses for ${monthName}: $${totalExpenses}`);
      return;
    }

    cvsRowsWithoutHeader.forEach((row) => {
      const amount = Number(row.at(-1));
      totalExpenses += amount;
    });
    console.log(`Total expenses: $${totalExpenses}`);
  } catch (err) {
    console.log("Can't show summary of expenses, because: ", err);
  }
}

export async function deleteExpense(id: number) {
  if (!id || id < 1) {
    console.log("ID must be greater than 0");
    return;
  }

  const stringId = id.toString();

  try {
    const csv = await readFile("db.csv", "utf8");
    const csvArray = csv.split("\n").filter((line) => line.trim() !== "");
    const cvsRows = csvArray.map((line) => line.split(","));

    const filteredRows = cvsRows.filter((row) => row[0] !== stringId);

    if (filteredRows.length === cvsRows.length) {
      console.log("Expense with this ID does not exist");
      return;
    }

    const updatedCsvContent =
      filteredRows.map((row) => row.join(",")).join("\n") + "\n";

    await writeFile("db.csv", updatedCsvContent);
    console.log("Expense deleted successfully");
  } catch (err) {
    console.log("Can't delete expense, because: ", err);
  }
}
