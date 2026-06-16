"""Knowledge management and RAG query API."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from agents.knowledge_agent.agent import KnowledgeAgent
from api.dependencies.database import get_db
from api.schemas import KnowledgeDocument, KnowledgeQuery, KnowledgeResponse
from services import db_repository as repo

router = APIRouter()


@router.post("/knowledge/query", response_model=KnowledgeResponse)
async def query_knowledge(request: KnowledgeQuery):
    agent = KnowledgeAgent()
    return await agent.retrieve(request.query, request.equipment_id, request.top_k)


@router.post("/knowledge/upload", response_model=KnowledgeDocument)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("manual"),
    equipment_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    doc = await repo.create_knowledge_document(
        db, file.filename or "document", doc_type, equipment_id, len(content),
    )
    await repo.create_audit_log(db, "knowledge.upload", "System", doc["id"])
    return KnowledgeDocument(**doc)


@router.get("/knowledge/documents", response_model=list[KnowledgeDocument])
async def list_documents(doc_type: str | None = None, db: AsyncSession = Depends(get_db)):
    docs = await repo.list_knowledge_documents(db, doc_type)
    return [KnowledgeDocument(**d) for d in docs]


@router.get("/knowledge/documents/{doc_id}", response_model=KnowledgeDocument)
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await repo.get_knowledge_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return KnowledgeDocument(**doc)


@router.delete("/knowledge/documents/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    if not await repo.delete_knowledge_document(db, doc_id):
        raise HTTPException(status_code=404, detail="Document not found")
    await repo.create_audit_log(db, "knowledge.delete", "System", doc_id)
    return {"deleted": doc_id}


@router.post("/knowledge/reindex")
async def reindex_knowledge(db: AsyncSession = Depends(get_db)):
    count = await repo.reindex_knowledge_documents(db)
    await repo.create_audit_log(db, "knowledge.reindex", "System", "all")
    return {"status": "reindexed", "documents": count}


@router.post("/knowledge/embedding/rebuild")
async def rebuild_embeddings(db: AsyncSession = Depends(get_db)):
    await repo.create_audit_log(db, "knowledge.embedding.rebuild", "System", "qdrant")
    return {"status": "rebuilding", "collection": "maintenance_knowledge", "model": "BGE-large"}


@router.get("/knowledge/stats")
async def knowledge_stats(db: AsyncSession = Depends(get_db)):
    docs = await repo.list_knowledge_documents(db)
    indexed = sum(1 for d in docs if d.get("indexed"))
    by_type: dict[str, int] = {}
    for doc in docs:
        by_type[doc["doc_type"]] = by_type.get(doc["doc_type"], 0) + 1
    return {
        "total_documents": len(docs),
        "indexed_documents": indexed,
        "by_type": by_type,
        "embedding_model": "BGE-large",
        "vector_store": "Qdrant",
        "storage": "Supabase Storage",
    }
