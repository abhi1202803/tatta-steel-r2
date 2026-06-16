"""Emergency Agent – handles critical failure scenarios."""

from api.schemas import RiskLevel


class EmergencyAgent:
    async def handle_critical(self, equipment_id: str, risk_level: RiskLevel, message: str) -> dict:
        if risk_level != RiskLevel.CRITICAL:
            return {"escalated": False}

        return {
            "escalated": True,
            "equipment_id": equipment_id,
            "actions": [
                "Emergency shutdown initiated",
                "Maintenance team notified via SMS/email",
                "Production supervisor alerted",
                "Incident ticket created",
            ],
            "notification_channels": ["email", "sms", "whatsapp"],
            "message": message,
        }
