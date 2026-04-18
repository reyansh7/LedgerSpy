import networkx as nx
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class RiskMapper:
    def __init__(self):
        # We use a MultiDiGraph because multiple transactions can happen between the same entities
        self.graph = nx.MultiDiGraph()
        self.transaction_data = None  # Store original data for time analysis

    def build_graph(self, df: pd.DataFrame):
        """
        Transforms the tabular ledger into a mathematical directed graph.
        Nodes = Companies/Accounts
        Edges = Transactions (Money Flow)
        
        Edge weights include:
        - amount: Total transaction amount
        - count: Number of transactions
        - avg_amount: Average transaction amount
        """
        self.graph.clear()
        self.transaction_data = df.copy()
        
        # We only need the flow data for this
        flow_data = df[['source_entity', 'destination_entity', 'amount', 'transaction_id', 'timestamp']].dropna()

        # Build graph with weighted edges
        for _, row in flow_data.iterrows():
            source = str(row['source_entity']).strip()
            target = str(row['destination_entity']).strip()
            
            # Skip self-transfers
            if source != target:
                # Check if edge already exists
                if self.graph.has_edge(source, target):
                    # Update edge weights
                    existing_data = self.graph.get_edge_data(source, target)
                    for key, edge_attrs in existing_data.items():
                        # Sum amounts, count transactions
                        edge_attrs['amount'] = edge_attrs.get('amount', 0) + row['amount']
                        edge_attrs['count'] = edge_attrs.get('count', 0) + 1
                else:
                    # Add new edge with weight
                    self.graph.add_edge(
                        source, 
                        target,
                        amount=row['amount'],
                        count=1,
                        tx_ids=[row['transaction_id']],
                        timestamps=[row['timestamp']]
                    )
                    
                    # Also track on the multi-edge
                    self.graph[source][target][len(self.graph[source][target]) - 1] = {
                        'amount': row['amount'],
                        'count': 1,
                        'tx_id': row['transaction_id'],
                        'timestamp': row['timestamp']
                    }

    def find_circular_loops(self, max_depth=4, min_loop_weight=0) -> list:
        """
        Hunts for money laundering loops (e.g., A -> B -> C -> A).
        Now with weighted analysis and time-based detection.
        
        Args:
            max_depth: Maximum loop length to search
            min_loop_weight: Minimum total transaction amount to flag (0 = no minimum)
        """
        if len(self.graph.nodes) == 0:
            raise ValueError("Graph is empty. Run build_graph() first.")

        suspicious_loops = []
        
        # Find all circular paths
        cycles = list(nx.simple_cycles(self.graph, length_bound=max_depth))

        for cycle in cycles:
            if len(cycle) >= 2:
                # Calculate loop weight (total $ flowing through the loop)
                loop_weight = 0
                loop_time_span = None
                rapid_cycle = False
                
                # Get all edges in the cycle
                cycle_edges = []
                for i in range(len(cycle)):
                    source = cycle[i]
                    target = cycle[(i + 1) % len(cycle)]
                    
                    if self.graph.has_edge(source, target):
                        edge_data = self.graph.get_edge_data(source, target)
                        for key, attrs in edge_data.items():
                            loop_weight += attrs.get('amount', 0)
                            if 'timestamp' in attrs:
                                cycle_edges.append(attrs['timestamp'])
                
                # Detect rapid cycles (potential money laundering red flag)
                if cycle_edges and len(cycle_edges) >= 2:
                    timestamps = sorted(cycle_edges)
                    time_diff = timestamps[-1] - timestamps[0]
                    loop_time_span = time_diff.total_seconds() / 3600  # Convert to hours
                    
                    # If loop completes in < 24 hours = RED FLAG
                    if time_diff < timedelta(hours=24):
                        rapid_cycle = True
                
                # Only include if meets minimum weight threshold
                if loop_weight >= min_loop_weight:
                    # Determine risk level based on multiple factors
                    base_risk = 'CRITICAL' if len(cycle) > 2 else 'HIGH'
                    
                    # Escalate if rapid cycle detected
                    if rapid_cycle:
                        base_risk = 'CRITICAL_RAPID'
                    
                    # Weighted fraud score (higher amount = higher risk)
                    fraud_score = min(100, 50 + (loop_weight / max(1, loop_weight) * 50))
                    
                    loop_details = {
                        'entities_involved': cycle,
                        'hop_count': len(cycle),
                        'risk_level': base_risk,
                        'total_loop_amount': round(loop_weight, 2),
                        'loop_time_span_hours': round(loop_time_span, 1) if loop_time_span else None,
                        'is_rapid_cycle': rapid_cycle,
                        'fraud_probability': round(fraud_score, 1),
                        'flag_reason': self._get_loop_flag_reason(len(cycle), rapid_cycle, loop_weight)
                    }
                    suspicious_loops.append(loop_details)

        # Sort: first by rapid cycles, then by hop count, then by amount
        return sorted(
            suspicious_loops,
            key=lambda x: (-x['is_rapid_cycle'], -x['hop_count'], -x['total_loop_amount'])
        )
    
    def _get_loop_flag_reason(self, hop_count: int, is_rapid: bool, amount: float) -> str:
        """Generate human-readable reason for flagging a loop"""
        parts = []
        
        if hop_count > 2:
            parts.append(f"Complex {hop_count}-entity cycle detected")
        else:
            parts.append("Circular money flow detected")
        
        if is_rapid:
            parts.append("RAPID CYCLE (< 24 hours)")
        
        if amount > 1000000:
            parts.append(f"HIGH VALUE (${amount:,.0f})")
        
        return " | ".join(parts)
    
    def find_high_velocity_edges(self, min_transactions=5, threshold_amount=None) -> list:
        """
        Identify entity pairs with unusually high transaction frequency.
        Good for detecting shell company networks.
        
        Args:
            min_transactions: Minimum number of transactions to flag
            threshold_amount: Total amount threshold (None = no limit)
        """
        high_velocity_edges = []
        
        for source, target, key, edge_data in self.graph.edges(keys=True, data=True):
            count = edge_data.get('count', 1)
            amount = edge_data.get('amount', 0)
            
            if count >= min_transactions:
                if threshold_amount is None or amount >= threshold_amount:
                    high_velocity_edges.append({
                        'source': source,
                        'destination': target,
                        'transaction_count': count,
                        'total_amount': round(amount, 2),
                        'average_amount': round(amount / max(count, 1), 2),
                        'risk_level': 'CRITICAL' if count > 20 else 'HIGH' if count > 10 else 'MEDIUM'
                    })
        
        return sorted(high_velocity_edges, key=lambda x: -x['transaction_count'])