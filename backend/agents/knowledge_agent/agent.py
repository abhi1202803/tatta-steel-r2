"""Knowledge Agent – RAG retrieval from manuals, SOPs, and failure reports."""

from api.schemas import KnowledgeResponse
from rag.retrieval.retriever import KnowledgeRetriever


class KnowledgeAgent:
    def __init__(self):
        self.retriever = KnowledgeRetriever()

    async def retrieve(self, query: str, equipment_id: str | None = None, top_k: int = 5) -> KnowledgeResponse:
        result = await self.retriever.retrieve(query, top_k, equipment_id)
        return KnowledgeResponse(
            query=query,
            retrieved_context=result["retrieved_context"],
            relevant_documents=result["relevant_documents"],
            technical_guidance=result["technical_guidance"],
        )
