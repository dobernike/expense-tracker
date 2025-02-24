import argparse
import datetime
import typing
from typing import Optional

from ..actions import actions


def id_type(value: str) -> int:
    try:
        id = int(value)
        if id > 0:
            return id
        else:
            raise ValueError()
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"isn't correct: {value}. ID must be greater than 0"
        )


def date_type(value: str) -> str:
    try:
        date = datetime.datetime.strptime(value, "%Y-%m-%d").date()
        return str(date)
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"format isn't correct: {value}. Use format YYYY-MM-DD, ex. 2025-02-15"
        )


def month_type(value: str) -> int:
    try:
        month = int(value)
        if month > 0 and month <= 12:
            return month
        else:
            raise ValueError()
    except ValueError:
        raise argparse.ArgumentTypeError(f"Month must be between 1 and 12, not {value}")


class AddExpenseArgs(typing.NamedTuple):
    description: str
    amount: float
    date: Optional[str]


def add(args: AddExpenseArgs) -> None:
    description = args.description
    amount = args.amount
    date = args.date

    actions.add_expense(description=description, amount=amount, date=date)
    print(f"Adding expense: Description={description}, Amount={amount}, Date={date}")


class UpdateExpenseArgs(typing.NamedTuple):
    id: int
    description: Optional[str]
    amount: Optional[float]
    date: Optional[str]


def update(args: UpdateExpenseArgs) -> None:
    id = args.id
    description = args.description
    amount = args.amount
    date = args.date

    if not description and not amount and not date:
        raise argparse.ArgumentTypeError(description, "one of update arguments must be")

    actions.update_expense(id=id, description=description, amount=amount, date=date)


def show_list(args) -> None:
    actions.show_expenses()


class SummaryArgs(typing.NamedTuple):
    month: Optional[int]


def summary(args: SummaryArgs) -> None:
    month = args.month
    actions.summary(month=month)


class DeleteExpenseArgs(typing.NamedTuple):
    id: int


def delete(args: DeleteExpenseArgs) -> None:
    id = args.id
    actions.delete_expense(id=id)
    print(f"Deleting expense id {args.id}")


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="etrack", description="track expenses", epilog="test"
    )
    subparsers = parser.add_subparsers(dest="command")

    add_parser = subparsers.add_parser("add", help="add a new expense")
    add_parser.add_argument(
        "-d",
        "--description",
        type=str,
        required=True,
        help="description of the expense",
    )
    add_parser.add_argument(
        "-a", "--amount", type=float, required=True, help="amount of the expense"
    )
    add_parser.add_argument(
        "--date",
        type=date_type,
        required=True,
        help="date of the expense",
    )
    add_parser.set_defaults(func=add)

    update_parser = subparsers.add_parser("update", help="update expense with id")
    update_parser.add_argument(
        "-i", "--id", type=id_type, required=True, help="ID of the expense"
    )
    update_parser.add_argument(
        "-d", "--description", type=str, help="description of the expense"
    )
    update_parser.add_argument(
        "-a", "--amount", type=float, help="amount of the expense"
    )
    update_parser.add_argument(
        "--date",
        type=date_type,
        help="date of the expense",
    )
    update_parser.set_defaults(func=update)

    list_parser = subparsers.add_parser("list", help="show all expenses")
    list_parser.set_defaults(func=show_list)

    summary_parser = subparsers.add_parser("summary", help="show summary expenses")
    summary_parser.add_argument(
        "-m", "--month", type=month_type, help="Month of the expenses"
    )
    summary_parser.set_defaults(func=summary)

    delete_parser = subparsers.add_parser("delete", help="delete an expense")
    delete_parser.add_argument(
        "-i", "--id", type=int, required=True, help="ID of the expense"
    )
    delete_parser.set_defaults(func=delete)

    args = parser.parse_args()

    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
