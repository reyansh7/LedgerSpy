"""
Monte Carlo Going Concern Stress Test
Simulates thousands of possible cash-flow futures to assess company survival probability.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
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
            num_simulations: Number of Monte Carlo simulations to run
            forecast_months: Forecast horizon (default 12 months)
        """
        self.num_simulations = num_simulations
        self.forecast_months = forecast_months
        self.simulation_results = None
        self.survival_probability = None
    
    def analyze_cash_flow(self, transactions_df: pd.DataFrame, 
                         starting_balance: float = 100000,
                         min_required_balance: float = 10000) -> dict:
        """
        Perform Monte Carlo simulation on cash flows.
        
        Args:
            transactions_df: DataFrame with transaction history (amount, timestamp)
            starting_balance: Starting cash balance
            min_required_balance: Minimum balance to avoid insolvency
            
        Returns:
            Dictionary with survival probabilities and stress test results
        """
        # Extract cash flow statistics from historical data
        df = transactions_df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['amount'] = pd.to_numeric(df['amount'])
        
        # Calculate daily cash flow statistics
        df['date'] = df['timestamp'].dt.date
        daily_flows = df.groupby('date')['amount'].agg(['sum', 'count', 'std']).reset_index()
        
        # Statistics for simulation
        mean_daily_flow = daily_flows['sum'].mean()
        std_daily_flow = daily_flows['sum'].std()
        mean_txn_size = df['amount'].mean()
        std_txn_size = df['amount'].std()
        
        logger.info(f"Cash flow stats - Mean: {mean_daily_flow:.2f}, Std: {std_daily_flow:.2f}")
        
        # Run Monte Carlo simulations
        num_days = self.forecast_months * 30  # Approximate days
        survival_count = 0
        min_balances_per_sim = []
        end_balances = []
        insolvent_day = []
        
        for sim in range(self.num_simulations):
            current_balance = starting_balance
            daily_balances = [current_balance]
            insolvency_day = None
            
            for day in range(num_days):
                # Simulate daily cash flow with volatility
                daily_flow = np.random.normal(mean_daily_flow, std_daily_flow)
                current_balance += daily_flow
                daily_balances.append(current_balance)
                
                # Check for insolvency
                if current_balance < min_required_balance and insolvency_day is None:
                    insolvency_day = day
                
                # Early exit if bankrupt
                if current_balance < 0:
                    insolvency_day = day
                    break
            
            min_balance = min(daily_balances)
            min_balances_per_sim.append(min_balance)
            end_balances.append(current_balance)
            insolvent_day.append(insolvency_day if insolvency_day else None)
            
            # Count survivals
            if current_balance >= min_required_balance:
                survival_count += 1
        
        survival_probability = survival_count / self.num_simulations * 100
        
        # ===== PERCENTILE ANALYSIS =====
        end_balance_percentiles = np.percentile(end_balances, [5, 25, 50, 75, 95])
        min_balance_percentiles = np.percentile(min_balances_per_sim, [5, 25, 50, 75, 95])
        
        # ===== RISK CLASSIFICATION =====
        if survival_probability >= 95:
            risk_level = 'SAFE'
            risk_color = 'green'
        elif survival_probability >= 80:
            risk_level = 'MODERATE'
            risk_color = 'yellow'
        elif survival_probability >= 60:
            risk_level = 'AT_RISK'
            risk_color = 'orange'
        else:
            risk_level = 'CRITICAL'
            risk_color = 'red'
        
        # ===== SCENARIO BANDS =====
        # P5-P25: Critical band
        # P25-P50: Danger band
        # P50-P75: Caution band
        # P75-P95: Safe band
        scenario_bands = {
            'critical': {
                'range': f"${min_balance_percentiles[0]:,.0f} - ${min_balance_percentiles[1]:,.0f}",
                'probability': f"{np.mean([1 for b in min_balances_per_sim if b <= min_balance_percentiles[1]]) / len(min_balances_per_sim) * 100:.1f}%",
                'color': 'red'
            },
            'danger': {
                'range': f"${min_balance_percentiles[1]:,.0f} - ${min_balance_percentiles[2]:,.0f}",
                'probability': f"{np.mean([1 for b in min_balances_per_sim if min_balance_percentiles[1] < b <= min_balance_percentiles[2]]) / len(min_balances_per_sim) * 100:.1f}%",
                'color': 'orange'
            },
            'caution': {
                'range': f"${min_balance_percentiles[2]:,.0f} - ${min_balance_percentiles[3]:,.0f}",
                'probability': f"{np.mean([1 for b in min_balances_per_sim if min_balance_percentiles[2] < b <= min_balance_percentiles[3]]) / len(min_balances_per_sim) * 100:.1f}%",
                'color': 'yellow'
            },
            'safe': {
                'range': f"${min_balance_percentiles[3]:,.0f} - ${min_balance_percentiles[4]:,.0f}",
                'probability': f"{np.mean([1 for b in min_balances_per_sim if b > min_balance_percentiles[3]]) / len(min_balances_per_sim) * 100:.1f}%",
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
                'avg_days_to_insolvency': round(np.nanmean([d for d in insolvent_day if d is not None]), 1) if any(d is not None for d in insolvent_day) else None
            }
        }
    
    def get_recommendation(self, analysis_result: dict) -> str:
        """
        Generate audit recommendation based on going concern analysis.
        
        Args:
            analysis_result: Result from analyze_cash_flow()
            
        Returns:
            Audit recommendation string
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
