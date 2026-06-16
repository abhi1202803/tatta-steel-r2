"""Input Router Agent – classifies multi-modal input and selects workflow."""

import json
import re
from typing import Any

from api.schemas import InputType, IngestRequest, RoutingDecision, WorkflowType
from services.equipment_context import equipment_context


class InputRouterAgent:
    """Detects input type and routes to the appropriate agent workflow."""

    SENSOR_KEYS = {"temperature", "vibration", "pressure", "current", "rpm", "flow_rate"}
    INVENTORY_KEYWORDS = {"stock", "inventory", "spare", "procurement", "reorder", "bearing", "lead time"}
    KNOWLEDGE_KEYWORDS = {"manual", "sop", "procedure", "document", "how to", "what is", "why is", "explain"}
    FAULT_KEYWORDS = {"fault", "error", "alarm", "failure", "trip", "shutdown", "code"}

    def route(self, request: IngestRequest) -> RoutingDecision:
        detected = request.input_type
        if detected == InputType.AUTO:
            detected = self._detect_type(request.payload)

        equipment_id = equipment_context.resolve_id(
            request.equipment_id,
            self._payload_text(request.payload),
        )
        workflow, agents = self._workflow_for(detected)
        return RoutingDecision(
            detected_type=detected,
            workflow=workflow,
            agents=agents,
            confidence=0.88 if detected != InputType.AUTO else 0.75,
            equipment_id=equipment_id,
        )

    def _detect_type(self, payload: Any) -> InputType:
        if isinstance(payload, dict):
            if self.SENSOR_KEYS.intersection(payload.keys()):
                return InputType.SENSOR
            if "readings" in payload or "sensor_data" in payload:
                return InputType.SENSOR
            if "fault_code" in payload or "fault_log" in payload:
                return InputType.FAULT_LOG
            if "maintenance_records" in payload or "work_orders" in payload:
                return InputType.MAINTENANCE_HISTORY
            if "parts" in payload or "inventory" in payload:
                return InputType.INVENTORY
            if payload.get("content_type") == "application/pdf" or "pdf" in str(payload.get("filename", "")).lower():
                return InputType.PDF
        text = self._payload_text(payload).lower()
        if any(k in text for k in self.INVENTORY_KEYWORDS):
            return InputType.INVENTORY
        if any(k in text for k in self.FAULT_KEYWORDS):
            return InputType.FAULT_LOG
        if any(k in text for k in self.KNOWLEDGE_KEYWORDS):
            return InputType.NATURAL_LANGUAGE
        if len(text) > 20:
            return InputType.NATURAL_LANGUAGE
        return InputType.FULL_INCIDENT

    def _workflow_for(self, input_type: InputType) -> tuple[WorkflowType, list[str]]:
        mapping = {
            InputType.SENSOR: (WorkflowType.SENSOR_DIAGNOSIS, ["diagnosis", "prediction"]),
            InputType.FAULT_LOG: (WorkflowType.FULL_INCIDENT, ["diagnosis", "prediction", "knowledge"]),
            InputType.PDF: (WorkflowType.KNOWLEDGE_QUERY, ["knowledge"]),
            InputType.SOP: (WorkflowType.KNOWLEDGE_QUERY, ["knowledge"]),
            InputType.MANUAL: (WorkflowType.KNOWLEDGE_QUERY, ["knowledge"]),
            InputType.MAINTENANCE_HISTORY: (WorkflowType.MAINTENANCE_PLAN, ["maintenance", "inventory"]),
            InputType.NATURAL_LANGUAGE: (WorkflowType.KNOWLEDGE_QUERY, ["knowledge", "diagnosis"]),
            InputType.INVENTORY: (WorkflowType.INVENTORY_CHECK, ["inventory"]),
            InputType.DELAY_LOG: (WorkflowType.FULL_INCIDENT, ["diagnosis", "maintenance", "report"]),
            InputType.INCIDENT: (WorkflowType.FULL_INCIDENT, ["diagnosis", "prediction", "maintenance", "inventory", "knowledge", "report"]),
            InputType.FAILURE_REPORT: (WorkflowType.FULL_INCIDENT, ["diagnosis", "prediction", "knowledge", "report"]),
            InputType.FULL_INCIDENT: (WorkflowType.FULL_INCIDENT, [
                "diagnosis", "prediction", "maintenance", "inventory", "knowledge", "report",
            ]),
        }
        return mapping.get(input_type, (WorkflowType.FULL_INCIDENT, ["diagnosis", "prediction"]))

    def _payload_text(self, payload: Any) -> str:
        if isinstance(payload, str):
            return payload
        if isinstance(payload, dict):
            for key in ("query", "message", "text", "description", "content"):
                if key in payload:
                    return str(payload[key])
            return json.dumps(payload)
        return str(payload)
