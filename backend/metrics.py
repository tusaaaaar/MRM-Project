"""Evaluation metrics for the Credit Risk Dashboard."""

from __future__ import annotations

import math
from typing import Any, Sequence, TypedDict

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    cohen_kappa_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

POSITIVE_LABEL = 1


class MetricsError(Exception):
    """Raised when metric inputs are invalid or computation fails."""


class MetricsResult(TypedDict):
    """Classification and ranking metrics for a credit-risk model."""

    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc: float
    gini: float
    kappa: float


class ConfusionMatrixResult(TypedDict):
    """Confusion-matrix counts for binary default classification."""

    tn: int
    fp: int
    fn: int
    tp: int


class ROCDataResult(TypedDict):
    """ROC curve coordinates for dashboard plotting."""

    fpr: list[float]
    tpr: list[float]
    thresholds: list[float]


class ModelSummaryResult(TypedDict):
    """Combined metrics and confusion-matrix values for dashboard KPI cards."""

    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc: float
    gini: float
    kappa: float
    tn: int
    fp: int
    fn: int
    tp: int


class PDDecileResult(TypedDict):
    """PD decile validation output for a single decile band."""

    decile: int
    customer_count: int
    average_pd: float
    actual_bad_rate: float


class ScoreBandResult(TypedDict):
    """Score band analysis output for a single credit-score band."""

    score_band: str
    customer_count: int
    average_pd: float
    actual_bad_rate: float
    min_pd: float
    max_pd: float


METRICS_RESULT_KEYS: tuple[str, ...] = (
    "accuracy",
    "precision",
    "recall",
    "f1_score",
    "auc",
    "gini",
    "kappa",
)
CONFUSION_MATRIX_RESULT_KEYS: tuple[str, ...] = ("tn", "fp", "fn", "tp")

# ── Score band definitions ────────────────────────────────────────────────────
_SCORE_BANDS: list[tuple[int, int, str]] = [
    (300, 349, "300-349"),
    (350, 399, "350-399"),
    (400, 449, "400-449"),
    (450, 499, "450-499"),
    (500, 549, "500-549"),
    (550, 599, "550-599"),
    (600, 649, "600-649"),
    (650, 699, "650-699"),
    (700, 749, "700-749"),
    (750, 799, "750-799"),
    (800, 9999, "800+"),
]

ArrayLike = Sequence[Any] | np.ndarray | pd.Series


# ── PD → Credit Score conversion ─────────────────────────────────────────────

def _pd_to_score(pd_value: float) -> float:
    """
    Convert a probability of default to a credit score.

    Formula:  Score = 600 + 15 * ln((1 - PD) / PD)

    PD values of exactly 0 or 1 are clamped to avoid log domain errors.
    """
    pd_clamped = max(1e-9, min(1 - 1e-9, pd_value))
    odds = (1.0 - pd_clamped) / pd_clamped
    return 600.0 + 15.0 * math.log(odds)


def _assign_score_band(score: float) -> str:
    """Return the score band label for a given credit score."""
    for low, high, label in _SCORE_BANDS:
        if low <= score <= high:
            return label
    return "800+"


# ── PD Decile Validation ──────────────────────────────────────────────────────

