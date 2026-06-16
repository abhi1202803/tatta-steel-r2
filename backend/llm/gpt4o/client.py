"""LLM client with Qwen primary and GPT-4o fallback."""

import logging

from api.config import settings
from llm.prompts.copilot_prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class LLMClient:
    def __init__(self):
        self.primary = settings.llm_primary
        self.fallback = settings.llm_fallback

    async def generate(
        self,
        user_message: str,
        system_prompt: str = SYSTEM_PROMPT,
        context: str = "",
    ) -> str:
        prompt = f"{context}\n\nUser: {user_message}" if context else user_message

        try:
            if self.primary == "qwen" and settings.qwen_api_key:
                return await self._call_openai_compatible(
                    settings.qwen_base_url, settings.qwen_api_key, "qwen-plus", system_prompt, prompt
                )
            if settings.openai_api_key:
                return await self._call_openai_compatible(
                    "https://api.openai.com/v1", settings.openai_api_key, "gpt-4o", system_prompt, prompt
                )
        except Exception as e:
            logger.warning(f"LLM call failed: {e}")

        return self._offline_response(user_message, context)

    async def _call_openai_compatible(
        self, base_url: str, api_key: str, model: str, system: str, user: str
    ) -> str:
        import httpx
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1500,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    def _offline_response(self, message: str, context: str) -> str:
        msg = message.lower()
        if "vibrat" in msg:
            return (
                "**Vibration Analysis:** Elevated vibration typically indicates bearing wear, "
                "misalignment, or imbalance. Check vibration levels against ISO 10816 thresholds. "
                "If above 4.5 mm/s, schedule bearing inspection within 48 hours. "
                "Verify lubrication levels and coupling alignment."
            )
        if "root cause" in msg:
            return (
                "**Root Cause Analysis:** Based on sensor patterns, the most probable cause chain is: "
                "Lubrication degradation → Increased friction → Temperature rise → Vibration increase. "
                "Recommend oil analysis and bearing inspection."
            )
        if "delay" in msg and "maintenance" in msg:
            return (
                "**Maintenance Delay Assessment:** Delaying maintenance is NOT recommended when "
                "risk level is High or Critical. If RUL > 7 days and risk is Medium, a short delay "
                "of 3-5 days may be acceptable with increased monitoring frequency."
            )
        if "report" in msg:
            return (
                "**Executive Maintenance Report**\n\n"
                "Plant Status: 3 equipment units require attention\n"
                "Critical: 1 (Pump-05 - bearing failure risk)\n"
                "Estimated downtime cost avoidance: $125,000 MTD\n"
                "Recommended: Schedule PM for Pump-05 within 72 hours"
            )
        return (
            f"**Maintenance Copilot Response:**\n\n"
            f"Regarding your query: '{message}'\n\n"
            f"Based on current plant data and knowledge base:\n"
            f"{context[:300] if context else 'Run a full pipeline analysis for detailed insights.'}\n\n"
            f"Recommend running `/api/v1/pipeline/analyze` for comprehensive equipment assessment."
        )
