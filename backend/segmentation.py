"""Customer risk segmentation for the Credit Risk Dashboard."""

from __future__ import annotations

import numpy as np
import pandas as pd

GOOD = "Good"
MODERATE = "Moderate"
BAD = "Bad"

DEFAULT_GOOD_THRESHOLD = 0.30
DEFAULT_BAD_THRESHOLD = 0.70

PROBABILITY_COLUMN = "probability_of_default"
PREDICTION_COLUMN = "prediction"
RISK_CATEGORY_COLUMN = "risk_category"

RISK_CATEGORY_ORDER: tuple[str, ...] = (GOOD, MODERATE, BAD)


class SegmentationError(Exception):
    """Base exception for segmentation failures."""


class InvalidThresholdError(SegmentationError):
    """Raised when segmentation thresholds are invalid."""


class CreditRiskSegmentation:
    """
    Assign customers to risk segments based on probability of default (PD).

    Segments:
        - **Good**: PD < good_threshold
        - **Moderate**: good_threshold <= PD < bad_threshold
        - **Bad**: PD >= bad_threshold
    """

    def segment_customers(
        self,
        predictions_df: pd.DataFrame,
        good_threshold: float = DEFAULT_GOOD_THRESHOLD,
        bad_threshold: float = DEFAULT_BAD_THRESHOLD,
    ) -> pd.DataFrame:
        """
        Classify customers into risk categories from model predictions.

        Args:
            predictions_df: Dataframe containing ``probability_of_default``.
                May optionally include ``prediction``.
            good_threshold: Upper bound (exclusive) for the Good segment.
                Must lie in ``[0, 1]``. Defaults to ``0.30``.
            bad_threshold: Lower bound (inclusive) for the Bad segment.
                Must lie in ``[0, 1]`` and be greater than ``good_threshold``.
                Defaults to ``0.70``.

        Returns:
            A dataframe with ``probability_of_default``, ``prediction`` when
            present in the input, and ``risk_category``.

        Raises:
            TypeError: If ``predictions_df`` is not a pandas DataFrame.
            SegmentationError: If ``probability_of_default`` is missing.
            InvalidThresholdError: If thresholds are out of range or ordered
                incorrectly.
        """
        if not isinstance(predictions_df, pd.DataFrame):
            raise TypeError(
                f"Expected a pandas DataFrame, got {type(predictions_df).__name__}."
            )

        self._validate_thresholds(good_threshold, bad_threshold)

        if PROBABILITY_COLUMN not in predictions_df.columns:
            raise SegmentationError(
                f"Input dataframe must contain '{PROBABILITY_COLUMN}' column."
            )

        segmented = predictions_df.copy()
        probability = segmented[PROBABILITY_COLUMN].astype(float)

        segmented[RISK_CATEGORY_COLUMN] = np.select(
            [
                probability < good_threshold,
                (probability >= good_threshold) & (probability < bad_threshold),
                probability >= bad_threshold,
            ],
            [GOOD, MODERATE, BAD],
            default=MODERATE
        )

        return self._select_output_columns(segmented)

    def get_segment_summary(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Summarize customer counts and PD statistics by risk category.

        Args:
            df: Segmented dataframe containing ``risk_category`` and
                ``probability_of_default``.

        Returns:
            A dataframe with columns ``risk_category``, ``customer_count``,
            ``percentage``, and ``average_pd``, ordered Good → Moderate → Bad.

        Raises:
            TypeError: If ``df`` is not a pandas DataFrame.
            SegmentationError: If required columns are missing.
        """
        if not isinstance(df, pd.DataFrame):
            raise TypeError(
                f"Expected a pandas DataFrame, got {type(df).__name__}."
            )

        missing_columns = [
            column
            for column in (RISK_CATEGORY_COLUMN, PROBABILITY_COLUMN)
            if column not in df.columns
        ]
        if missing_columns:
            raise SegmentationError(
                "Segment summary requires "
                f"'{RISK_CATEGORY_COLUMN}' and '{PROBABILITY_COLUMN}' columns. "
                f"Missing: {missing_columns}."
            )

        if df.empty:
            return pd.DataFrame(
                columns=[
                    RISK_CATEGORY_COLUMN,
                    "customer_count",
                    "percentage",
                    "average_pd",
                ]
            )

        summary = (
            df.groupby(RISK_CATEGORY_COLUMN, as_index=False)
            .agg(
                customer_count=(PROBABILITY_COLUMN, "count"),
                average_pd=(PROBABILITY_COLUMN, "mean"),
            )
        )

        total_customers = int(summary["customer_count"].sum())
        summary["percentage"] = np.where(
            total_customers > 0,
            (summary["customer_count"] / total_customers) * 100.0,
            0.0,
        )

        summary[RISK_CATEGORY_COLUMN] = pd.Categorical(
            summary[RISK_CATEGORY_COLUMN],
            categories=list(RISK_CATEGORY_ORDER),
            ordered=True,
        )
        summary = summary.sort_values(RISK_CATEGORY_COLUMN).reset_index(drop=True)
        summary[RISK_CATEGORY_COLUMN] = summary[RISK_CATEGORY_COLUMN].astype(str)

        return summary[
            [
                RISK_CATEGORY_COLUMN,
                "customer_count",
                "percentage",
                "average_pd",
            ]
        ]

    @staticmethod
    def _validate_thresholds(good_threshold: float, bad_threshold: float) -> None:
        """Validate segmentation threshold values and ordering."""
        for name, value in (
            ("good_threshold", good_threshold),
            ("bad_threshold", bad_threshold),
        ):
            if not isinstance(value, (int, float)):
                raise InvalidThresholdError(
                    f"{name} must be a number between 0 and 1, "
                    f"got {type(value).__name__}."
                )
            if not 0.0 <= float(value) <= 1.0:
                raise InvalidThresholdError(
                    f"{name} must be between 0 and 1, got {value}."
                )

        if float(good_threshold) >= float(bad_threshold):
            raise InvalidThresholdError(
                "good_threshold must be less than bad_threshold; "
                f"got good_threshold={good_threshold}, "
                f"bad_threshold={bad_threshold}."
            )

    @staticmethod
    def _select_output_columns(df: pd.DataFrame) -> pd.DataFrame:
        """Return only the columns required by the segmentation output contract."""
        output_columns = [PROBABILITY_COLUMN]
        if PREDICTION_COLUMN in df.columns:
            output_columns.append(PREDICTION_COLUMN)
        output_columns.append(RISK_CATEGORY_COLUMN)
        return df.loc[:, output_columns].copy()
