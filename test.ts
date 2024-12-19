import { describe, it } from "node:test";
import { addExpense, list, summary } from "./index.js";

describe("index", () => {
  describe("addExpense", () => {
    it("should added expense", async () => {
      await addExpense("description", 100);
      await addExpense("description 2", 200);
    });
  });

  describe("list", () => {
    it("should show expenses", async () => {
      await list();
    });
  });

  describe("summary", () => {
    it("should show total expenses", async () => {
      await summary();
      await summary(1);
      await summary(13);
      await summary(12);
    });
  });
  // $ expense-tracker summary
  //     `Total expenses: $30`
  //
  // $ expense-tracker delete --id 2
  //     `Expense deleted successfully`
  //
  // $ expense-tracker summary
  //     `Total expenses: $20`
  //
  // $ expense-tracker summary --month 8
  //     `Total expenses for August: $20`
});
