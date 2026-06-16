"""BGE-M3 embedding service with fallback to sentence-transformers."""

import hashlib
import logging

import numpy as np

logger = logging.getLogger(__name__)

KNOWLEDGE_BASE = [
    {
        "id": "manual_bearing_01",
        "source": "SKF Bearing Maintenance Manual",
        "type": "manual",
        "text": "Bearing failure is commonly caused by inadequate lubrication, contamination, misalignment, or excessive load. Monitor vibration levels above 4.5 mm/s RMS as warning threshold. Temperature rise above 80°C indicates lubrication breakdown.",
    },
    {
        "id": "sop_pump_01",
        "source": "Pump Maintenance SOP",
        "type": "sop",
        "text": "For centrifugal pumps, check seal condition every 500 operating hours. Cavitation occurs when NPSH available is less than NPSH required. Symptoms include noise, vibration, and reduced flow rate.",
    },
    {
        "id": "sop_motor_01",
        "source": "Motor Inspection SOP",
        "type": "sop",
        "text": "Motor winding insulation should be tested with megger at 500V. Resistance below 1 MΩ indicates insulation degradation. Bearing temperature should not exceed 70°C above ambient.",
    },
    {
        "id": "failure_report_01",
        "source": "Historical Failure Report - Pump-05",
        "type": "failure_report",
        "text": "Pump-05 experienced bearing failure due to lubrication loss. Root cause: seal leak causing oil contamination. Vibration increased from 2.1 to 8.5 mm/s over 72 hours before failure.",
    },
    {
        "id": "manual_gearbox_01",
        "source": "Gearbox Maintenance Guide",
        "type": "manual",
        "text": "Gearbox failures typically result from tooth wear, lubricant degradation, or misalignment. Oil analysis should be performed quarterly. Iron content above 100 ppm indicates abnormal wear.",
    },
    {
        "id": "spare_catalog_01",
        "source": "Spare Parts Catalog",
        "type": "catalog",
        "text": "Critical spares for steel plant: SKF 6310 bearings (lead time 2 weeks), Siemens 1LA7 motors (lead time 4 weeks), mechanical seals (lead time 1 week). Maintain 2x minimum stock for critical items.",
    },
    {
        "id": "vendor_doc_01",
        "source": "Vendor Technical Bulletin",
        "type": "vendor",
        "text": "Recommended maintenance intervals: bearing relubrication every 2000 hours, motor inspection every 4000 hours, gearbox oil change every 8000 hours or annually.",
    },
    {
        "id": "rca_report_01",
        "source": "RCA Report - Conveyor Motor",
        "type": "rca_report",
        "text": "Conveyor motor failure chain: Insulation degradation → Overcurrent during startup → Winding overheat → Bearing stress → Complete motor failure. Preventive action: soft starter installation.",
    },
]


class EmbeddingService:
    """Embedding service with in-memory vector store fallback."""

    def __init__(self):
        self._model = None
        self._embeddings: dict[str, np.ndarray] = {}
        self._documents = KNOWLEDGE_BASE
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer("BAAI/bge-small-en-v1.5")
            logger.info("Loaded BGE embedding model")
        except Exception as e:
            logger.warning(f"Embedding model unavailable, using hash fallback: {e}")
            self._model = None

        for doc in self._documents:
            self._embeddings[doc["id"]] = self._embed(doc["text"])
        self._initialized = True

    def _embed(self, text: str) -> np.ndarray:
        if self._model:
            return self._model.encode(text, normalize_embeddings=True)
        h = hashlib.sha256(text.encode()).digest()
        return np.frombuffer(h, dtype=np.uint8).astype(np.float32)[:384]

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        self.initialize()
        query_vec = self._embed(query)
        scores = []
        for doc in self._documents:
            doc_vec = self._embeddings[doc["id"]]
            min_len = min(len(query_vec), len(doc_vec))
            score = float(np.dot(query_vec[:min_len], doc_vec[:min_len]))
            scores.append((score, doc))

        scores.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "text": doc["text"],
                "source": doc["source"],
                "type": doc["type"],
                "score": round(score, 4),
            }
            for score, doc in scores[:top_k]
        ]
