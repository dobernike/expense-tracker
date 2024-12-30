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

    it("should added expense", async () => {
      await addExpense("description", 100);
      await addExpense("description 2", 200);
      originalLog(consoleOutput);

      assert(consoleOutput.some((output) => output.includes("Expense added")));
    });

    it("should not add expense with invalid amount", async () => {
      await addExpense("description", 0);

      assert(
        consoleOutput.every((output) =>
          output.includes("description and amount must exist to continue")
        )
      );
    });
  });

  describe("list", () => {
    it("should show expenses", async () => {
      await list();
      // originalLog(consoleOutput);

      assert(consoleOutput.some((output) => output.includes("ID")));
    });
  });

  describe("summary", () => {
    it("should show total expenses", async () => {
      await summary();
      assert(
        consoleOutput.some((output) => output.includes("Total expenses: $"))
      );

      await summary(1);
      assert(
        consoleOutput.some((output) =>
          output.includes("Total expenses for January: $")
        )
      );

      await summary(13);
      assert(
        consoleOutput.some((output) =>
          output.includes("Month must be between 1 and 12")
        )
      );

      await summary(12);
      assert(
        consoleOutput.some((output) =>
          output.includes("Total expenses for December: $")
        )
      );
    });
  });

  describe("deleteExpense", () => {
    it("should delete expense with set id", async () => {
      await deleteExpense(0);
      assert(
        consoleOutput.some((output) =>
          output.includes("ID must be greater than 0")
        )
      );

      await deleteExpense(1);
      assert(
        consoleOutput.some((output) =>
          output.includes("Expense deleted successfully")
        )
      );

      await deleteExpense(2);
      assert(
        consoleOutput.some((output) =>
          output.includes("Expense deleted successfully")
        )
      );

      await deleteExpense(10);
      assert(
        consoleOutput.some((output) =>
          output.includes("Expense with this ID does not exist")
        )
      );
    });
  });
});
