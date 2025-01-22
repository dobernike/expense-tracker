import assert from "node:assert";
import { after, before, beforeEach, describe, it } from "node:test";
import { addExpense, list, summary, deleteExpense } from "./actions.ts";

describe("index", () => {
  let consoleOutput: string[] = [];
  const originalLog = console.log;
  const mockedLog = (output: string) => consoleOutput.push(output);

  before(() => {
    consoleOutput = [];
    console.log = mockedLog;
  });

  after(() => {
    console.log = originalLog;
  });

  describe("addExpense", () => {
    beforeEach(() => {
      consoleOutput = [];
    });

    it("should add expense", async () => {
      await addExpense("description", 100);
      await addExpense("description 2", 200);

      assert(consoleOutput.some((output) => output.includes("Expense added")));
    });

    it("should add expense with provided date", async () => {
      await addExpense("description 2", 200, "2024-12-29");
      assert(consoleOutput.some((output) => output.includes("Expense added")));
    });

    it("should not add expense with invalid amount", async () => {
      const invalidAmounts = [0, -1];
      const message = "description and amount must exist to continue";

      await Promise.all(
        invalidAmounts.map((amount) =>
          assert.rejects(() => addExpense("description", amount), { message }),
        ),
      );
    });

    it("should not add expense with invalid date", async () => {
      await addExpense("description 2", 200, "2024-12-291");
      await addExpense("description 2", 200, "test");
      await addExpense("description 2", 200, "1");
      await addExpense("description 2", 200, "");

      assert(consoleOutput.some((output) => output.includes("Expense added")));
    });
  });

  describe("list", () => {
    it("should show expenses", async () => {
      await list();

      assert(consoleOutput.some((output) => output.includes("ID")));
    });
  });

  describe("summary", () => {
    it("should show total expenses", async () => {
      await summary();
      assert(
        consoleOutput.some((output) => output.includes("Total expenses: $")),
      );

      await summary(1);
      assert(
        consoleOutput.some((output) =>
          output.includes("Total expenses for January: $"),
        ),
      );

      await summary(13);
      assert(
        consoleOutput.some((output) =>
          output.includes("Month must be between 1 and 12"),
        ),
      );

      await summary(12);
      assert(
        consoleOutput.some((output) =>
          output.includes("Total expenses for December: $"),
        ),
      );
    });
  });

  describe("deleteExpense", () => {
    it("should delete expense with set id", async () => {
      await deleteExpense(0);
      assert(
        consoleOutput.some((output) =>
          output.includes("ID must be greater than 0"),
        ),
      );

      await deleteExpense(1);
      assert(
        consoleOutput.some((output) =>
          output.includes("Expense deleted successfully"),
        ),
      );

      await deleteExpense(2);
      assert(
        consoleOutput.some((output) =>
          output.includes("Expense deleted successfully"),
        ),
      );

      await deleteExpense(10);
      assert(
        consoleOutput.some((output) =>
          output.includes("Expense with this ID does not exist"),
        ),
      );
    });
  });
});
