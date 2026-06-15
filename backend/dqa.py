"""Data Quality Assessment report builder for the Credit Risk Dashboard."""

from __future__ import annotations

from typing import Any

import pandas as pd

# Keywords used to detect identifier columns (order = priority)
_ID_KEYWORDS = ("id", "customer", "client", "borrower", "account", "loan")


def build_dqa_report(df: pd.DataFrame) -> dict[str, Any]:
    """
    Build a comprehensive Data Quality Assessment report for a dataframe.

    Analyses performed:
      - Dataset profile (shape, column types)
      - Missing value analysis (per column)
      - Duplicate identifier analysis (generic ID column detection)
      - Issue log, recommendations, and DQA agent assessment
    """
    dataset_profile    = _build_dataset_profile(df)
    missing_analysis   = _build_missing_value_analysis(df)
    id_column          = _resolve_id_column(df)
    duplicate_analysis = _build_duplicate_analysis(df, id_column)
    issue_log          = _build_issue_log(missing_analysis, duplicate_analysis, id_column)
    recommendations    = _build_recommendations(issue_log)
    dqa_assessment     = generate_dqa_assessment(
        dataset_profile, missing_analysis, duplicate_analysis, id_column
    )

    return {
        "dataset_profile":        dataset_profile,
        "missing_value_analysis": missing_analysis,
        "duplicate_analysis":     duplicate_analysis,
        "issue_log":              issue_log,
        "recommendations":        recommendations,
        "dqa_assessment":         dqa_assessment,
    }


# ── Identifier detection ──────────────────────────────────────────────────────

def _resolve_id_column(df: pd.DataFrame) -> str | None:
    """
    Detect the most likely unique-identifier column using keyword matching.

    Strategy:
    1. Exact matches against known candidate names (highest priority).
    2. Case-insensitive column name scan for any _ID_KEYWORDS substring.
    3. Return None if no identifier column is found.
    """
    # 1. Exact known names
    exact_candidates = (
        "Customer_ID", "customer_id", "CustomerID",
        "Client_ID",   "client_id",   "ClientID",
        "Borrower_ID", "borrower_id", "BorrowerID",
        "Account_ID",  "account_id",  "AccountID",
        "Loan_ID",     "loan_id",     "LoanID",
        "ID",          "id",
    )
    for candidate in exact_candidates:
        if candidate in df.columns:
            return candidate

    # 2. Keyword substring scan (case-insensitive)
    lower_map = {col.lower(): col for col in df.columns}
    for keyword in _ID_KEYWORDS:
        for lower_col, original_col in lower_map.items():
            if keyword in lower_col:
                return original_col

    return None


def _id_field_label(id_column: str | None) -> str:
    """Return a human-readable label for the detected identifier column."""
    return f'"{id_column}"' if id_column else "Identifier Field"


# ── DQA Agent Assessment ─────────────────────────────────────────────────────

def generate_dqa_assessment(
    dataset_profile:        dict[str, Any],
    missing_value_analysis: list[dict[str, Any]],
    duplicate_analysis:     list[dict[str, Any]],
    id_column:              str | None = None,
) -> dict[str, Any]:
    """
    Generate a rule-based DQA Agent Assessment.

    Uses deterministic thresholds — no LLMs involved.
    """
    total_rows       = dataset_profile.get("total_rows", 0)
    total_columns    = dataset_profile.get("total_columns", 0)
    num_missing_cols = len(missing_value_analysis)
    num_duplicates   = len(duplicate_analysis)

    max_missing_pct = (
        max(r["missing_percentage"] for r in missing_value_analysis)
        if missing_value_analysis else 0.0
    )
    avg_missing_pct = (
        round(
            sum(r["missing_percentage"] for r in missing_value_analysis)
            / len(missing_value_analysis),
            2,
        )
        if missing_value_analysis else 0.0
    )
    duplicate_rate = (
        round((num_duplicates / total_rows * 100), 2)
        if total_rows > 0 and num_duplicates > 0 else 0.0
    )

    overall_risk = _determine_overall_risk(max_missing_pct, num_duplicates, duplicate_rate)

    return {
        "overall_risk":      overall_risk,
        "executive_summary": _build_executive_summary(
            overall_risk, total_rows, total_columns,
            num_missing_cols, avg_missing_pct,
            num_duplicates, duplicate_rate, id_column,
        ),
        "key_findings": _build_key_findings(
            total_rows, total_columns,
            missing_value_analysis, duplicate_analysis,
            max_missing_pct, duplicate_rate, id_column,
        ),
        "priority_actions": _build_priority_actions(
            missing_value_analysis, duplicate_analysis,
            max_missing_pct, id_column,
        ),
    }


def _determine_overall_risk(
    max_missing_pct: float,
    num_duplicates: int,
    duplicate_rate: float,
) -> str:
    if max_missing_pct == 0 and num_duplicates == 0:
        return "LOW"
    if max_missing_pct > 10 or duplicate_rate > 5:
        return "HIGH"
    return "MEDIUM"


