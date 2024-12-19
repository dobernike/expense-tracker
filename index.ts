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
    const csvArray = csv.split("\n");
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

export function list() {}
// $ expense-tracker list
//     `ID  Date       Description  Amount`
//     `1   2024-08-06  Lunch        $20`
//     `2   2024-08-06  Dinner       $10`
//

export function summary() {}
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
