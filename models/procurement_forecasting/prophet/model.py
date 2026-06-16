"""Layer 7 – Prophet spare parts demand forecasting."""

from pathlib import Path
import numpy as np

from models.base import BaseModel

SPARE_CATEGORIES = ["bearings", "motors", "filters", "lubricants", "seals"]
CATEGORY_WEIGHTS = {
    "bearings": 0.25, "motors": 0.20, "filters": 0.20,
    "lubricants": 0.20, "seals": 0.15,
}


class ProphetForecastModel(BaseModel):
    def __init__(self, artifacts_path):
        super().__init__(artifacts_path, "prophet_forecast")

    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        baseline = float(np.mean(y)) if y is not None else 10.0
        self.model = {"baseline": baseline}
        self.is_trained = True

    def predict(
        self,
        predicted_failures: list[dict] | None = None,
        risk_levels: dict | None = None,
        horizon_days: int = 30,
    ) -> dict:
        baseline = float(self.model.get("baseline", 10.0))
        prophet_model = self.model.get("prophet_model")
        forecasts = {}
        reorder = {}
        stockout_risk = {}
        recommendations = []

        failure_demand = {}
        for pf in predicted_failures or []:
            ft = pf.get("failure_type", "bearing_failure")
            part = ft.replace("_failure", "s")
            failure_demand[part] = failure_demand.get(part, 0) + 1

        if prophet_model is not None:
            try:
                future = prophet_model.make_future_dataframe(periods=horizon_days)
                forecast = prophet_model.predict(future)
                daily_total = forecast.tail(horizon_days)["yhat"].clip(lower=0).values
            except Exception:
                daily_total = np.full(horizon_days, baseline)
        else:
            daily_total = np.full(horizon_days, baseline)

        for category in SPARE_CATEGORIES:
            weight = CATEGORY_WEIGHTS.get(category, 1.0 / len(SPARE_CATEGORIES))
            extra = failure_demand.get(category, 0) * 2
            forecast = (daily_total * weight + extra).tolist()
            forecasts[category] = [round(v, 1) for v in forecast]

            total_demand = sum(forecast)
            reorder[category] = max(1, int(total_demand * 1.2))
            risk = min(1.0, total_demand / (reorder[category] + 1))
            stockout_risk[category] = round(risk, 3)

            if risk > 0.6:
                recommendations.append({
                    "part": category,
                    "action": "urgent_reorder",
                    "quantity": reorder[category],
                    "reason": f"High stockout risk ({risk:.0%})",
                })
            elif risk > 0.3:
                recommendations.append({
                    "part": category,
                    "action": "planned_reorder",
                    "quantity": reorder[category],
                    "reason": "Moderate demand forecast",
                })

        return {
            "forecasts": forecasts,
            "procurement_recommendations": recommendations,
            "reorder_quantities": reorder,
            "stockout_risk": stockout_risk,
        }
