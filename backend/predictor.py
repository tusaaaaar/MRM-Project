"""Prediction reader for the Credit Risk Dashboard."""

from __future__ import annotations

import pandas as pd

DEFAULT_PREDICTION_THRESHOLD = 0.50
PREDICTION_COLUMN            = "prediction"
PROBABILITY_COLUMN           = "probability_of_default"
ACTUAL_DEFAULT_COLUMN        = "actual_default"

REQUIRED_COLUMNS: tuple[str, ...] = (
    PREDICTION_COLUMN,
    PROBABILITY_COLUMN,
    ACTUAL_DEFAULT_COLUMN,
)


class PredictorError(Exception):
    """Base exception for predictor failures."""


class MissingColumnError(PredictorError):
    """Raised when a required column is absent from the uploaded dataset."""


class EmptyDatasetError(PredictorError):
    """Raised when the uploaded dataset contains no rows."""


class CreditRiskPredictor:
    """
    Lightweight prediction reader — no model training required.

    Expects the uploaded dataset to already contain:
        - ``prediction``             — binary default label (0 / 1)
        - ``probability_of_default`` — PD score in [0, 1]
        - ``actual_default``         — ground-truth default label (0 / 1)

    :meth:`fit_predict` validates the presence of those columns and returns
    them as a clean DataFrame ready for metrics, segmentation, and dashboard
    consumption.  All model-training, feature-engineering, and encoding logic
    has been removed.
    """

    def __init__(self) -> None:
        # Retained for interface compatibility with pipeline.py
        self.target_column: str | None = ACTUAL_DEFAULT_COLUMN

    # ── Public API ────────────────────────────────────────────────────────────

    def fit_predict(
        self,
        df: pd.DataFrame,
        target_column: str | None = None,       # kept for call-site compatibility
        prediction_threshold: float = DEFAULT_PREDICTION_THRESHOLD,  # unused; kept for compatibility
    ) -> pd.DataFrame:
        """
        Validate required columns and return prediction outputs.

        Args:
            df:                   Dataset that must already contain
                                  ``prediction``, ``probability_of_default``,
                                  and ``actual_default``.
            target_column:        Ignored — retained for call-site compatibility
                                  with the previous training-based interface.
            prediction_threshold: Ignored — predictions are read directly from
                                  the dataset, not re-thresholded.

        Returns:
            DataFrame with columns ``prediction``, ``probability_of_default``,
            ``actual_default``, and ``is_test_fold`` (all ``True`` so that
            downstream metric computation uses every row).

        Raises:
            PredictorError:     If ``df`` is not a DataFrame.
            EmptyDatasetError:  If ``df`` contains no rows.
            MissingColumnError: If any of the three required columns are absent.
        """
        if not isinstance(df, pd.DataFrame):
            raise PredictorError(
                f"Expected a pandas DataFrame, got {type(df).__name__}."
            )

        if df.empty:
            raise EmptyDatasetError(
                "Uploaded dataset contains no rows. "
                "Please upload a non-empty CSV or XLSX file."
            )

        self._validate_required_columns(df)

        result = df[[
            PREDICTION_COLUMN,
            PROBABILITY_COLUMN,
            ACTUAL_DEFAULT_COLUMN,
        ]].copy()

        # Mark every row as part of the evaluation set so that pipeline.py's
        # test-fold filter includes the full dataset for metric computation.
        result["is_test_fold"] = True

        return result

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _validate_required_columns(df: pd.DataFrame) -> None:
        """
        Raise ``MissingColumnError`` if any required column is absent.

        Reports all missing columns in a single error rather than failing
        one at a time, so the user can fix everything in one upload cycle.
        """
        missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing:
            formatted = ", ".join(f"'{c}'" for c in missing)
            raise MissingColumnError(
                f"The uploaded dataset is missing required column(s): {formatted}. "
                f"Please ensure your file contains all of: "
                f"{', '.join(repr(c) for c in REQUIRED_COLUMNS)}."
            )