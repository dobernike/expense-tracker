import { describe, it } from "node:test";
import { addExpense, list, summary, deleteExpense } from "./index.js";

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

  describe("deleteExpense", () => {
    it("should delete expense with set id", async () => {
      await deleteExpense(0);
      await deleteExpense(1);
      await deleteExpense(2);
      await deleteExpense(10);
    });
  });
});
