"""Planner Agent – dynamic execution plans based on input type and workflow."""

from api.schemas import InputType, PipelineRequest, WorkflowType


class PlannerAgent:
    async def create_plan(
        self,
        request: PipelineRequest,
        workflow: WorkflowType = WorkflowType.FULL_INCIDENT,
        input_type: InputType = InputType.FULL_INCIDENT,
    ) -> dict:
        if workflow == WorkflowType.SENSOR_DIAGNOSIS:
            steps = [
                {"agent": "diagnosis", "task": "anomaly_detection", "priority": 1},
                {"agent": "prediction", "task": "failure_classification", "priority": 2, "depends_on": [1]},
                {"agent": "prediction", "task": "rul_prediction", "priority": 3, "depends_on": [2]},
                {"agent": "prediction", "task": "risk_assessment", "priority": 4, "depends_on": [3]},
            ]
            parallel_groups = []
        elif workflow == WorkflowType.KNOWLEDGE_QUERY:
            steps = [
                {"agent": "knowledge", "task": "retrieval", "priority": 1},
                {"agent": "diagnosis", "task": "root_cause_analysis", "priority": 2, "depends_on": [1]},
            ]
            parallel_groups = []
        elif workflow == WorkflowType.INVENTORY_CHECK:
            steps = [
                {"agent": "inventory", "task": "spare_forecasting", "priority": 1},
                {"agent": "maintenance", "task": "optimization", "priority": 2, "depends_on": [1]},
            ]
            parallel_groups = []
        elif workflow == WorkflowType.MAINTENANCE_PLAN:
            steps = [
                {"agent": "maintenance", "task": "optimization", "priority": 1},
                {"agent": "inventory", "task": "spare_forecasting", "priority": 2},
                {"agent": "report", "task": "executive_summary", "priority": 3, "depends_on": [1, 2]},
            ]
            parallel_groups = [[1, 2]]
        else:
            steps = [
                {"agent": "diagnosis", "task": "anomaly_detection", "priority": 1},
                {"agent": "prediction", "task": "failure_classification", "priority": 2, "depends_on": [1]},
                {"agent": "diagnosis", "task": "root_cause_analysis", "priority": 3, "depends_on": [2]},
                {"agent": "prediction", "task": "rul_prediction", "priority": 4, "depends_on": [3]},
                {"agent": "prediction", "task": "risk_assessment", "priority": 5, "depends_on": [4]},
                {"agent": "maintenance", "task": "optimization", "priority": 6, "depends_on": [5]},
                {"agent": "inventory", "task": "spare_forecasting", "priority": 7, "depends_on": [5]},
                {"agent": "knowledge", "task": "retrieval", "priority": 8, "depends_on": [3]},
                {"agent": "report", "task": "executive_summary", "priority": 9, "depends_on": [6, 7, 8]},
            ]
            parallel_groups = [[7, 8]]

        return {
            "equipment_id": request.equipment_id,
            "workflow": workflow.value,
            "input_type": input_type.value,
            "steps": steps,
            "estimated_duration_ms": 800 * len(steps),
            "parallel_groups": parallel_groups,
        }
