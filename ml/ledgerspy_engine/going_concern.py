"""
Monte Carlo Going Concern Stress Test
Simulates thousands of possible cash-flow futures to assess company survival probability.
"""
import numpy as np
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class GoingConcernAnalyzer:
    """
    Performs Monte Carlo simulation to assess going concern risk.
    Generates probability distribution of company survival over next 12 months.
    """
    
    def __init__(self, num_simulations=10000, forecast_months=12):
        """
        Initialize analyzer.
        
        Args:
            num_simulations: Number of Monte Carlo simulations to run (default 10000)
            forecast_months: Forecast horizon (default 12 months)
        """
        self.num_simulations = num_simulations
        self.forecast_months = forecast_months
    
    def analyze_cash_flow(self, transactions_df: pd.DataFrame, 
                          starting_balance: float = 100000,
                          min_required_balance: float = 10000) -> dict:
        """
        Perform vectorized Monte Carlo simulation on cash flows.
        """
        # 1. Prepare Data
        df = transactions_df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['amount'] = pd.to_numeric(df['amount'])
        df['date'] = df['timestamp'].dt.date
        
        # 2. Extract Cash Flow Stats (Accounting for days with $0 flow)
        daily_sums = df.groupby('date')['amount'].sum()
        daily_sums.index = pd.to_datetime(daily_sums.index)
        
        # Fill missing days with 0 to accurately reflect burn rate
        try:
            daily_sums = daily_sums.asfreq('D', fill_value=0)
        except ValueError:
            pass # Failsafe if dataset only has 1 single day of data
            
        mean_daily_flow = daily_sums.mean()
        std_daily_flow = daily_sums.std()
        
        logger.info(f"Monte Carlo Stats - Mean Flow: {mean_daily_flow:.2f}, Std Dev: {std_daily_flow:.2f}")
        
        num_days = self.forecast_months * 30  # Approximate days
        
        # 3. Vectorized Simulation (Lightning Fast)
        # Generate a matrix of (10,000 simulations x 360 days)
        random_flows = np.random.normal(mean_daily_flow, std_daily_flow, 
                                        (self.num_simulations, num_days))
        
        # Calculate cumulative cash balance across the timeline
        balance_paths = starting_balance + np.cumsum(random_flows, axis=1)
        
        # 4. Extract Matrix Insights
        min_balances_per_sim = np.min(balance_paths, axis=1)
        end_balances = balance_paths[:, -1]
        
        # A company survives if its MINIMUM balance never drops below the requirement
        survived_mask = min_balances_per_sim >= min_required_balance
        survival_probability = (np.sum(survived_mask) / self.num_simulations) * 100
        
        # Track Bankruptcy Days
        insolvent_mask = balance_paths < 0
        actually_insolvent = np.any(insolvent_mask, axis=1)
        first_insolvent_day = np.argmax(insolvent_mask, axis=1)[actually_insolvent]
        avg_days_to_insolvency = np.mean(first_insolvent_day) if len(first_insolvent_day) > 0 else None
        
        # ===== PERCENTILE ANALYSIS =====
        end_balance_percentiles = np.percentile(end_balances, [5, 25, 50, 75, 95])
        min_balance_percentiles = np.percentile(min_balances_per_sim, [5, 25, 50, 75, 95])
        
        # ===== RISK CLASSIFICATION =====
        if survival_probability >= 95:
            risk_level, risk_color = 'SAFE', 'green'
        elif survival_probability >= 80:
            risk_level, risk_color = 'MODERATE', 'yellow'
        elif survival_probability >= 60:
            risk_level, risk_color = 'AT_RISK', 'orange'
        else:
            risk_level, risk_color = 'CRITICAL', 'red'
        
        # ===== SCENARIO BANDS =====
        # Using fast numpy array comparisons instead of list comprehensions
        scenario_bands = {
            'critical': {
                'range': f"${min_balance_percentiles[0]:,.0f} - ${min_balance_percentiles[1]:,.0f}",
                'probability': f"{(np.sum(min_balances_per_sim <= min_balance_percentiles[1]) / self.num_simulations) * 100:.1f}%",
                'color': 'red'
            },
            'danger': {
                'range': f"${min_balance_percentiles[1]:,.0f} - ${min_balance_percentiles[2]:,.0f}",
                'probability': f"{(np.sum((min_balances_per_sim > min_balance_percentiles[1]) & (min_balances_per_sim <= min_balance_percentiles[2])) / self.num_simulations) * 100:.1f}%",
                'color': 'orange'
            },
            'caution': {
                'range': f"${min_balance_percentiles[2]:,.0f} - ${min_balance_percentiles[3]:,.0f}",
                'probability': f"{(np.sum((min_balances_per_sim > min_balance_percentiles[2]) & (min_balances_per_sim <= min_balance_percentiles[3])) / self.num_simulations) * 100:.1f}%",
                'color': 'yellow'
            },
            'safe': {
                'range': f"${min_balance_percentiles[3]:,.0f} - ${min_balance_percentiles[4]:,.0f}",
                'probability': f"{(np.sum(min_balances_per_sim > min_balance_percentiles[3]) / self.num_simulations) * 100:.1f}%",
                'color': 'green'
            }
        }
        
        return {
            'survival_probability': round(survival_probability, 1),
            'risk_level': risk_level,
            'risk_color': risk_color,
            'num_simulations': self.num_simulations,
            'forecast_months': self.forecast_months,
            'starting_balance': starting_balance,
            'min_required_balance': min_required_balance,
            'ending_balance_stats': {
                'p5': round(end_balance_percentiles[0], 2),
                'p25': round(end_balance_percentiles[1], 2),
                'p50_median': round(end_balance_percentiles[2], 2),
                'p75': round(end_balance_percentiles[3], 2),
                'p95': round(end_balance_percentiles[4], 2),
                'mean': round(np.mean(end_balances), 2),
                'std': round(np.std(end_balances), 2)
            },
            'minimum_balance_stats': {
                'p5': round(min_balance_percentiles[0], 2),
                'p25': round(min_balance_percentiles[1], 2),
                'p50_median': round(min_balance_percentiles[2], 2),
                'p75': round(min_balance_percentiles[3], 2),
                'p95': round(min_balance_percentiles[4], 2),
                'mean': round(np.mean(min_balances_per_sim), 2),
                'std': round(np.std(min_balances_per_sim), 2)
            },
            'scenario_bands': scenario_bands,
            'key_metrics': {
                'avg_ending_balance': round(np.mean(end_balances), 2),
                'worst_case_ending': round(np.min(end_balances), 2),
                'best_case_ending': round(np.max(end_balances), 2),
                'median_minimum_balance': round(np.median(min_balances_per_sim), 2),
                'probability_never_insolvency': f"{survival_probability:.1f}%",
                'avg_days_to_insolvency': round(avg_days_to_insolvency, 1) if avg_days_to_insolvency is not None else "N/A"
            },
            'chart_data': self._generate_chart_data(balance_paths, num_days)
        }
    def _generate_chart_data(self, balance_paths, num_days):
        """Generate month-by-month chart data for UI visualization."""
        chart_data = []
        for month in range(1, self.forecast_months + 1):
            day_index = min((month * 30) - 1, num_days - 1)
            month_balances = balance_paths[:, day_index]
            chart_data.append({
                "name": f"Month {month}",
                "p5": round(np.percentile(month_balances, 5), 2),
                "median": round(np.percentile(month_balances, 50), 2),
                "p95": round(np.percentile(month_balances, 95), 2)
            })
        return chart_data
    
    def get_recommendation(self, analysis_result: dict) -> str:
        """
        Generate audit recommendation based on going concern analysis.
        """
        prob = analysis_result['survival_probability']
        
        if prob >= 95:
            return "✅ Going concern assumption appears SAFE. No material uncertainty."
        elif prob >= 80:
            return "⚠️ Going concern assumption is REASONABLE with moderate stress. Monitor cash flow."
        elif prob >= 60:
            return "🔴 Going concern assumption is AT RISK. Recommend liquidity improvements or contingency planning."
        else:
            return "🚨 CRITICAL: Substantial doubt about going concern. Management must disclose uncertainty."