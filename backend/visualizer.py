"""Chart generation for the Credit Risk Dashboard."""

from __future__ import annotations

from typing import Any, Sequence

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.figure import Figure

from backend.segmentation import RISK_CATEGORY_COLUMN, RISK_CATEGORY_ORDER

TOP_FEATURE_COUNT = 10


class VisualizationError(Exception):
    """Raised when chart inputs are invalid or plotting fails."""


class CreditRiskVisualizer:
    """Build matplotlib figures for credit-risk dashboard visualizations."""

    def generate_roc_curve(
        self,
        fpr: Sequence[float],
        tpr: Sequence[float],
        auc_score: float,
    ) -> Figure:
        """
        Plot an ROC curve with the supplied false- and true-positive rates.

        Args:
            fpr: False positive rates.
            tpr: True positive rates.
            auc_score: Area under the ROC curve used in the chart legend.

        Returns:
            A matplotlib ``Figure`` containing the ROC curve.

        Raises:
            VisualizationError: If inputs are invalid or plotting fails.
        """
        false_positive_rate = self._to_numeric_array(fpr, name="fpr")
        true_positive_rate = self._to_numeric_array(tpr, name="tpr")

        if false_positive_rate.size == 0 or true_positive_rate.size == 0:
            raise VisualizationError("fpr and tpr must not be empty.")

        if false_positive_rate.shape[0] != true_positive_rate.shape[0]:
            raise VisualizationError(
                "fpr and tpr must have the same length; "
                f"got {false_positive_rate.shape[0]} and {true_positive_rate.shape[0]}."
            )

        if not isinstance(auc_score, (int, float)):
            raise VisualizationError(
                f"auc_score must be numeric, got {type(auc_score).__name__}."
            )

        figure: Figure | None = None
        try:
            figure, axis = plt.subplots(figsize=(8, 6))
            axis.plot(
                false_positive_rate,
                true_positive_rate,
                color="#1f77b4",
                linewidth=2,
                label=f"AUC = {float(auc_score):.3f}",
            )
            axis.plot([0, 1], [0, 1], linestyle="--", color="#7f7f7f", linewidth=1)
            axis.set_title("ROC Curve")
            axis.set_xlabel("False Positive Rate")
            axis.set_ylabel("True Positive Rate")
            axis.set_xlim(0.0, 1.0)
            axis.set_ylim(0.0, 1.0)
            axis.legend(loc="lower right")
            axis.grid(True, linestyle="--", alpha=0.4)
            figure.tight_layout()
        except Exception as exc:
            if figure is not None:
                plt.close(figure)
            raise VisualizationError("Failed to generate ROC curve plot.") from exc

        return figure

    def generate_confusion_matrix_plot(
        self,
        tn: int,
        fp: int,
        fn: int,
        tp: int,
    ) -> Figure:
        """
        Plot a heatmap for a binary confusion matrix.

        Args:
            tn: True negatives.
            fp: False positives.
            fn: False negatives.
            tp: True positives.

        Returns:
            A matplotlib ``Figure`` containing the confusion-matrix heatmap.

        Raises:
            VisualizationError: If counts are invalid or plotting fails.
        """
        counts = self._validate_confusion_counts(tn, fp, fn, tp)
        matrix = np.array([[counts["tn"], counts["fp"]], [counts["fn"], counts["tp"]]])

        figure: Figure | None = None
        try:
            figure, axis = plt.subplots(figsize=(6, 5))
            image = axis.imshow(matrix, cmap="Blues")
            figure.colorbar(image, ax=axis, fraction=0.046, pad=0.04)

            axis.set_xticks([0, 1])
            axis.set_yticks([0, 1])
            axis.set_xticklabels(["Predicted 0", "Predicted 1"])
            axis.set_yticklabels(["Actual 0", "Actual 1"])
            axis.set_title("Confusion Matrix")

            labels = [
                ["TN", "FP"],
                ["FN", "TP"],
            ]
            for row_index in range(2):
                for column_index in range(2):
                    axis.text(
                        column_index,
                        row_index,
                        f"{labels[row_index][column_index]}\n{matrix[row_index, column_index]}",
                        ha="center",
                        va="center",
                        color="black",
                        fontsize=11,
                    )

            figure.tight_layout()
        except Exception as exc:
            if figure is not None:
                plt.close(figure)
            raise VisualizationError(
                "Failed to generate confusion matrix plot."
            ) from exc

        return figure

    def generate_risk_distribution_plot(self, segmented_df: pd.DataFrame) -> Figure:
        """
        Plot customer counts by risk category.

        Args:
            segmented_df: Dataframe containing a ``risk_category`` column with
                values ``Good``, ``Moderate``, and ``Bad``.

        Returns:
            A matplotlib ``Figure`` containing the risk-distribution bar chart.

        Raises:
            VisualizationError: If the input is invalid or plotting fails.
        """
        if not isinstance(segmented_df, pd.DataFrame):
            raise VisualizationError(
                f"segmented_df must be a pandas DataFrame, got {type(segmented_df).__name__}."
            )

        if RISK_CATEGORY_COLUMN not in segmented_df.columns:
            raise VisualizationError(
                f"segmented_df must contain '{RISK_CATEGORY_COLUMN}' column."
            )

        category_counts = (
            segmented_df[RISK_CATEGORY_COLUMN]
            .value_counts()
            .reindex(list(RISK_CATEGORY_ORDER), fill_value=0)
            .astype(int)
        )

        figure: Figure | None = None
        try:
            figure, axis = plt.subplots(figsize=(8, 6))
            bars = axis.bar(
                category_counts.index,
                category_counts.values,
                color=["#2ca02c", "#ff7f0e", "#d62728"],
            )
            axis.set_title("Risk Category Distribution")
            axis.set_xlabel("Risk Category")
            axis.set_ylabel("Customer Count")
            axis.grid(axis="y", linestyle="--", alpha=0.4)

            for bar in bars:
                height = bar.get_height()
                axis.text(
                    bar.get_x() + bar.get_width() / 2,
                    height,
                    f"{int(height)}",
                    ha="center",
                    va="bottom",
                )

            figure.tight_layout()
        except Exception as exc:
            if figure is not None:
                plt.close(figure)
            raise VisualizationError(
                "Failed to generate risk distribution plot."
            ) from exc

        return figure

    def generate_feature_importance_plot(
        self,
        model: Any,
        feature_names: Sequence[str],
    ) -> Figure:
        """
        Plot the top feature importances from a linear model's coefficients.

        Args:
            model: Fitted model exposing a ``coef_`` attribute.
            feature_names: Feature names aligned with ``model.coef_``.

        Returns:
            A matplotlib ``Figure`` containing the top-10 feature-importance
            bar chart.

        Raises:
            VisualizationError: If the model or feature names are invalid, or
                plotting fails.
        """
        coefficients = self._extract_coefficients(model)
        names = self._validate_feature_names(feature_names, coefficient_count=coefficients.size)

        importance = np.abs(coefficients)
        top_count = min(TOP_FEATURE_COUNT, importance.size)
        top_indices = np.argsort(importance)[-top_count:][::-1]

        top_features = [names[index] for index in top_indices]
        top_importance = importance[top_indices]

        figure: Figure | None = None
        try:
            figure, axis = plt.subplots(figsize=(10, 6))
            axis.barh(top_features[::-1], top_importance[::-1], color="#1f77b4")
            axis.set_title(f"Top {top_count} Feature Importances")
            axis.set_xlabel("Absolute Coefficient Value")
            axis.set_ylabel("Feature")
            axis.grid(axis="x", linestyle="--", alpha=0.4)
            figure.tight_layout()
        except Exception as exc:
            if figure is not None:
                plt.close(figure)
            raise VisualizationError(
                "Failed to generate feature importance plot."
            ) from exc

        return figure

    @staticmethod
    def _to_numeric_array(values: Sequence[float], *, name: str) -> np.ndarray:
        """Convert a sequence to a 1D numeric numpy array."""
        array = np.asarray(values, dtype=float)
        if array.ndim != 1:
            raise VisualizationError(f"{name} must be a 1D sequence.")
        return array

    @staticmethod
    def _validate_confusion_counts(
        tn: int,
        fp: int,
        fn: int,
        tp: int,
    ) -> dict[str, int]:
        """Validate confusion-matrix count inputs."""
        validated: dict[str, int] = {}
        for name, value in (("tn", tn), ("fp", fp), ("fn", fn), ("tp", tp)):
            if not isinstance(value, (int, np.integer)):
                raise VisualizationError(
                    f"{name} must be an integer, got {type(value).__name__}."
                )
            if value < 0:
                raise VisualizationError(f"{name} must be non-negative, got {value}.")
            validated[name] = int(value)
        return validated

    @staticmethod
    def _extract_coefficients(model: Any) -> np.ndarray:
        """Extract and flatten model coefficients for importance ranking."""
        if not hasattr(model, "coef_"):
            raise VisualizationError("model must expose a 'coef_' attribute.")

        try:
            coefficients = np.asarray(model.coef_, dtype=float).ravel()
        except Exception as exc:
            raise VisualizationError("Unable to read coefficients from model.") from exc

        if coefficients.size == 0:
            raise VisualizationError("model.coef_ must not be empty.")

        return coefficients

    @staticmethod
    def _validate_feature_names(
        feature_names: Sequence[str],
        *,
        coefficient_count: int,
    ) -> list[str]:
        """Validate feature names against coefficient length."""
        if not isinstance(feature_names, Sequence) or isinstance(feature_names, (str, bytes)):
            raise VisualizationError("feature_names must be a sequence of strings.")

        names = list(feature_names)
        if not names:
            raise VisualizationError("feature_names must not be empty.")

        if not all(isinstance(name, str) for name in names):
            raise VisualizationError("feature_names must contain only strings.")

        if len(names) != coefficient_count:
            raise VisualizationError(
                "feature_names length must match model.coef_ size; "
                f"got {len(names)} names for {coefficient_count} coefficients."
            )

        return names
