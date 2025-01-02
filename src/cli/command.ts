import { Command } from "commander";
import { addExpense, list, summary, deleteExpense } from "../actions/index.ts";

const program = new Command();

program.name("expense-tracker");

program
  .command("add")
  .description("add a new expense")
  .option("-d --description <string>", "description of the expense")
  .option("-a --amount <number>", "amount of the expense")
  .option("--date <>", "date of the expense")
  .action(({ description, amount, date }) => {
    if (amount) {
      amount = Number(amount);
    }
    return addExpense(description, amount, date);
  });

program.command("list").description("show all expenses").action(list);

program
  .command("summary")
  .description("show summary expenses")
  .option("-m --month <number>", "Month of the expenses")
  .action(({ month }) => {
    if (month) {
      month = Number(month);
    }
    return summary(month);
  });

program
  .command("delete")
  .description("Delete an expense")
  .option("-i --id <number>", "ID of the expense")
  .action(({ id }) => {
    if (id) {
      id = Number(id);
    }
    return deleteExpense(id);
  });

export { program };
