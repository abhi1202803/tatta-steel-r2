"""Document chunking for RAG pipeline."""

import re
from dataclasses import dataclass


@dataclass
class DocumentChunk:
    text: str
    metadata: dict
    chunk_id: str


class DocumentChunker:
  CHUNK_SIZE = 512
  CHUNK_OVERLAP = 64

  def chunk_text(self, text: str, source: str, doc_type: str = "manual") -> list[DocumentChunk]:
      paragraphs = re.split(r"\n\s*\n", text.strip())
      chunks = []
      current = ""
      chunk_idx = 0

      for para in paragraphs:
          if len(current) + len(para) > self.CHUNK_SIZE and current:
              chunks.append(DocumentChunk(
                  text=current.strip(),
                  metadata={"source": source, "type": doc_type, "chunk_index": chunk_idx},
                  chunk_id=f"{source}_{chunk_idx}",
              ))
              overlap = current[-self.CHUNK_OVERLAP:] if len(current) > self.CHUNK_OVERLAP else ""
              current = overlap + " " + para
              chunk_idx += 1
          else:
              current = (current + "\n" + para).strip()

      if current.strip():
          chunks.append(DocumentChunk(
              text=current.strip(),
              metadata={"source": source, "type": doc_type, "chunk_index": chunk_idx},
              chunk_id=f"{source}_{chunk_idx}",
          ))

      return chunks
