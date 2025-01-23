import pg from "pg";
import type { rawExpense, Expense } from "./types.ts";

const TRANSACTION_TABLE = "transactions";

// provide a default database connection for CLI
if (process.env.NODE_ENV !== "test") {
  process.env.DATABASE_URL = "postgres://user:123@localhost:5432/expenses";
}

const client = process.env.DATABASE_URL
  ? new pg.Client({ connectionString: process.env.DATABASE_URL })
  : null;

if (client) {
  console.log("Database connected");
} else {
  console.log("DATABASE_URL is not set. Using CSV instead of database");
}

export async function addExpenseDB({
  date,
  description,
  amount,
}: Omit<Expense, "id">) {
  if (client) {
    client.connect();
    const result = await client.query(
      `INSERT INTO ${TRANSACTION_TABLE} (date, description, amount) VALUES($1, $2, $3)`,
      [date, description, amount],
    );
    client.end();

    return result.rowCount;
  } else {
    console.log("Using CSV instead of database");
  }
}

export async function getListDB(): Promise<Expense[]> {
  if (client) {
    await client.connect();
    const result = await client.query<rawExpense>(
      `SELECT id, date, description, amount
       FROM ${TRANSACTION_TABLE}
       ORDER BY date;`,
    );
    client.end();

    return result.rows.map((row) => ({
      id: row.id,
      date: row.date.toISOString().split("T")[0],
      description: row.description,
      amount: parseFloat(row.amount),
    }));
  } else {
    console.log("Using CSV instead of database");
    return [];
  }
}

export async function getSummary(month?: number): Promise<number | undefined> {
  if (client) {
    await client.connect();
    let query = `SELECT SUM(amount) FROM ${TRANSACTION_TABLE}`;
    const values: number[] = [];

    if (month) {
      query += ` WHERE EXTRACT(MONTH FROM date) = $1`;
      values.push(month);
    }

    const result = await client.query<{ sum: number }>(query, values);
    client.end();

    return result.rows[0].sum;
  } else {
    console.log("Using CSV instead of database");
  }
}

export async function deleteExpenseDB(id: number) {
  if (client) {
    await client.connect();
    const result = await client.query(
      `DELETE FROM ${TRANSACTION_TABLE}
       WHERE id = $1`,
      [id],
    );
    client.end();

    return result.rowCount;
  } else {
    console.log("Using CSV instead of database");
  }
}

export async function updateExpenseDB(expense: Expense) {
  if (!expense.id) {
    throw new Error("ID is required");
  }

  if (client) {
    const fields: string[] = [];
    const values: any[] = [];
    let query = `UPDATE transactions SET`;

    if (expense.date) {
      fields.push(`date = $${fields.length + 1}`);
      values.push(expense.date);
    }

    if (expense.description) {
      fields.push(`description = $${fields.length + 1}`);
      values.push(expense.description);
    }

    if (expense.amount) {
      fields.push(`amount = $${fields.length + 1}`);
      values.push(expense.amount);
    }

    if (!fields.length) {
      throw new Error("At least one field to update must be provided");
    }

    query += ` ${fields.join(", ")} WHERE id = $${fields.length + 1}`;
    values.push(expense.id);

    await client.connect();
    const result = await client.query(query, values);
    client.end();

    return result.rowCount;
  } else {
    console.log("Database is not available");
  }
}
