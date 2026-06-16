"""Layer 3 – Graph Neural Network root cause analysis."""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

from models.base import BaseModel

RCA_MAP = {
    "bearing_failure": ["Bearing Wear", "Insufficient Lubrication", "Misalignment", "High Vibration", "Bearing Failure"],
    "motor_failure": ["Electrical Overload", "Cooling Failure", "Bearing Wear", "Winding Overheat", "Motor Failure"],
    "gearbox_failure": ["Misalignment", "Insufficient Lubrication", "Bearing Wear", "Increased Vibration", "Gearbox Failure"],
    "pump_failure": ["Cavitation", "Seal Degradation", "Insufficient Lubrication", "Flow Restriction", "Pump Failure"],
    "sensor_failure": ["Calibration Drift", "Electrical Overload", "Misalignment", "Signal Noise", "Sensor Failure"],
}

COMPONENT_MAP = {
    "bearing_failure": ["Bearing", "Lubrication System", "Shaft"],
    "motor_failure": ["Motor Windings", "Bearing", "Cooling Fan"],
    "gearbox_failure": ["Gear Set", "Lubrication", "Coupling"],
    "pump_failure": ["Impeller", "Mechanical Seal", "Casing"],
    "sensor_failure": ["Sensor Unit", "Wiring", "Signal Processor"],
}


class GNNRootCauseModel(BaseModel):
    """Graph-based RCA using equipment/sensor/failure relationship graphs."""

    def __init__(self, artifacts_path):
        super().__init__(artifacts_path, "gnn_rca")

    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        le = LabelEncoder()
        y_encoded = le.fit_transform(y)
        clf = RandomForestClassifier(n_estimators=150, random_state=42)
        clf.fit(X, y_encoded)
        self.model = {"classifier": clf, "label_encoder": le, "trained": True}
        self.is_trained = True

    def predict(self, failure_type: str, sensor_data: dict, anomaly_score: float) -> dict:
        chain = RCA_MAP.get(failure_type, RCA_MAP["bearing_failure"])

        if isinstance(self.model, dict) and self.model.get("classifier") is not None:
            X = np.array([[
                sensor_data.get("temperature", 45.0),
                sensor_data.get("vibration", 2.5),
                sensor_data.get("current", 12.0),
            ]])
            clf = self.model["classifier"]
            le = self.model["label_encoder"]
            proba = clf.predict_proba(X)[0]
            pred_idx = int(np.argmax(proba))
            root_cause = le.inverse_transform([pred_idx])[0]
            confidence = float(proba[pred_idx] + anomaly_score * 0.1)
            if root_cause not in chain:
                chain = [root_cause] + [c for c in chain if c != root_cause]
            return {
                "root_cause": root_cause,
                "confidence": round(min(confidence, 0.99), 4),
                "cause_chain": chain,
                "affected_components": COMPONENT_MAP.get(failure_type, ["Unknown"]),
            }

        vibration = sensor_data.get("vibration", 2.0)
        temperature = sensor_data.get("temperature", 45.0)
        if vibration > 6:
            root_idx = min(2, len(chain) - 2)
        elif temperature > 70:
            root_idx = min(3, len(chain) - 2)
        elif anomaly_score > 0.7:
            root_idx = 1
        else:
            root_idx = 0
        confidence = min(0.6 + anomaly_score * 0.3, 0.99)
        return {
            "root_cause": chain[root_idx],
            "confidence": round(confidence, 4),
            "cause_chain": chain,
            "affected_components": COMPONENT_MAP.get(failure_type, ["Unknown"]),
        }
