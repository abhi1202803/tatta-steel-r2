"""
Industry-grade synthetic predictive-maintenance dataset generator.

Builds a master tabular dataset (50k+ rows, 500+ assets), graph data for GNN,
model-specific train/val/test splits, Prophet demand series, and RL transitions.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

FAILURE_TYPES = [
    "none",
    "bearing_failure",
    "motor_failure",
    "gearbox_failure",
    "pump_failure",
    "sensor_failure",
]
FAILURE_TYPES_CLASS = [ft for ft in FAILURE_TYPES if ft != "none"]

ROOT_CAUSES = [
    "Insufficient Lubrication",
    "Misalignment",
    "Bearing Wear",
    "Electrical Overload",
    "Cooling Failure",
    "Cavitation",
    "Seal Degradation",
    "Calibration Drift",
    "Normal Operation",
]

RISK_LEVELS = ["low", "medium", "high", "critical"]
RISK_TO_INT = {level: idx for idx, level in enumerate(RISK_LEVELS)}

RCA_MAP = {
    "bearing_failure": ["Bearing Wear", "Insufficient Lubrication", "Misalignment"],
    "motor_failure": ["Electrical Overload", "Cooling Failure", "Bearing Wear"],
    "gearbox_failure": ["Misalignment", "Insufficient Lubrication", "Bearing Wear"],
    "pump_failure": ["Cavitation", "Seal Degradation", "Insufficient Lubrication"],
    "sensor_failure": ["Calibration Drift", "Electrical Overload", "Misalignment"],
    "none": ["Normal Operation"],
}

SENSOR_FEATURES = [
    "temperature", "vibration", "pressure", "current", "voltage",
    "rpm", "flow_rate", "power_consumption",
]
THERMAL_FEATURES = ["oil_level", "bearing_temperature", "motor_temperature", "gearbox_temperature"]
ENV_FEATURES = ["ambient_temperature", "humidity"]
OPS_FEATURES = [
    "operating_hours", "maintenance_days_ago", "production_load", "downtime_cost_per_hour",
]
META_COLS = ["equipment_id", "timestamp", "equipment_type", "manufacturer", "location"]

EQUIPMENT_TYPES = ["motor", "pump", "gearbox", "compressor", "conveyor", "fan", "turbine"]
MANUFACTURERS = ["Siemens", "ABB", "SKF", "Grundfos", "Bonfiglioli", "Atlas Copco", "WEG", "KSB"]
LOCATIONS = [
    "Plant-A/Line-1", "Plant-A/Line-2", "Plant-B/Line-1", "Plant-B/Line-2",
    "Plant-C/Finishing", "Plant-C/Casting", "Plant-D/Rolling", "Plant-D/Coating",
]
SPARE_CATEGORIES = ["bearings", "motors", "filters", "lubricants", "seals"]

RL_ACTIONS = ["do_nothing", "monitor", "schedule_maintenance", "shutdown", "order_spares"]
RL_ACTION_TO_INT = {a: i for i, a in enumerate(RL_ACTIONS)}

ALL_MODELS = [
    "isolation_forest",
    "autoencoder",
    "lstm_autoencoder",
    "xgboost_failure",
    "gnn_rca",
    "lstm_rul",
    "tft_rul",
    "catboost_risk",
    "maintenance_rl",
    "prophet_forecast",
]

DEFAULT_NUM_EQUIPMENT = 520
DEFAULT_HOURS_PER_EQUIPMENT = 100
RANDOM_SEED = 42


@dataclass
class IndustrialDataPipeline:
    """Orchestrates master dataset creation and model-specific exports."""

    data_root: Path = field(default_factory=lambda: Path("data"))
    num_equipment: int = DEFAULT_NUM_EQUIPMENT
    hours_per_equipment: int = DEFAULT_HOURS_PER_EQUIPMENT
    seed: int = RANDOM_SEED

    master: pd.DataFrame = field(default_factory=pd.DataFrame, init=False, repr=False)
    train_df: pd.DataFrame = field(default_factory=pd.DataFrame, init=False, repr=False)
    val_df: pd.DataFrame = field(default_factory=pd.DataFrame, init=False, repr=False)
    test_df: pd.DataFrame = field(default_factory=pd.DataFrame, init=False, repr=False)
    nodes: pd.DataFrame = field(default_factory=pd.DataFrame, init=False, repr=False)
    edges: pd.DataFrame = field(default_factory=pd.DataFrame, init=False, repr=False)
    prophet_dfs: dict[str, pd.DataFrame] = field(default_factory=dict, init=False, repr=False)
    _generated: bool = field(default=False, init=False, repr=False)

    @property
    def master_dir(self) -> Path:
        return self.data_root / "master"

    @property
    def graph_dir(self) -> Path:
        return self.data_root / "graph"

    @property
    def datasets_dir(self) -> Path:
        return self.data_root / "datasets"

    def generate(self, force: bool = False) -> None:
        if self._generated and not force:
            return
        rng = np.random.default_rng(self.seed)
        print("  building master dataset...")
        self.master = _build_master_dataframe(self.num_equipment, self.hours_per_equipment, rng)
        print("  splitting train/val/test (chronological)...")
        self.train_df, self.val_df, self.test_df = _chronological_split(self.master)
        print("  building GNN graph...")
        self.nodes, self.edges = _build_graph_data(self.master, rng)
        print("  building Prophet demand series...")
        self.prophet_dfs = _build_prophet_demand(self.master, rng)
        print("  persisting master + splits...")
        self._persist_master()
        self._persist_graph()
        print("  persisting model-specific datasets...")
        self._persist_model_datasets()
        self._generated = True

    def get_model_data(self, model_name: str, split: str = "train") -> dict:
        if not self._generated:
            self.generate()
        path = self.datasets_dir / model_name / f"{split}.npz"
        if not path.exists():
            raise FileNotFoundError(f"Missing dataset: {path}")
        archive = np.load(path, allow_pickle=True)
        has_y = bool(archive["has_y"])
        y = archive["y"] if has_y else None
        if y is not None and len(y) == 0:
            y = None
        result = {"X": archive["X"], "y": y}
        if "meta" in archive:
            result["meta"] = json.loads(str(archive["meta"]))
        return result

    def _persist_master(self) -> None:
        self.master_dir.mkdir(parents=True, exist_ok=True)
        self.master.to_csv(self.master_dir / "industrial_master.csv", index=False)
        self.train_df.to_csv(self.master_dir / "train.csv", index=False)
        self.val_df.to_csv(self.master_dir / "validation.csv", index=False)
        self.test_df.to_csv(self.master_dir / "test.csv", index=False)
        stats = {
            "total_records": len(self.master),
            "equipment_count": int(self.master["equipment_id"].nunique()),
            "failure_distribution": self.master["failure_type"].value_counts().to_dict(),
            "risk_distribution": self.master["risk_level"].value_counts().to_dict(),
            "rul_stats": {
                "mean": float(self.master["remaining_useful_life_hours"].mean()),
                "min": float(self.master["remaining_useful_life_hours"].min()),
                "max": float(self.master["remaining_useful_life_hours"].max()),
            },
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
        (self.master_dir / "statistics.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")

    def _persist_graph(self) -> None:
        self.graph_dir.mkdir(parents=True, exist_ok=True)
        self.nodes.to_csv(self.graph_dir / "nodes.csv", index=False)
        self.edges.to_csv(self.graph_dir / "edges.csv", index=False)

    def _persist_model_datasets(self) -> None:
        builders = {
            "isolation_forest": _pack_isolation_forest,
            "autoencoder": _pack_autoencoder,
            "lstm_autoencoder": _pack_lstm_autoencoder,
            "xgboost_failure": _pack_xgboost,
            "gnn_rca": _pack_gnn,
            "lstm_rul": _pack_lstm_rul,
            "tft_rul": _pack_tft_rul,
            "catboost_risk": _pack_catboost,
            "maintenance_rl": _pack_rl,
            "prophet_forecast": _pack_prophet,
        }
        for name, builder in builders.items():
            out = self.datasets_dir / name
            out.mkdir(parents=True, exist_ok=True)
            model_meta: dict = {"model": name, "splits": ["train", "validation", "test"]}
            for split_name, df in [("train", self.train_df), ("validation", self.val_df), ("test", self.test_df)]:
                data, meta = builder(df, self.nodes, self.edges, self.prophet_dfs, split_name)
                _save_npz(out / f"{split_name}.npz", data, meta)
                _save_csv(out / f"{split_name}.csv", data, meta, name)
                if name == "gnn_rca" and "nodes" in data:
                    data["nodes"].to_csv(out / f"{split_name}_nodes.csv", index=False)
                    data["edges"].to_csv(out / f"{split_name}_edges.csv", index=False)
                model_meta[split_name] = {
                    "X_shape": list(data["X"].shape),
                    "has_labels": data.get("y") is not None,
                    **meta,
                }
            if name == "prophet_forecast":
                prophet_dir = out / "categories"
                prophet_dir.mkdir(exist_ok=True)
                for cat, pdf in self.prophet_dfs.items():
                    pdf.to_csv(prophet_dir / f"{cat}.csv", index=False)
            (out / "metadata.json").write_text(json.dumps(model_meta, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Master dataset generation
# ---------------------------------------------------------------------------

def _build_master_dataframe(n_equipment: int, hours: int, rng: np.random.Generator) -> pd.DataFrame:
    start = datetime(2023, 1, 1)
    rows: list[dict] = []

    for i in range(n_equipment):
        eq_id = f"EQ-{i + 1:05d}"
        eq_type = EQUIPMENT_TYPES[i % len(EQUIPMENT_TYPES)]
        profile = _equipment_profile(eq_type, rng)
        operating_hours = float(rng.uniform(500, 8000))
        maintenance_days = float(rng.uniform(5, 180))
        degradation = float(rng.uniform(0.001, 0.004))
        spare_inventory = int(rng.integers(2, 40))
        production_load = float(rng.uniform(0.4, 1.0))
        downtime_cost = float(rng.uniform(2000, 25000))

        for h in range(hours):
            t = start + timedelta(hours=i * hours + h)
            progress = h / max(hours - 1, 1)
            wear = float(np.clip(degradation * h + operating_hours / 12000 + progress * 0.1, 0, 1))

            forced = _sample_failure_event(wear, h, rng)
            sensors = _simulate_sensors(profile, wear, rng, eq_type, force_failure=forced)
            ambient_temp = float(rng.normal(28, 4))
            humidity = float(np.clip(rng.normal(55, 10), 20, 95))
            oil_level = float(np.clip(profile["oil_base"] - wear * 20 + rng.normal(0, 1), 5, 100))
            bearing_temperature = sensors["temperature"] + float(rng.normal(8, 2)) + wear * 30
            motor_temperature = sensors["temperature"] + float(rng.normal(15, 3)) + wear * 40
            gearbox_temperature = sensors["temperature"] + float(rng.normal(10, 2)) + wear * 25

            # Maintenance event resets wear periodically
            if maintenance_days > 120 and h % 40 == 0:
                wear *= 0.4
                maintenance_days = float(rng.uniform(1, 14))

            thermal = {
                "bearing_temperature": bearing_temperature,
                "motor_temperature": motor_temperature,
                "gearbox_temperature": gearbox_temperature,
            }
            failure_type = _assign_failure_type(sensors, eq_type, thermal)
            root_cause = _assign_root_cause(failure_type, sensors)
            anomaly_score = _compute_anomaly_score(sensors, failure_type)
            rul = _compute_rul(
                base_life=profile["base_life"],
                operating_hours=operating_hours + h,
                sensors=sensors,
                maintenance_days_ago=maintenance_days + h / 24,
            )
            risk_level = _assign_risk_level(
                rul, anomaly_score, failure_type, production_load, downtime_cost,
            )

            rows.append({
                "equipment_id": eq_id,
                "timestamp": t.isoformat(),
                "equipment_type": eq_type,
                "manufacturer": MANUFACTURERS[i % len(MANUFACTURERS)],
                "location": LOCATIONS[i % len(LOCATIONS)],
                **sensors,
                "oil_level": oil_level,
                "bearing_temperature": bearing_temperature,
                "motor_temperature": motor_temperature,
                "gearbox_temperature": gearbox_temperature,
                "ambient_temperature": ambient_temp,
                "humidity": humidity,
                "operating_hours": operating_hours + h,
                "maintenance_days_ago": maintenance_days + h / 24,
                "production_load": production_load * (0.95 + 0.1 * np.sin(progress * np.pi)),
                "downtime_cost_per_hour": downtime_cost,
                "spare_inventory": spare_inventory,
                "failure_type": failure_type,
                "root_cause": root_cause,
                "risk_level": risk_level,
                "remaining_useful_life_hours": rul,
                "anomaly_score": anomaly_score,
                "is_anomaly": int(failure_type != "none" or anomaly_score > 0.65),
            })

    df = pd.DataFrame(rows)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df.sort_values(["equipment_id", "timestamp"]).reset_index(drop=True)


def _equipment_profile(eq_type: str, rng: np.random.Generator) -> dict:
    profiles = {
        "motor": {"temp": 55, "vib": 2.5, "pressure": 1.0, "current": 35, "rpm": 1800, "flow": 0, "base_life": 6000, "oil_base": 80},
        "pump": {"temp": 48, "vib": 3.0, "pressure": 6.0, "current": 22, "rpm": 1450, "flow": 55, "base_life": 5000, "oil_base": 70},
        "gearbox": {"temp": 52, "vib": 3.5, "pressure": 2.0, "current": 28, "rpm": 900, "flow": 0, "base_life": 5500, "oil_base": 75},
        "compressor": {"temp": 60, "vib": 4.0, "pressure": 8.0, "current": 40, "rpm": 3600, "flow": 30, "base_life": 4500, "oil_base": 65},
        "conveyor": {"temp": 42, "vib": 1.8, "pressure": 1.0, "current": 15, "rpm": 120, "flow": 0, "base_life": 7000, "oil_base": 85},
        "fan": {"temp": 45, "vib": 2.2, "pressure": 1.5, "current": 18, "rpm": 1100, "flow": 80, "base_life": 6500, "oil_base": 78},
        "turbine": {"temp": 65, "vib": 4.5, "pressure": 12.0, "current": 55, "rpm": 3000, "flow": 100, "base_life": 4000, "oil_base": 60},
    }
    base = profiles.get(eq_type, profiles["motor"])
    return {**base, "voltage": 400.0}


def _simulate_sensors(
    profile: dict,
    wear: float,
    rng: np.random.Generator,
    eq_type: str,
    force_failure: str | None = None,
) -> dict:
    """Generate sensor readings; optionally force a specific failure signature."""
    temp = profile["temp"] + wear * 15 + rng.normal(0, 1.5)
    vib = profile["vib"] + wear * 3 + rng.normal(0, 0.2)
    pressure = max(0.5, profile["pressure"] + rng.normal(0, 0.15) - wear * 0.5)
    current = profile["current"] + wear * 5 + rng.normal(0, 1.0)
    rpm = max(100, profile["rpm"] + rng.normal(0, 20) - wear * 50)
    flow = max(0, profile["flow"] + rng.normal(0, 1.5) - wear * 2)
    voltage = profile["voltage"] + rng.normal(0, 2)
    power = (current * voltage / 1000) * (0.85 + wear * 0.05)

    if force_failure == "bearing_failure":
        vib = rng.uniform(16, 24)
        temp = rng.uniform(75, 95)
    elif force_failure == "motor_failure":
        current = rng.uniform(62, 85)
        temp = rng.uniform(100, 140)
    elif force_failure == "gearbox_failure":
        rpm = rng.uniform(400, 680)
        temp = rng.uniform(85, 115)
    elif force_failure == "pump_failure":
        pressure = rng.uniform(0.3, 1.8)
        flow = rng.uniform(2, 12)
    elif force_failure == "sensor_failure":
        if rng.random() < 0.5:
            rpm = -abs(rng.uniform(50, 200))
        else:
            temp = rng.uniform(550, 800)

    return {
        "temperature": float(temp),
        "vibration": float(max(0, vib)),
        "pressure": float(pressure),
        "current": float(max(0, current)),
        "voltage": float(max(0, voltage)),
        "rpm": float(rpm),
        "flow_rate": float(flow),
        "power_consumption": float(max(0, power)),
    }


def _sample_failure_event(wear: float, h: int, rng: np.random.Generator) -> str | None:
    """Stochastically trigger failure events – majority of rows stay healthy (~70%)."""
    base_p = 0.01 + wear * 0.12
    if h > 70:
        base_p += 0.02
    base_p = min(base_p, 0.35)
    if rng.random() > base_p:
        return None
    types = FAILURE_TYPES_CLASS
    weights = np.array([0.35, 0.20, 0.15, 0.15, 0.15])  # bearing, motor, gearbox, pump, sensor
    return rng.choice(types, p=weights / weights.sum())


def _assign_failure_type(sensors: dict, eq_type: str, thermal: dict) -> str:
    if sensors["rpm"] < 0 or sensors["temperature"] > 500 or sensors["vibration"] < 0:
        return "sensor_failure"
    if sensors["vibration"] > 15 and thermal["bearing_temperature"] > 90:
        return "bearing_failure"
    if eq_type in ("motor", "compressor", "turbine", "fan", "conveyor"):
        if sensors["current"] > 60 and thermal["motor_temperature"] > 120:
            return "motor_failure"
    if eq_type in ("gearbox", "conveyor", "turbine"):
        if sensors["rpm"] < 700 and thermal["gearbox_temperature"] > 100:
            return "gearbox_failure"
    if eq_type in ("pump", "compressor", "fan"):
        flow_threshold = 20 if eq_type == "pump" else 12
        if sensors["pressure"] < 2 and sensors["flow_rate"] < flow_threshold:
            return "pump_failure"
    return "none"


def _assign_root_cause(failure_type: str, sensors: dict) -> str:
    if failure_type == "none":
        return "Normal Operation"
    candidates = RCA_MAP.get(failure_type, ROOT_CAUSES[:3])
    if failure_type == "bearing_failure":
        if sensors["vibration"] > 18:
            return "Bearing Wear"
        if sensors["temperature"] > 80:
            return "Insufficient Lubrication"
        return "Misalignment"
    if failure_type == "motor_failure":
        if sensors["current"] > 70:
            return "Electrical Overload"
        return "Cooling Failure"
    if failure_type == "gearbox_failure":
        return "Misalignment"
    if failure_type == "pump_failure":
        if sensors["pressure"] < 1:
            return "Cavitation"
        return "Seal Degradation"
    if failure_type == "sensor_failure":
        return "Calibration Drift"
    return candidates[0]


def _compute_anomaly_score(sensors: dict, failure_type: str) -> float:
    score = 0.0
    score += min(sensors["vibration"] / 20, 1.0) * 0.35
    score += min(sensors["temperature"] / 150, 1.0) * 0.25
    score += min(sensors["current"] / 80, 1.0) * 0.2
    score += (1 - min(sensors["pressure"] / 5, 1.0)) * 0.1
    if failure_type != "none":
        score += 0.25
    return float(np.clip(score, 0, 1))


def _compute_rul(
    base_life: float,
    operating_hours: float,
    sensors: dict,
    maintenance_days_ago: float,
) -> float:
    op_factor = max(0.15, 1.0 - operating_hours / 12000)
    vib_factor = max(0.2, 1.0 - sensors["vibration"] / 30)
    temp_factor = max(0.2, 1.0 - sensors["temperature"] / 200)
    maint_factor = max(0.5, 1.0 - maintenance_days_ago / 365)
    rul = base_life * op_factor * vib_factor * temp_factor * maint_factor
    return float(max(24.0, rul))


def _assign_risk_level(
    rul: float,
    anomaly_score: float,
    failure_type: str,
    production_load: float,
    downtime_cost: float,
) -> str:
    if rul > 1000:
        base = 0
    elif rul > 300:
        base = 1
    elif rul > 100:
        base = 2
    else:
        base = 3

    if failure_type != "none":
        base = min(3, base + 1)
    if anomaly_score > 0.75:
        base = min(3, base + 1)
    if production_load > 0.85 and downtime_cost > 15000:
        base = min(3, base + 1)

    return RISK_LEVELS[base]


def _chronological_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    ordered = df.sort_values("timestamp").reset_index(drop=True)
    n = len(ordered)
    t1, t2 = int(n * 0.70), int(n * 0.85)
    return ordered.iloc[:t1].copy(), ordered.iloc[t1:t2].copy(), ordered.iloc[t2:].copy()


def _stratified_failure_split(
    df: pd.DataFrame, label_col: str = "failure_type",
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Stratified split for classification subsets (failure events only)."""
    from sklearn.model_selection import train_test_split

    events = df[df[label_col] != "none"].copy()
    if len(events) < 30:
        return _chronological_split(df)
    train, temp = train_test_split(events, test_size=0.30, stratify=events[label_col], random_state=RANDOM_SEED)
    val, test = train_test_split(temp, test_size=0.50, stratify=temp[label_col], random_state=RANDOM_SEED)
    return train, val, test