def _build_executive_summary(
    overall_risk:     str,
    total_rows:       int,
    total_columns:    int,
    num_missing_cols: int,
    avg_missing_pct:  float,
    num_duplicates:   int,
    duplicate_rate:   float,
    id_column:        str | None,
) -> str:
    risk_label = {"LOW": "low risk", "MEDIUM": "moderate risk", "HIGH": "high risk"}.get(
        overall_risk, "undetermined risk"
    )
    field_label = _id_field_label(id_column)

    parts = [
        f"The uploaded dataset contains {total_rows:,} rows and "
        f"{total_columns:,} columns and has been assessed as {risk_label}."
    ]

    if num_missing_cols == 0:
        parts.append("No missing values were detected across any column.")
    else:
        parts.append(
            f"{num_missing_cols} column(s) contain missing values, "
            f"with an average missing rate of {avg_missing_pct}%."
        )

    if num_duplicates == 0:
        if id_column:
            parts.append(f"All values in the identifier field {field_label} are unique.")
        else:
            parts.append("No identifier column was detected; duplicate ID check was skipped.")
    else:
        parts.append(
            f"{num_duplicates} duplicate value(s) were identified in {field_label}, "
            f"representing approximately {duplicate_rate}% of total records."
        )

    closing = {
        "LOW":    "The dataset meets baseline quality standards and is ready for modelling.",
        "MEDIUM": "Minor data quality issues were detected. Remediation is recommended before model training.",
        "HIGH":   "Significant data quality issues were detected. Immediate remediation is required.",
    }
    parts.append(closing.get(overall_risk, ""))
    return " ".join(parts)


def _build_key_findings(
    total_rows:             int,
    total_columns:          int,
    missing_value_analysis: list[dict[str, Any]],
    duplicate_analysis:     list[dict[str, Any]],
    max_missing_pct:        float,
    duplicate_rate:         float,
    id_column:              str | None,
) -> list[str]:
    field_label = _id_field_label(id_column)
    findings = [f"Dataset contains {total_rows:,} records across {total_columns} columns."]

    if not missing_value_analysis:
        findings.append("All columns are complete — no missing values detected.")
    else:
        worst = max(missing_value_analysis, key=lambda r: r["missing_percentage"])
        findings.append(
            f"{len(missing_value_analysis)} column(s) have missing values. "
            f"Worst affected: '{worst['column']}' at {worst['missing_percentage']}%."
        )
        high_cols = [r["column"] for r in missing_value_analysis if r["missing_percentage"] >= 20]
        if high_cols:
            findings.append(
                f"{len(high_cols)} column(s) exceed the 20% missing threshold "
                f"and may require exclusion: {', '.join(high_cols)}."
            )

    if not id_column:
        findings.append("No identifier column detected; duplicate identifier check was skipped.")
    elif not duplicate_analysis:
        findings.append(f"All values in {field_label} are unique — no duplicates detected.")
    else:
        total_extra = sum(r["occurrences"] - 1 for r in duplicate_analysis)
        findings.append(
            f"{len(duplicate_analysis)} value(s) in {field_label} appear more than once, "
            f"accounting for {total_extra:,} redundant record(s)."
        )
        critical = [r for r in duplicate_analysis if r["occurrences"] >= 5]
        if critical:
            findings.append(
                f"{len(critical)} identifier value(s) appear 5 or more times "
                "and are classified as critical duplicates."
            )

    return findings


def _build_priority_actions(
    missing_value_analysis: list[dict[str, Any]],
    duplicate_analysis:     list[dict[str, Any]],
    max_missing_pct:        float,
    id_column:              str | None,
) -> list[str]:
    field_label = _id_field_label(id_column)
    actions = []

    if missing_value_analysis:
        exclude_cols = [r["column"] for r in missing_value_analysis if r["missing_percentage"] >= 40]
        impute_cols  = [r["column"] for r in missing_value_analysis if r["missing_percentage"] < 40]

        if exclude_cols:
            actions.append(
                f"[CRITICAL] Exclude or review column(s) with >40% missing data: "
                f"{', '.join(exclude_cols)}."
            )
        if impute_cols:
            actions.append(
                f"[HIGH] Apply imputation to {len(impute_cols)} column(s) with missing values. "
                "Use mean/median for numeric and mode or 'Unknown' for categorical columns."
            )
        actions.append(
            "[MEDIUM] Investigate the upstream data pipeline to identify "
            "the root cause of missing values and prevent recurrence."
        )

    if duplicate_analysis:
        critical_dupes = [r for r in duplicate_analysis if r["occurrences"] >= 5]
        if critical_dupes:
            actions.append(
                f"[CRITICAL] Immediately resolve {len(critical_dupes)} identifier value(s) "
                f"in {field_label} with 5+ occurrences. These may indicate ingestion or merge errors."
            )
        actions.append(
            f"[HIGH] Run a full deduplication pass on {field_label}: retain the most "
            "recent record per identifier and remove all duplicates."
        )
        actions.append(
            f"[MEDIUM] Implement a uniqueness constraint on {field_label} "
            "in the source system to prevent future duplicates."
        )

    if not actions:
        actions.append(
            "[INFO] No immediate actions required. Dataset meets quality "
            "standards for credit risk modelling."
        )

    return actions


