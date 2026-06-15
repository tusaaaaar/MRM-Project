"""Preprocessing pipeline for the Credit Risk Dashboard."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Sequence

import joblib
import numpy as np
import pandas as pd

ID_COLUMN = "ID"


class PreprocessorError(Exception):
    """Base exception for preprocessor failures."""


class ScalerLoadError(PreprocessorError):
    """Raised when the scaler artifact cannot be loaded."""


class FeatureColumnsLoadError(PreprocessorError):
    """Raised when the feature-columns artifact cannot be loaded."""


class MissingFeatureColumnsError(PreprocessorError):
    """Raised when the input dataframe lacks required feature columns."""

    def __init__(self, missing_columns: list[str]) -> None:
        self.missing_columns = missing_columns
        super().__init__(
            "Input dataframe is missing required feature columns: "
            f"{missing_columns}"
        )


class CreditRiskPreprocessor:
    """
    Load persisted artifacts and transform raw credit-risk data for inference.

    Artifacts are expected to be joblib-serialized files produced during model
    training (``scaler.pkl`` and ``feature_columns.pkl``).
    """

    def __init__(self, scaler_path: str | Path, feature_columns_path: str | Path) -> None:
        """
        Initialize the preprocessor and load training artifacts.

        Args:
            scaler_path: Filesystem path to the fitted scaler (``scaler.pkl``).
            feature_columns_path: Filesystem path to the ordered feature list
                (``feature_columns.pkl``).

        Raises:
            ScalerLoadError: If the scaler file is missing or cannot be loaded.
            FeatureColumnsLoadError: If the feature-columns file is missing or
                cannot be loaded.
        """
        self._scaler_path = Path(scaler_path)
        self._feature_columns_path = Path(feature_columns_path)
        self.scaler = self._load_scaler(self._scaler_path)
        self.feature_columns = self._load_feature_columns(self._feature_columns_path)

    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare and scale a raw dataset for model inference.

        Steps:
          1. Copy the input dataframe
          2. Drop the ``ID`` column when present
          3. Select and reorder columns to match ``feature_columns``
          4. Apply the fitted scaler

        Args:
            df: Raw input dataframe.

        Returns:
            A dataframe with the same row count as the input (after ID removal)
            and columns matching ``feature_columns``, with scaled numeric values.

        Raises:
            TypeError: If ``df`` is not a pandas DataFrame.
            MissingFeatureColumnsError: If any required feature column is absent.
            PreprocessorError: If scaling fails unexpectedly.
        """
        if not isinstance(df, pd.DataFrame):
            raise TypeError(
                f"Expected a pandas DataFrame, got {type(df).__name__}."
            )

        processed = df.copy()

        if ID_COLUMN in processed.columns:
            processed = processed.drop(columns=[ID_COLUMN])

        missing_columns = [
            column
            for column in self.feature_columns
            if column not in processed.columns
        ]
        if missing_columns:
            raise MissingFeatureColumnsError(missing_columns)

        features = processed.loc[:, self.feature_columns]

        try:
            scaled_values = self.scaler.transform(features)
        except Exception as exc:
            raise PreprocessorError(
                f"Failed to scale features using '{self._scaler_path}'."
            ) from exc

        return pd.DataFrame(
            np.asarray(scaled_values),
            columns=self.feature_columns,
            index=features.index,
        )

    @staticmethod
    def _load_scaler(path: Path) -> Any:
        """Load a fitted scaler from disk."""
        if not path.is_file():
            raise ScalerLoadError(f"Scaler file not found: '{path}'.")

        try:
            scaler = joblib.load(path)
        except Exception as exc:
            raise ScalerLoadError(
                f"Unable to load scaler from '{path}'."
            ) from exc

        if not hasattr(scaler, "transform") or not callable(scaler.transform):
            raise ScalerLoadError(
                f"Artifact at '{path}' is not a valid scaler with a transform method."
            )

        return scaler

    @staticmethod
    def _load_feature_columns(path: Path) -> list[str]:
        """Load the ordered feature-column list from disk."""
        if not path.is_file():
            raise FeatureColumnsLoadError(
                f"Feature columns file not found: '{path}'."
            )

        try:
            feature_columns = joblib.load(path)
        except Exception as exc:
            raise FeatureColumnsLoadError(
                f"Unable to load feature columns from '{path}'."
            ) from exc

        if not isinstance(feature_columns, Sequence) or isinstance(
            feature_columns, (str, bytes)
        ):
            raise FeatureColumnsLoadError(
                f"Feature columns artifact at '{path}' must be a sequence of names."
            )

        columns = list(feature_columns)
        if not columns:
            raise FeatureColumnsLoadError(
                f"Feature columns artifact at '{path}' is empty."
            )

        if not all(isinstance(column, str) for column in columns):
            raise FeatureColumnsLoadError(
                f"Feature columns artifact at '{path}' must contain only strings."
            )

        return columns
