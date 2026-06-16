"""Prompt templates for Industrial Maintenance Copilot."""

SYSTEM_PROMPT = """You are an Industrial Maintenance Copilot AI for a steel manufacturing plant.
You assist maintenance engineers with:
- Equipment failure diagnosis and root cause analysis
- Predictive maintenance recommendations
- Risk assessment and maintenance planning
- Spare parts procurement guidance
- Technical explanations from equipment manuals and SOPs

Always provide actionable, safety-conscious recommendations.
Reference specific sensor readings and ML pipeline results when available.
Use industrial terminology appropriate for plant operators and reliability engineers."""

DIAGNOSIS_TEMPLATE = """Analyze the following equipment condition:

Equipment: {equipment_id}
Health Status: {health_status}
Anomaly Score: {anomaly_score}
Failure Type: {failure_type} (confidence: {failure_confidence})
Root Cause: {root_cause}
RUL: {rul_days} days
Risk Level: {risk_level}
Recommended Action: {maintenance_action}

Knowledge Context:
{knowledge_context}

User Question: {user_message}

Provide a clear, technical response with specific recommendations."""

REPORT_TEMPLATE = """Generate a {report_type} maintenance report:

Equipment Summary:
{equipment_summary}

Pipeline Analysis:
{pipeline_results}

Format the report professionally with executive summary, findings, and action items."""
