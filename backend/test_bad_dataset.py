import sys
import os
import pandas as pd
sys.path.append('.')
sys.path.append('../ml')

from app.services.audit_service import run_full_analysis

bad_df = pd.read_csv('../ml/poor_quality_dataset_50pct.csv')
result = run_full_analysis(bad_df, 'poor_quality_dataset_50pct.csv')
report = result.get('readiness_report', {})

print()
print('FINAL TEST RESULTS')
print('='*70)
print(f'Readiness Score: {report.get("readiness_score", 0):.1f}/100')
print(f'Data Quality: {report.get("data_quality", "Unknown")}')
print()
print('Component Breakdown:')
print(f'  • Completeness:         {report.get("completeness", 0):6.1f}%')
print(f'  • Format Validity:      {report.get("format_validity", 0):6.1f}%')
print(f'  • Consistency:          {report.get("consistency", 0):6.1f}%')
print(f'  • Statistical Health:   {report.get("statistical_health", 0):6.1f}%')
print(f'  • Record Sufficiency:   {report.get("record_sufficiency", 0):6.1f}%')
print()
print(f'Issues: {len(report.get("issues", []))} detected')
for i, issue in enumerate(report.get('issues', []), 1):
    print(f'  {i}. {issue}')
print()
print(f'Recommendations: {len(report.get("recommendations", []))} provided')
for i, rec in enumerate(report.get('recommendations', []), 1):
    print(f'  {i}. {rec}')
