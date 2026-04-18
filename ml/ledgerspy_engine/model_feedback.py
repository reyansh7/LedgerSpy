"""
Model Feedback System: Tracks predictions and collects feedback for continuous improvement.
Enables retraining with real-world labeled data.
"""
import json
import logging
from pathlib import Path
from datetime import datetime
import pandas as pd

logger = logging.getLogger(__name__)


class ModelFeedbackCollector:
    """Collects predictions and their feedback for model retraining."""
    
    def __init__(self, feedback_dir: str = "ml/logs/feedback"):
        """
        Initialize feedback collector.
        
        Args:
            feedback_dir: Directory to store feedback logs
        """
        self.feedback_dir = Path(feedback_dir)
        self.feedback_dir.mkdir(parents=True, exist_ok=True)
        self.feedback_log_file = self.feedback_dir / f"feedback_{datetime.now().strftime('%Y%m%d')}.jsonl"
    
    def log_prediction(self, transaction_id: str, prediction_data: dict, actual_label: int = None):
        """
        Log a model prediction and optional ground truth.
        
        Args:
            transaction_id: Unique transaction identifier
            prediction_data: Dict with model predictions and scores
            actual_label: Ground truth (0=normal, 1=fraud) if known
        """
        feedback_record = {
            'timestamp': datetime.now().isoformat(),
            'transaction_id': transaction_id,
            'prediction': prediction_data,
            'actual_label': actual_label,
            'is_correct': None if actual_label is None else (
                prediction_data.get('is_anomaly', False) == (actual_label == 1)
            )
        }
        
        try:
            with open(self.feedback_log_file, 'a') as f:
                f.write(json.dumps(feedback_record) + '\n')
        except Exception as e:
            logger.error(f"Failed to log prediction feedback: {e}")
    
    def get_feedback_dataset(self, min_labeled: int = 50) -> dict:
        """
        Retrieve collected feedback data for model retraining.
        
        Returns:
            Dictionary with labeled data suitable for retraining
        """
        all_feedback = []
        
        # Read all feedback files
        for feedback_file in self.feedback_dir.glob("feedback_*.jsonl"):
            try:
                with open(feedback_file, 'r') as f:
                    for line in f:
                        record = json.loads(line)
                        if record.get('actual_label') is not None:
                            all_feedback.append(record)
            except Exception as e:
                logger.warning(f"Failed to read feedback file {feedback_file}: {e}")
        
        if len(all_feedback) < min_labeled:
            logger.warning(f"Only {len(all_feedback)} labeled records. Need {min_labeled} for retraining.")
            return None
        
        # Convert to DataFrame for easy feature extraction
        df = pd.DataFrame(all_feedback)
        
        return {
            'labels': df['actual_label'].values,
            'predictions': df['prediction'].values,
            'accuracy': (df['is_correct'].sum() / len(df) * 100) if len(df) > 0 else 0,
            'num_fraud': (df['actual_label'] == 1).sum(),
            'num_normal': (df['actual_label'] == 0).sum(),
            'num_records': len(df)
        }
    
    def get_prediction_accuracy(self) -> dict:
        """Calculate model accuracy from collected feedback."""
        all_records = []
        
        for feedback_file in self.feedback_dir.glob("feedback_*.jsonl"):
            try:
                with open(feedback_file, 'r') as f:
                    for line in f:
                        record = json.loads(line)
                        all_records.append(record)
            except Exception as e:
                logger.warning(f"Failed to read feedback file: {e}")
        
        if not all_records:
            return None
        
        df = pd.DataFrame(all_records)
        labeled_records = df[df['actual_label'].notna()]
        
        if len(labeled_records) == 0:
            return None
        
        return {
            'total_predictions': len(df),
            'labeled_predictions': len(labeled_records),
            'accuracy': (labeled_records['is_correct'].sum() / len(labeled_records) * 100),
            'precision': self._calculate_precision(labeled_records),
            'recall': self._calculate_recall(labeled_records),
            'f1_score': self._calculate_f1(labeled_records)
        }
    
    @staticmethod
    def _calculate_precision(df: pd.DataFrame) -> float:
        """Precision = TP / (TP + FP)"""
        df['pred_positive'] = df['prediction'].apply(lambda x: x.get('is_anomaly', False))
        tp = ((df['pred_positive']) & (df['actual_label'] == 1)).sum()
        fp = ((df['pred_positive']) & (df['actual_label'] == 0)).sum()
        return tp / (tp + fp) * 100 if (tp + fp) > 0 else 0
    
    @staticmethod
    def _calculate_recall(df: pd.DataFrame) -> float:
        """Recall = TP / (TP + FN)"""
        df['pred_positive'] = df['prediction'].apply(lambda x: x.get('is_anomaly', False))
        tp = ((df['pred_positive']) & (df['actual_label'] == 1)).sum()
        fn = (~(df['pred_positive']) & (df['actual_label'] == 1)).sum()
        return tp / (tp + fn) * 100 if (tp + fn) > 0 else 0
    
    @staticmethod
    def _calculate_f1(df: pd.DataFrame) -> float:
        """F1 = 2 * (Precision * Recall) / (Precision + Recall)"""
        precision = ModelFeedbackCollector._calculate_precision(df)
        recall = ModelFeedbackCollector._calculate_recall(df)
        return 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