# ---------------------------------------------------------------------------
# Graph data (GNN)
# ---------------------------------------------------------------------------

GRAPH_TOPOLOGY = [
    ("Motor", "Bearing", "drives"),
    ("Bearing", "Vibration_Sensor", "monitored_by"),
    ("Motor", "Temperature_Sensor", "monitored_by"),
    ("Motor", "Gearbox", "coupled_to"),
    ("Gearbox", "Shaft", "transmits_to"),
    ("Shaft", "Pump", "drives"),
    ("Pump", "Pressure_Sensor", "monitored_by"),
    ("Pump", "Flow_Sensor", "monitored_by"),
    ("Motor", "Current_Sensor", "monitored_by"),
]


def _build_graph_data(master: pd.DataFrame, rng: np.random.Generator) -> tuple[pd.DataFrame, pd.DataFrame]:
    node_rows, edge_rows = [], []
    node_id = 0
    failure_events = master[master["failure_type"] != "none"].drop_duplicates("equipment_id", keep="last")

    for _, row in failure_events.iterrows():
        eq = row["equipment_id"]
        local_nodes: dict[str, int] = {}
        for src, tgt, rel in GRAPH_TOPOLOGY:
            for name in (src, tgt):
                if name not in local_nodes:
                    local_nodes[name] = node_id
                    node_rows.append({
                        "node_id": node_id,
                        "node_type": name,
                        "equipment_id": eq,
                        "temperature": row["temperature"] + rng.normal(0, 2),
                        "vibration": row["vibration"] + (5 if "Vibration" in name else 0),
                        "current": row["current"] + (3 if "Current" in name else 0),
                        "root_cause": row["root_cause"],
                        "failure_type": row["failure_type"],
                    })
                    node_id += 1
            edge_rows.append({
                "source_node": local_nodes[src],
                "target_node": local_nodes[tgt],
                "relationship": rel,
                "equipment_id": eq,
            })

    return pd.DataFrame(node_rows), pd.DataFrame(edge_rows)