def calculate_pd_deciles(
    df: pd.DataFrame,
    pd_column: str = "probability_of_default",
    actual_column: str = "actual_default",
    n_deciles: int = 10,
) -> list[PDDecileResult]:
    """
    Divide customers into PD deciles and compute validation statistics.

    Customers are sorted ascending by ``pd_column`` so Decile 1 contains
    the lowest-PD customers and Decile ``n_deciles`` the highest.

    For each decile the following are computed:
    - ``customer_count``: number of records in the decile.
    - ``average_pd``: mean predicted probability of default.
    - ``actual_bad_rate``: fraction of records where ``actual_column`` == 1.

    Args:
        df:             DataFrame containing at least ``pd_column`` and
                        ``actual_column``.
        pd_column:      Column name for predicted probability of default.
                        Defaults to ``"probability_of_default"``.
        actual_column:  Column name for observed default outcome (0/1).
                        Defaults to ``"actual_default"``.
        n_deciles:      Number of equal-frequency bands. Defaults to 10.

    Returns:
        A list of ``PDDecileResult`` dicts ordered from Decile 1 to
        Decile ``n_deciles``.

    Raises:
        MetricsError: If required columns are missing, the DataFrame is
                      empty, or decile assignment fails.
    """
    if not isinstance(df, pd.DataFrame) or df.empty:
        raise MetricsError("DataFrame must be non-empty to compute PD deciles.")

    missing = [c for c in (pd_column, actual_column) if c not in df.columns]
    if missing:
        raise MetricsError(
            f"Required column(s) not found in DataFrame: {missing}."
        )

    work = df[[pd_column, actual_column]].copy().reset_index(drop=True)
    work = work.sort_values(pd_column, ascending=True).reset_index(drop=True)

    try:
        work["_decile"] = pd.qcut(
            work[pd_column],
            q=n_deciles,
            labels=False,
            duplicates="drop",
        )
    except Exception as exc:
        raise MetricsError(f"Failed to assign PD decile bands: {exc}") from exc

    band_order = {
        band: rank + 1
        for rank, band in enumerate(sorted(work["_decile"].dropna().unique()))
    }
    work["_decile"] = work["_decile"].map(band_order)

    results: list[PDDecileResult] = []

    for decile_num in sorted(work["_decile"].dropna().unique()):
        subset = work[work["_decile"] == decile_num]
        customer_count  = len(subset)
        average_pd      = round(float(subset[pd_column].mean()), 4)
        actual_bad_rate = round(
            float(subset[actual_column].sum() / customer_count)
            if customer_count > 0 else 0.0,
            4,
        )
        results.append({
            "decile":          int(decile_num),
            "customer_count":  customer_count,
            "average_pd":      average_pd,
            "actual_bad_rate": actual_bad_rate,
        })

    return results


# ── Score Band Analysis ───────────────────────────────────────────────────────

def calculate_score_band_analysis(
    df: pd.DataFrame,
    pd_column: str = "probability_of_default",
    actual_column: str = "actual_default",
) -> list[ScoreBandResult]:
    """
    Segment customers into credit-score bands and compute validation statistics.

    Each PD value is converted to a credit score using:

        Score = 600 + 15 * ln((1 - PD) / PD)

    Customers are then placed into fixed 50-point score bands ranging from
    300–349 up to 800+.  Only bands that contain at least one customer are
    included in the output.

    For each band the following are computed:

    - ``customer_count``: number of records in the band.
    - ``average_pd``: mean predicted probability of default.
    - ``actual_bad_rate``: fraction of records where ``actual_column`` == 1.
    - ``min_pd``: lowest PD value in the band.
    - ``max_pd``: highest PD value in the band.

    Args:
        df:             DataFrame containing at least ``pd_column`` and
                        ``actual_column``.
        pd_column:      Column name for predicted probability of default.
                        Defaults to ``"probability_of_default"``.
        actual_column:  Column name for observed default outcome (0/1).
                        Defaults to ``"actual_default"``.

    Returns:
        A list of ``ScoreBandResult`` dicts ordered from lowest to highest
        score band, containing only bands with at least one customer.

    Raises:
        MetricsError: If required columns are missing or the DataFrame is
                      empty.
    """
    if not isinstance(df, pd.DataFrame) or df.empty:
        raise MetricsError(
            "DataFrame must be non-empty to compute score band analysis."
        )

    missing = [c for c in (pd_column, actual_column) if c not in df.columns]
    if missing:
        raise MetricsError(
            f"Required column(s) not found in DataFrame: {missing}."
        )

    work = df[[pd_column, actual_column]].copy().reset_index(drop=True)

    # Convert PD → credit score, then assign score band label
    work["_score"]      = work[pd_column].apply(_pd_to_score)
    work["_score_band"] = work["_score"].apply(_assign_score_band)

    # Preserve defined band order
    band_order = [label for _, _, label in _SCORE_BANDS]

    results: list[ScoreBandResult] = []

    for label in band_order:
        subset = work[work["_score_band"] == label]
        if subset.empty:
            continue

        customer_count  = len(subset)
        average_pd      = round(float(subset[pd_column].mean()), 4)
        actual_bad_rate = round(
            float(subset[actual_column].sum() / customer_count)
            if customer_count > 0 else 0.0,
            4,
        )
        min_pd = round(float(subset[pd_column].min()), 4)
        max_pd = round(float(subset[pd_column].max()), 4)

        results.append({
            "score_band":      label,
            "customer_count":  customer_count,
            "average_pd":      average_pd,
            "actual_bad_rate": actual_bad_rate,
            "min_pd":          min_pd,
            "max_pd":          max_pd,
        })

    return results


