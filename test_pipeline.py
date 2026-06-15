"""Integration test script for the Credit Risk Dashboard backend."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from backend.pipeline import CreditRiskPipeline, PipelineError

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parent
DATASET_PATH = PROJECT_ROOT / "uploads" / "UCI_Credit_Card.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "credit_risk_model.pkl"
SCALER_PATH = PROJECT_ROOT / "models" / "scaler.pkl"
FEATURE_COLUMNS_PATH = PROJECT_ROOT / "models" / "feature_columns.pkl"

# Pipeline thresholds
PREDICTION_THRESHOLD = 0.50
GOOD_THRESHOLD = 0.30
BAD_THRESHOLD = 0.70


def print_section(title: str) -> None:
    """Print a formatted section header."""
    separator = "=" * 36
    print(separator)
    print(title)
    print(separator)


def main() -> None:
    """
    Load the UCI credit-card dataset and execute the full backend pipeline.

    Prints validation results, metrics (when available), segment summary,
    and a sample of predictions.
    """
    try:
        # Load dataset
        dataset = pd.read_csv(DATASET_PATH)
        print(f"Dataset shape: {dataset.shape}")

        # Initialize and run pipeline
        pipeline = CreditRiskPipeline(
            model_path=MODEL_PATH,
            scaler_path=SCALER_PATH,
            feature_columns_path=FEATURE_COLUMNS_PATH,
        )
        result = pipeline.run(
            dataset,
            prediction_threshold=PREDICTION_THRESHOLD,
            good_threshold=GOOD_THRESHOLD,
            bad_threshold=BAD_THRESHOLD,
        )

        # Validation report
        print_section("VALIDATION REPORT")
        print(result["validation_report"])

        # Model metrics (only when target column is present)
        print_section("METRICS")
        metrics = result.get("metrics")
        if metrics is not None:
            print(metrics)
        else:
            print("Target column not found. Metrics skipped.")

        # Segment summary
        print_section("SEGMENT SUMMARY")
        print(result["segment_summary"])

        # Sample predictions
        print_section("SAMPLE PREDICTIONS")
        print(result["predictions"].head())

    except PipelineError as exc:
        print(f"Pipeline error: {exc}")
    except FileNotFoundError as exc:
        print(f"Required file not found: {exc}")
    except Exception as exc:
        print(f"Unexpected error: {exc}")


if __name__ == "__main__":
    main()