# ---------------------------------------------------------------------------
# Prophet demand
# ---------------------------------------------------------------------------

def _build_prophet_demand(master: pd.DataFrame, rng: np.random.Generator) -> dict[str, pd.DataFrame]:
    daily = master.copy()
    daily["date"] = daily["timestamp"].dt.floor("D")
    result: dict[str, pd.DataFrame] = {}

    for category in SPARE_CATEGORIES:
        fail_col = daily["failure_type"].str.replace("_failure", "", regex=False)
        daily = daily.copy()
        daily["_fail_match"] = fail_col.str.contains(category.rstrip("s")[:4], case=False, na=False).astype(int)
        agg = daily.groupby("date").agg(
            failures=("_fail_match", "sum"),
            load=("production_load", "mean"),
            maint=("maintenance_days_ago", "mean"),
        ).reset_index()

        n = len(agg)
        t = np.arange(n)
        seasonal = 3 * np.sin(t * 2 * np.pi / 30) + 2 * np.sin(t * 2 * np.pi / 7)
        y = (
            8
            + agg["failures"] * 4
            + agg["load"] * 5
            + (agg["maint"] / 30)
            + seasonal
            + rng.normal(0, 0.5, n)
        ).clip(0)
        result[category] = pd.DataFrame({"ds": agg["date"], "y": y})
    return result


