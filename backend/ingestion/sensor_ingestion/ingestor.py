"""Sensor data ingestion pipeline."""

from datetime import datetime, timezone

from api.schemas import SensorReading


class SensorIngestor:
    async def ingest(self, equipment_id: str, raw_data: dict) -> SensorReading:
        return SensorReading(
            temperature=raw_data.get("temperature", 25.0),
            vibration=raw_data.get("vibration", 2.0),
            pressure=raw_data.get("pressure", 5.0),
            current=raw_data.get("current", 10.0),
            rpm=raw_data.get("rpm", 1500.0),
            flow_rate=raw_data.get("flow_rate"),
            timestamp=datetime.now(timezone.utc),
        )

    async def ingest_batch(self, equipment_id: str, readings: list[dict]) -> list[SensorReading]:
        return [await self.ingest(equipment_id, r) for r in readings]
