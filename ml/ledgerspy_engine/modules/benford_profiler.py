import math
import numpy as np
import pandas as pd
from scipy.stats import chi2


class BenfordProfiler:
    """
    Benford's Law fraud detection profiler.

    Changelog vs original:
        Bug 1 fixed  — Chi-square now uses raw counts (unweighted) or a proper
                        effective-N formulation (weighted), not %-scale values.
        Bug 2 fixed  — compliance_confidence = p_value * 100.
                        High p-value means data conforms well; score now reflects that.
        Bug 3 fixed  — Weighted and unweighted results are clearly separated in the
                        output and both chi-square values are always returned so
                        callers can see which mode drove the verdict.
        Bug 4 fixed  — expected_dist computed exactly via log10 formula instead of
                        hardcoded rounded constants.
        Bug 5 fixed  — OVER-represented digits now also flagged as HIGH risk
                        (just-below-threshold fraud pattern).
    """

    # Chi-square critical value: df=8, significance level 5 %
    CHI2_THRESHOLD = 15.507

    # MAD risk bands (Nigrini 2012)
    MAD_BANDS = [
        (0.000, 0.006, "LOW",      "Close conformity — no material concern"),
        (0.006, 0.012, "MODERATE", "Acceptable conformity — minor anomalies possible"),
        (0.012, 0.015, "ELEVATED", "Marginal conformity — warrants review"),
        (0.015, float("inf"), "HIGH", "Non-conformity — statistically suspicious"),
    ]

    def __init__(self):
        # FIX 4: compute exact Benford probabilities instead of hardcoded rounded values
        self.expected_dist: dict[int, float] = {
            d: math.log10(1 + 1 / d) for d in range(1, 10)
        }
        # Sanity-check: probabilities must sum to exactly 1
        assert abs(sum(self.expected_dist.values()) - 1.0) < 1e-10, (
            "expected_dist does not sum to 1.0"
        )
        # Expose threshold as instance attribute for external use
        self.threshold = self.CHI2_THRESHOLD

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def analyze(
        self,
        df: pd.DataFrame,
        amount_column: str = "amount",
        weighted: bool = True,
    ) -> dict:
        """
        Analyze a transaction dataset against Benford's Law.

        Args:
            df:            DataFrame containing transaction data.
            amount_column: Column whose leading-digit distribution to test.
            weighted:      If True, also compute an amount-weighted distribution
                           and include it alongside the unweighted result.
                           The primary compliance verdict is always based on the
                           unweighted (count-based) chi-square.

        Returns:
            JSON-serialisable dict with chi-square statistics, p-values,
            MAD scores, per-digit breakdown, and anomaly patterns.
        """
        if amount_column not in df.columns:
            raise ValueError(f"Column '{amount_column}' not found in dataframe.")

        first_digits = self._extract_first_digits(df[amount_column])

        if len(first_digits) == 0:
            return {"error": "No valid numerical data to analyse."}

        n = len(first_digits)
        obs_counts = first_digits.value_counts().to_dict()

        # ── Unweighted analysis (always run) ──────────────────────────────────
        unweighted = self._unweighted_stats(obs_counts, n)

        # ── Weighted analysis (optional) ──────────────────────────────────────
        weighted_result: dict | None = None
        if weighted:
            amounts = df[amount_column].loc[first_digits.index]
            weighted_result = self._weighted_stats(first_digits, amounts, n)

        # ── Per-digit comparison table ─────────────────────────────────────────
        digit_distribution = self._build_digit_table(
            obs_counts, n, weighted_result
        )

        # ── Anomaly pattern detection ──────────────────────────────────────────
        anomaly_patterns = self._detect_anomalies(digit_distribution)

        # ── MAD risk classification ────────────────────────────────────────────
        mad_risk = self._classify_mad(unweighted["mad"])

        return {
            # Primary (unweighted) verdict
            "is_compliant": unweighted["chi_square"] < self.CHI2_THRESHOLD,
            "chi_square_stat": unweighted["chi_square"],
            "p_value": unweighted["p_value"],
            # FIX 2: compliance_confidence = p_value * 100
            #   High p-value (e.g. 0.54) → data conforms well → high confidence (54 %)
            #   Low p-value  (e.g. 0.01) → suspicious data    → low confidence  (1 %)
            "compliance_confidence": round(unweighted["p_value"] * 100, 4),
            "mad": round(unweighted["mad"] * 100, 4),       # expressed as %
            "mad_risk_level": mad_risk["level"],
            "mad_risk_description": mad_risk["description"],
            "total_analyzed": n,
            "digit_distribution": digit_distribution,
            "anomaly_patterns": anomaly_patterns,
            # FIX 3: always surface both modes so callers know which chi² drove
            #         the verdict and can compare the two distributions
            "weighted_analysis": weighted_result,
            "analysis_mode": "weighted+unweighted" if weighted else "unweighted",
        }

    def analyze_multiple_fields(
        self,
        df: pd.DataFrame,
        amount_fields: list[str] | None = None,
        weighted: bool = True,
    ) -> dict:
        """
        Run Benford analysis across multiple numeric columns.

        Args:
            df:            DataFrame to analyse.
            amount_fields: Columns to test (None = all numeric, minus id/count/index).
            weighted:      Passed through to each individual analysis.

        Returns:
            Dict mapping column name → analysis result.
        """
        if amount_fields is None:
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            amount_fields = [
                c for c in numeric_cols if c not in {"id", "count", "index"}
            ]

        results: dict = {}
        for field in amount_fields:
            if field in df.columns:
                try:
                    results[field] = self.analyze(df, field, weighted=weighted)
                except Exception as exc:
                    results[field] = {"error": str(exc)}

        return results

    # ──────────────────────────────────────────────────────────────────────────
    # Private helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _extract_first_digits(self, series: pd.Series) -> pd.Series:
        """
        Vectorised extraction of the first significant digit for every value.

        Uses the mathematical identity:
            d = floor( 10 ^ (log10(x) - floor(log10(x))) )
        which correctly handles values < 1 (e.g. 0.045 → 4).

        Returns a Series with the same index as the cleaned input so it can be
        joined back to the original DataFrame for weighted analysis.
        """
        clean = series.dropna().abs()
        clean = clean[clean > 0]

        if clean.empty:
            return pd.Series(dtype=int)

        log_vals = np.log10(clean.values)
        digits = np.floor(10 ** (log_vals - np.floor(log_vals)))
        digits = np.clip(digits, 1, 9).astype(int)

        return pd.Series(digits, index=clean.index)

    def _unweighted_stats(self, obs_counts: dict, n: int) -> dict:
        """
        Compute count-based (unweighted) chi-square and MAD.

        FIX 1: chi-square uses raw counts, not percentages.
            Correct formula:  Σ (O_i − E_i)² / E_i
            where O_i = observed count, E_i = expected count = p_i × N.
        """
        chi_sq = 0.0
        mad = 0.0

        for d in range(1, 10):
            expected_count = self.expected_dist[d] * n
            observed_count = obs_counts.get(d, 0)
            # Pearson chi-square component — operates on counts, not percentages
            chi_sq += (observed_count - expected_count) ** 2 / expected_count
            # MAD operates on proportions
            mad += abs(observed_count / n - self.expected_dist[d])

        mad /= 9
        p_val = float(1 - chi2.cdf(chi_sq, df=8))

        return {
            "chi_square": round(float(chi_sq), 6),
            "p_value": round(p_val, 6),
            "mad": mad,
        }

    def _weighted_stats(
        self,
        first_digits: pd.Series,
        amounts: pd.Series,
        n: int,
    ) -> dict:
        """
        Compute amount-weighted chi-square and MAD.

        The weighted distribution treats each digit's share of total transaction
        volume (rather than transaction count) as the observed probability.

        FIX 1 (weighted): chi-square uses the count-based effective-N formulation:
            Σ (w_i − p_i)² / p_i  ×  N
        This keeps the statistic on the same scale as the unweighted version and
        makes the existing threshold (15.507) meaningful.

        Note: a very large weighted chi-square (as seen here when high-value fraud
        transactions concentrate around certain digits) is a genuine signal and
        intentionally reported separately from the count-based verdict.
        """
        weight_by_digit: dict[int, float] = {}
        for d in range(1, 10):
            mask = first_digits == d
            weight_by_digit[d] = float(amounts[mask].sum()) if mask.any() else 0.0

        total_weight = sum(weight_by_digit.values())
        if total_weight == 0:
            return {"error": "Total weighted amount is zero."}

        obs_w = {d: weight_by_digit[d] / total_weight for d in range(1, 10)}

        chi_sq = 0.0
        mad = 0.0
        for d in range(1, 10):
            exp = self.expected_dist[d]
            obs = obs_w[d]
            # Effective-N weighted chi-square (keeps scale comparable to unweighted)
            chi_sq += ((obs - exp) ** 2 / exp) * n
            mad += abs(obs - exp)

        mad /= 9
        p_val = float(1 - chi2.cdf(chi_sq, df=8))

        return {
            "chi_square": round(float(chi_sq), 6),
            "p_value": round(p_val, 6),
            "mad": round(mad * 100, 4),             # expressed as %
            "mad_risk_level": self._classify_mad(mad)["level"],
            "obs_weighted_pct": {
                d: round(obs_w[d] * 100, 4) for d in range(1, 10)
            },
            "is_compliant": chi_sq < self.CHI2_THRESHOLD,
        }

    def _build_digit_table(
        self,
        obs_counts: dict,
        n: int,
        weighted_result: dict | None,
    ) -> dict:
        """Build the per-digit comparison payload for the frontend."""
        table = {}
        for d in range(1, 10):
            exp_pct = self.expected_dist[d] * 100
            obs_pct = obs_counts.get(d, 0) / n * 100
            entry = {
                "expected_pct": round(exp_pct, 4),
                "observed_pct": round(obs_pct, 4),
                "deviation": round(abs(obs_pct - exp_pct), 4),
            }
            if weighted_result and "obs_weighted_pct" in weighted_result:
                entry["observed_pct_weighted"] = weighted_result["obs_weighted_pct"][d]
                entry["deviation_weighted"] = round(
                    abs(weighted_result["obs_weighted_pct"][d] - exp_pct), 4
                )
            table[d] = entry
        return table

    def _detect_anomalies(self, digit_distribution: dict) -> list[dict]:
        """
        Flag over- and under-represented digits.

        FIX 5: Both OVER and UNDER representation are labelled HIGH risk.
            Over-representation of digits 5–9 is the classic 'just-below-threshold'
            fraud signal (e.g. amounts of 4 999 or 9 990 to avoid approval limits).
            Labelling it MEDIUM understates real-world fraud risk.
        """
        patterns = []
        for d in range(1, 10):
            info = digit_distribution[d]
            obs = info["observed_pct"]
            exp = info["expected_pct"]

            if obs < exp * 0.5:
                patterns.append({
                    "digit": d,
                    "pattern": "UNDER_REPRESENTED",
                    "reason": (
                        f"Digit {d} appears {obs:.1f}% vs expected {exp:.1f}% "
                        f"({(obs - exp):+.1f} pp) — artificial data suppression suspected"
                    ),
                    "fraud_risk": "HIGH",
                })
            elif obs > exp * 1.5:
                # FIX 5: was MEDIUM, now HIGH — over-representation is equally suspicious
                patterns.append({
                    "digit": d,
                    "pattern": "OVER_REPRESENTED",
                    "reason": (
                        f"Digit {d} appears {obs:.1f}% vs expected {exp:.1f}% "
                        f"({(obs - exp):+.1f} pp) — rounding avoidance or fabrication suspected"
                    ),
                    "fraud_risk": "HIGH",
                })

        return patterns

    def _classify_mad(self, mad: float) -> dict:
        """Return the Nigrini MAD risk band for a given MAD value (0–1 scale)."""
        for low, high, level, description in self.MAD_BANDS:
            if low <= mad < high:
                return {"level": level, "description": description}
        # Fallback (should never be reached)
        return {"level": "HIGH", "description": "Non-conformity — statistically suspicious"}