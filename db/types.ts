export interface rawExpense {
  id: number;
  date: Date;
  description: string;
  amount: string;
}

export interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
}
