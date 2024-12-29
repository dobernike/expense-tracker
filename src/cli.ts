import { Command } from "commander";
import { addExpense, list, summary, deleteExpense } from "./actions.ts";

const program = new Command();

program.name("expense-tracker");

program
  .command("add")
  .description("add a new expense")
  .option("--description <string>", "description of the expense")
  .option("--amount <number>", "amount of the expense")
  .action(({ description, amount }) => {
    if (amount) {
      amount = Number(amount);
    }
    return addExpense(description, amount);
  });

program.command("list").description("show all expenses").action(list);

program
  .command("summary")
  .description("show summary expenses")
  .option("--month <number>", "Month of the expenses")
  .action(({ month }) => {
    if (month) {
      month = Number(month);
    }
    return summary(month);
  });

program
  .command("delete")
  .description("Delete an expense")
  .option("--id <number>", "ID of the expense")
  .action(({ id }) => {
    if (id) {
      id = Number(id);
    }
    return deleteExpense(id);
  });

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
