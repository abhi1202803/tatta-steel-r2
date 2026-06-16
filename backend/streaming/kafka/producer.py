"""Kafka sensor data producer stub."""

import json
import logging

logger = logging.getLogger(__name__)


class SensorDataProducer:
    def __init__(self, bootstrap_servers: str = "localhost:9092"):
        self.bootstrap_servers = bootstrap_servers
        self._producer = None

    async def connect(self):
        try:
            from aiokafka import AIOKafkaProducer
            self._producer = AIOKafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode(),
            )
            await self._producer.start()
            logger.info("Kafka producer connected")
        except Exception as e:
            logger.warning(f"Kafka unavailable: {e}")

    async def publish_sensor_reading(self, equipment_id: str, reading: dict):
        if not self._producer:
            logger.debug(f"Kafka offline – would publish {equipment_id}: {reading}")
            return
        await self._producer.send("sensor-readings", {
            "equipment_id": equipment_id,
            **reading,
        })

    async def close(self):
        if self._producer:
            await self._producer.stop()
