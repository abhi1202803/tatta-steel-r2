"""Knowledge retrieval with reranking."""

from rag.embeddings.embedding_service import EmbeddingService


class KnowledgeRetriever:
    def __init__(self):
        self.embedding_service = EmbeddingService()

    async def retrieve(self, query: str, top_k: int = 5, equipment_id: str | None = None) -> dict:
        results = self.embedding_service.search(query, top_k=top_k)

        if equipment_id:
            equipment_results = [
                r for r in results
                if equipment_id.lower() in r["text"].lower()
                or equipment_id.lower() in r["source"].lower()
            ]
            if equipment_results:
                results = equipment_results + [r for r in results if r not in equipment_results]

        guidance = self._generate_guidance(query, results[:3])
        return {
            "retrieved_context": results,
            "relevant_documents": [r["source"] for r in results],
            "technical_guidance": guidance,
        }

    def _generate_guidance(self, query: str, top_results: list[dict]) -> str:
        if not top_results:
            return "No relevant documentation found. Consult maintenance supervisor."
        context = " ".join(r["text"][:200] for r in top_results)
        return (
            f"Based on industrial knowledge base for query '{query}': "
            f"{context[:500]}..."
        )
