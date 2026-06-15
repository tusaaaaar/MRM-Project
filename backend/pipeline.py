"""End-to-end orchestration for the Credit Risk Dashboard."""

from __future__ import annotations

from typing import Any, TypedDict

import pandas as pd

from backend.metrics import (
    ConfusionMatrixResult,
    CreditRiskMetrics,
    MetricsError,
    MetricsResult,
    ROCDataResult,
    calculate_pd_deciles,
    calculate_score_band_analysis,
)
from backend.predictor import (
    CreditRiskPredictor,
    DEFAULT_PREDICTION_THRESHOLD,
    PredictorError,
    PROBABILITY_COLUMN,
    PREDICTION_COLUMN,
)
from backend.segmentation import (
    CreditRiskSegmentation,
    DEFAULT_BAD_THRESHOLD,
    DEFAULT_GOOD_THRESHOLD,
    SegmentationError,
)
from backend.validator import ValidationResult, validate_dataset

ACTUAL_DEFAULT_COLUMN = "actual_default"


class PipelineError(Exception):
    """Raised when the credit-risk pipeline fails."""


class PipelineResult(TypedDict, total=False):
    """Pipeline output consumed by the dashboard."""

    predictions:        pd.DataFrame
    segmentation:       pd.DataFrame
    segment_summary:    list[dict[str, Any]]
    metrics:            MetricsResult
    confusion_matrix:   ConfusionMatrixResult
    roc_data:           ROCDataResult
    pd_decile_analysis: list[dict[str, Any]]
    validation_report:  ValidationResult
    score_band_analysis: list[dict[str, Any]]


class CreditRiskPipeline:
    """
    Orchestrate validation, prediction reading, metrics, and segmentation.

    The pipeline no longer trains any model.  It expects the uploaded dataset
    to already contain ``prediction``, ``probability_of_default``, and
    ``actual_default`` columns, which are validated and read by the predictor.
    """

    def __init__(self) -> None:
        """Initialise stateless pipeline components."""
        self.predictor    = CreditRiskPredictor()
        self.segmentation = CreditRiskSegmentation()
        self.metrics      = CreditRiskMetrics()

    # ── Public API ────────────────────────────────────────────────────────────

    def run(
        self,
        df: pd.DataFrame,
        target_column: str | None = None,
        prediction_threshold: float = DEFAULT_PREDICTION_THRESHOLD,
        good_threshold: float = DEFAULT_GOOD_THRESHOLD,
        bad_threshold: float = DEFAULT_BAD_THRESHOLD,
    ) -> PipelineResult:
        """
        Execute the credit-risk analytics workflow.

        Pipeline steps:
            1. Validate the input dataset.
            2. Read and validate prediction columns from the dataset.
            3. Compute evaluation metrics from the pre-computed predictions.
            4. Compute PD decile analysis.
            5. Segment all customers by probability of default.
            6. Summarise segment distribution.

        Args:
            df:                   Dataset containing ``prediction``,
                                  ``probability_of_default``, and
                                  ``actual_default`` columns.
            target_column:        Unused — retained for API compatibility.
            prediction_threshold: Unused — predictions are read directly from
                                  the dataset, not re-thresholded.
            good_threshold:       Upper bound (exclusive) for the Good segment.
            bad_threshold:        Lower bound (inclusive) for the Bad segment.

        Returns:
            Dashboard-ready ``PipelineResult`` dictionary.

        Raises:
            PipelineError: If validation fails or any pipeline step errors.
        """
        if not isinstance(df, pd.DataFrame):
            raise PipelineError(
                f"Input must be a pandas DataFrame, got {type(df).__name__}."
            )

        try:
            # Step 1 — Validate
            validation_result = validate_dataset(df)
            self._ensure_valid_dataset(validation_result)

            # Step 2 — Read prediction columns
            predictions = self.predictor.fit_predict(df)

            # Step 3 — Compute evaluation metrics
            evaluation_outputs = self._calculate_evaluation_outputs(predictions)

            # Step 4 — PD decile analysis
            pd_decile_analysis = self._calculate_pd_decile_analysis(predictions)

            score_band_analysis = calculate_score_band_analysis(predictions)

            # Step 5 — Segment all customers by probability of default
            segmentation = self.segmentation.segment_customers(
                predictions,
                good_threshold=good_threshold,
                bad_threshold=bad_threshold,
            )

            # Step 6 — Segment summary
            segment_summary_raw = self.segmentation.get_segment_summary(segmentation)
            segment_summary = (
                segment_summary_raw.to_dict(orient="records")
                if isinstance(segment_summary_raw, pd.DataFrame)
                else segment_summary_raw
            )

            result: PipelineResult = {
                "validation_report":  validation_result,
                "predictions":        predictions,
                "segmentation":       segmentation,
                "segment_summary":    segment_summary,
                "pd_decile_analysis": pd_decile_analysis,
                "score_band_analysis": score_band_analysis,
            }
            result.update(evaluation_outputs)

            return result

        except PipelineError:
            raise
        except (PredictorError, SegmentationError, MetricsError) as exc:
            raise PipelineError("Credit-risk pipeline execution failed.") from exc

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _ensure_valid_dataset(validation_result: ValidationResult) -> None:
        """Block completely unusable datasets; surface other issues via the report."""
        if validation_result["total_rows"] == 0:
            raise PipelineError("Uploaded dataset contains no records.")

    def _calculate_evaluation_outputs(
        self,
        predictions: pd.DataFrame,
    ) -> dict[str, Any]:
        """
        Compute metrics, confusion matrix, and ROC data from pre-computed predictions.

        Args:
            predictions: DataFrame containing ``prediction``,
                         ``probability_of_default``, and ``actual_default``.

        Returns:
            Dictionary with ``metrics``, ``confusion_matrix``, and ``roc_data``.

        Raises:
            PipelineError: If the predictions frame is empty.
        """
        if predictions.empty:
            raise PipelineError(
                "Predictions DataFrame is empty — cannot compute evaluation metrics."
            )

        y_true = predictions[ACTUAL_DEFAULT_COLUMN]
        y_pred = predictions[PREDICTION_COLUMN]
        y_prob = predictions[PROBABILITY_COLUMN]

        metrics_result          = self.metrics.calculate_metrics(y_true, y_pred, y_prob)
        confusion_matrix_result = self.metrics.get_confusion_matrix(y_true, y_pred)
        roc_data                = self.metrics.get_roc_data(y_true, y_prob)

        return {
            "metrics":          metrics_result,
            "confusion_matrix": confusion_matrix_result,
            "roc_data":         roc_data,
        }

    @staticmethod
    def _calculate_pd_decile_analysis(
        predictions: pd.DataFrame,
    ) -> list[dict[str, Any]]:
        """
        Compute PD decile validation statistics from the predictions DataFrame.

        Wraps ``calculate_pd_deciles`` with a graceful fallback so that a
        missing ``actual_default`` column (inference-only datasets) does not
        abort the entire pipeline.

        Args:
            predictions: DataFrame returned by ``CreditRiskPredictor.fit_predict``
                         containing at least ``probability_of_default``.

        Returns:
            List of decile dicts, or an empty list if decile computation
            is not possible (e.g. ``actual_default`` absent).
        """
        try:
            return calculate_pd_deciles(predictions)
        except MetricsError:
            # actual_default column absent — decile analysis not available
            return []
        
    @staticmethod
    def _calculate_score_band_analysis(
        predictions: pd.DataFrame,
    ) -> list[dict[str, Any]]:
        """
        Compute score band analysis statistics from predictions.
        """
        try:
            return calculate_score_band_analysis(predictions)
        except MetricsError:
            return []