# ---------------------------------------------------------------------------
# Model-specific packers
# ---------------------------------------------------------------------------

def _pack_isolation_forest(df: pd.DataFrame, *_args) -> tuple[dict, dict]:
    X = df[SENSOR_FEATURES].values.astype(np.float32)
    y = df["is_anomaly"].values.astype(np.int32)
    return {"X": X, "y": y}, {"features": SENSOR_FEATURES, "task": "anomaly_detection"}


def _pack_autoencoder(df: pd.DataFrame, *_args) -> tuple[dict, dict]:
    normal = df[df["failure_type"] == "none"]
    if len(normal) < 100:
        normal = df[df["is_anomaly"] == 0]
    if len(normal) < 100:
        normal = df.nsmallest(max(500, len(df) // 2), "anomaly_score")
    X = normal[SENSOR_FEATURES + THERMAL_FEATURES].values.astype(np.float32)
    return {"X": X, "y": None}, {"features": SENSOR_FEATURES + THERMAL_FEATURES, "task": "reconstruction"}


def _pack_lstm_autoencoder(df: pd.DataFrame, *_args) -> tuple[dict, dict]:
    seq_len = 24
    feats = SENSOR_FEATURES
    sequences = _extract_sequences(df, feats, seq_len)
    return {"X": sequences, "y": None}, {"seq_len": seq_len, "features": feats, "task": "temporal_anomaly"}


def _pack_xgboost(df: pd.DataFrame, *_args) -> tuple[dict, dict]:
    events = df[df["failure_type"] != "none"]
    if len(events) < 50:
        events = df.sample(min(500, len(df)), random_state=RANDOM_SEED)
    cols = SENSOR_FEATURES + THERMAL_FEATURES + OPS_FEATURES + ["anomaly_score", "remaining_useful_life_hours"]
    X = events[cols].values.astype(np.float32)
    y = events["failure_type"].values
    return {"X": X, "y": y}, {"features": cols, "task": "failure_classification"}


def _pack_gnn(df: pd.DataFrame, nodes: pd.DataFrame, edges: pd.DataFrame, _p, split: str) -> tuple[dict, dict]:
    eq_in_split = set(df["equipment_id"].unique())
    n = nodes[nodes["equipment_id"].isin(eq_in_split)].copy()
    if n.empty:
        n = nodes.head(100)
    X = n[["temperature", "vibration", "current"]].values.astype(np.float32)
    y = n["root_cause"].values
    meta = {
        "task": "root_cause_analysis",
        "node_features": ["temperature", "vibration", "current"],
        "graph_nodes": len(n),
        "graph_edges": len(edges[edges["equipment_id"].isin(eq_in_split)]),
    }
    e = edges[edges["equipment_id"].isin(eq_in_split)]
    return {"X": X, "y": y, "nodes": n, "edges": e}, meta


def _pack_lstm_rul(df: pd.DataFrame, *_args) -> tuple[dict, dict]:
    seq_len = 30
    feats = ["temperature", "vibration", "pressure", "current", "rpm"]
    X = _extract_sequences(df, feats, seq_len)
    targets: list[float] = []
    for _, grp in df.groupby("equipment_id", sort=False):
        arr = grp.sort_values("timestamp")
        if len(arr) < seq_len:
            continue
        rul = arr["remaining_useful_life_hours"].values
        targets.extend(rul[seq_len - 1 :])
    y = np.array(targets[: len(X)], dtype=np.float32)
    return {"X": X, "y": y}, {"seq_len": seq_len, "features": feats, "task": "rul_regression"}


def _pack_tft_rul(df: pd.DataFrame, *_args) -> tuple[dict, dict]:
    seq_len = 30
    seq_feats = ["temperature", "vibration", "pressure", "current", "rpm", "flow_rate"]
    static_feats = ["operating_hours", "production_load", "maintenance_days_ago"]
    seqs_list, statics, targets = [], [], []
    for _, grp in df.groupby("equipment_id", sort=False):
        arr = grp.sort_values("timestamp")
        if len(arr) < seq_len:
            continue
        s = arr[seq_feats].values
        st = arr[static_feats].iloc[-1].values
        rul = arr["remaining_useful_life_hours"].values
        n = len(arr) - seq_len + 1
        strides = (s.strides[0], s.strides[0], s.strides[1])
        windows = np.lib.stride_tricks.as_strided(s, (n, seq_len, len(seq_feats)), strides).copy()
        seqs_list.append(windows.reshape(n, -1))
        statics.append(np.tile(st, (n, 1)))
        targets.append(rul[seq_len - 1 :])
    if not seqs_list:
        return {"X": np.empty((0, 1)), "y": np.empty(0)}, {"seq_len": seq_len, "task": "rul_tft"}
    X = np.column_stack([np.vstack(seqs_list), np.vstack(statics)]).astype(np.float32)
    y = np.concatenate(targets).astype(np.float32)
    return {"X": X, "y": y[: len(X)]}, {"seq_len": seq_len, "task": "rul_tft"}


def _pack_catboost(df: pd.DataFrame, *_args) -> tuple[dict, dict]:
    cols = [
        "anomaly_score", "remaining_useful_life_hours", "operating_hours",
        "production_load", "downtime_cost_per_hour", "maintenance_days_ago",
        "vibration", "temperature",
    ]
    X = df[cols].values.astype(np.float32)
    y = np.array([RISK_TO_INT[r] for r in df["risk_level"]], dtype=np.int32)
    return {"X": X, "y": y}, {"features": cols, "task": "risk_classification", "labels": RISK_LEVELS}


def _pack_rl(df: pd.DataFrame, *_args) -> tuple[dict, dict]:
    states, actions, rewards = [], [], []
    for _, row in df.iterrows():
        state = [
            RISK_TO_INT[row["risk_level"]] / 3.0,
            min(row["remaining_useful_life_hours"] / 2000, 1.0),
            row["spare_inventory"] / 50.0,
            row["production_load"],
            row["downtime_cost_per_hour"] / 25000.0,
            row["anomaly_score"],
            row["vibration"] / 25.0,
            row["temperature"] / 150.0,
        ]
        action = _optimal_rl_action(row)
        reward = _rl_reward(row, action)
        states.append(state)
        actions.append(action)
        rewards.append(reward)
    X = np.array(states, dtype=np.float32)
    y_actions = np.array(actions, dtype=np.int32)
    y_rewards = np.array(rewards, dtype=np.float32)
    return {"X": X, "y": y_actions, "rewards": y_rewards}, {"task": "maintenance_rl", "actions": RL_ACTIONS}


def _pack_prophet(_df: pd.DataFrame, _n, _e, prophet_dfs: dict, _split: str) -> tuple[dict, dict]:
    cat = "bearings"
    pdf = prophet_dfs[cat]
    X = np.arange(len(pdf))
    y = pdf["y"].values.astype(np.float32)
    return {"X": X, "y": y, "dates": pdf["ds"].astype(str).values}, {"task": "procurement_forecast", "category": cat}


def _optimal_rl_action(row: pd.Series) -> int:
    risk = row["risk_level"]
    rul = row["remaining_useful_life_hours"]
    inv = row["spare_inventory"]
    if risk == "critical" or rul <= 100:
        return RL_ACTION_TO_INT["shutdown"]
    if risk == "high" or rul <= 300:
        return RL_ACTION_TO_INT["schedule_maintenance"]
    if risk == "medium":
        return RL_ACTION_TO_INT["monitor"]
    if inv < 5:
        return RL_ACTION_TO_INT["order_spares"]
    return RL_ACTION_TO_INT["do_nothing"]


def _rl_reward(row: pd.Series, action: int) -> float:
    optimal = _optimal_rl_action(row)
    base = 10.0 if action == optimal else -5.0
    cost_penalty = row["downtime_cost_per_hour"] / 50000
    downtime_bonus = 3.0 if action == RL_ACTION_TO_INT["schedule_maintenance"] and row["risk_level"] == "high" else 0
    shutdown_bonus = 5.0 if action == RL_ACTION_TO_INT["shutdown"] and row["risk_level"] == "critical" else 0
    inv_bonus = 2.0 if action == RL_ACTION_TO_INT["order_spares"] and row["spare_inventory"] < 5 else 0
    return base - cost_penalty + downtime_bonus + shutdown_bonus + inv_bonus


def _extract_sequences(df: pd.DataFrame, features: list[str], seq_len: int) -> np.ndarray:
    seqs: list[np.ndarray] = []
    for _, grp in df.groupby("equipment_id", sort=False):
        values = grp.sort_values("timestamp")[features].values
        n = len(values) - seq_len + 1
        if n <= 0:
            continue
        strides = (values.strides[0], values.strides[0], values.strides[1])
        shape = (n, seq_len, len(features))
        windowed = np.lib.stride_tricks.as_strided(values, shape=shape, strides=strides).copy()
        seqs.append(windowed)
    return np.concatenate(seqs, axis=0).astype(np.float32) if seqs else np.empty((0, seq_len, len(features)), dtype=np.float32)


# ---------------------------------------------------------------------------
# Persistence helpers
# ---------------------------------------------------------------------------

def _save_npz(path: Path, data: dict, meta: dict) -> None:
    payload = {
        "X": data["X"],
        "y": data.get("y") if data.get("y") is not None else np.array([]),
        "has_y": data.get("y") is not None,
        "meta": json.dumps(meta),
    }
    if "rewards" in data:
        payload["rewards"] = data["rewards"]
    np.savez_compressed(path, **payload)


def _save_csv(path: Path, data: dict, meta: dict, model_name: str) -> None:
    """Save human-readable CSV (skip huge 3D sequence tensors – use NPZ instead)."""
    X, y = data["X"], data.get("y")
    try:
        if X.ndim == 2 and X.shape[0] <= 50000:
            cols = meta.get("features", [f"f{i}" for i in range(X.shape[1])])
            if len(cols) != X.shape[1]:
                cols = [f"f{i}" for i in range(X.shape[1])]
            df = pd.DataFrame(X, columns=cols)
            if y is not None:
                df["target"] = y
            df.to_csv(path, index=False)
        elif X.ndim == 3:
            # Summary sample only for sequence models
            sample = pd.DataFrame({
                "n_sequences": [X.shape[0]],
                "seq_len": [X.shape[1]],
                "n_features": [X.shape[2]],
            })
            sample.to_csv(path, index=False)
        elif model_name == "prophet_forecast" and "dates" in data:
            pd.DataFrame({"ds": data["dates"], "y": y}).to_csv(path, index=False)
    except Exception:
        pass
