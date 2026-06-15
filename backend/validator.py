"""Dataset validation for the Credit Risk Dashboard."""

from __future__ import annotations

from typing import Any, TypedDict

import pandas as pd


class ValidationResult(TypedDict):
    """Schema for the dataset validation report."""

    validation_status: bool
    missing_columns: list[str]
    duplicate_rows: int
    missing_values: int
    total_rows: int
    total_columns: int


def validate_dataset(df: pd.DataFrame | None) -> ValidationResult:
    """
    Validate a credit-risk dataset against structural and quality rules.

    Dataset-agnostic: no hardcoded column names required.

    Checks performed:
      - Non-None and correct type
      - Non-empty dataframe
      - Missing (null) values
      - Duplicate rows

    Args:
        df: Input dataframe to validate. May be ``None`` or empty.

    Returns:
        A dictionary with validation metrics and overall status.
        ``validation_status`` is ``True`` when the dataframe is non-empty,
        has no missing values, and has no duplicate rows.
    """
    if df is None or not isinstance(df, pd.DataFrame):
        return _build_result(
            validation_status=False,
            missing_columns=[],
            duplicate_rows=0,
            missing_values=0,
            total_rows=0,
            total_columns=0,
        )

    total_rows    = len(df)
    total_columns = len(df.columns)

    if total_rows == 0:
        return _build_result(
            validation_status=False,
            missing_columns=[],
            duplicate_rows=0,
            missing_values=int(df.isna().sum().sum()),
            total_rows=0,
            total_columns=total_columns,
        )

    duplicate_rows = int(df.duplicated().sum())
    missing_values = int(df.isna().sum().sum())

    validation_status = (
        duplicate_rows == 0
        and missing_values == 0
    )

    return _build_result(
        validation_status=validation_status,
        missing_columns=[],
        duplicate_rows=duplicate_rows,
        missing_values=missing_values,
        total_rows=total_rows,
        total_columns=total_columns,
    )


def _build_result(
    *,
    validation_status: bool,
    missing_columns: list[str],
    duplicate_rows: int,
    missing_values: int,
    total_rows: int,
    total_columns: int,
) -> ValidationResult:
    """Assemble a validation report with a stable key order."""
    return {
        "validation_status": validation_status,
        "missing_columns":   missing_columns,
        "duplicate_rows":    duplicate_rows,
        "missing_values":    missing_values,
        "total_rows":        total_rows,
        "total_columns":     total_columns,
    }


# """Dataset validation for the Credit Risk Dashboard."""

# from __future__ import annotations

# from typing import Any, TypedDict

# import pandas as pd

# REQUIRED_COLUMNS: tuple[str, ...] = (
#     "LIMIT_BAL",
#     "SEX",
#     "EDUCATION",
#     "MARRIAGE",
#     "AGE",
#     "PAY_0",
#     "PAY_2",
#     "PAY_3",
#     "PAY_4",
#     "PAY_5",
#     "PAY_6",
#     "BILL_AMT1",
#     "BILL_AMT2",
#     "BILL_AMT3",
#     "BILL_AMT4",
#     "BILL_AMT5",
#     "BILL_AMT6",
#     "PAY_AMT1",
#     "PAY_AMT2",
#     "PAY_AMT3",
#     "PAY_AMT4",
#     "PAY_AMT5",
#     "PAY_AMT6",
# )


# class ValidationResult(TypedDict):
#     """Schema for the dataset validation report."""

#     validation_status: bool
#     missing_columns: list[str]
#     duplicate_rows: int
#     missing_values: int
#     total_rows: int
#     total_columns: int


# def validate_dataset(df: pd.DataFrame | None) -> ValidationResult:
#     """
#     Validate a credit-risk dataset against structural and quality rules.

#     Checks performed:
#       - Non-empty dataframe
#       - Presence of all required columns
#       - Missing (null) values
#       - Duplicate rows

#     Args:
#         df: Input dataframe to validate. May be ``None`` or empty.

#     Returns:
#         A dictionary with validation metrics and overall status.
#         ``validation_status`` is ``True`` only when all checks pass.
#     """
#     if df is None or not isinstance(df, pd.DataFrame):
#         return _build_result(
#             validation_status=False,
#             missing_columns=list(REQUIRED_COLUMNS),
#             duplicate_rows=0,
#             missing_values=0,
#             total_rows=0,
#             total_columns=0,
#         )

#     total_rows = len(df)
#     total_columns = len(df.columns)

#     if total_rows == 0:
#         missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
#         return _build_result(
#             validation_status=False,
#             missing_columns=missing_columns,
#             duplicate_rows=0,
#             missing_values=int(df.isna().sum().sum()),
#             total_rows=0,
#             total_columns=total_columns,
#         )

#     missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
#     duplicate_rows = int(df.duplicated().sum())
#     missing_values = int(df.isna().sum().sum())

#     validation_status = (
#         len(missing_columns) == 0
#         and duplicate_rows == 0
#         and missing_values == 0
#     )

#     return _build_result(
#         validation_status=validation_status,
#         missing_columns=missing_columns,
#         duplicate_rows=duplicate_rows,
#         missing_values=missing_values,
#         total_rows=total_rows,
#         total_columns=total_columns,
#     )


# def _build_result(
#     *,
#     validation_status: bool,
#     missing_columns: list[str],
#     duplicate_rows: int,
#     missing_values: int,
#     total_rows: int,
#     total_columns: int,
# ) -> ValidationResult:
#     """Assemble a validation report with a stable key order."""
#     return {
#         "validation_status": validation_status,
#         "missing_columns": missing_columns,
#         "duplicate_rows": duplicate_rows,
#         "missing_values": missing_values,
#         "total_rows": total_rows,
#         "total_columns": total_columns,
#     }