# ── Existing metrics class (unchanged) ───────────────────────────────────────

class CreditRiskMetrics:
    """Compute classification and ranking metrics for credit-risk models."""

    def calculate_metrics(
        self,
        y_true: ArrayLike,
        y_pred: ArrayLike,
        y_prob: ArrayLike,
    ) -> MetricsResult:
        """
        Calculate standard performance metrics for binary default prediction.

        Args:
            y_true: Ground-truth labels (0 = no default, 1 = default).
            y_pred: Predicted class labels.
            y_prob: Predicted probability of the positive (default) class.

        Returns:
            A dictionary containing ``accuracy``, ``precision``, ``recall``,
            ``f1_score``, ``auc``, ``gini`` (where ``gini = (2 * auc) - 1``),
            and ``kappa`` (Cohen's Kappa Statistic).

        Raises:
            MetricsError: If inputs are empty, lengths differ, or computation
                fails.
        """
        true_labels, predicted_labels, predicted_probabilities = self._validate_triplet(
            y_true,
            y_pred,
            y_prob,
            names=("y_true", "y_pred", "y_prob"),
        )

        try:
            accuracy  = float(accuracy_score(true_labels, predicted_labels))
            precision = float(
                precision_score(
                    true_labels,
                    predicted_labels,
                    pos_label=POSITIVE_LABEL,
                    zero_division=0,
                )
            )
            recall = float(
                recall_score(
                    true_labels,
                    predicted_labels,
                    pos_label=POSITIVE_LABEL,
                    zero_division=0,
                )
            )
            f1 = float(
                f1_score(
                    true_labels,
                    predicted_labels,
                    pos_label=POSITIVE_LABEL,
                    zero_division=0,
                )
            )
            auc   = float(roc_auc_score(true_labels, predicted_probabilities))
            gini  = float((2.0 * auc) - 1.0)
            kappa = float(cohen_kappa_score(true_labels, predicted_labels))
        except Exception as exc:
            raise MetricsError("Failed to calculate performance metrics.") from exc

        return {
            "accuracy":  accuracy,
            "precision": precision,
            "recall":    recall,
            "f1_score":  f1,
            "auc":       auc,
            "gini":      gini,
            "kappa":     kappa,
        }

    def get_confusion_matrix(
        self,
        y_true: ArrayLike,
        y_pred: ArrayLike,
    ) -> ConfusionMatrixResult:
        """
        Compute confusion-matrix counts for binary predictions.

        Args:
            y_true: Ground-truth labels.
            y_pred: Predicted class labels.

        Returns:
            A dictionary with keys ``tn``, ``fp``, ``fn``, and ``tp``.

        Raises:
            MetricsError: If inputs are empty, lengths differ, or computation
                fails.
        """
        true_labels, predicted_labels = self._validate_pair(
            y_true,
            y_pred,
            names=("y_true", "y_pred"),
        )

        try:
            matrix = confusion_matrix(
                true_labels,
                predicted_labels,
                labels=[0, POSITIVE_LABEL],
            )
            tn, fp, fn, tp = (int(value) for value in matrix.ravel())
        except Exception as exc:
            raise MetricsError("Failed to calculate confusion matrix.") from exc

        return {"tn": tn, "fp": fp, "fn": fn, "tp": tp}

    def get_roc_data(
        self,
        y_true: ArrayLike,
        y_prob: ArrayLike,
    ) -> ROCDataResult:
        """
        Generate ROC curve data for visualization.

        Args:
            y_true: Ground-truth labels.
            y_prob: Predicted probability of the positive (default) class.

        Returns:
            A dictionary with ``fpr``, ``tpr``, and ``thresholds`` as lists.

        Raises:
            MetricsError: If inputs are empty, lengths differ, or computation
                fails.
        """
        true_labels, predicted_probabilities = self._validate_pair(
            y_true,
            y_prob,
            names=("y_true", "y_prob"),
        )

        try:
            fpr, tpr, thresholds = roc_curve(true_labels, predicted_probabilities)
        except Exception as exc:
            raise MetricsError("Failed to calculate ROC curve data.") from exc

        clean_thresholds = np.where(np.isinf(thresholds), -1.0, thresholds)

        return {
            "fpr":        np.asarray(fpr, dtype=float).tolist(),
            "tpr":        np.asarray(tpr, dtype=float).tolist(),
            "thresholds": np.asarray(clean_thresholds, dtype=float).tolist(),
        }

    def get_model_summary(
        self,
        metrics_result: MetricsResult | dict[str, Any],
        confusion_matrix_result: ConfusionMatrixResult | dict[str, Any],
    ) -> ModelSummaryResult:
        """
        Combine classification metrics and confusion-matrix counts for KPI cards.

        Args:
            metrics_result: Output from :meth:`calculate_metrics`.
            confusion_matrix_result: Output from :meth:`get_confusion_matrix`.

        Returns:
            A single dictionary containing all dashboard KPI fields.

        Raises:
            MetricsError: If either input is invalid or missing required keys.
        """
        validated_metrics = self._validate_result_dict(
            metrics_result,
            required_keys=METRICS_RESULT_KEYS,
            name="metrics_result",
        )
        validated_confusion_matrix = self._validate_result_dict(
            confusion_matrix_result,
            required_keys=CONFUSION_MATRIX_RESULT_KEYS,
            name="confusion_matrix_result",
        )

        return {
            "accuracy":  float(validated_metrics["accuracy"]),
            "precision": float(validated_metrics["precision"]),
            "recall":    float(validated_metrics["recall"]),
            "f1_score":  float(validated_metrics["f1_score"]),
            "auc":       float(validated_metrics["auc"]),
            "gini":      float(validated_metrics["gini"]),
            "kappa":     float(validated_metrics["kappa"]),
            "tn":        int(validated_confusion_matrix["tn"]),
            "fp":        int(validated_confusion_matrix["fp"]),
            "fn":        int(validated_confusion_matrix["fn"]),
            "tp":        int(validated_confusion_matrix["tp"]),
        }

    @staticmethod
    def _validate_result_dict(
        result: dict[str, Any],
        *,
        required_keys: tuple[str, ...],
        name: str,
    ) -> dict[str, Any]:
        """Ensure a result dictionary exposes all required keys."""
        if not isinstance(result, dict):
            raise MetricsError(
                f"{name} must be a dictionary, got {type(result).__name__}."
            )
        missing_keys = [key for key in required_keys if key not in result]
        if missing_keys:
            raise MetricsError(
                f"{name} is missing required keys: {missing_keys}."
            )
        return result

    @staticmethod
    def _to_numpy_array(values: ArrayLike, name: str) -> np.ndarray:
        """Convert supported array-like inputs to a 1D numpy array."""
        if isinstance(values, pd.Series):
            array = values.to_numpy()
        else:
            array = np.asarray(values)
        if array.ndim != 1:
            raise MetricsError(f"{name} must be a 1D array-like input.")
        return array

    @classmethod
    def _validate_pair(
        cls,
        first: ArrayLike,
        second: ArrayLike,
        *,
        names: tuple[str, str],
    ) -> tuple[np.ndarray, np.ndarray]:
        """Validate two equally sized, non-empty inputs."""
        first_array  = cls._to_numpy_array(first,  names[0])
        second_array = cls._to_numpy_array(second, names[1])
        if first_array.size == 0:
            raise MetricsError(f"{names[0]} must not be empty.")
        if first_array.shape[0] != second_array.shape[0]:
            raise MetricsError(
                f"{names[0]} and {names[1]} must have the same length; "
                f"got {first_array.shape[0]} and {second_array.shape[0]}."
            )
        return first_array, second_array

    @classmethod
    def _validate_triplet(
        cls,
        y_true: ArrayLike,
        y_pred: ArrayLike,
        y_prob: ArrayLike,
        *,
        names: tuple[str, str, str],
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Validate three equally sized, non-empty inputs."""
        true_labels, predicted_labels = cls._validate_pair(
            y_true, y_pred, names=(names[0], names[1])
        )
        predicted_probabilities = cls._to_numpy_array(y_prob, names[2])
        if predicted_probabilities.size == 0:
            raise MetricsError(f"{names[2]} must not be empty.")
        if true_labels.shape[0] != predicted_probabilities.shape[0]:
            raise MetricsError(
                f"{names[0]} and {names[2]} must have the same length; "
                f"got {true_labels.shape[0]} and {predicted_probabilities.shape[0]}."
            )
        return true_labels, predicted_labels, predicted_probabilities