# ── Private helpers ───────────────────────────────────────────────────────────

def _build_dataset_profile(df: pd.DataFrame) -> dict[str, Any]:
    numeric_columns     = int(df.select_dtypes(include="number").shape[1])
    categorical_columns = int(df.select_dtypes(exclude="number").shape[1])
    return {
        "total_rows":          int(df.shape[0]),
        "total_columns":       int(df.shape[1]),
        "numeric_columns":     numeric_columns,
        "categorical_columns": categorical_columns,
    }


def _build_missing_value_analysis(df: pd.DataFrame) -> list[dict[str, Any]]:
    total_rows = len(df)
    result = []
    for column in df.columns:
        missing_count = int(df[column].isna().sum())
        if missing_count == 0:
            continue
        missing_percentage = round(
            (missing_count / total_rows * 100) if total_rows > 0 else 0.0, 2
        )
        result.append({
            "column":             column,
            "missing_count":      missing_count,
            "missing_percentage": missing_percentage,
        })
    return sorted(result, key=lambda x: x["missing_count"], reverse=True)


def _build_duplicate_analysis(
    df: pd.DataFrame,
    id_column: str | None,
) -> list[dict[str, Any]]:
    if id_column is None:
        return []
    counts     = df[id_column].value_counts()
    duplicates = counts[counts > 1]
    return [
    {"identifier_value": str(val), "occurrences": int(count)}
    for val, count in duplicates.items()
    ]


def _build_issue_log(
    missing_analysis:   list[dict[str, Any]],
    duplicate_analysis: list[dict[str, Any]],
    id_column:          str | None,
) -> list[dict[str, Any]]:
    field_label = _id_field_label(id_column)
    issues = []

    for row in missing_analysis:
        pct      = row["missing_percentage"]
        severity = "High" if pct >= 20 else "Medium" if pct >= 5 else "Low"
        issues.append({
            "issue":              "Missing Values",
            "column":             row["column"],
            "severity":           severity,
            "missing_count":      row["missing_count"],
            "missing_percentage": pct,
            "detail": (
                f"{row['missing_count']:,} missing value(s) detected in "
                f"'{row['column']}' ({pct}% of rows)."
            ),
            "business_impact": "May affect credit risk calculations and downstream analysis.",
        })

    for row in duplicate_analysis:
        severity = "High" if row["occurrences"] >= 5 else "Medium"
        issues.append({
            "issue":       "Duplicate Identifier Record",
            "column": id_column or "Identifier Field",
            "severity":    severity,
            "identifier_value": row["identifier_value"],
            "occurrences": row["occurrences"],
            "detail": (f"Value '{row['identifier_value']}' in {field_label} appears "
                
                f"{row['occurrences']} times in the dataset."
            ),
            "business_impact": (
                "Duplicate records can skew model training, inflate portfolio "
                "metrics, and lead to incorrect risk assessments."
            ),
        })

    return issues


def _build_recommendations(
    issue_log: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    recommendations = []

    for issue in issue_log:

        if issue["issue"] == "Missing Values":
            pct = issue["missing_percentage"]
            if pct >= 40:
                action = (
                    f"The missing rate for '{issue['column']}' is {pct}% — "
                    "consider excluding this column from analysis entirely. "
                    "If retention is required, apply model-based imputation."
                )
            elif pct >= 5:
                action = (
                    f"Apply mean or median imputation for numeric field '{issue['column']}'. "
                    "For categorical fields, use the most frequent value or 'Unknown'."
                )
            else:
                action = (
                    f"'{issue['column']}' has a low missing rate ({pct}%). "
                    "Simple mean, median, or mode imputation is sufficient."
                )
            recommendations.append({
                "issue":          issue["issue"],
                "column":         issue["column"],
                "severity":       issue["severity"],
                "recommendation": action,
            })

        elif issue["issue"] == "Duplicate Identifier Record":
            recommendations.append({
                "issue": issue["issue"],
                "column": issue["column"],
                "severity": issue["severity"],
                "identifier_value": issue["identifier_value"],
                "recommendation": (
                    f"Value '{issue['identifier_value']}' in the identifier field appears "
                    f"{issue['occurrences']} time(s). Retain the most recent record "
                    "and remove the rest. Investigate the ingestion pipeline to prevent re-occurrence."
                ),
            })

    return recommendations
