import networkx as nx
import pandas as pd

class RiskMapper:
    def __init__(self):
        # We use a MultiDiGraph because multiple transactions can happen between the same entities
        self.graph = nx.MultiDiGraph()

    def build_graph(self, df: pd.DataFrame):
        """
        Transforms the tabular ledger into a mathematical directed graph.
        Nodes = Companies/Accounts
        Edges = Transactions (Money Flow)
        """
        self.graph.clear()
        
        # We only need the flow data for this
        flow_data = df[['source_entity', 'destination_entity', 'amount', 'transaction_id']].dropna()

        for _, row in flow_data.iterrows():
            source = str(row['source_entity']).strip()
            target = str(row['destination_entity']).strip()
            
            # Skip self-transfers (Company A paying Company A) unless you want to flag those too
            if source != target:
                self.graph.add_edge(
                    source, 
                    target, 
                    amount=row['amount'], 
                    tx_id=row['transaction_id']
                )

    def find_circular_loops(self, max_depth=4) -> list:
        """
        Hunts for money laundering loops (e.g., A -> B -> C -> A).
        max_depth limits how far down the rabbit hole we look to save processing time.
        """
        if len(self.graph.nodes) == 0:
            raise ValueError("Graph is empty. Run build_graph() first.")

        suspicious_loops = []
        
        # nx.simple_cycles finds all circular paths in a directed graph
        # In NetworkX 3.0+, simple_cycles has a length_bound parameter!
        cycles = list(nx.simple_cycles(self.graph, length_bound=max_depth))

        for cycle in cycles:
            # A cycle must be at least 2 nodes (e.g., A -> B -> A)
            if len(cycle) >= 2:
                loop_details = {
                    'entities_involved': cycle,
                    'hop_count': len(cycle),
                    'risk_level': 'CRITICAL' if len(cycle) > 2 else 'HIGH',
                    'flag_reason': 'Circular money flow detected'
                }
                suspicious_loops.append(loop_details)

        # Sort so the most complex loops (highest hop count) show up first
        return sorted(suspicious_loops, key=lambda x: x['hop_count'], reverse=True)