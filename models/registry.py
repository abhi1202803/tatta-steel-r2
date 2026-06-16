"""Central model registry – loads and manages all ML models."""

import logging
from pathlib import Path

from api.config import settings
from models.anomaly_detection.autoencoder.model import AutoEncoderModel
from models.anomaly_detection.isolation_forest.model import IsolationForestModel
from models.anomaly_detection.lstm_autoencoder.model import LSTMAutoEncoderModel
from models.failure_classification.xgboost.model import XGBoostFailureModel
from models.maintenance_rl.reinforcement_agent.model import MaintenanceRLAgent
from models.procurement_forecasting.prophet.model import ProphetForecastModel
from models.risk_engine.catboost.model import CatBoostRiskModel
from models.root_cause_analysis.gnn.model import GNNRootCauseModel
from models.rul_prediction.lstm.model import LSTMRULModel
from models.rul_prediction.tft.model import TFTRULModel

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Singleton registry for all pipeline models."""

    def __init__(self):
        self.artifacts_path = Path(settings.model_artifacts_path)
        self.isolation_forest: IsolationForestModel | None = None
        self.autoencoder: AutoEncoderModel | None = None
        self.lstm_autoencoder: LSTMAutoEncoderModel | None = None
        self.xgboost_failure: XGBoostFailureModel | None = None
        self.gnn_rca: GNNRootCauseModel | None = None
        self.lstm_rul: LSTMRULModel | None = None
        self.tft_rul: TFTRULModel | None = None
        self.catboost_risk: CatBoostRiskModel | None = None
        self.rl_agent: MaintenanceRLAgent | None = None
        self.prophet_forecast: ProphetForecastModel | None = None
        self._initialized = False

    async def initialize(self):
        if self._initialized:
            return
        logger.info("Initializing ML model registry...")
        self.artifacts_path.mkdir(parents=True, exist_ok=True)

        self.isolation_forest = IsolationForestModel(self.artifacts_path)
        self.autoencoder = AutoEncoderModel(self.artifacts_path)
        self.lstm_autoencoder = LSTMAutoEncoderModel(self.artifacts_path)
        self.xgboost_failure = XGBoostFailureModel(self.artifacts_path)
        self.gnn_rca = GNNRootCauseModel(self.artifacts_path)
        self.lstm_rul = LSTMRULModel(self.artifacts_path)
        self.tft_rul = TFTRULModel(self.artifacts_path)
        self.catboost_risk = CatBoostRiskModel(self.artifacts_path)
        self.rl_agent = MaintenanceRLAgent(self.artifacts_path)
        self.prophet_forecast = ProphetForecastModel(self.artifacts_path)

        for model in [
            self.isolation_forest, self.autoencoder, self.lstm_autoencoder,
            self.xgboost_failure, self.gnn_rca, self.lstm_rul, self.tft_rul,
            self.catboost_risk, self.rl_agent, self.prophet_forecast,
        ]:
            model.load_or_train()

        self._initialized = True
        logger.info("All models loaded successfully")

    async def shutdown(self):
        self._initialized = False
        logger.info("Model registry shut down")
